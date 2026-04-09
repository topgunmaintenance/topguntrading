import { describe, expect, it, vi } from "vitest";
import { KrakenAdapter } from "./kraken.adapter";
import {
  assetPairToSymbolMeta,
  isTradableAssetPair,
  krakenOhlcToNormalized,
  krakenTradesToNormalized,
  tickerToQuote,
} from "./mapping";
import { MarketDataError } from "../errors";

/**
 * Contract tests for the Kraken adapter. Every upstream call is
 * intercepted via an injected `fetch` implementation — no network
 * hits any real endpoint. Per docs/testing-strategy.md §Conventions
 * ("Time is always injected. No `new Date()`.") the adapter itself
 * is allowed to call `new Date()` inside its quote builder because
 * quote timestamps are informational metadata, not data used for
 * candles or replay lock-forward enforcement.
 */

function okResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function errorResponse(status: number, body = ""): Response {
  return new Response(body, {
    status,
    headers: { "content-type": "text/plain" },
  });
}

// ---- Mapping: price precision + candle integrity ---------------------------

describe("kraken mapping — price precision", () => {
  it("preserves decimal strings verbatim in candles", () => {
    const rows = [
      [1712000000, "67000.12345678", "67200.00", "66800.5", "67100.01", "0", "12.345678", 10],
      [1712000060, "67100.01", "67150.9", "67050.1", "67125.55", "0", "9.87654321", 8],
    ];
    const candles = krakenOhlcToNormalized(rows);
    expect(candles).toHaveLength(2);
    expect(candles[0]).toMatchObject({
      openTime: new Date(1712000000 * 1000).toISOString(),
      open: "67000.12345678",
      high: "67200.00",
      low: "66800.5",
      close: "67100.01",
      volume: "12.345678",
    });
    // No parseFloat ever happens — strings come out character-identical
    // to what came in, so whales of $67,000.12345678 don't silently
    // become $67,000.12345679.
    expect(candles[1]?.volume).toBe("9.87654321");
  });

  it("rejects a non-array payload with MarketDataError", () => {
    expect(() => krakenOhlcToNormalized({ not: "an array" })).toThrow(MarketDataError);
  });

  it("drops malformed rows silently rather than crashing", () => {
    const rows = [
      [1712000000, "67000", "67200", "66800", "67100", "0", "1.5", 10],
      // malformed — time not a number
      ["bad", "67000", "67200", "66800", "67100", "0", "1.5", 10],
      [1712000060, "67100", "67150", "67050", "67125", "0", "2.5", 8],
    ];
    const candles = krakenOhlcToNormalized(rows);
    expect(candles).toHaveLength(2);
  });
});

describe("kraken mapping — candle integrity", () => {
  it("sorts bars chronologically", () => {
    const rows = [
      [1712000120, "3", "3", "3", "3", "0", "1", 1],
      [1712000000, "1", "1", "1", "1", "0", "1", 1],
      [1712000060, "2", "2", "2", "2", "0", "1", 1],
    ];
    const candles = krakenOhlcToNormalized(rows);
    expect(candles.map((c) => c.open)).toEqual(["1", "2", "3"]);
  });

  it("yields candles where OHLC invariants can be checked externally", () => {
    // Detector-level / UI-level invariant: high >= max(open, close, low),
    // low <= min(open, close, high). We don't enforce this at mapping
    // time because it's provider-trust territory, but the test asserts
    // the mapping doesn't scramble the fields.
    const rows = [[1712000000, "100.0", "110.5", "99.5", "105.25", "0", "50", 5]];
    const [c] = krakenOhlcToNormalized(rows);
    if (!c) throw new Error("no candle");
    const open = Number.parseFloat(c.open);
    const high = Number.parseFloat(c.high);
    const low = Number.parseFloat(c.low);
    const close = Number.parseFloat(c.close);
    expect(high).toBeGreaterThanOrEqual(Math.max(open, close, low));
    expect(low).toBeLessThanOrEqual(Math.min(open, close, high));
  });
});

// ---- Mapping: trade parsing ------------------------------------------------

