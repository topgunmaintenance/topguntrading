import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { AttributionInfo, EdgeSignal, Trade } from "@topgun/types";
import {
  SymbolRefSchema,
  parseSymbolRef,
} from "@topgun/types";
import { MarketDataError } from "@topgun/market-data";
import {
  LARGE_TRADES_DEFAULTS,
  detectLargeTrades,
} from "@topgun/trading-rules";
import { ENV } from "../config/config.module";
import type { Env } from "../config/env";
// NOTE: runtime class import — NestJS DI needs the constructor reference.
import { MarketDataAdapterRegistry } from "./adapter.registry";

/**
 * Edge observations service.
 *
 * Phase 3.5 (ADR-0026, ADR-0027): runs pure-function detectors from
 * `@topgun/trading-rules` against tape data from the configured
 * crypto provider (currently Kraken). Emits structured
 * `EdgeSignal[]` — never prose, never recommendations.
 *
 * Fan-in is protected by a tiny per-symbol debounce so that a burst
 * of dashboard polls cannot hammer the upstream provider's free-tier
 * limits.
 */
@Injectable()
export class EdgeService {
  private readonly logger = new Logger(EdgeService.name);
  private readonly tradesDebounceMs = 5_000;
  private readonly tradesCache = new Map<
    string,
    { at: number; trades: Trade[] }
  >();

  constructor(
    private readonly registry: MarketDataAdapterRegistry,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /**
   * Raw public trade tape. Used by the controller to expose a
   * minimal `/market-data/trades` endpoint and by the whale feed
   * internally. Decimal strings end-to-end; no parseFloat happens
   * on the request path.
   */
  async getTrades(
    symbolRef: string,
    limit?: number,
    since?: string,
  ): Promise<{ trades: Trade[]; attribution: AttributionInfo }> {
    const ref = SymbolRefSchema.parse(symbolRef);
    const cacheKey = `${ref}:${limit ?? "-"}:${since ?? "-"}`;
    const cached = this.tradesCache.get(cacheKey);
    if (cached && Date.now() - cached.at < this.tradesDebounceMs) {
      const adapter = this.registry.adapterFor(ref);
      return { trades: cached.trades, attribution: adapter.attribution };
    }

    const adapter = this.registry.adapterFor(ref);
    if (!adapter.capabilities.recentTrades || !adapter.getRecentTrades) {
      throw new ServiceUnavailableException({
        code: "unsupported_capability",
        message: `Provider ${adapter.id} does not expose recent trades`,
      });
    }

    const started = Date.now();
    try {
      const { symbol: providerSymbol } = parseSymbolRef(ref);
      const request: Parameters<typeof adapter.getRecentTrades>[0] = { symbol: ref };
      if (limit !== undefined) request.limit = limit;
      if (since !== undefined) request.since = since;
      const trades = await adapter.getRecentTrades(request);

      // Structured JSON provider-call log (docs/observability.md §Logs).
      this.logProviderCall({
        provider: adapter.id,
        endpoint: "getRecentTrades",
        symbol: providerSymbol,
        latency_ms: Date.now() - started,
        status: "ok",
        count: trades.length,
      });

      this.tradesCache.set(cacheKey, { at: Date.now(), trades });
      return { trades, attribution: adapter.attribution };
    } catch (error) {
      this.logProviderCall({
        provider: adapter.id,
        endpoint: "getRecentTrades",
        symbol: ref,
        latency_ms: Date.now() - started,
        status: "error",
        error_code:
          error instanceof MarketDataError ? error.code : "unknown",
      });
      this.handleAdapterError(error);
    }
  }

  /**
   * Whale-activity observations. Runs `detectLargeTrades` over the
   * recent public tape for the requested symbol.
   *
   * `symbolRef` defaults to `env.WHALES_DEFAULT_SYMBOL` so the
   * dashboard card can make a zero-arg call and get useful data.
   */
  async getWhaleSignals(
    symbolRef?: string,
  ): Promise<{ signals: EdgeSignal[]; attribution: AttributionInfo }> {
    const ref = SymbolRefSchema.parse(symbolRef ?? this.env.WHALES_DEFAULT_SYMBOL);
    // Pull ~500 trades so the detector has a full lookback window
    // plus some evaluation headroom. Kraken free-tier REST caps at
    // 1000 per /Trades call.
    const limit = Math.max(
      LARGE_TRADES_DEFAULTS.lookback + 100,
      500,
    );
    const { trades, attribution } = await this.getTrades(ref, limit);
    const signals = detectLargeTrades(trades, LARGE_TRADES_DEFAULTS);
    this.logger.debug(
      `edge.whales: symbol=${ref} trades=${trades.length} signals=${signals.length}`,
    );
    return { signals, attribution };
  }

  // ---- helpers --------------------------------------------------------------

  private handleAdapterError(error: unknown): never {
    if (error instanceof MarketDataError) {
      this.logger.warn(`Adapter error ${error.code}: ${error.message}`);
      throw new ServiceUnavailableException({
        code: error.code === "rate_limited" ? "rate_limited" : "internal_error",
        message: error.message,
      });
    }
    throw error;
  }

  private logProviderCall(fields: {
    provider: string;
    endpoint: string;
    symbol: string;
    latency_ms: number;
    status: "ok" | "error";
    count?: number;
    error_code?: string;
  }): void {
    // Structured JSON event per docs/observability.md §Logs. We
    // emit it via console.log so the Nest logger's pretty-printing
    // does not mangle the JSON (the whole point of structured logs
    // is machine-parseability). Production ships this to stdout
    // already, so a single-line JSON event lands in the log pipe.
    const payload = {
      ts: new Date().toISOString(),
      level: fields.status === "ok" ? "info" : "warn",
      service: "api",
      event: "market_data.provider_call",
      provider: fields.provider,
      endpoint: fields.endpoint,
      symbol: fields.symbol,
      latency_ms: fields.latency_ms,
      status: fields.status,
      ...(fields.count !== undefined ? { count: fields.count } : {}),
      ...(fields.error_code ? { error_code: fields.error_code } : {}),
    };
    // Single line so log aggregators can parse it as JSON.
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(payload));
  }
}
