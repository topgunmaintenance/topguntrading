import { z } from "zod";
import { IdSchema, IsoDateSchema } from "./common";

/**
 * Market data schemas shared across web, api, and the market-data
 * adapters. Every adapter normalizes its raw payload into these
 * shapes; every client reads from these shapes. There is no parallel
 * definition anywhere else in the repo.
 */

// ---- Asset class + interval --------------------------------------------------

export const AssetClassSchema = z.enum([
  "crypto",
  "equity",
  "futures",
  "fx",
]);
export type AssetClass = z.infer<typeof AssetClassSchema>;

export const IntervalSchema = z.enum([
  "1m",
  "5m",
  "15m",
  "1h",
  "6h",
  "1d",
]);
export type Interval = z.infer<typeof IntervalSchema>;

/**
 * Seconds per interval. Use these for cursor math and cache keys.
 * Intervals longer than 1d would live in a separate table.
 */
export const INTERVAL_SECONDS: Record<Interval, number> = {
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
export const SymbolRefSchema = z
  .string()
  .regex(
    /^[a-z][a-z0-9_-]{1,19}:[A-Za-z0-9._/-]{1,32}$/,
    "Expected `{provider}:{symbol}`",
  );
export type SymbolRef = z.infer<typeof SymbolRefSchema>;

// ---- Symbol metadata ---------------------------------------------------------

export const SymbolMetaSchema = z.object({
  ref: SymbolRefSchema,
  provider: z.string().min(1).max(20),
  providerSymbol: z.string().min(1).max(32),
  assetClass: AssetClassSchema,
  baseAsset: z.string().min(1).max(16),
  quoteAsset: z.string().min(1).max(16),
  displayName: z.string().min(1).max(80),
  /** Decimal string, e.g. "0.01" for $0.01 tick. */
  minPriceIncrement: z.string().nullable(),
  /** Decimal string, e.g. "0.00000001" for 1 satoshi. */
  minSizeIncrement: z.string().nullable(),
});
export type SymbolMeta = z.infer<typeof SymbolMetaSchema>;

// ---- Candles -----------------------------------------------------------------

/**
 * A candle in normalized form. OHLC values are strings to preserve
 * the provider's precision across JSON serialization.
 */
export const CandleSchema = z.object({
  openTime: IsoDateSchema,
  open: z.string(),
  high: z.string(),
  low: z.string(),
  close: z.string(),
  volume: z.string(),
});
export type Candle = z.infer<typeof CandleSchema>;

export const CandleRequestSchema = z.object({
  symbol: SymbolRefSchema,
  interval: IntervalSchema,
  /** Inclusive start (ISO-8601). Optional — adapter picks a sensible default. */
  from: IsoDateSchema.optional(),
  /** Exclusive end (ISO-8601). Optional — defaults to "now". */
  to: IsoDateSchema.optional(),
  /** Max candles to return. Capped by the adapter. */
  limit: z.number().int().positive().max(1000).optional(),
});
export type CandleRequest = z.infer<typeof CandleRequestSchema>;

// ---- Quotes ------------------------------------------------------------------

/**
 * A live quote tick. Emitted by the streaming layer. Bid/ask/last
 * are all optional because different providers expose different
 * subsets.
 */
export const QuoteSchema = z.object({
  symbol: SymbolRefSchema,
  time: IsoDateSchema,
  last: z.string().nullable(),
  bid: z.string().nullable(),
  ask: z.string().nullable(),
  /** 24h volume in base units, as a decimal string. */
  volume24h: z.string().nullable(),
});
export type Quote = z.infer<typeof QuoteSchema>;

// ---- Attribution -------------------------------------------------------------

export const AttributionInfoSchema = z.object({
  provider: z.string().min(1),
  label: z.string().min(1),
  url: z.string().url().nullable(),
  delayed: z.boolean(),
  /**
   * If true, this data source is simulated and MUST NOT be presented as
   * real market prices. The web surface renders a prominent banner.
   */
  simulated: z.boolean(),
});
export type AttributionInfo = z.infer<typeof AttributionInfoSchema>;

// ---- Adapter capabilities ----------------------------------------------------

export const AdapterCapabilitiesSchema = z.object({
  assetClasses: z.array(AssetClassSchema).min(1),
  intervals: z.array(IntervalSchema).min(1),
  streaming: z.object({
    quotes: z.boolean(),
    trades: z.boolean(),
    level2: z.boolean(),
  }),
});
export type AdapterCapabilities = z.infer<typeof AdapterCapabilitiesSchema>;

// ---- Parsing helpers ---------------------------------------------------------

export function parseSymbolRef(ref: string): { provider: string; symbol: string } {
  const parsed = SymbolRefSchema.parse(ref);
  const idx = parsed.indexOf(":");
  return { provider: parsed.slice(0, idx), symbol: parsed.slice(idx + 1) };
}

export function formatSymbolRef(provider: string, symbol: string): SymbolRef {
  return SymbolRefSchema.parse(`${provider}:${symbol}`);
}

// ---- Persisted symbol (what the API returns from its cache) -----------------

export const StoredSymbolSchema = SymbolMetaSchema.extend({
  id: IdSchema,
  lastSyncedAt: IsoDateSchema,
});
export type StoredSymbol = z.infer<typeof StoredSymbolSchema>;
