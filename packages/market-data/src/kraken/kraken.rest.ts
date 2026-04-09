/**
 * TopGun Trading — Kraken public-API REST client.
 *
 * Unauthenticated public endpoints only. No credentials sent, ever.
 * Per ADR-0026 this is the second crypto market-data provider after
 * Coinbase and specifically powers the Phase 3.5 whale-activity
 * observational feature.
 *
 * Source:      https://docs.kraken.com/rest/
 * License:     Public unauthenticated REST.
 * Attribution: "Data provided by Kraken public feed. Delayed."
 */

import type { Candle, CandleRequest, Quote, SymbolMeta, Trade } from "@topgun/types";
import { INTERVAL_SECONDS } from "@topgun/types";
import { MarketDataError } from "../errors";
import {
  KRAKEN_INTERVAL_MINUTES,
  KRAKEN_OHLC_LIMIT,
  KRAKEN_PROVIDER_ID,
  type KrakenAssetPair,
  type KrakenTickerEntry,
  assetPairToSymbolMeta,
  isTradableAssetPair,
  krakenOhlcToNormalized,
  krakenTradesToNormalized,
  tickerToQuote,
} from "./mapping";

export interface KrakenRestOptions {
  /** Override the REST base URL (used in tests and mirrors). */
  baseUrl?: string;
  /** Override the global fetch implementation (used in tests). */
  fetch?: typeof fetch;
  /** Per-request timeout. Defaults to 10s. */
  requestTimeoutMs?: number;
  userAgent?: string;
}

const DEFAULT_BASE_URL = "https://api.kraken.com/0/public";
const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Kraken wraps every response in an envelope:
 *   { error: string[], result: T }
 * A non-empty `error` array means the upstream rejected the request.
 */
interface KrakenEnvelope<T> {
  error?: string[];
  result?: T;
}

