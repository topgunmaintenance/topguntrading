import type { AdapterCapabilities, AttributionInfo, Candle, CandleRequest, SymbolMeta } from "@topgun/types";
import type { IMarketDataAdapter, QuoteHandler, Subscription } from "../contract";
/**
 * Mock market data adapter.
 *
 * Produces deterministic synthetic data. This adapter is for tests,
 * local development without network, and UI scaffolding. Every
 * response is explicitly marked `simulated: true` in the attribution
 * so the UI can warn the user that what they are seeing is NOT real
 * market data.
 *
 * Determinism is achieved with a cheap LCG keyed on symbol + time.
 */
export declare class MockAdapter implements IMarketDataAdapter {
    readonly id = "mock";
    readonly capabilities: AdapterCapabilities;
    readonly attribution: AttributionInfo;
    private readonly universe;
    searchSymbols(query: string, limit?: number): Promise<SymbolMeta[]>;
    getSymbol(symbol: string): Promise<SymbolMeta | null>;
    listSupportedSymbols(limit?: number): Promise<SymbolMeta[]>;
    getCandles(request: CandleRequest): Promise<Candle[]>;
    streamQuotes(symbols: string[], handler: QuoteHandler): Subscription;
    dispose(): Promise<void>;
    private meta;
    private symbolBasePrice;
    private hash;
}
//# sourceMappingURL=mock.adapter.d.ts.map