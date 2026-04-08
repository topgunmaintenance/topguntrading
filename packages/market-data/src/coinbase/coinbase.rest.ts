import type { Candle, CandleRequest } from "@topgun/types";
import { INTERVAL_SECONDS } from "@topgun/types";
import { MarketDataError } from "../errors";
import {
  COINBASE_CANDLE_LIMIT,
  COINBASE_GRANULARITY,
  COINBASE_PROVIDER_ID,
  type CoinbaseProduct,
  coinbaseCandlesToNormalized,
  isTradableProduct,
  productToSymbolMeta,
} from "./mapping";
import type { SymbolMeta } from "@topgun/types";

export interface CoinbaseRestOptions {
  /** Override the REST base URL (used in tests and mirrors). */
  baseUrl?: string;
  /** Override the global fetch implementation (used in tests). */
  fetch?: typeof fetch;
  /** Per-request timeout. Defaults to 10s. */
  requestTimeoutMs?: number;
  userAgent?: string;
}

const DEFAULT_BASE_URL = "https://api.exchange.coinbase.com";
const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Read-only REST client for Coinbase Exchange public endpoints.
 *
 * Only the `/products` and `/products/{id}/candles` endpoints are
 * touched. No authenticated endpoints are called. No credentials are
 * stored or sent.
 */
export class CoinbaseRestClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly userAgent: string;

  constructor(options: CoinbaseRestOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.fetchImpl = options.fetch ?? globalThis.fetch;
    this.timeoutMs = options.requestTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.userAgent = options.userAgent ?? "topgun-trading/0.3 (+https://topguntrading.example)";
    if (typeof this.fetchImpl !== "function") {
      throw new MarketDataError(
        COINBASE_PROVIDER_ID,
        "configuration_error",
        "Global fetch is not available. Pass a fetch implementation via CoinbaseRestOptions.",
      );
    }
  }

  async listProducts(): Promise<SymbolMeta[]> {
    const data = (await this.request(`/products`)) as CoinbaseProduct[] | unknown;
    if (!Array.isArray(data)) {
      throw new MarketDataError(
        COINBASE_PROVIDER_ID,
        "bad_response",
        "Expected /products to return an array",
      );
    }
    return data.filter(isTradableProduct).map(productToSymbolMeta);
  }

  async getProduct(productId: string): Promise<SymbolMeta | null> {
    try {
      const data = (await this.request(
        `/products/${encodeURIComponent(productId)}`,
      )) as CoinbaseProduct;
      if (!data || typeof data !== "object" || !("id" in data)) return null;
      return productToSymbolMeta(data);
    } catch (error) {
      if (error instanceof MarketDataError && error.code === "not_found") {
        return null;
      }
      throw error;
    }
  }

  async getCandles(request: CandleRequest): Promise<Candle[]> {
    const granularity = COINBASE_GRANULARITY[request.interval];
    const productId = request.symbol.includes(":")
      ? request.symbol.slice(request.symbol.indexOf(":") + 1)
      : request.symbol;

    const params = new URLSearchParams();
    params.set("granularity", String(granularity));
    const now = Date.now();
    const limit = Math.min(request.limit ?? 300, COINBASE_CANDLE_LIMIT);
    const to = request.to ? new Date(request.to).getTime() : now;
    const from = request.from
      ? new Date(request.from).getTime()
      : to - limit * INTERVAL_SECONDS[request.interval] * 1000;
    params.set("start", new Date(from).toISOString());
    params.set("end", new Date(to).toISOString());

    const raw = await this.request(
      `/products/${encodeURIComponent(productId)}/candles?${params.toString()}`,
    );
    return coinbaseCandlesToNormalized(raw);
  }

  private async request(path: string): Promise<unknown> {
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
          COINBASE_PROVIDER_ID,
          "not_found",
          `Coinbase endpoint not found: ${path}`,
        );
      }
      if (response.status === 429) {
        throw new MarketDataError(
          COINBASE_PROVIDER_ID,
          "rate_limited",
          "Coinbase rate limit hit",
        );
      }
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new MarketDataError(
          COINBASE_PROVIDER_ID,
          "upstream_error",
          `Coinbase request failed with ${response.status}: ${text.slice(0, 200)}`,
        );
      }

      return (await response.json()) as unknown;
    } catch (error) {
      if (error instanceof MarketDataError) throw error;
      if ((error as { name?: string }).name === "AbortError") {
        throw new MarketDataError(
          COINBASE_PROVIDER_ID,
          "timeout",
          `Coinbase request to ${path} timed out after ${this.timeoutMs}ms`,
        );
      }
      throw new MarketDataError(
        COINBASE_PROVIDER_ID,
        "network_error",
        `Coinbase network error on ${path}`,
        error,
      );
    } finally {
      clearTimeout(timer);
    }
  }
}
