/**
 * TopGun Trading — Kraken public-API data mapping.
 *
 * Pure functions that convert raw Kraken REST payloads into the
 * normalized `@topgun/types` shapes (SymbolMeta, Candle, Quote,
 * Trade). No IO. No side effects. Unit-tested in isolation.
 *
 * Source:      https://docs.kraken.com/rest/
 * ADR:         docs/decisions.md ADR-0026
 * Attribution: "Data provided by Kraken public feed. Delayed."
 */

import type { Candle, Interval, Quote, SymbolMeta, Trade } from "@topgun/types";
import { formatSymbolRef } from "@topgun/types";
import { MarketDataError } from "../errors";

export const KRAKEN_PROVIDER_ID = "kraken" as const;

/**
 * Kraken OHLC endpoint takes `interval` in MINUTES. Supported values
 * per Kraken docs: 1, 5, 15, 30, 60, 240, 1440, 10080, 21600.
 * We map our `Interval` union to the subset we support.
 */
export const KRAKEN_INTERVAL_MINUTES: Record<Interval, number> = {
  "1m": 1,
  "5m": 5,
  "15m": 15,
  "1h": 60,
  "6h": 240,
  "1d": 1440,
};

/** Kraken's OHLC endpoint returns up to 720 candles per call. */
export const KRAKEN_OHLC_LIMIT = 720;

// ---- Asset pair -> SymbolMeta -----------------------------------------------

/**
 * A single asset pair from `GET /0/public/AssetPairs`. Kraken pairs
 * are keyed by an "altname" (friendly, e.g. "XBTUSD") and a "wsname"
 * (exchange-internal, e.g. "XBT/USD"). We use the altname as the
 * provider-native identifier (what we store in `SymbolRef`).
 */
export interface KrakenAssetPair {
  altname?: string;
  wsname?: string;
  base?: string;
  quote?: string;
  status?: string;
  pair_decimals?: number;
  lot_decimals?: number;
  tick_size?: string;
  ordermin?: string;
}

/**
 * Kraken returns assets with leading X (crypto) / Z (fiat) prefixes
 * for historical reasons ("XXBT" for BTC, "ZUSD" for USD, etc.).
 * Strip the prefix and apply a small alias table so our display
 * labels match user expectations ("BTC" not "XBT", "USD" not "ZUSD").
 */
const KRAKEN_ASSET_ALIASES: Record<string, string> = {
  XBT: "BTC",
  XDG: "DOGE",
};

function normalizeKrakenAsset(asset: string): string {
  let normalized = asset;
  if (
    normalized.length === 4 &&
    (normalized.startsWith("X") || normalized.startsWith("Z"))
  ) {
    normalized = normalized.slice(1);
  }
  return KRAKEN_ASSET_ALIASES[normalized] ?? normalized;
}

export function assetPairToSymbolMeta(
  key: string,
  pair: KrakenAssetPair,
): SymbolMeta | null {
  const providerSymbol = pair.altname ?? key;
  if (!providerSymbol) return null;
  if (pair.status && pair.status !== "online") return null;

  const rawBase = pair.base ?? providerSymbol.slice(0, providerSymbol.length - 3);
  const rawQuote = pair.quote ?? providerSymbol.slice(providerSymbol.length - 3);
  const base = normalizeKrakenAsset(rawBase);
  const quote = normalizeKrakenAsset(rawQuote);

  return {
    ref: formatSymbolRef(KRAKEN_PROVIDER_ID, providerSymbol),
    provider: KRAKEN_PROVIDER_ID,
    providerSymbol,
    assetClass: "crypto",
    baseAsset: base,
    quoteAsset: quote,
    displayName: `${base} / ${quote}`,
    minPriceIncrement: pair.tick_size ?? null,
    minSizeIncrement: pair.ordermin ?? null,
  };
}

export function isTradableAssetPair(pair: KrakenAssetPair): boolean {
  if (!pair.altname) return false;
  if (pair.status && pair.status !== "online") return false;
  return true;
}

// ---- OHLC row -> Candle -----------------------------------------------------

/**
 * Kraken OHLC row shape:
 *   [ time, open, high, low, close, vwap, volume, count ]
 * where `time` is unix seconds and every numeric field is a string.
 */
export type KrakenOhlcRow = [
  number,
  string,
  string,
  string,
  string,
  string,
  string,
  number,
];

