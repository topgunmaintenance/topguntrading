import { Inject, Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";
import { AdapterRegistry, type IMarketDataAdapter } from "@topgun/market-data";
import { ENV } from "../config/config.module";
import type { Env } from "../config/env";

/**
 * NestJS-owned wrapper around the `@topgun/market-data` AdapterRegistry.
 * Exposes the configured adapter and disposes it on shutdown.
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
    });
  }

  get(): IMarketDataAdapter {
    return this.registry.get(this.env.MARKET_DATA_PROVIDER);
  }

  async onModuleDestroy(): Promise<void> {
    await this.registry.disposeAll();
    this.logger.log("Market data adapters disposed");
  }
}
