import { z } from "zod";
/**
 * Market data schemas shared across web, api, and the market-data
 * adapters. Every adapter normalizes its raw payload into these
 * shapes; every client reads from these shapes. There is no parallel
 * definition anywhere else in the repo.
 */
export declare const AssetClassSchema: z.ZodEnum<["crypto", "equity", "futures", "fx"]>;
export type AssetClass = z.infer<typeof AssetClassSchema>;
export declare const IntervalSchema: z.ZodEnum<["1m", "5m", "15m", "1h", "6h", "1d"]>;
export type Interval = z.infer<typeof IntervalSchema>;
/**
 * Seconds per interval. Use these for cursor math and cache keys.
 * Intervals longer than 1d would live in a separate table.
 */
export declare const INTERVAL_SECONDS: Record<Interval, number>;
/**
 * Canonical symbol reference: `{provider}:{symbol}`.
 * - provider: lowercase ascii, 2-20 chars
 * - symbol: provider-native identifier (e.g. `BTC-USD`, `AAPL`)
 *
 * Examples: `coinbase:BTC-USD`, `mock:BTC-USD`.
 */
export declare const SymbolRefSchema: z.ZodString;
export type SymbolRef = z.infer<typeof SymbolRefSchema>;
export declare const SymbolMetaSchema: z.ZodObject<{
    ref: z.ZodString;
    provider: z.ZodString;
    providerSymbol: z.ZodString;
    assetClass: z.ZodEnum<["crypto", "equity", "futures", "fx"]>;
    baseAsset: z.ZodString;
    quoteAsset: z.ZodString;
    displayName: z.ZodString;
    /** Decimal string, e.g. "0.01" for $0.01 tick. */
    minPriceIncrement: z.ZodNullable<z.ZodString>;
    /** Decimal string, e.g. "0.00000001" for 1 satoshi. */
    minSizeIncrement: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    displayName: string;
    ref: string;
    provider: string;
    providerSymbol: string;
    assetClass: "crypto" | "equity" | "futures" | "fx";
    baseAsset: string;
    quoteAsset: string;
    minPriceIncrement: string | null;
    minSizeIncrement: string | null;
}, {
    displayName: string;
    ref: string;
    provider: string;
    providerSymbol: string;
    assetClass: "crypto" | "equity" | "futures" | "fx";
    baseAsset: string;
    quoteAsset: string;
    minPriceIncrement: string | null;
    minSizeIncrement: string | null;
}>;
export type SymbolMeta = z.infer<typeof SymbolMetaSchema>;
/**
 * A candle in normalized form. OHLC values are strings to preserve
 * the provider's precision across JSON serialization.
 */
export declare const CandleSchema: z.ZodObject<{
    openTime: z.ZodString;
    open: z.ZodString;
    high: z.ZodString;
    low: z.ZodString;
    close: z.ZodString;
    volume: z.ZodString;
}, "strip", z.ZodTypeAny, {
    openTime: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
}, {
    openTime: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
}>;
export type Candle = z.infer<typeof CandleSchema>;
export declare const CandleRequestSchema: z.ZodObject<{
    symbol: z.ZodString;
    interval: z.ZodEnum<["1m", "5m", "15m", "1h", "6h", "1d"]>;
    /** Inclusive start (ISO-8601). Optional — adapter picks a sensible default. */
    from: z.ZodOptional<z.ZodString>;
    /** Exclusive end (ISO-8601). Optional — defaults to "now". */
    to: z.ZodOptional<z.ZodString>;
    /** Max candles to return. Capped by the adapter. */
    limit: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "1h" | "6h" | "1d";
    from?: string | undefined;
    to?: string | undefined;
    limit?: number | undefined;
}, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "1h" | "6h" | "1d";
    from?: string | undefined;
    to?: string | undefined;
    limit?: number | undefined;
}>;
export type CandleRequest = z.infer<typeof CandleRequestSchema>;
/**
 * A live quote tick. Emitted by the streaming layer. Bid/ask/last
 * are all optional because different providers expose different
 * subsets.
 */
