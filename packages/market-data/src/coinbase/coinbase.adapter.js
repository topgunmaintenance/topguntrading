"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoinbaseAdapter = void 0;
const coinbase_rest_1 = require("./coinbase.rest");
const coinbase_ws_1 = require("./coinbase.ws");
const mapping_1 = require("./mapping");
const DEFAULT_PRODUCTS_TTL_MS = 5 * 60 * 1000;
/**
 * Coinbase public market-data adapter. Uses only unauthenticated
 * Coinbase Exchange endpoints and the Advanced Trade public
 * WebSocket ticker channel.
 *
 * - No API key is required.
 * - No trading capability is wired in (and never will be).
 * - Attribution must be rendered by the UI: "Data provided by Coinbase".
 */
class CoinbaseAdapter {
    id = mapping_1.COINBASE_PROVIDER_ID;
    capabilities = {
        assetClasses: ["crypto"],
        intervals: ["1m", "5m", "15m", "1h", "6h", "1d"],
        streaming: { quotes: true, trades: false, level2: false },
    };
    attribution = {
        provider: "coinbase",
        label: "Data provided by Coinbase",
        url: "https://www.coinbase.com/",
        delayed: false,
        simulated: false,
    };
    rest;
    ws;
    productsTtlMs;
    productsCache = null;
    constructor(options = {}) {
        this.rest = new coinbase_rest_1.CoinbaseRestClient(options.rest);
        this.ws = new coinbase_ws_1.CoinbaseWsClient(options.ws);
        this.productsTtlMs = options.productsTtlMs ?? DEFAULT_PRODUCTS_TTL_MS;
    }
    async searchSymbols(query, limit = 20) {
        const products = await this.getProducts();
        const q = query.trim().toLowerCase();
        if (!q)
            return products.slice(0, limit);
        return products
            .filter((p) => p.providerSymbol.toLowerCase().includes(q) ||
            p.baseAsset.toLowerCase().includes(q) ||
            p.quoteAsset.toLowerCase().includes(q) ||
            p.displayName.toLowerCase().includes(q))
            .slice(0, limit);
    }
    async getSymbol(providerSymbol) {
        const products = await this.getProducts();
        const match = products.find((p) => p.providerSymbol === providerSymbol);
        if (match)
            return match;
        return this.rest.getProduct(providerSymbol);
    }
    async listSupportedSymbols(limit = 50) {
        const products = await this.getProducts();
        return products.slice(0, limit);
    }
    async getCandles(request) {
        return this.rest.getCandles(request);
    }
    streamQuotes(symbols, handler) {
        // Accept both `coinbase:BTC-USD` and `BTC-USD`; normalize to the
        // provider's native id before forwarding.
        const productIds = symbols.map((s) => (s.includes(":") ? s.slice(s.indexOf(":") + 1) : s));
        return this.ws.subscribe(productIds, handler);
    }
    async dispose() {
        await this.ws.dispose();
        this.productsCache = null;
    }
    // ---- internals ------------------------------------------------------------
    async getProducts() {
        if (this.productsCache &&
            Date.now() - this.productsCache.at < this.productsTtlMs) {
            return this.productsCache.data;
        }
        const data = await this.rest.listProducts();
        this.productsCache = { at: Date.now(), data };
        return data;
    }
}
exports.CoinbaseAdapter = CoinbaseAdapter;
//# sourceMappingURL=coinbase.adapter.js.map