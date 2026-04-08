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
  SymbolRefSchema,
  type AttributionInfo,
  type Candle,
  type StoredSymbol,
  type SymbolMeta,
} from "@topgun/types";
import { AuthGuard } from "../auth/auth.guard";
import { MarketDataService } from "./market-data.service";

@Controller("market-data")
@UseGuards(AuthGuard)
export class MarketDataController {
  constructor(private readonly service: MarketDataService) {}

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
}