export declare const QuoteSchema: z.ZodObject<{
    symbol: z.ZodString;
    time: z.ZodString;
    last: z.ZodNullable<z.ZodString>;
    bid: z.ZodNullable<z.ZodString>;
    ask: z.ZodNullable<z.ZodString>;
    /** 24h volume in base units, as a decimal string. */
    volume24h: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    time: string;
    last: string | null;
    bid: string | null;
    ask: string | null;
    volume24h: string | null;
}, {
    symbol: string;
    time: string;
    last: string | null;
    bid: string | null;
    ask: string | null;
    volume24h: string | null;
}>;
export type Quote = z.infer<typeof QuoteSchema>;
export declare const AttributionInfoSchema: z.ZodObject<{
    provider: z.ZodString;
    label: z.ZodString;
    url: z.ZodNullable<z.ZodString>;
    delayed: z.ZodBoolean;
    /**
     * If true, this data source is simulated and MUST NOT be presented as
     * real market prices. The web surface renders a prominent banner.
     */
    simulated: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    url: string | null;
    provider: string;
    label: string;
    delayed: boolean;
    simulated: boolean;
}, {
    url: string | null;
    provider: string;
    label: string;
    delayed: boolean;
    simulated: boolean;
}>;
export type AttributionInfo = z.infer<typeof AttributionInfoSchema>;
export declare const AdapterCapabilitiesSchema: z.ZodObject<{
    assetClasses: z.ZodArray<z.ZodEnum<["crypto", "equity", "futures", "fx"]>, "many">;
    intervals: z.ZodArray<z.ZodEnum<["1m", "5m", "15m", "1h", "6h", "1d"]>, "many">;
    streaming: z.ZodObject<{
        quotes: z.ZodBoolean;
        trades: z.ZodBoolean;
        level2: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        quotes: boolean;
        trades: boolean;
        level2: boolean;
    }, {
        quotes: boolean;
        trades: boolean;
        level2: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    assetClasses: ("crypto" | "equity" | "futures" | "fx")[];
    intervals: ("1m" | "5m" | "15m" | "1h" | "6h" | "1d")[];
    streaming: {
        quotes: boolean;
        trades: boolean;
        level2: boolean;
    };
}, {
    assetClasses: ("crypto" | "equity" | "futures" | "fx")[];
    intervals: ("1m" | "5m" | "15m" | "1h" | "6h" | "1d")[];
    streaming: {
        quotes: boolean;
        trades: boolean;
        level2: boolean;
    };
}>;
export type AdapterCapabilities = z.infer<typeof AdapterCapabilitiesSchema>;
export declare function parseSymbolRef(ref: string): {
    provider: string;
    symbol: string;
};
export declare function formatSymbolRef(provider: string, symbol: string): SymbolRef;
export declare const StoredSymbolSchema: z.ZodObject<{
    ref: z.ZodString;
    provider: z.ZodString;
    providerSymbol: z.ZodString;
    assetClass: z.ZodEnum<["crypto", "equity", "futures", "fx"]>;
    baseAsset: z.ZodString;
    quoteAsset: z.ZodString;
    displayName: z.ZodString;
    /** Decimal string, e.g. "0.01" for $0.01 tick. */
    minPriceIncrement: z.ZodNullable<z.ZodString>;
    /** Decimal string, e.g. "0.00000001" for 1 satoshi. */
    minSizeIncrement: z.ZodNullable<z.ZodString>;
} & {
    id: z.ZodString;
    lastSyncedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    displayName: string;
    ref: string;
    provider: string;
    providerSymbol: string;
    assetClass: "crypto" | "equity" | "futures" | "fx";
    baseAsset: string;
    quoteAsset: string;
    minPriceIncrement: string | null;
    minSizeIncrement: string | null;
    lastSyncedAt: string;
}, {
    id: string;
    displayName: string;
    ref: string;
    provider: string;
    providerSymbol: string;
    assetClass: "crypto" | "equity" | "futures" | "fx";
    baseAsset: string;
    quoteAsset: string;
    minPriceIncrement: string | null;
    minSizeIncrement: string | null;
    lastSyncedAt: string;
}>;
export type StoredSymbol = z.infer<typeof StoredSymbolSchema>;
//# sourceMappingURL=market-data.d.ts.map