import { describe, expect, it, vi } from "vitest";
import type { Quote } from "@topgun/types";
import type { IMarketDataAdapter, Subscription } from "@topgun/market-data";
import { SubscriptionHub } from "../src/market-data/subscription-hub";
import type { MarketDataAdapterRegistry } from "../src/market-data/adapter.registry";

/**
 * Minimal adapter harness that lets tests drive fake quote broadcasts
 * and count how often `streamQuotes` was invoked.
 */
function makeFakeAdapter(id = "mock"): {
  adapter: IMarketDataAdapter;
  pushQuote: (quote: Quote) => void;
  streamCalls: () => number;
  closedCount: () => number;
} {
  let calls = 0;
  let closed = 0;
  const handlers: Array<(quote: Quote) => void> = [];

  const adapter: IMarketDataAdapter = {
    id,
    capabilities: {
      assetClasses: ["crypto"],
      intervals: ["1m"],
      streaming: { quotes: true, trades: false, level2: false },
    },
    attribution: {
      provider: id,
      label: "test",
      url: null,
      delayed: false,
      simulated: true,
    },
    async searchSymbols() {
      return [];
    },
    async getSymbol() {
      return null;
    },
    async listSupportedSymbols() {
      return [];
    },
    async getCandles() {
      return [];
    },
    streamQuotes(_symbols, handler): Subscription {
      calls++;
      handlers.push(handler);
      return {
        symbols: new Set(_symbols),
        async close() {
          closed++;
          const idx = handlers.indexOf(handler);
          if (idx >= 0) handlers.splice(idx, 1);
        },
      };
    },
    async dispose() {},
  };

  return {
    adapter,
    pushQuote(quote: Quote) {
      for (const h of handlers) h(quote);
    },
    streamCalls: () => calls,
    closedCount: () => closed,
  };
}

function makeRegistry(adapter: IMarketDataAdapter): MarketDataAdapterRegistry {
  return { get: () => adapter } as unknown as MarketDataAdapterRegistry;
}

const btcQuote: Quote = {
  symbol: "mock:BTC-USD",
  time: "2026-04-10T12:00:00.000+00:00",
  last: "50000.00",
  bid: "49999.50",
  ask: "50000.50",
  volume24h: "1000",
};

const ethQuote: Quote = { ...btcQuote, symbol: "mock:ETH-USD" };

describe("SubscriptionHub", () => {
  it("creates exactly one upstream subscription per symbol", async () => {
    const fake = makeFakeAdapter();
    const hub = new SubscriptionHub(makeRegistry(fake.adapter));
    hub.registerClient("a", vi.fn());
    hub.registerClient("b", vi.fn());

    await hub.subscribe("a", ["mock:BTC-USD"]);
    await hub.subscribe("b", ["mock:BTC-USD"]);

    expect(fake.streamCalls()).toBe(1);
    expect(hub._hasUpstream("mock:BTC-USD")).toBe(true);
    expect(hub._clientCount("mock:BTC-USD")).toBe(2);
  });

  it("fans out a single upstream quote to every subscribed client", async () => {
    const fake = makeFakeAdapter();
    const hub = new SubscriptionHub(makeRegistry(fake.adapter));
    const recvA = vi.fn();
    const recvB = vi.fn();
    hub.registerClient("a", (_id, quote) => recvA(quote));
    hub.registerClient("b", (_id, quote) => recvB(quote));

    await hub.subscribe("a", ["mock:BTC-USD"]);
    await hub.subscribe("b", ["mock:BTC-USD"]);

    fake.pushQuote(btcQuote);
    expect(recvA).toHaveBeenCalledWith(btcQuote);
    expect(recvB).toHaveBeenCalledWith(btcQuote);
  });

  it("tears down the upstream when the last client unsubscribes", async () => {
    const fake = makeFakeAdapter();
    const hub = new SubscriptionHub(makeRegistry(fake.adapter));
    hub.registerClient("a", vi.fn());
    hub.registerClient("b", vi.fn());

    await hub.subscribe("a", ["mock:BTC-USD"]);
    await hub.subscribe("b", ["mock:BTC-USD"]);
    expect(fake.closedCount()).toBe(0);

    hub.unsubscribe("a", ["mock:BTC-USD"]);
    expect(hub._hasUpstream("mock:BTC-USD")).toBe(true); // b is still there
    expect(fake.closedCount()).toBe(0);

    hub.unsubscribe("b", ["mock:BTC-USD"]);
    // Upstream close is awaited inside the hub; allow microtask to run.
    await Promise.resolve();
    expect(hub._hasUpstream("mock:BTC-USD")).toBe(false);
    expect(fake.closedCount()).toBe(1);
  });

  it("releases every symbol when a client disconnects", async () => {
    const fake = makeFakeAdapter();
    const hub = new SubscriptionHub(makeRegistry(fake.adapter));
    hub.registerClient("a", vi.fn());
    await hub.subscribe("a", ["mock:BTC-USD", "mock:ETH-USD"]);
    expect(fake.streamCalls()).toBe(2);

    hub.unregisterClient("a");
    await Promise.resolve();
    expect(hub._hasUpstream("mock:BTC-USD")).toBe(false);
    expect(hub._hasUpstream("mock:ETH-USD")).toBe(false);
    expect(fake.closedCount()).toBe(2);
  });

  it("skips symbols whose provider does not match the active adapter", async () => {
    const fake = makeFakeAdapter("coinbase");
    const hub = new SubscriptionHub(makeRegistry(fake.adapter));
    hub.registerClient("a", vi.fn());

    const { accepted, skipped } = await hub.subscribe("a", [
      "coinbase:BTC-USD",
      "mock:BTC-USD",
    ]);
    expect(accepted).toEqual(["coinbase:BTC-USD"]);
    expect(skipped).toEqual(["mock:BTC-USD"]);
    expect(fake.streamCalls()).toBe(1);
  });

  it("never broadcasts ETH quotes to clients only subscribed to BTC", async () => {
    const fake = makeFakeAdapter();
    const hub = new SubscriptionHub(makeRegistry(fake.adapter));
    const recv = vi.fn();
    hub.registerClient("a", (_id, quote) => recv(quote));

    await hub.subscribe("a", ["mock:BTC-USD"]);
    fake.pushQuote(ethQuote);
    expect(recv).not.toHaveBeenCalled();
  });
});