describe("kraken mapping — trade parsing", () => {
  it("maps taker side labels b/s to taker_buy/taker_sell", () => {
    const rows = [
      ["67000.12345678", "0.5", 1712658123.4567, "b", "l", "", 123],
      ["67100.00", "1.0", 1712658124.1, "s", "l", "", 124],
      ["67150.00", "0.25", 1712658125.0, "x", "l", "", 125],
    ];
    const trades = krakenTradesToNormalized("XBTUSD", rows);
    expect(trades).toHaveLength(3);
    expect(trades[0]).toMatchObject({
      symbol: "kraken:XBTUSD",
      price: "67000.12345678",
      size: "0.5",
      side: "taker_buy",
      tradeId: "123",
    });
    expect(trades[1]?.side).toBe("taker_sell");
    expect(trades[2]?.side).toBe("unknown");
  });

  it("preserves float-seconds timestamps at millisecond precision", () => {
    const rows = [["67000", "1", 1712658123.456, "b", "l", "", 1]];
    const [t] = krakenTradesToNormalized("XBTUSD", rows);
    // 1712658123.456 * 1000 = 1712658123456 ms
    expect(t?.time).toBe(new Date(1712658123456).toISOString());
    // Millisecond precision preserved verbatim
    expect(t?.time).toMatch(/\.456Z$/);
  });

  it("skips malformed rows silently", () => {
    const rows = [
      ["67000", "1", 1712658123.456, "b", "l", "", 1],
      ["not-a-price", "1", 1712658124, "b", "l", "", 2], // malformed price
      [],
      ["67100", "2", 1712658125.0, "s", "l", "", 3],
    ];
    const trades = krakenTradesToNormalized("XBTUSD", rows);
    expect(trades).toHaveLength(2);
  });

  it("rejects a non-array payload", () => {
    expect(() => krakenTradesToNormalized("XBTUSD", { nope: true })).toThrow(
      MarketDataError,
    );
  });
});

// ---- Mapping: ticker + asset pair ------------------------------------------

describe("kraken mapping — misc", () => {
  it("tickerToQuote uses first-entry shape and preserves decimal strings", () => {
    const quote = tickerToQuote(
      "XBTUSD",
      {
        a: ["67123.45", "1", "1"],
        b: ["67122.00", "1", "1"],
        c: ["67122.80", "0.01"],
        v: ["100.5", "2345.67"],
      },
      "2024-04-09T12:00:00.000Z",
    );
    expect(quote).toEqual({
      symbol: "kraken:XBTUSD",
      time: "2024-04-09T12:00:00.000Z",
      last: "67122.80",
      bid: "67122.00",
      ask: "67123.45",
      volume24h: "2345.67",
    });
  });

  it("assetPairToSymbolMeta strips X/Z prefixes from crypto/fiat codes", () => {
    const meta = assetPairToSymbolMeta("XXBTZUSD", {
      altname: "XBTUSD",
      wsname: "XBT/USD",
      base: "XXBT",
      quote: "ZUSD",
      status: "online",
      tick_size: "0.1",
      ordermin: "0.0001",
    });
    expect(meta).toMatchObject({
      ref: "kraken:XBTUSD",
      provider: "kraken",
      providerSymbol: "XBTUSD",
      baseAsset: "BTC",
      quoteAsset: "USD",
      displayName: "BTC / USD",
      minPriceIncrement: "0.1",
      minSizeIncrement: "0.0001",
    });
  });

  it("isTradableAssetPair rejects offline pairs", () => {
    expect(isTradableAssetPair({ altname: "XBTUSD", status: "offline" })).toBe(false);
    expect(isTradableAssetPair({ altname: "XBTUSD", status: "online" })).toBe(true);
    expect(isTradableAssetPair({ status: "online" })).toBe(false);
  });
});

// ---- Adapter behavior ------------------------------------------------------