export function krakenOhlcToNormalized(rows: unknown): Candle[] {
  if (!Array.isArray(rows)) {
    throw new MarketDataError(
      KRAKEN_PROVIDER_ID,
      "bad_response",
      "Expected an array of OHLC rows",
    );
  }
  const candles: Candle[] = [];
  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 7) continue;
    const [time, open, high, low, close, , volume] = row as KrakenOhlcRow;
    if (
      typeof time !== "number" ||
      typeof open !== "string" ||
      typeof high !== "string" ||
      typeof low !== "string" ||
      typeof close !== "string" ||
      typeof volume !== "string"
    ) {
      continue;
    }
    candles.push({
      openTime: new Date(time * 1000).toISOString(),
      open,
      high,
      low,
      close,
      volume,
    });
  }
  candles.sort((a, b) => a.openTime.localeCompare(b.openTime));
  return candles;
}

// ---- Ticker -> Quote --------------------------------------------------------

/**
 * Kraken ticker shape per pair:
 *   {
 *     a: [ask_price, wholeLotVolume, lotVolume],
 *     b: [bid_price, wholeLotVolume, lotVolume],
 *     c: [last_price, last_volume],
 *     v: [today_volume, 24h_volume],
 *     ...
 *   }
 */
export interface KrakenTickerEntry {
  a?: [string, string, string];
  b?: [string, string, string];
  c?: [string, string];
  v?: [string, string];
}

export function tickerToQuote(
  providerSymbol: string,
  ticker: KrakenTickerEntry,
  nowIso: string,
): Quote {
  return {
    symbol: formatSymbolRef(KRAKEN_PROVIDER_ID, providerSymbol),
    time: nowIso,
    last: ticker.c?.[0] ?? null,
    bid: ticker.b?.[0] ?? null,
    ask: ticker.a?.[0] ?? null,
    volume24h: ticker.v?.[1] ?? null,
  };
}

// ---- Trades -> Trade --------------------------------------------------------

/**
 * Kraken trades row shape:
 *   [ price, volume, time, buy/sell, market/limit, misc, tradeId ]
 * where `buy`/`sell` is the AGGRESSOR taker side, and `time` is a
 * float unix-seconds timestamp (e.g. 1712658123.4567).
 *
 * Kraken's taker-side labels (`b` / `s`) match our aggressor model
 * directly — `b` means a taker bought (lifted the ask), `s` means
 * a taker sold (hit the bid). We map these to `taker_buy` /
 * `taker_sell`. Anything else becomes `unknown`.
 */
export type KrakenTradeRow = [
  string, // price
  string, // volume
  number, // time (float seconds)
  "b" | "s" | string, // aggressor side
  "m" | "l" | string, // market / limit
  string, // misc
  number, // trade id
];

/**
 * Decimal-string guard. Accepts `"67000"`, `"67000.12345678"`,
 * `"-0.5"`; rejects `"not-a-price"`, `""`, `"NaN"`, hex, etc.
 * Used by the trade and candle parsers to drop malformed rows
 * rather than poison downstream math.
 */
const DECIMAL_STRING_RE = /^-?\d+(\.\d+)?$/;

function isDecimalString(v: unknown): v is string {
  return typeof v === "string" && DECIMAL_STRING_RE.test(v);
}

export function krakenTradesToNormalized(
  providerSymbol: string,
  rows: unknown,
): Trade[] {
  if (!Array.isArray(rows)) {
    throw new MarketDataError(
      KRAKEN_PROVIDER_ID,
      "bad_response",
      "Expected an array of trade rows",
    );
  }
  const symbolRef = formatSymbolRef(KRAKEN_PROVIDER_ID, providerSymbol);
  const out: Trade[] = [];
  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 7) continue;
    const [price, volume, time, rawSide, , , rawId] = row as KrakenTradeRow;
    if (
      !isDecimalString(price) ||
      !isDecimalString(volume) ||
      typeof time !== "number"
    ) {
      continue;
    }
    const side: Trade["side"] =
      rawSide === "b" ? "taker_buy" : rawSide === "s" ? "taker_sell" : "unknown";
    // time is float seconds; preserve millisecond precision in the ISO
    const ms = Math.round(time * 1000);
    out.push({
      symbol: symbolRef,
      time: new Date(ms).toISOString(),
      price,
      size: volume,
      side,
      tradeId: typeof rawId === "number" ? String(rawId) : String(rawId ?? ""),
    });
  }
  // Kraken returns oldest-first; preserve that but assert it via sort
  out.sort((a, b) => a.time.localeCompare(b.time));
  return out;
}
