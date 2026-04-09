import type { Candle, Interval, Quote, SymbolMeta } from "@topgun/types";
export declare const COINBASE_PROVIDER_ID: "coinbase";
/**
 * Coinbase exchange uses seconds for granularity. Only these values
 * are supported; requesting anything else returns a 400.
 */
export declare const COINBASE_GRANULARITY: Record<Interval, number>;
/** Coinbase returns at most 300 candles per request. */
export declare const COINBASE_CANDLE_LIMIT = 300;
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
export declare function productToSymbolMeta(product: CoinbaseProduct): SymbolMeta;
export declare function isTradableProduct(product: CoinbaseProduct): boolean;
/**
 * Coinbase candle shape: `[time, low, high, open, close, volume]` where
 * time is unix seconds. Entries are returned newest-first. We reverse
 * and normalize.
 */
export type CoinbaseCandleRow = [number, number, number, number, number, number];
export declare function coinbaseCandlesToNormalized(rows: unknown): Candle[];
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
export declare function tickerEventToQuote(event: CoinbaseTickerEvent, timestamp: string): Quote;
export interface CoinbaseTickerEnvelope {
    channel: string;
    timestamp: string;
    events: Array<{
        type?: string;
        tickers?: CoinbaseTickerEvent[];
    }>;
}
export declare function isTickerEnvelope(msg: unknown): msg is CoinbaseTickerEnvelope;
//# sourceMappingURL=mapping.d.ts.map