describe("KrakenAdapter — behavior with mocked fetch", () => {
  function adapterWithFetch(mockFetch: typeof fetch): KrakenAdapter {
    return new KrakenAdapter({ rest: { fetch: mockFetch, baseUrl: "https://fake" } });
  }

  it("declares the right capabilities for Phase 3.5", () => {
    const adapter = new KrakenAdapter();
    expect(adapter.id).toBe("kraken");
    expect(adapter.capabilities.assetClasses).toEqual(["crypto"]);
    expect(adapter.capabilities.recentTrades).toBe(true);
    expect(adapter.capabilities.batchQuotes).toBe(false);
    expect(adapter.capabilities.streaming.quotes).toBe(false);
    expect(adapter.attribution.label).toMatch(/kraken/i);
    expect(adapter.attribution.simulated).toBe(false);
    expect(adapter.attribution.delayed).toBe(true);
  });

  it("getRecentTrades calls /Trades with the pair and normalizes the response", async () => {
    const mockFetch = vi.fn(async () =>
      okResponse({
        error: [],
        result: {
          XXBTZUSD: [
            ["67000.12345678", "0.5", 1712658123.4567, "b", "l", "", 123],
            ["67100.00", "1.0", 1712658124.1, "s", "l", "", 124],
          ],
          last: "1712658124100000000",
        },
      }),
    );
    const adapter = adapterWithFetch(mockFetch);
    const trades = await adapter.getRecentTrades({ symbol: "kraken:XBTUSD" });
    expect(trades).toHaveLength(2);
    expect(trades[0]?.price).toBe("67000.12345678"); // precision preserved
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const call = mockFetch.mock.calls[0];
    const url = String(call?.[0]);
    expect(url).toContain("/Trades?pair=XBTUSD");
  });

  it("getRecentTrades honors the limit by keeping the most recent", async () => {
    const rows = [
      ["1", "1", 1, "b", "l", "", 1],
      ["2", "1", 2, "b", "l", "", 2],
      ["3", "1", 3, "b", "l", "", 3],
      ["4", "1", 4, "b", "l", "", 4],
      ["5", "1", 5, "b", "l", "", 5],
    ];
    const mockFetch = vi.fn(async () =>
      okResponse({ error: [], result: { XXBTZUSD: rows, last: "0" } }),
    );
    const adapter = adapterWithFetch(mockFetch);
    const trades = await adapter.getRecentTrades({
      symbol: "kraken:XBTUSD",
      limit: 3,
    });
    expect(trades).toHaveLength(3);
    expect(trades.map((t) => t.tradeId)).toEqual(["3", "4", "5"]);
  });

  it("surfaces Kraken envelope errors as MarketDataError", async () => {
    const mockFetch = vi.fn(async () =>
      okResponse({ error: ["EQuery:Unknown asset pair"], result: {} }),
    );
    const adapter = adapterWithFetch(mockFetch);
    await expect(
      adapter.getRecentTrades({ symbol: "kraken:NOPE" }),
    ).rejects.toBeInstanceOf(MarketDataError);
  });

  it("maps HTTP 429 to a rate_limited MarketDataError", async () => {
    const mockFetch = vi.fn(async () => errorResponse(429, "rate limit"));
    const adapter = adapterWithFetch(mockFetch);
    await expect(
      adapter.getRecentTrades({ symbol: "kraken:XBTUSD" }),
    ).rejects.toMatchObject({
      name: "MarketDataError",
      code: "rate_limited",
    });
  });

  it("getCandles builds the interval query param in minutes", async () => {
    const rows = [
      [1712000000, "67000", "67200", "66800", "67100", "0", "1.5", 10],
      [1712000300, "67100", "67150", "67050", "67125", "0", "2.5", 8],
    ];
    const mockFetch = vi.fn(async () =>
      okResponse({ error: [], result: { XXBTZUSD: rows, last: 0 } }),
    );
    const adapter = adapterWithFetch(mockFetch);
    const candles = await adapter.getCandles({
      symbol: "kraken:XBTUSD",
      interval: "5m",
    });
    expect(candles).toHaveLength(2);
    const url = String(mockFetch.mock.calls[0]?.[0]);
    expect(url).toContain("interval=5");
    expect(url).toContain("pair=XBTUSD");
  });

  it("streamQuotes returns an inert subscription in Phase 3.5", async () => {
    const adapter = new KrakenAdapter();
    const sub = adapter.streamQuotes(["XBTUSD"], () => {
      throw new Error("should not be called");
    });
    expect(sub.symbols.has("XBTUSD")).toBe(true);
    await expect(sub.close()).resolves.toBeUndefined();
  });
});
