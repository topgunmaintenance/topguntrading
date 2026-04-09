import type {
  AttributionInfo,
  Candle,
  EdgeSignal,
  Interval,
  StoredSymbol,
  SymbolMeta,
  SymbolRef,
  Trade,
} from "@topgun/types";
import { env } from "./env";
import { ApiCallError } from "./api-client";

/**
 * Server-only typed client for the `/market-data/*` endpoints on the
 * API. Forwards the caller's cookie jar so the API can authenticate.
 */

async function call<T>(
  path: string,
  init: RequestInit & { cookie?: string | undefined } = {},
): Promise<T> {
  const { cookie, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set("accept", "application/json");
  if (cookie) headers.set("cookie", cookie);

  const response = await fetch(`${env.API_INTERNAL_URL}${path}`, {
    ...rest,
    headers,
    cache: "no-store",
  });
  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = { code: "internal_error", message: `API ${response.status}` };
    }
    throw new ApiCallError(response.status, body as never);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const marketDataClient = {
  async attribution(cookie?: string): Promise<AttributionInfo> {
    const { attribution } = await call<{ attribution: AttributionInfo }>(
      "/market-data/attribution",
      { cookie },
    );
    return attribution;
  },

  async searchSymbols(
    query: string,
    cookie?: string,
    limit = 20,
  ): Promise<SymbolMeta[]> {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    const { symbols } = await call<{ symbols: SymbolMeta[] }>(
      `/market-data/symbols?${params.toString()}`,
      { cookie },
    );
    return symbols;
  },

  async getSymbol(ref: SymbolRef, cookie?: string): Promise<StoredSymbol> {
    const params = new URLSearchParams({ ref });
    const { symbol } = await call<{ symbol: StoredSymbol }>(
      `/market-data/symbol?${params.toString()}`,
      { cookie },
    );
    return symbol;
  },

  async getCandles(
    request: {
      symbol: SymbolRef;
      interval: Interval;
      limit?: number;
      from?: string;
      to?: string;
    },
    cookie?: string,
  ): Promise<Candle[]> {
    const params = new URLSearchParams({
      symbol: request.symbol,
      interval: request.interval,
    });
    if (request.from) params.set("from", request.from);
    if (request.to) params.set("to", request.to);
    if (request.limit) params.set("limit", String(request.limit));
    const { candles } = await call<{ candles: Candle[] }>(
      `/market-data/candles?${params.toString()}`,
      { cookie },
    );
    return candles;
  },

  /**
   * Phase 3.5 (ADR-0026) — raw public trade tape.
   * Decimal strings are preserved end-to-end.
   */
  async getTrades(
    request: {
      symbol: SymbolRef;
      limit?: number;
      since?: string;
    },
    cookie?: string,
  ): Promise<{ trades: Trade[]; attribution: AttributionInfo }> {
    const params = new URLSearchParams({ symbol: request.symbol });
    if (request.limit) params.set("limit", String(request.limit));
    if (request.since) params.set("since", request.since);
    return call<{ trades: Trade[]; attribution: AttributionInfo }>(
      `/market-data/trades?${params.toString()}`,
      { cookie },
    );
  },

  /**
   * Phase 3.5 (ADR-0027) — whale-activity observations. If `symbol`
   * is omitted the API falls back to env.WHALES_DEFAULT_SYMBOL.
   */
  async getWhaleSignals(
    symbol?: SymbolRef,
    cookie?: string,
  ): Promise<{ signals: EdgeSignal[]; attribution: AttributionInfo }> {
    const path = symbol
      ? `/market-data/whales?symbol=${encodeURIComponent(symbol)}`
      : `/market-data/whales`;
    return call<{ signals: EdgeSignal[]; attribution: AttributionInfo }>(path, {
      cookie,
    });
  },
};
