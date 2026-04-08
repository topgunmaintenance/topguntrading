import type { Candle, Interval, Quote, SymbolMeta } from "@topgun/types";
import { formatSymbolRef } from "@topgun/types";
import { MarketDataError } from "../errors";

export const COINBASE_PROVIDER_ID = "coinbase" as const;

/**
 * Coinbase exchange uses seconds for granularity. Only these values
 * are supported; requesting anything else returns a 400.
 */
export const COINBASE_GRANULARITY: Record<Interval, number> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1h": 3600,
  "6h": 21600,
  "1d": 86400,
};

/** Coinbase returns at most 300 candles per request. */
export const COINBASE_CANDLE_LIMIT = 300;

// ---- Product → SymbolMeta ----------------------------------------------------

/**
 * Shape of a product object from `GET /products`. Fields we do not
 * read are marked unknown to avoid coupling to the full payload.
 */
export interface CoinbaseProduct {
  id: string;
  base_currency: string;
  quote_currency: string;
  display_name?: string;
  quote_increment?: string;
  base_increment?: string;
  status?: string;
  trading_disabled?: boolean;
  cancel_only?: boolean;
  post_only?: boolean;
  limit_only?: boolean;
}

export function productToSymbolMeta(product: CoinbaseProduct): SymbolMeta {
  return {
    ref: formatSymbolRef(COINBASE_PROVIDER_ID, product.id),
    provider: COINBASE_PROVIDER_ID,
    providerSymbol: product.id,
    assetClass: "crypto",
    baseAsset: product.base_currency,
    quoteAsset: product.quote_currency,
    displayName:
      product.display_name ?? `${product.base_currency} / ${product.quote_currency}`,
    minPriceIncrement: product.quote_increment ?? null,
    minSizeIncrement: product.base_increment ?? null,
  };
}

export function isTradableProduct(product: CoinbaseProduct): boolean {
  if (product.trading_disabled) return false;
  if (product.status && product.status !== "online") return false;
  return true;
}

// ---- Candles -----------------------------------------------------------------

/**
 * Coinbase candle shape: `[time, low, high, open, close, volume]` where
 * time is unix seconds. Entries are returned newest-first. We reverse
 * and normalize.
 */
export type CoinbaseCandleRow = [number, number, number, number, number, number];

export function coinbaseCandlesToNormalized(rows: unknown): Candle[] {
  if (!Array.isArray(rows)) {
    throw new MarketDataError(
      COINBASE_PROVIDER_ID,
      "bad_response",
      "Expected an array of candles",
    );
  }
  const candles: Candle[] = [];
  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 6) continue;
    const [time, low, high, open, close, volume] = row as CoinbaseCandleRow;
    if (
      typeof time !== "number" ||
      typeof low !== "number" ||
      typeof high !== "number" ||
      typeof open !== "number" ||
      typeof close !== "number" ||
      typeof volume !== "number"
    ) {
      continue;
    }
    candles.push({
      openTime: new Date(time * 1000).toISOString(),
      open: open.toString(),
      high: high.toString(),
      low: low.toString(),
      close: close.toString(),
      volume: volume.toString(),
    });
  }
  candles.sort((a, b) => a.openTime.localeCompare(b.openTime));
  return candles;
}

// ---- Ticker → Quote ----------------------------------------------------------

/**
 * Shape of a single ticker event from the Advanced Trade WS feed.
 * The subset we care about is the product id and the last / bid /
 * ask / 24h volume.
 */
export interface CoinbaseTickerEvent {
  product_id: string;
  price?: string;
  best_bid?: string;
  best_ask?: string;
  volume_24_h?: string;
}

export function tickerEventToQuote(
  event: CoinbaseTickerEvent,
  timestamp: string,
): Quote {
  return {
    symbol: formatSymbolRef(COINBASE_PROVIDER_ID, event.product_id),
    time: timestamp,
    last: event.price ?? null,
    bid: event.best_bid ?? null,
    ask: event.best_ask ?? null,
    volume24h: event.volume_24_h ?? null,
  };
}

// ---- Envelope of a raw WS message we care about -----------------------------

export interface CoinbaseTickerEnvelope {
  channel: string;
  timestamp: string;
  events: Array<{
    type?: string;
    tickers?: CoinbaseTickerEvent[];
  }>;
}

export function isTickerEnvelope(msg: unknown): msg is CoinbaseTickerEnvelope {
  if (typeof msg !== "object" || msg === null) return false;
  const m = msg as Record<string, unknown>;
  return m.channel === "ticker" && Array.isArray(m.events);
}
