import { Inject, Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";
import {
  AdapterRegistry,
  type AdapterId,
  type IMarketDataAdapter,
} from "@topgun/market-data";
import { parseSymbolRef } from "@topgun/types";
import { ENV } from "../config/config.module";
import type { Env } from "../config/env";

/**
 * NestJS-owned wrapper around the `@topgun/market-data` AdapterRegistry.
 * Exposes the configured primary adapter and disposes on shutdown.
 *
 * Phase 3.5 (ADR-0026) adds the Kraken adapter for whale-activity
 * observations. It is accessed by id (`"kraken"`) for edge routes,
 * independent of the primary `MARKET_DATA_PROVIDER` used for
 * watchlists and chart candles.
 */
@Injectable()
export class MarketDataAdapterRegistry implements OnModuleDestroy {
  private readonly logger = new Logger(MarketDataAdapterRegistry.name);
  private readonly registry: AdapterRegistry;

  constructor(@Inject(ENV) private readonly env: Env) {
    this.registry = new AdapterRegistry({
      coinbase: {
        rest: { baseUrl: env.COINBASE_REST_URL },
        ws: { url: env.COINBASE_WS_URL },
      },
      kraken: {
        rest: { baseUrl: env.KRAKEN_REST_URL },
      },
    });
  }

  /** Primary adapter — whatever `MARKET_DATA_PROVIDER` names. */
  get(): IMarketDataAdapter {
    return this.registry.get(this.env.MARKET_DATA_PROVIDER);
  }

  /** Get a specific adapter by id. Used by Phase 3.5 edge routes. */
  getById(id: AdapterId): IMarketDataAdapter {
    return this.registry.get(id);
  }

  /** Resolve an adapter from a canonical `{provider}:{symbol}` ref. */
  adapterFor(symbolRef: string): IMarketDataAdapter {
    const { provider } = parseSymbolRef(symbolRef);
    return this.registry.get(provider as AdapterId);
  }

  async onModuleDestroy(): Promise<void> {
    await this.registry.disposeAll();
    this.logger.log("Market data adapters disposed");
  }
}
