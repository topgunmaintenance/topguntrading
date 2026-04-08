import { describe, expect, it } from "vitest";
import {
  CandleSchema,
  INTERVAL_SECONDS,
  IntervalSchema,
  QuoteSchema,
  SymbolMetaSchema,
  SymbolRefSchema,
  formatSymbolRef,
  parseSymbolRef,
} from "./market-data";

describe("SymbolRefSchema", () => {
  it.each([
    "coinbase:BTC-USD",
    "mock:ETH-USD",
    "kraken:XBT/USD",
    "binance:BTCUSDT",
  ])("accepts %s", (ref) => {
    expect(SymbolRefSchema.safeParse(ref).success).toBe(true);
  });

  it.each([
    "Coinbase:BTC-USD", // uppercase provider
    "coinbase:", // empty symbol
    ":BTC-USD", // empty provider
    "coinbase BTC-USD", // no colon
    "coinbase:BTC USD", // space in symbol
  ])("rejects %s", (ref) => {
    expect(SymbolRefSchema.safeParse(ref).success).toBe(false);
  });
});

describe("parseSymbolRef / formatSymbolRef", () => {
  it("round-trips", () => {
    const { provider, symbol } = parseSymbolRef("coinbase:BTC-USD");
    expect(provider).toBe("coinbase");
    expect(symbol).toBe("BTC-USD");
    expect(formatSymbolRef(provider, symbol)).toBe("coinbase:BTC-USD");
  });
});

describe("IntervalSchema / INTERVAL_SECONDS", () => {
  it("covers every interval", () => {
    for (const interval of IntervalSchema.options) {
      expect(INTERVAL_SECONDS[interval]).toBeGreaterThan(0);
    }
  });
});

describe("CandleSchema", () => {
  it("accepts a string-valued candle", () => {
    const result = CandleSchema.safeParse({
      openTime: "2026-04-08T12:00:00.000+00:00",
      open: "50000.00",
      high: "50100.00",
      low: "49900.00",
      close: "50050.00",
      volume: "12.34567890",
    });
    expect(result.success).toBe(true);
  });

  it("rejects numeric OHLC values", () => {
    const result = CandleSchema.safeParse({
      openTime: "2026-04-08T12:00:00.000+00:00",
      open: 50000,
      high: 50100,
      low: 49900,
      close: 50050,
      volume: 12.3,
    });
    expect(result.success).toBe(false);
  });
});

describe("QuoteSchema", () => {
  it("allows null bid/ask/last/volume for partial feeds", () => {
    const result = QuoteSchema.safeParse({
      symbol: "coinbase:BTC-USD",
      time: "2026-04-08T12:00:00.000+00:00",
      last: "50000.00",
      bid: null,
      ask: null,
      volume24h: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("SymbolMetaSchema", () => {
  it("requires provider + providerSymbol + ref to agree at the caller layer", () => {
    const result = SymbolMetaSchema.safeParse({
      ref: "coinbase:BTC-USD",
      provider: "coinbase",
      providerSymbol: "BTC-USD",
      assetClass: "crypto",
      baseAsset: "BTC",
      quoteAsset: "USD",
      displayName: "Bitcoin / US Dollar",
      minPriceIncrement: "0.01",
      minSizeIncrement: "0.00000001",
    });
    expect(result.success).toBe(true);
  });
});
