"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdapterRegistry = void 0;
const mock_adapter_1 = require("./mock/mock.adapter");
const coinbase_adapter_1 = require("./coinbase/coinbase.adapter");
/**
 * Lazily constructs and caches adapter instances. Callers ask for an
 * adapter by id; the registry decides whether to build a new one or
 * hand back a cached instance.
 */
class AdapterRegistry {
    options;
    instances = new Map();
    constructor(options = {}) {
        this.options = options;
    }
    get(id) {
        const cached = this.instances.get(id);
        if (cached)
            return cached;
        const instance = this.build(id);
        this.instances.set(id, instance);
        return instance;
    }
    has(id) {
        return this.instances.has(id);
    }
    async disposeAll() {
        for (const instance of this.instances.values()) {
            try {
                await instance.dispose();
            }
            catch {
                // ignore — we are tearing down
            }
        }
        this.instances.clear();
    }
    build(id) {
        switch (id) {
            case "mock":
                return new mock_adapter_1.MockAdapter();
            case "coinbase":
                return new coinbase_adapter_1.CoinbaseAdapter(this.options.coinbase);
            default: {
                const _exhaustive = id;
                throw new Error(`Unknown adapter id: ${String(_exhaustive)}`);
            }
        }
    }
}
exports.AdapterRegistry = AdapterRegistry;
//# sourceMappingURL=registry.js.map