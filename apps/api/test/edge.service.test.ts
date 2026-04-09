import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AttributionInfo, Trade } from "@topgun/types";
import { EdgeService } from "../src/market-data/edge.service";
import type { Env } from "../src/config/env";
import { MarketDataError } from "@topgun/market-data";

const KRAKEN_ATTRIBUTION: AttributionInfo = {
  provider: "kraken",
  label: "Data provided by Kraken public feed. Delayed.",
  url: "https://www.kraken.com/",
  delayed: true,
  simulated: false,
};

function makeEnv(): Env {
  return {
    NODE_ENV: "test",
    API_PORT: 4001,
    API_PUBLIC_URL: "http://localhost:4001",
    API_CORS_ORIGINS: ["http://localhost:3000"],
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    AUTH_SECRET: "test-auth-secret-at-least-32-characters-xx",
    SESSION_TTL_SECONDS: 900,
    REFRESH_TTL_SECONDS: 60 * 60 * 24 * 30,
    MARKET_DATA_PROVIDER: "mock",
    MARKET_DATA_CACHE_TTL_SECONDS: 60,
    COINBASE_REST_URL: "https://api.exchange.coinbase.com",
    COINBASE_WS_URL: "wss://advanced-trade-ws.coinbase.com",
    KRAKEN_REST_URL: "https://api.kraken.com/0/public",
    WHALES_DEFAULT_SYMBOL: "kraken:XBTUSD",
  };
}

function fixtureTrades(count: number): Trade[] {
  const out: Trade[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      symbol: "kraken:XBTUSD",
      time: new Date(i * 1000).toISOString(),
      price: "67000",
      size: "0.05",
      side: i % 2 === 0 ? "taker_buy" : "taker_sell",
      tradeId: `t-${i}`,
    });
  }
  return out;
}

function whaleTrade(): Trade {
  return {
    symbol: "kraken:XBTUSD",
    time: new Date(999_000).toISOString(),
    price: "67000",
    size: "10",
    side: "taker_buy",
    tradeId: "whale-x",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeRegistryMock(getRecentTrades: any): any {
  const adapter = {
    id: "kraken",
    capabilities: {
      assetClasses: ["crypto"],
      intervals: ["1m"],
      streaming: { quotes: false, trades: false, level2: false },
      recentTrades: true,
      batchQuotes: false,
    },
    attribution: KRAKEN_ATTRIBUTION,
    getRecentTrades,
  };
  return {
    adapterFor: vi.fn(() => adapter),
  };
}

describe("EdgeService", () => {
  // silence the structured JSON log output in the test runner
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleLogSpy: any;
  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });
  afterEachCleanup();

  it("getTrades forwards to the adapter and attaches attribution", async () => {
    const trades = fixtureTrades(5);
    const getRecentTrades = vi.fn(async () => trades);
    const registry = makeRegistryMock(getRecentTrades);
    const svc = new EdgeService(registry, makeEnv());

    const result = await svc.getTrades("kraken:XBTUSD", 5);
    expect(result.trades).toEqual(trades);
    expect(result.attribution).toEqual(KRAKEN_ATTRIBUTION);
    expect(getRecentTrades).toHaveBeenCalledWith({
      symbol: "kraken:XBTUSD",
      limit: 5,
    });
    // Verify a structured JSON log event fired.
    expect(consoleLogSpy).toHaveBeenCalled();
    const logCall = (consoleLogSpy.mock.calls as unknown[][]).find(
      (c: unknown[]) => String(c[0]).includes("market_data.provider_call"),
    );
    expect(logCall).toBeDefined();
    const parsed = JSON.parse(String(logCall?.[0]));
    expect(parsed.event).toBe("market_data.provider_call");
    expect(parsed.provider).toBe("kraken");
    expect(parsed.status).toBe("ok");
  });

  it("getTrades debounces rapid repeated calls to the same symbol", async () => {
    const getRecentTrades = vi.fn(async () => fixtureTrades(3));
    const registry = makeRegistryMock(getRecentTrades);
    const svc = new EdgeService(registry, makeEnv());

    await svc.getTrades("kraken:XBTUSD", 3);
    await svc.getTrades("kraken:XBTUSD", 3);
    await svc.getTrades("kraken:XBTUSD", 3);

    expect(getRecentTrades).toHaveBeenCalledTimes(1);
  });

  it("getWhaleSignals uses the default symbol from env when none supplied", async () => {
    const base = fixtureTrades(200); // 200 small trades (history)
    const tape = [...base, whaleTrade()];
    const getRecentTrades = vi.fn(async () => tape);
    const registry = makeRegistryMock(getRecentTrades);
    const svc = new EdgeService(registry, makeEnv());

    const result = await svc.getWhaleSignals();
    expect(result.signals.length).toBeGreaterThanOrEqual(1);
    const whale = result.signals[0];
    expect(whale?.kind).toBe("large_trade");
    expect(whale?.symbol).toBe("kraken:XBTUSD");
    expect(whale?.source.detectorId).toBe("detectLargeTrades");
    // Attribution flows through
    expect(result.attribution.provider).toBe("kraken");
  });

  it("getWhaleSignals emits no signals when the tape is quiet", async () => {
    const getRecentTrades = vi.fn(async () => fixtureTrades(300));
    const registry = makeRegistryMock(getRecentTrades);
    const svc = new EdgeService(registry, makeEnv());

    const result = await svc.getWhaleSignals("kraken:XBTUSD");
    expect(result.signals).toHaveLength(0);
  });

  it("maps MarketDataError rate_limited to a 503 with rate_limited code", async () => {
    const getRecentTrades = vi.fn(async () => {
      throw new MarketDataError("kraken", "rate_limited", "upstream throttled");
    });
    const registry = makeRegistryMock(getRecentTrades);
    const svc = new EdgeService(registry, makeEnv());

    await expect(svc.getTrades("kraken:XBTUSD")).rejects.toMatchObject({
      response: expect.objectContaining({ code: "rate_limited" }),
    });
  });

  it("rejects providers that do not advertise recentTrades capability", async () => {
    const getRecentTrades = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unsupportedAdapter: any = {
      id: "mock",
      capabilities: {
        assetClasses: ["crypto"],
        intervals: ["1m"],
        streaming: { quotes: false, trades: false, level2: false },
        recentTrades: false,
      },
      attribution: KRAKEN_ATTRIBUTION,
      getRecentTrades,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registry: any = { adapterFor: vi.fn(() => unsupportedAdapter) };
    const svc = new EdgeService(registry, makeEnv());

    await expect(svc.getTrades("mock:BTC-USD")).rejects.toMatchObject({
      response: expect.objectContaining({ code: "unsupported_capability" }),
    });
    expect(getRecentTrades).not.toHaveBeenCalled();
  });
});

function afterEachCleanup(): void {
  // no-op placeholder — keeps the test file self-contained
}
