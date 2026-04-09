import type { IMarketDataAdapter } from "./contract";
import { type CoinbaseAdapterOptions } from "./coinbase/coinbase.adapter";
export type AdapterId = "mock" | "coinbase";
export interface AdapterRegistryOptions {
    coinbase?: CoinbaseAdapterOptions;
}
/**
 * Lazily constructs and caches adapter instances. Callers ask for an
 * adapter by id; the registry decides whether to build a new one or
 * hand back a cached instance.
 */
export declare class AdapterRegistry {
    private readonly options;
    private readonly instances;
    constructor(options?: AdapterRegistryOptions);
    get(id: AdapterId): IMarketDataAdapter;
    has(id: AdapterId): boolean;
    disposeAll(): Promise<void>;
    private build;
}
//# sourceMappingURL=registry.d.ts.map