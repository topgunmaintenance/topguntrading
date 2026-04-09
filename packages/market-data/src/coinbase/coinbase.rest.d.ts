import type { Candle, CandleRequest } from "@topgun/types";
import type { SymbolMeta } from "@topgun/types";
export interface CoinbaseRestOptions {
    /** Override the REST base URL (used in tests and mirrors). */
    baseUrl?: string;
    /** Override the global fetch implementation (used in tests). */
    fetch?: typeof fetch;
    /** Per-request timeout. Defaults to 10s. */
    requestTimeoutMs?: number;
    userAgent?: string;
}
/**
 * Read-only REST client for Coinbase Exchange public endpoints.
 *
 * Only the `/products` and `/products/{id}/candles` endpoints are
 * touched. No authenticated endpoints are called. No credentials are
 * stored or sent.
 */
export declare class CoinbaseRestClient {
    private readonly baseUrl;
    private readonly fetchImpl;
    private readonly timeoutMs;
    private readonly userAgent;
    constructor(options?: CoinbaseRestOptions);
    listProducts(): Promise<SymbolMeta[]>;
    getProduct(productId: string): Promise<SymbolMeta | null>;
    getCandles(request: CandleRequest): Promise<Candle[]>;
    private request;
}
//# sourceMappingURL=coinbase.rest.d.ts.map