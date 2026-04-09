"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoinbaseWsClient = void 0;
const ws_1 = __importDefault(require("ws"));
const mapping_1 = require("./mapping");
const DEFAULT_URL = "wss://advanced-trade-ws.coinbase.com";
const DEFAULT_MAX_RECONNECT_MS = 30_000;
const DEFAULT_HEARTBEAT_MS = 20_000;
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
class CoinbaseWsClient {
    url;
    createSocket;
    maxReconnectMs;
    heartbeatMs;
    onError;
    socket = null;
    connecting = false;
    reconnectAttempt = 0;
    reconnectTimer = null;
    heartbeatTimer = null;
    disposed = false;
    /** Map of `productId` → handlers interested in that product's ticks. */
    handlers = new Map();
    constructor(options = {}) {
        this.url = options.url ?? DEFAULT_URL;
        this.createSocket =
            options.createSocket ?? ((url) => new ws_1.default(url));
        this.maxReconnectMs = options.maxReconnectMs ?? DEFAULT_MAX_RECONNECT_MS;
        this.heartbeatMs = options.heartbeatMs ?? DEFAULT_HEARTBEAT_MS;
        if (options.onError) {
            this.onError = options.onError;
        }
    }
    subscribe(productIds, handler) {
        const subscribedSymbols = new Set();
        const newProducts = [];
        for (const id of productIds) {
            if (!this.handlers.has(id)) {
                this.handlers.set(id, new Set());
                newProducts.push(id);
            }
            this.handlers.get(id).add(handler);
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
                    if (!set)
                        continue;
                    set.delete(handler);
                    if (set.size === 0) {
                        this.handlers.delete(id);
                        this.sendUnsubscribe([id]);
                    }
                }
            },
        };
    }
    async dispose() {
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
            }
            catch {
                // ignore
            }
            this.socket = null;
        }
    }
    // ---- internals ------------------------------------------------------------
    ensureSocket() {
        if (this.disposed)
            return;
        if (this.socket || this.connecting)
            return;
        this.connecting = true;
        let socket;
        try {
            socket = this.createSocket(this.url);
        }
        catch (error) {
            this.connecting = false;
            this.scheduleReconnect(error);
            return;
        }
        socket.on("open", () => {
            this.connecting = false;
            this.reconnectAttempt = 0;
            this.socket = socket;
            this.startHeartbeat();
            // Re-subscribe to every currently-interesting product.
            const products = Array.from(this.handlers.keys());
            if (products.length > 0) {
                this.sendSubscribe(products);
            }
        });
        socket.on("message", (raw) => {
            try {
                const parsed = JSON.parse(raw.toString());
                if (!(0, mapping_1.isTickerEnvelope)(parsed))
                    return;
                const timestamp = typeof parsed.timestamp === "string" && parsed.timestamp.length > 0
                    ? parsed.timestamp
                    : new Date().toISOString();
                for (const event of parsed.events) {
                    if (!Array.isArray(event.tickers))
                        continue;
                    for (const ticker of event.tickers) {
                        const quote = (0, mapping_1.tickerEventToQuote)(ticker, timestamp);
                        const handlers = this.handlers.get(ticker.product_id);
                        if (!handlers)
                            continue;
                        for (const handler of handlers) {
                            try {
                                handler(quote);
                            }
                            catch {
                                // handlers must not throw
                            }
                        }
                    }
                }
            }
            catch (error) {
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
        socket.on("error", (error) => {
            this.onError?.(error);
        });
    }
    sendSubscribe(productIds) {
        const socket = this.socket;
        if (!socket || socket.readyState !== ws_1.default.OPEN)
            return;
        try {
            socket.send(JSON.stringify({
                type: "subscribe",
                product_ids: productIds,
                channel: "ticker",
            }));
        }
        catch (error) {
            this.onError?.(error instanceof Error ? error : new Error(String(error)));
        }
    }
    sendUnsubscribe(productIds) {
        const socket = this.socket;
        if (!socket || socket.readyState !== ws_1.default.OPEN)
            return;
        try {
            socket.send(JSON.stringify({
                type: "unsubscribe",
                product_ids: productIds,
                channel: "ticker",
            }));
        }
        catch (error) {
            this.onError?.(error instanceof Error ? error : new Error(String(error)));
        }
    }
    startHeartbeat() {
        if (this.heartbeatTimer)
            clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = setInterval(() => {
            const socket = this.socket;
            if (!socket || socket.readyState !== ws_1.default.OPEN)
                return;
            try {
                socket.send(JSON.stringify({ type: "heartbeat" }));
            }
            catch {
                // ignored; next message will surface any failure
            }
        }, this.heartbeatMs);
    }
    scheduleReconnect(cause) {
        if (this.disposed)
            return;
        if (this.reconnectTimer)
            return;
        this.reconnectAttempt = Math.min(this.reconnectAttempt + 1, 10);
        const base = Math.min(this.maxReconnectMs, 2 ** this.reconnectAttempt * 250);
        const jitter = Math.floor(Math.random() * 250);
        const delay = base + jitter;
        if (cause) {
            this.onError?.(cause instanceof Error ? cause : new Error(String(cause)));
        }
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.ensureSocket();
        }, delay);
    }
    // ---- test helpers ---------------------------------------------------------
    /** @internal exposed for tests only */
    get _handlerCountFor() {
        return (productId) => this.handlers.get(productId)?.size ?? 0;
    }
}
exports.CoinbaseWsClient = CoinbaseWsClient;
//# sourceMappingURL=coinbase.ws.js.map