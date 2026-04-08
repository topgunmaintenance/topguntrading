import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Quote } from "@topgun/types";
import { MockAdapter } from "./mock.adapter";

describe("MockAdapter", () => {
  const adapter = new MockAdapter();

  describe("attribution", () => {
    it("is clearly marked simulated", () => {
      expect(adapter.attribution.simulated).toBe(true);
      expect(adapter.attribution.label.toLowerCase()).toContain("simulated");
    });
  });

  describe("searchSymbols", () => {
    it("returns the full universe when query is empty", async () => {
      const result = await adapter.searchSymbols("");
      expect(result.length).toBeGreaterThan(0);
    });

    it("filters by substring on base asset", async () => {
      const result = await adapter.searchSymbols("btc");
      expect(result.length).toBe(1);
      expect(result[0]?.baseAsset).toBe("BTC");
    });
  });

  describe("getSymbol", () => {
    it("returns null for unknown symbols", async () => {
      expect(await adapter.getSymbol("ZZZ-USD")).toBeNull();
    });

    it("returns metadata for known symbols", async () => {
      const meta = await adapter.getSymbol("BTC-USD");
      expect(meta?.ref).toBe("mock:BTC-USD");
      expect(meta?.provider).toBe("mock");
    });
  });

  describe("getCandles", () => {
    it("produces a deterministic sequence for the same inputs", async () => {
      const a = await adapter.getCandles({
        symbol: "mock:BTC-USD",
        interval: "1m",
        from: "2026-04-08T00:00:00.000+00:00",
        to: "2026-04-08T00:05:00.000+00:00",
      });
      const b = await adapter.getCandles({
        symbol: "mock:BTC-USD",
        interval: "1m",
        from: "2026-04-08T00:00:00.000+00:00",
        to: "2026-04-08T00:05:00.000+00:00",
      });
      expect(a).toEqual(b);
      expect(a.length).toBeGreaterThan(0);
    });

    it("caps at the requested limit", async () => {
      const candles = await adapter.getCandles({
        symbol: "mock:BTC-USD",
        interval: "1m",
        limit: 10,
      });
      expect(candles.length).toBeLessThanOrEqual(10);
    });

    it("returns candles with string-valued OHLC fields", async () => {
      const [first] = await adapter.getCandles({
        symbol: "mock:BTC-USD",
        interval: "1m",
        limit: 1,
      });
      expect(typeof first?.open).toBe("string");
      expect(typeof first?.close).toBe("string");
    });
  });

  describe("streamQuotes", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("emits ticks for every subscribed symbol and stops on close", async () => {
      const received: Quote[] = [];
      const sub = adapter.streamQuotes(["mock:BTC-USD", "mock:ETH-USD"], (q) => {
        received.push(q);
      });

      vi.advanceTimersByTime(500);
      expect(received.length).toBe(2);

      vi.advanceTimersByTime(500);
      expect(received.length).toBe(4);

      await sub.close();
      vi.advanceTimersByTime(1000);
      expect(received.length).toBe(4);
    });

    it("never lets a throwing handler tear down the stream", async () => {
      let calls = 0;
      const sub = adapter.streamQuotes(["mock:BTC-USD"], () => {
        calls++;
        throw new Error("boom");
      });
      vi.advanceTimersByTime(1500);
      expect(calls).toBeGreaterThanOrEqual(2);
      await sub.close();
    });
  });
});
