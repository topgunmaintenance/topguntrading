import WebSocket from "ws";
import type { QuoteHandler, Subscription } from "../contract";
import {
  COINBASE_PROVIDER_ID,
  isTickerEnvelope,
  tickerEventToQuote,
} from "./mapping";

export interface CoinbaseWsOptions {
  url?: string;
  /**
   * Factory for constructing WebSocket instances. Defaults to the
   * real `ws` library. Tests inject a fake.
   */
  createSocket?: (url: string) => WebSocket;
  /** Max backoff for reconnect in ms. Defaults to 30s. */
  maxReconnectMs?: number;
  /** Heartbeat interval in ms. Defaults to 20s. */
  heartbeatMs?: number;
  onError?: (error: Error) => void;
}

const DEFAULT_URL = "wss://advanced-trade-ws.coinbase.com";
const DEFAULT_MAX_RECONNECT_MS = 30_000;
const DEFAULT_HEARTBEAT_MS = 20_000;

type WSSocket = Pick<
  WebSocket,
  "send" | "close" | "readyState" | "on" | "off" | "removeAllListeners"
>;

/**
 * Thin WebSocket client for Coinbase Advanced Trade public ticker
 * channel. Owns a single socket and exposes a `Subscription` per
 * call. Internally multiplexes multiple subscriptions onto the one
 * socket.
 *
 * Reconnect policy: exponential backoff with jitter, capped at
 * `maxReconnectMs`. On reconnect, the client re-sends the current
 * set of subscriptions.
 */
export class CoinbaseWsClient {
  private readonly url: string;
  private readonly createSocket: (url: string) => WebSocket;
  private readonly maxReconnectMs: number;
  private readonly heartbeatMs: number;
  private readonly onError?: (error: Error) => void;

  private socket: WSSocket | null = null;
  private connecting = false;
  private reconnectAttempt = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private disposed = false;

  /** Map of `productId` → handlers interested in that product's ticks. */
  private readonly handlers = new Map<string, Set<QuoteHandler>>();

  constructor(options: CoinbaseWsOptions = {}) {
    this.url = options.url ?? DEFAULT_URL;
    this.createSocket =
      options.createSocket ?? ((url) => new WebSocket(url));
    this.maxReconnectMs = options.maxReconnectMs ?? DEFAULT_MAX_RECONNECT_MS;
    this.heartbeatMs = options.heartbeatMs ?? DEFAULT_HEARTBEAT_MS;
    this.onError = options.onError;
  }

  subscribe(productIds: string[], handler: QuoteHandler): Subscription {
    const subscribedSymbols = new Set<string>();
    const newProducts: string[] = [];

    for (const id of productIds) {
      if (!this.handlers.has(id)) {
        this.handlers.set(id, new Set());
        newProducts.push(id);
      }
      this.handlers.get(id)!.add(handler);
      subscribedSymbols.add(id);
    }

    this.ensureSocket();
    if (newProducts.length > 0) {
      this.sendSubscribe(newProducts);
    }

    return {
      symbols: subscribedSymbols,
      close: async () => {
        for (const id of subscribedSymbols) {
          const set = this.handlers.get(id);
          if (!set) continue;
          set.delete(handler);
          if (set.size === 0) {
            this.handlers.delete(id);
            this.sendUnsubscribe([id]);
          }
        }
      },
    };
  }

  async dispose(): Promise<void> {
    this.disposed = true;
    this.handlers.clear();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.socket) {
      try {
        this.socket.removeAllListeners();
        this.socket.close(1000);
      } catch {
        // ignore
      }
      this.socket = null;
    }
  }

  // ---- internals ------------------------------------------------------------

  private ensureSocket(): void {
    if (this.disposed) return;
    if (this.socket || this.connecting) return;
    this.connecting = true;

    let socket: WebSocket;
    try {
      socket = this.createSocket(this.url);
    } catch (error) {
      this.connecting = false;
      this.scheduleReconnect(error);
      return;
    }

    socket.on("open", () => {
      this.connecting = false;
      this.reconnectAttempt = 0;
      this.socket = socket as WSSocket;
      this.startHeartbeat();
      // Re-subscribe to every currently-interesting product.
      const products = Array.from(this.handlers.keys());
      if (products.length > 0) {
        this.sendSubscribe(products);
      }
    });

    socket.on("message", (raw: WebSocket.RawData) => {
      try {
        const parsed = JSON.parse(raw.toString()) as unknown;
        if (!isTickerEnvelope(parsed)) return;
        const timestamp =
          typeof parsed.timestamp === "string" && parsed.timestamp.length > 0
            ? parsed.timestamp
            : new Date().toISOString();
        for (const event of parsed.events) {
          if (!Array.isArray(event.tickers)) continue;
          for (const ticker of event.tickers) {
            const quote = tickerEventToQuote(ticker, timestamp);
            const handlers = this.handlers.get(ticker.product_id);
            if (!handlers) continue;
            for (const handler of handlers) {
              try {
                handler(quote);
              } catch {
                // handlers must not throw
              }
            }
          }
        }
      } catch (error) {
        this.onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    });

    socket.on("close", () => {
      this.connecting = false;
      this.socket = null;
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
      if (!this.disposed && this.handlers.size > 0) {
        this.scheduleReconnect();
      }
    });

    socket.on("error", (error: Error) => {
      this.onError?.(error);
    });
  }

  private sendSubscribe(productIds: string[]): void {
    const socket = this.socket;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    try {
      socket.send(
        JSON.stringify({
          type: "subscribe",
          product_ids: productIds,
          channel: "ticker",
        }),
      );
    } catch (error) {
      this.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private sendUnsubscribe(productIds: string[]): void {
    const socket = this.socket;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    try {
      socket.send(
        JSON.stringify({
          type: "unsubscribe",
          product_ids: productIds,
          channel: "ticker",
        }),
      );
    } catch (error) {
      this.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      const socket = this.socket;
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      try {
        socket.send(JSON.stringify({ type: "heartbeat" }));
      } catch {
        // ignored; next message will surface any failure
      }
    }, this.heartbeatMs);
  }

  private scheduleReconnect(cause?: unknown): void {
    if (this.disposed) return;
    if (this.reconnectTimer) return;
    this.reconnectAttempt = Math.min(this.reconnectAttempt + 1, 10);
    const base = Math.min(this.maxReconnectMs, 2 ** this.reconnectAttempt * 250);
    const jitter = Math.floor(Math.random() * 250);
    const delay = base + jitter;
    if (cause) {
      this.onError?.(
        cause instanceof Error ? cause : new Error(String(cause)),
      );
    }
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.ensureSocket();
    }, delay);
  }

  // ---- test helpers ---------------------------------------------------------

  /** @internal exposed for tests only */
  get _handlerCountFor(): (productId: string) => number {
    return (productId) => this.handlers.get(productId)?.size ?? 0;
  }
}
