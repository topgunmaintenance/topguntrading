import type { AdapterCapabilities, AttributionInfo, Candle, CandleRequest, SymbolMeta } from "@topgun/types";
import type { IMarketDataAdapter, QuoteHandler, Subscription } from "../contract";
import { type CoinbaseRestOptions } from "./coinbase.rest";
import { type CoinbaseWsOptions } from "./coinbase.ws";
export interface CoinbaseAdapterOptions {
    rest?: CoinbaseRestOptions;
    ws?: CoinbaseWsOptions;
    /** Override how long the in-process product list cache lasts. */
    productsTtlMs?: number;
}
/**
 * Coinbase public market-data adapter. Uses only unauthenticated
 * Coinbase Exchange endpoints and the Advanced Trade public
 * WebSocket ticker channel.
 *
 * - No API key is required.
 * - No trading capability is wired in (and never will be).
 * - Attribution must be rendered by the UI: "Data provided by Coinbase".
 */
export declare class CoinbaseAdapter implements IMarketDataAdapter {
    readonly id: "coinbase";
    readonly capabilities: AdapterCapabilities;
    readonly attribution: AttributionInfo;
    private readonly rest;
    private readonly ws;
    private readonly productsTtlMs;
    private productsCache;
    constructor(options?: CoinbaseAdapterOptions);
    searchSymbols(query: string, limit?: number): Promise<SymbolMeta[]>;
    getSymbol(providerSymbol: string): Promise<SymbolMeta | null>;
    listSupportedSymbols(limit?: number): Promise<SymbolMeta[]>;
    getCandles(request: CandleRequest): Promise<Candle[]>;
    streamQuotes(symbols: string[], handler: QuoteHandler): Subscription;
    dispose(): Promise<void>;
    private getProducts;
}
//# sourceMappingURL=coinbase.adapter.d.ts.map