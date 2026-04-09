import WebSocket from "ws";
import type { QuoteHandler, Subscription } from "../contract";
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
export declare class CoinbaseWsClient {
    private readonly url;
    private readonly createSocket;
    private readonly maxReconnectMs;
    private readonly heartbeatMs;
    private readonly onError?;
    private socket;
    private connecting;
    private reconnectAttempt;
    private reconnectTimer;
    private heartbeatTimer;
    private disposed;
    /** Map of `productId` → handlers interested in that product's ticks. */
    private readonly handlers;
    constructor(options?: CoinbaseWsOptions);
    subscribe(productIds: string[], handler: QuoteHandler): Subscription;
    dispose(): Promise<void>;
    private ensureSocket;
    private sendSubscribe;
    private sendUnsubscribe;
    private startHeartbeat;
    private scheduleReconnect;
    /** @internal exposed for tests only */
    get _handlerCountFor(): (productId: string) => number;
}
//# sourceMappingURL=coinbase.ws.d.ts.map