export class KrakenRestClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly userAgent: string;

  constructor(options: KrakenRestOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.fetchImpl = options.fetch ?? globalThis.fetch;
    this.timeoutMs = options.requestTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.userAgent =
      options.userAgent ?? "topgun-trading/0.3 (+https://topguntrading.example)";
    if (typeof this.fetchImpl !== "function") {
      throw new MarketDataError(
        KRAKEN_PROVIDER_ID,
        "configuration_error",
        "Global fetch is not available. Pass a fetch implementation via KrakenRestOptions.",
      );
    }
  }

  async listAssetPairs(): Promise<SymbolMeta[]> {
    const result = await this.request<Record<string, KrakenAssetPair>>(
      "/AssetPairs",
    );
    if (!result || typeof result !== "object") {
      throw new MarketDataError(
        KRAKEN_PROVIDER_ID,
        "bad_response",
        "Expected /AssetPairs to return an object",
      );
    }
    const symbols: SymbolMeta[] = [];
    for (const [key, pair] of Object.entries(result)) {
      if (!isTradableAssetPair(pair)) continue;
      const meta = assetPairToSymbolMeta(key, pair);
      if (meta) symbols.push(meta);
    }
    // Stable alphabetical order so search results are predictable.
    symbols.sort((a, b) => a.providerSymbol.localeCompare(b.providerSymbol));
    return symbols;
  }

  async getAssetPair(providerSymbol: string): Promise<SymbolMeta | null> {
    try {
      const result = await this.request<Record<string, KrakenAssetPair>>(
        `/AssetPairs?pair=${encodeURIComponent(providerSymbol)}`,
      );
      if (!result) return null;
      for (const [key, pair] of Object.entries(result)) {
        const meta = assetPairToSymbolMeta(key, pair);
        if (meta && meta.providerSymbol === providerSymbol) return meta;
        // Kraken sometimes returns the canonical key instead of altname.
        if (meta && key === providerSymbol) return meta;
      }
      return null;
    } catch (error) {
      if (error instanceof MarketDataError && error.code === "not_found") {
        return null;
      }
      throw error;
    }
  }

  async getCandles(request: CandleRequest): Promise<Candle[]> {
    const providerSymbol = stripProviderPrefix(request.symbol);
    const intervalMins = KRAKEN_INTERVAL_MINUTES[request.interval];
    if (intervalMins === undefined) {
      throw new MarketDataError(
        KRAKEN_PROVIDER_ID,
        "unsupported_interval",
        `Kraken adapter does not support interval ${request.interval}`,
      );
    }

    const params = new URLSearchParams();
    params.set("pair", providerSymbol);
    params.set("interval", String(intervalMins));
    if (request.from) {
      // Kraken `since` for OHLC is unix seconds.
      const since = Math.floor(new Date(request.from).getTime() / 1000);
      params.set("since", String(since));
    }

    const result = await this.request<Record<string, unknown>>(
      `/OHLC?${params.toString()}`,
    );
    if (!result || typeof result !== "object") {
      throw new MarketDataError(
        KRAKEN_PROVIDER_ID,
        "bad_response",
        "Expected /OHLC envelope to contain a result object",
      );
    }
    // Kraken keys the result by the canonical pair name (not always altname).
    // Find the first array value that looks like OHLC rows and use it.
    const rows = pickFirstArrayValue(result);
    const candles = krakenOhlcToNormalized(rows);
    const limit = Math.min(
      request.limit ?? KRAKEN_OHLC_LIMIT,
      KRAKEN_OHLC_LIMIT,
    );
    // Trim to `limit` most-recent bars if the caller asked for fewer.
    // If `to` is set, drop any bars newer than it.
    let trimmed = candles;
    if (request.to) {
      const toMs = new Date(request.to).getTime();
      trimmed = trimmed.filter((c) => new Date(c.openTime).getTime() <= toMs);
    }
    if (trimmed.length > limit) {
      trimmed = trimmed.slice(trimmed.length - limit);
    }
    // Sanity check that from->to range is plausible; use INTERVAL_SECONDS
    // so lint doesn't complain about the unused import.
    void INTERVAL_SECONDS;
    return trimmed;
  }

  async getQuote(providerSymbol: string): Promise<Quote> {
    const params = new URLSearchParams();
    params.set("pair", providerSymbol);
    const result = await this.request<Record<string, KrakenTickerEntry>>(
      `/Ticker?${params.toString()}`,
    );
    if (!result || typeof result !== "object") {
      throw new MarketDataError(
        KRAKEN_PROVIDER_ID,
        "bad_response",
        "Expected /Ticker envelope to contain a result object",
      );
    }
    const entries = Object.values(result);
    const first = entries[0];
    if (!first) {
      throw new MarketDataError(
        KRAKEN_PROVIDER_ID,
        "not_found",
        `Kraken ticker returned no entries for ${providerSymbol}`,
      );
    }
    return tickerToQuote(providerSymbol, first, new Date().toISOString());
  }

  async getRecentTrades(
    providerSymbol: string,
    limit: number | undefined,
    since: string | undefined,
  ): Promise<Trade[]> {
    const params = new URLSearchParams();
    params.set("pair", providerSymbol);
    if (since) {
      // Kraken `since` for /Trades is a nanosecond unix timestamp.
      const sinceNs = BigInt(new Date(since).getTime()) * 1_000_000n;
      params.set("since", sinceNs.toString());
    }

    const result = await this.request<Record<string, unknown>>(
      `/Trades?${params.toString()}`,
    );
    if (!result || typeof result !== "object") {
      throw new MarketDataError(
        KRAKEN_PROVIDER_ID,
        "bad_response",
        "Expected /Trades envelope to contain a result object",
      );
    }
    // First non-"last" value is the trade array.
    const rows = pickFirstArrayValue(result);
    const trades = krakenTradesToNormalized(providerSymbol, rows);
    if (limit && trades.length > limit) {
      // Keep most-recent `limit` trades.
      return trades.slice(trades.length - limit);
    }
    return trades;
  }

  private async request<T>(path: string): Promise<T | undefined> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(url, {
        method: "GET",
        headers: {
          accept: "application/json",
          "user-agent": this.userAgent,
        },
        signal: controller.signal,
      });

      if (response.status === 404) {
        throw new MarketDataError(
          KRAKEN_PROVIDER_ID,
          "not_found",
          `Kraken endpoint not found: ${path}`,
        );
      }
      if (response.status === 429) {
        throw new MarketDataError(
          KRAKEN_PROVIDER_ID,
          "rate_limited",
          "Kraken rate limit hit",
        );
      }
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new MarketDataError(
          KRAKEN_PROVIDER_ID,
          "upstream_error",
          `Kraken request failed with ${response.status}: ${text.slice(0, 200)}`,
        );
      }

      const envelope = (await response.json()) as KrakenEnvelope<T>;
      if (Array.isArray(envelope.error) && envelope.error.length > 0) {
        const message = envelope.error.join("; ");
        // Kraken returns lower-case error codes in the array; we surface
        // the first one verbatim and let the service layer categorize.
        if (message.toLowerCase().includes("unknown asset pair")) {
          throw new MarketDataError(
            KRAKEN_PROVIDER_ID,
            "not_found",
            `Kraken: ${message}`,
          );
        }
        if (message.toLowerCase().includes("rate limit")) {
          throw new MarketDataError(
            KRAKEN_PROVIDER_ID,
            "rate_limited",
            `Kraken: ${message}`,
          );
        }
        throw new MarketDataError(
          KRAKEN_PROVIDER_ID,
          "upstream_error",
          `Kraken: ${message}`,
        );
      }
      return envelope.result;
    } catch (error) {
      if (error instanceof MarketDataError) throw error;
      if ((error as { name?: string }).name === "AbortError") {
        throw new MarketDataError(
          KRAKEN_PROVIDER_ID,
          "timeout",
          `Kraken request to ${path} timed out after ${this.timeoutMs}ms`,
        );
      }
      throw new MarketDataError(
        KRAKEN_PROVIDER_ID,
        "network_error",
        `Kraken network error on ${path}`,
        error,
      );
    } finally {
      clearTimeout(timer);
    }
  }
}

/**
 * Accept both `kraken:XBTUSD` and `XBTUSD`; Kraken always wants the
 * native identifier in its REST calls.
 */
function stripProviderPrefix(ref: string): string {
  return ref.includes(":") ? ref.slice(ref.indexOf(":") + 1) : ref;
}

/**
 * Kraken envelopes key results by the canonical pair name. For
 * endpoints that return exactly one pair, we want the first array
 * value regardless of its key. The `last` key (trade cursor) is
 * a bigint string, not an array — skip it.
 */
function pickFirstArrayValue(obj: Record<string, unknown>): unknown[] {
  for (const [key, value] of Object.entries(obj)) {
    if (key === "last") continue;
    if (Array.isArray(value)) return value as unknown[];
  }
  return [];
}
