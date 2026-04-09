import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  CandleRequestSchema,
  IntervalSchema,
  IsoDateSchema,
  SymbolRefSchema,
  type AttributionInfo,
  type Candle,
  type EdgeSignal,
  type StoredSymbol,
  type SymbolMeta,
  type Trade,
} from "@topgun/types";
import { AuthGuard } from "../auth/auth.guard";
// NOTE: runtime class imports — NestJS DI needs the constructor
// reference, not just a type. Do not let ESLint auto-fix these to
// `import type`.
import { EdgeService } from "./edge.service";
import { MarketDataService } from "./market-data.service";

@Controller("market-data")
@UseGuards(AuthGuard)
export class MarketDataController {
  constructor(
    private readonly service: MarketDataService,
    private readonly edge: EdgeService,
  ) {}

  @Get("attribution")
  attribution(): { attribution: AttributionInfo } {
    return { attribution: this.service.attribution() };
  }

  @Get("symbols")
  async searchSymbols(
    @Query("q") q?: string,
    @Query("limit") limit?: string,
  ): Promise<{ symbols: SymbolMeta[] }> {
    const parsedLimit = limit ? Math.max(1, Math.min(100, Number.parseInt(limit, 10) || 20)) : 20;
    const symbols = await this.service.searchSymbols(q ?? "", parsedLimit);
    return { symbols };
  }

  @Get("symbol")
  async getSymbol(@Query("ref") ref?: string): Promise<{ symbol: StoredSymbol }> {
    if (!ref) {
      throw new BadRequestException({
        code: "bad_request",
        message: "Query parameter `ref` is required",
      });
    }
    const parsed = SymbolRefSchema.safeParse(ref);
    if (!parsed.success) {
      throw new BadRequestException({
        code: "bad_request",
        message: "Invalid symbol reference. Expected `{provider}:{symbol}`.",
      });
    }
    const symbol = await this.service.getSymbolByRef(parsed.data);
    return { symbol };
  }

  @Get("candles")
  async getCandles(
    @Query("symbol") symbol?: string,
    @Query("interval") interval?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("limit") limit?: string,
  ): Promise<{ candles: Candle[] }> {
    const payload: Record<string, unknown> = {
      symbol,
      interval,
    };
    if (from) payload.from = from;
    if (to) payload.to = to;
    if (limit) payload.limit = Number.parseInt(limit, 10);

    const result = CandleRequestSchema.safeParse(payload);
    if (!result.success) {
      throw new BadRequestException({
        code: "bad_request",
        message: "Invalid candle request",
        fields: Object.fromEntries(
          result.error.issues.map((issue) => [issue.path.join("."), issue.message]),
        ),
      });
    }

    // Extra guard: reject unsupported intervals early with a clearer message.
    if (!IntervalSchema.options.includes(result.data.interval)) {
      throw new BadRequestException({
        code: "bad_request",
        message: `Interval ${result.data.interval} is not supported`,
      });
    }

    const candles = await this.service.getCandles(result.data);
    return { candles };
  }

  /**
   * Phase 3.5 (ADR-0026) — raw public trade tape.
   *
   * Query:
   *   symbol  `{provider}:{symbol}` — required
   *   limit   positive int, max 1000 — optional
   *   since   ISO-8601 timestamp — optional cursor
   *
   * Returns: `{ trades, attribution }` where `trades` is the
   * normalized `Trade[]` from the adapter's tape and every price
   * / size value is a decimal string preserving provider precision.
   */
  @Get("trades")
  async getTrades(
    @Query("symbol") symbol?: string,
    @Query("limit") limit?: string,
    @Query("since") since?: string,
  ): Promise<{ trades: Trade[]; attribution: AttributionInfo }> {
    const parsedSymbol = SymbolRefSchema.safeParse(symbol ?? "");
    if (!parsedSymbol.success) {
      throw new BadRequestException({
        code: "bad_request",
        message: "Query parameter `symbol` must be `{provider}:{symbol}`",
      });
    }
    let parsedLimit: number | undefined;
    if (limit !== undefined) {
      const n = Number.parseInt(limit, 10);
      if (!Number.isFinite(n) || n <= 0 || n > 1000) {
        throw new BadRequestException({
          code: "bad_request",
          message: "`limit` must be a positive integer ≤ 1000",
        });
      }
      parsedLimit = n;
    }
    let parsedSince: string | undefined;
    if (since !== undefined) {
      const parsed = IsoDateSchema.safeParse(since);
      if (!parsed.success) {
        throw new BadRequestException({
          code: "bad_request",
          message: "`since` must be an ISO-8601 timestamp",
        });
      }
      parsedSince = parsed.data;
    }

    return this.edge.getTrades(parsedSymbol.data, parsedLimit, parsedSince);
  }

  /**
   * Phase 3.5 (ADR-0026, ADR-0027) — whale-activity observations.
   *
   * Runs the `detectLargeTrades` detector (from
   * `@topgun/trading-rules`) against the most recent public tape
   * and returns any `EdgeSignal`s that qualify. If `symbol` is
   * omitted the service uses `env.WHALES_DEFAULT_SYMBOL`.
   *
   * Observational only — see ADR-0027. The `headline` on each
   * signal is a neutral one-liner, never a recommendation.
   */
  @Get("whales")
  async getWhales(
    @Query("symbol") symbol?: string,
  ): Promise<{ signals: EdgeSignal[]; attribution: AttributionInfo }> {
    if (symbol !== undefined && symbol !== "") {
      const parsed = SymbolRefSchema.safeParse(symbol);
      if (!parsed.success) {
        throw new BadRequestException({
          code: "bad_request",
          message: "Query parameter `symbol` must be `{provider}:{symbol}`",
        });
      }
      return this.edge.getWhaleSignals(parsed.data);
    }
    return this.edge.getWhaleSignals();
  }
}
