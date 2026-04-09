/**
 * TopGun Trading — Kraken public-API market data adapter.
 *
 * Implements `IMarketDataAdapter` against Kraken's unauthenticated
 * public REST endpoints. Powers the Phase 3.5 whale-activity
 * observational feature via `getRecentTrades`. Candles and quotes
 * are also supported so this adapter can serve as a fallback or
 * secondary provider for crypto symbols.
 *
 * No live WebSocket stream in this phase — `streamQuotes` returns
 * an inert subscription. A WS client can be added in a future
 * phase behind the same contract without touching callers.
 *
 * Source:      https://docs.kraken.com/rest/
 * License:     Public unauthenticated REST. No credentials sent.
 * Attribution: "Data provided by Kraken public feed. Delayed."
 * ADR:         docs/decisions.md ADR-0026
 */

import type {
  AdapterCapabilities,
  AttributionInfo,
  Candle,
  CandleRequest,
  SymbolMeta,
  Trade,
  TradesRequest,
} from "@topgun/types";
import type { IMarketDataAdapter, QuoteHandler, Subscription } from "../contract";
import { KrakenRestClient, type KrakenRestOptions } from "./kraken.rest";
import { KRAKEN_PROVIDER_ID } from "./mapping";

export interface KrakenAdapterOptions {
  rest?: KrakenRestOptions;
  /** Override how long the in-process asset-pair cache lasts. */
  pairsTtlMs?: number;
}

const DEFAULT_PAIRS_TTL_MS = 5 * 60 * 1000;

export class KrakenAdapter implements IMarketDataAdapter {
  readonly id = KRAKEN_PROVIDER_ID;

  readonly capabilities: AdapterCapabilities = {
    assetClasses: ["crypto"],
    intervals: ["1m", "5m", "15m", "1h", "6h", "1d"],
    streaming: { quotes: false, trades: false, level2: false },
    recentTrades: true,
    batchQuotes: false,
  };

  readonly attribution: AttributionInfo = {
    provider: "kraken",
    label: "Data provided by Kraken public feed. Delayed.",
    url: "https://www.kraken.com/",
    delayed: true,
    simulated: false,
  };

  private readonly rest: KrakenRestClient;
  private readonly pairsTtlMs: number;

  private pairsCache: { at: number; data: SymbolMeta[] } | null = null;

  constructor(options: KrakenAdapterOptions = {}) {
    this.rest = new KrakenRestClient(options.rest);
    this.pairsTtlMs = options.pairsTtlMs ?? DEFAULT_PAIRS_TTL_MS;
  }

  async searchSymbols(query: string, limit = 20): Promise<SymbolMeta[]> {
    const pairs = await this.getPairs();
    const q = query.trim().toLowerCase();
    if (!q) return pairs.slice(0, limit);
    return pairs
      .filter(
        (p) =>
          p.providerSymbol.toLowerCase().includes(q) ||
          p.baseAsset.toLowerCase().includes(q) ||
          p.quoteAsset.toLowerCase().includes(q) ||
          p.displayName.toLowerCase().includes(q),
      )
      .slice(0, limit);
  }

  async getSymbol(providerSymbol: string): Promise<SymbolMeta | null> {
    const pairs = await this.getPairs();
    const match = pairs.find((p) => p.providerSymbol === providerSymbol);
    if (match) return match;
    return this.rest.getAssetPair(providerSymbol);
  }

  async listSupportedSymbols(limit = 50): Promise<SymbolMeta[]> {
    const pairs = await this.getPairs();
    return pairs.slice(0, limit);
  }

  async getCandles(request: CandleRequest): Promise<Candle[]> {
    return this.rest.getCandles(request);
  }

  streamQuotes(symbols: string[], _handler: QuoteHandler): Subscription {
    // Kraken WS is not wired up in Phase 3.5. Return an inert
    // subscription so the caller can still call close() safely.
    void _handler;
    const symbolSet = new Set(symbols);
    return {
      symbols: symbolSet,
      close: async () => {
        // nothing to tear down
      },
    };
  }

  async getRecentTrades(request: TradesRequest): Promise<Trade[]> {
    const providerSymbol = request.symbol.includes(":")
      ? request.symbol.slice(request.symbol.indexOf(":") + 1)
      : request.symbol;
    return this.rest.getRecentTrades(providerSymbol, request.limit, request.since);
  }

  async dispose(): Promise<void> {
    this.pairsCache = null;
  }

  // ---- internals ------------------------------------------------------------

  private async getPairs(): Promise<SymbolMeta[]> {
    if (this.pairsCache && Date.now() - this.pairsCache.at < this.pairsTtlMs) {
      return this.pairsCache.data;
    }
    const data = await this.rest.listAssetPairs();
    this.pairsCache = { at: Date.now(), data };
    return data;
  }
}
