"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoredSymbolSchema = exports.AdapterCapabilitiesSchema = exports.AttributionInfoSchema = exports.QuoteSchema = exports.CandleRequestSchema = exports.CandleSchema = exports.SymbolMetaSchema = exports.SymbolRefSchema = exports.INTERVAL_SECONDS = exports.IntervalSchema = exports.AssetClassSchema = void 0;
exports.parseSymbolRef = parseSymbolRef;
exports.formatSymbolRef = formatSymbolRef;
const zod_1 = require("zod");
const common_1 = require("./common");
/**
 * Market data schemas shared across web, api, and the market-data
 * adapters. Every adapter normalizes its raw payload into these
 * shapes; every client reads from these shapes. There is no parallel
 * definition anywhere else in the repo.
 */
// ---- Asset class + interval --------------------------------------------------
exports.AssetClassSchema = zod_1.z.enum([
    "crypto",
    "equity",
    "futures",
    "fx",
]);
exports.IntervalSchema = zod_1.z.enum([
    "1m",
    "5m",
    "15m",
    "1h",
    "6h",
    "1d",
]);
/**
 * Seconds per interval. Use these for cursor math and cache keys.
 * Intervals longer than 1d would live in a separate table.
 */
exports.INTERVAL_SECONDS = {
    "1m": 60,
    "5m": 300,
    "15m": 900,
    "1h": 3600,
    "6h": 21600,
    "1d": 86400,
};
// ---- Symbol reference --------------------------------------------------------
/**
 * Canonical symbol reference: `{provider}:{symbol}`.
 * - provider: lowercase ascii, 2-20 chars
 * - symbol: provider-native identifier (e.g. `BTC-USD`, `AAPL`)
 *
 * Examples: `coinbase:BTC-USD`, `mock:BTC-USD`.
 */
exports.SymbolRefSchema = zod_1.z
    .string()
    .regex(/^[a-z][a-z0-9_-]{1,19}:[A-Za-z0-9._/-]{1,32}$/, "Expected `{provider}:{symbol}`");
// ---- Symbol metadata ---------------------------------------------------------
exports.SymbolMetaSchema = zod_1.z.object({
    ref: exports.SymbolRefSchema,
    provider: zod_1.z.string().min(1).max(20),
    providerSymbol: zod_1.z.string().min(1).max(32),
    assetClass: exports.AssetClassSchema,
    baseAsset: zod_1.z.string().min(1).max(16),
    quoteAsset: zod_1.z.string().min(1).max(16),
    displayName: zod_1.z.string().min(1).max(80),
    /** Decimal string, e.g. "0.01" for $0.01 tick. */
    minPriceIncrement: zod_1.z.string().nullable(),
    /** Decimal string, e.g. "0.00000001" for 1 satoshi. */
    minSizeIncrement: zod_1.z.string().nullable(),
});
// ---- Candles -----------------------------------------------------------------
/**
 * A candle in normalized form. OHLC values are strings to preserve
 * the provider's precision across JSON serialization.
 */
exports.CandleSchema = zod_1.z.object({
    openTime: common_1.IsoDateSchema,
    open: zod_1.z.string(),
    high: zod_1.z.string(),
    low: zod_1.z.string(),
    close: zod_1.z.string(),
    volume: zod_1.z.string(),
});
exports.CandleRequestSchema = zod_1.z.object({
    symbol: exports.SymbolRefSchema,
    interval: exports.IntervalSchema,
    /** Inclusive start (ISO-8601). Optional — adapter picks a sensible default. */
    from: common_1.IsoDateSchema.optional(),
    /** Exclusive end (ISO-8601). Optional — defaults to "now". */
    to: common_1.IsoDateSchema.optional(),
    /** Max candles to return. Capped by the adapter. */
    limit: zod_1.z.number().int().positive().max(1000).optional(),
});
// ---- Quotes ------------------------------------------------------------------
/**
 * A live quote tick. Emitted by the streaming layer. Bid/ask/last
 * are all optional because different providers expose different
 * subsets.
 */
exports.QuoteSchema = zod_1.z.object({
    symbol: exports.SymbolRefSchema,
    time: common_1.IsoDateSchema,
    last: zod_1.z.string().nullable(),
    bid: zod_1.z.string().nullable(),
    ask: zod_1.z.string().nullable(),
    /** 24h volume in base units, as a decimal string. */
    volume24h: zod_1.z.string().nullable(),
});
// ---- Attribution -------------------------------------------------------------
exports.AttributionInfoSchema = zod_1.z.object({
    provider: zod_1.z.string().min(1),
    label: zod_1.z.string().min(1),
    url: zod_1.z.string().url().nullable(),
    delayed: zod_1.z.boolean(),
    /**
     * If true, this data source is simulated and MUST NOT be presented as
     * real market prices. The web surface renders a prominent banner.
     */
    simulated: zod_1.z.boolean(),
});
// ---- Adapter capabilities ----------------------------------------------------
exports.AdapterCapabilitiesSchema = zod_1.z.object({
    assetClasses: zod_1.z.array(exports.AssetClassSchema).min(1),
    intervals: zod_1.z.array(exports.IntervalSchema).min(1),
    streaming: zod_1.z.object({
        quotes: zod_1.z.boolean(),
        trades: zod_1.z.boolean(),
        level2: zod_1.z.boolean(),
    }),
});
// ---- Parsing helpers ---------------------------------------------------------
function parseSymbolRef(ref) {
    const parsed = exports.SymbolRefSchema.parse(ref);
    const idx = parsed.indexOf(":");
    return { provider: parsed.slice(0, idx), symbol: parsed.slice(idx + 1) };
}
function formatSymbolRef(provider, symbol) {
    return exports.SymbolRefSchema.parse(`${provider}:${symbol}`);
}
// ---- Persisted symbol (what the API returns from its cache) -----------------
exports.StoredSymbolSchema = exports.SymbolMetaSchema.extend({
    id: common_1.IdSchema,
    lastSyncedAt: common_1.IsoDateSchema,
});
//# sourceMappingURL=market-data.js.map