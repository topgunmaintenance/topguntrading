import { describe, expect, it } from "vitest";
import {
  COINBASE_GRANULARITY,
  coinbaseCandlesToNormalized,
  isTickerEnvelope,
  isTradableProduct,
  productToSymbolMeta,
  tickerEventToQuote,
  type CoinbaseProduct,
} from "./mapping";

describe("COINBASE_GRANULARITY", () => {
  it("maps every interval we advertise", () => {
    expect(COINBASE_GRANULARITY["1m"]).toBe(60);
    expect(COINBASE_GRANULARITY["5m"]).toBe(300);
    expect(COINBASE_GRANULARITY["15m"]).toBe(900);
    expect(COINBASE_GRANULARITY["1h"]).toBe(3600);
    expect(COINBASE_GRANULARITY["6h"]).toBe(21600);
    expect(COINBASE_GRANULARITY["1d"]).toBe(86400);
  });
});

describe("productToSymbolMeta", () => {
  it("builds a normalized meta from a Coinbase product", () => {
    const product: CoinbaseProduct = {
      id: "BTC-USD",
      base_currency: "BTC",
      quote_currency: "USD",
      display_name: "Bitcoin / US Dollar",
      quote_increment: "0.01",
      base_increment: "0.00000001",
      status: "online",
    };
    const meta = productToSymbolMeta(product);
    expect(meta.ref).toBe("coinbase:BTC-USD");
    expect(meta.provider).toBe("coinbase");
    expect(meta.providerSymbol).toBe("BTC-USD");
    expect(meta.assetClass).toBe("crypto");
    expect(meta.baseAsset).toBe("BTC");
    expect(meta.quoteAsset).toBe("USD");
    expect(meta.displayName).toBe("Bitcoin / US Dollar");
    expect(meta.minPriceIncrement).toBe("0.01");
    expect(meta.minSizeIncrement).toBe("0.00000001");
  });

  it("falls back to base/quote for the display name when missing", () => {
    const meta = productToSymbolMeta({
      id: "SOL-USD",
      base_currency: "SOL",
      quote_currency: "USD",
    });
    expect(meta.displayName).toBe("SOL / USD");
    expect(meta.minPriceIncrement).toBeNull();
    expect(meta.minSizeIncrement).toBeNull();
  });
});

describe("isTradableProduct", () => {
  it("rejects disabled, non-online, or cancel-only products", () => {
    expect(
      isTradableProduct({
        id: "BAD-USD",
        base_currency: "BAD",
        quote_currency: "USD",
        trading_disabled: true,
      }),
    ).toBe(false);
    expect(
      isTradableProduct({
        id: "WAT-USD",
        base_currency: "WAT",
        quote_currency: "USD",
        status: "delisted",
      }),
    ).toBe(false);
    expect(
      isTradableProduct({
        id: "OK-USD",
        base_currency: "OK",
        quote_currency: "USD",
        status: "online",
      }),
    ).toBe(true);
  });
});

describe("coinbaseCandlesToNormalized", () => {
  it("sorts ascending and converts to ISO + string OHLC", () => {
    const raw: Array<[number, number, number, number, number, number]> = [
      [1700000120, 49900, 50100, 50000, 50050, 10],
      [1700000060, 49800, 50000, 49900, 49950, 8],
      [1700000000, 49700, 49900, 49800, 49850, 5],
    ];
    const normalized = coinbaseCandlesToNormalized(raw);
    expect(normalized).toHaveLength(3);
    const first = normalized[0];
    const second = normalized[1];
    if (!first || !second) throw new Error("expected at least two candles");
    expect(first.openTime < second.openTime).toBe(true);
    expect(normalized[0]?.open).toBe("49800");
    expect(typeof normalized[0]?.volume).toBe("string");
  });

  it("throws on a non-array response", () => {
    expect(() => coinbaseCandlesToNormalized({ error: "nope" })).toThrow(
      /array/,
    );
  });

  it("skips malformed rows", () => {
    const mixed = [
      [1700000060, 1, 2, 3, 4, 5],
      ["garbage"],
      [1700000120, 1, 2, 3, 4, 5],
    ];
    expect(coinbaseCandlesToNormalized(mixed)).toHaveLength(2);
  });
});

describe("tickerEventToQuote", () => {
  it("maps a ticker event to a normalized quote", () => {
    const q = tickerEventToQuote(
      {
        product_id: "BTC-USD",
        price: "50000.12",
        best_bid: "49999.50",
        best_ask: "50000.75",
        volume_24_h: "12345.6789",
      },
      "2026-04-08T12:00:00.123+00:00",
    );
    expect(q.symbol).toBe("coinbase:BTC-USD");
    expect(q.last).toBe("50000.12");
    expect(q.bid).toBe("49999.50");
    expect(q.ask).toBe("50000.75");
    expect(q.volume24h).toBe("12345.6789");
  });

  it("allows missing fields as nulls", () => {
    const q = tickerEventToQuote({ product_id: "BTC-USD" }, "2026-04-08T12:00:00+00:00");
    expect(q.last).toBeNull();
    expect(q.bid).toBeNull();
    expect(q.ask).toBeNull();
    expect(q.volume24h).toBeNull();
  });
});

describe("isTickerEnvelope", () => {
  it("accepts a shaped envelope", () => {
    expect(
      isTickerEnvelope({
        channel: "ticker",
        timestamp: "2026-04-08T12:00:00+00:00",
        events: [{ type: "update", tickers: [] }],
      }),
    ).toBe(true);
  });

  it("rejects other channels", () => {
    expect(
      isTickerEnvelope({
        channel: "heartbeats",
        events: [],
      }),
    ).toBe(false);
  });
});
