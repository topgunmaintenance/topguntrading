import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { LRUCache } from "lru-cache";
import {
  type AttributionInfo,
  type Candle,
  type CandleRequest,
  type Interval,
  type StoredSymbol,
  type SymbolMeta,
  formatSymbolRef,
  parseSymbolRef,
} from "@topgun/types";
import { MarketDataError } from "@topgun/market-data";
import { PrismaService } from "../prisma/prisma.service";
import { ENV } from "../config/config.module";
import type { Env } from "../config/env";
import { MarketDataAdapterRegistry } from "./adapter.registry";

interface CandleCacheKey {
  provider: string;
  symbol: string;
  interval: Interval;
  from?: string | undefined;
  to?: string | undefined;
  limit?: number | undefined;
}

/**
 * High-level market data service. Wraps the configured adapter,
 * persists symbol metadata on first touch, and adds a short-lived
 * in-memory LRU cache for candle responses.
 */
@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);
  private readonly candleCache: LRUCache<string, Candle[]>;

  constructor(
    private readonly registry: MarketDataAdapterRegistry,
    private readonly prisma: PrismaService,
    @Inject(ENV) private readonly env: Env,
  ) {
    this.candleCache = new LRUCache<string, Candle[]>({
      max: 500,
      ttl: env.MARKET_DATA_CACHE_TTL_SECONDS * 1000,
    });
  }

  attribution(): AttributionInfo {
    return this.registry.get().attribution;
  }

  providerId(): string {
    return this.registry.get().id;
  }

  async searchSymbols(query: string, limit = 20): Promise<SymbolMeta[]> {
    try {
      return await this.registry.get().searchSymbols(query, limit);
    } catch (error) {
      this.handleAdapterError(error);
    }
  }

  async getSymbolByRef(ref: string): Promise<StoredSymbol> {
    const { provider, symbol } = parseSymbolRef(ref);
    const adapter = this.registry.get();
    if (adapter.id !== provider) {
      throw new NotFoundException({
        code: "not_found",
        message: `Symbol provider ${provider} is not active on this instance`,
      });
    }
    let meta: SymbolMeta | null;
    try {
      meta = await adapter.getSymbol(symbol);
    } catch (error) {
      this.handleAdapterError(error);
    }
    if (!meta) {
      throw new NotFoundException({
        code: "not_found",
        message: `Symbol ${ref} not found`,
      });
    }
    const stored = await this.upsertSymbol(meta);
    return stored;
  }

  async getCandles(request: CandleRequest): Promise<Candle[]> {
    const cacheKey = this.candleCacheKey(request);
    const cached = this.candleCache.get(cacheKey);
    if (cached) return cached;

    try {
      const candles = await this.registry.get().getCandles(request);
      this.candleCache.set(cacheKey, candles);
      return candles;
    } catch (error) {
      this.handleAdapterError(error);
    }
  }

  /**
   * Upsert a symbol into the local cache table and return the stored
   * row in its public shape. Used by the watchlist service when the
   * user adds an item that the cache has not yet seen.
   */
  async upsertSymbol(meta: SymbolMeta): Promise<StoredSymbol> {
    const row = await this.prisma.symbol.upsert({
      where: {
        provider_providerSymbol: {
          provider: meta.provider,
          providerSymbol: meta.providerSymbol,
        },
      },
      create: {
        provider: meta.provider,
        providerSymbol: meta.providerSymbol,
        assetClass: meta.assetClass,
        baseAsset: meta.baseAsset,
        quoteAsset: meta.quoteAsset,
        displayName: meta.displayName,
        minPriceIncrement: meta.minPriceIncrement,
        minSizeIncrement: meta.minSizeIncrement,
      },
      update: {
        assetClass: meta.assetClass,
        baseAsset: meta.baseAsset,
        quoteAsset: meta.quoteAsset,
        displayName: meta.displayName,
        minPriceIncrement: meta.minPriceIncrement,
        minSizeIncrement: meta.minSizeIncrement,
        lastSyncedAt: new Date(),
      },
    });
    return this.toStoredSymbol(row);
  }

  // ---- helpers --------------------------------------------------------------

  private toStoredSymbol(row: {
    id: string;
    provider: string;
    providerSymbol: string;
    assetClass: string;
    baseAsset: string;
    quoteAsset: string;
    displayName: string;
    minPriceIncrement: string | null;
    minSizeIncrement: string | null;
    lastSyncedAt: Date;
  }): StoredSymbol {
    return {
      id: row.id,
      ref: formatSymbolRef(row.provider, row.providerSymbol),
      provider: row.provider,
      providerSymbol: row.providerSymbol,
      assetClass: row.assetClass as StoredSymbol["assetClass"],
      baseAsset: row.baseAsset,
      quoteAsset: row.quoteAsset,
      displayName: row.displayName,
      minPriceIncrement: row.minPriceIncrement,
      minSizeIncrement: row.minSizeIncrement,
      lastSyncedAt: row.lastSyncedAt.toISOString(),
    };
  }

  private candleCacheKey(req: CandleRequest): string {
    const key: CandleCacheKey = {
      provider: this.providerId(),
      symbol: req.symbol,
      interval: req.interval,
      from: req.from,
      to: req.to,
      limit: req.limit,
    };
    return JSON.stringify(key);
  }

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
}
