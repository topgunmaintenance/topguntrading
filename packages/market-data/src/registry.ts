import type { IMarketDataAdapter } from "./contract";
import { MockAdapter } from "./mock/mock.adapter";
import { CoinbaseAdapter, type CoinbaseAdapterOptions } from "./coinbase/coinbase.adapter";
import { KrakenAdapter, type KrakenAdapterOptions } from "./kraken/kraken.adapter";

export type AdapterId = "mock" | "coinbase" | "kraken";

export interface AdapterRegistryOptions {
  coinbase?: CoinbaseAdapterOptions;
  kraken?: KrakenAdapterOptions;
}

/**
 * Lazily constructs and caches adapter instances. Callers ask for an
 * adapter by id; the registry decides whether to build a new one or
 * hand back a cached instance.
 */
export class AdapterRegistry {
  private readonly instances = new Map<AdapterId, IMarketDataAdapter>();

  constructor(private readonly options: AdapterRegistryOptions = {}) {}

  get(id: AdapterId): IMarketDataAdapter {
    const cached = this.instances.get(id);
    if (cached) return cached;
    const instance = this.build(id);
    this.instances.set(id, instance);
    return instance;
  }

  has(id: AdapterId): boolean {
    return this.instances.has(id);
  }

  async disposeAll(): Promise<void> {
    for (const instance of this.instances.values()) {
      try {
        await instance.dispose();
      } catch {
        // ignore — we are tearing down
      }
    }
    this.instances.clear();
  }

  private build(id: AdapterId): IMarketDataAdapter {
    switch (id) {
      case "mock":
        return new MockAdapter();
      case "coinbase":
        return new CoinbaseAdapter(this.options.coinbase);
      case "kraken":
        return new KrakenAdapter(this.options.kraken);
      default: {
        const _exhaustive: never = id;
        throw new Error(`Unknown adapter id: ${String(_exhaustive)}`);
      }
    }
  }
}
