"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoinbaseRestClient = void 0;
const types_1 = require("@topgun/types");
const errors_1 = require("../errors");
const mapping_1 = require("./mapping");
const DEFAULT_BASE_URL = "https://api.exchange.coinbase.com";
const DEFAULT_TIMEOUT_MS = 10_000;
/**
 * Read-only REST client for Coinbase Exchange public endpoints.
 *
 * Only the `/products` and `/products/{id}/candles` endpoints are
 * touched. No authenticated endpoints are called. No credentials are
 * stored or sent.
 */
class CoinbaseRestClient {
    baseUrl;
    fetchImpl;
    timeoutMs;
    userAgent;
    constructor(options = {}) {
        this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
        this.fetchImpl = options.fetch ?? globalThis.fetch;
        this.timeoutMs = options.requestTimeoutMs ?? DEFAULT_TIMEOUT_MS;
        this.userAgent = options.userAgent ?? "topgun-trading/0.3 (+https://topguntrading.example)";
        if (typeof this.fetchImpl !== "function") {
            throw new errors_1.MarketDataError(mapping_1.COINBASE_PROVIDER_ID, "configuration_error", "Global fetch is not available. Pass a fetch implementation via CoinbaseRestOptions.");
        }
    }
    async listProducts() {
        const data = (await this.request(`/products`));
        if (!Array.isArray(data)) {
            throw new errors_1.MarketDataError(mapping_1.COINBASE_PROVIDER_ID, "bad_response", "Expected /products to return an array");
        }
        return data.filter(mapping_1.isTradableProduct).map(mapping_1.productToSymbolMeta);
    }
    async getProduct(productId) {
        try {
            const data = (await this.request(`/products/${encodeURIComponent(productId)}`));
            if (!data || typeof data !== "object" || !("id" in data))
                return null;
            return (0, mapping_1.productToSymbolMeta)(data);
        }
        catch (error) {
            if (error instanceof errors_1.MarketDataError && error.code === "not_found") {
                return null;
            }
            throw error;
        }
    }
    async getCandles(request) {
        const granularity = mapping_1.COINBASE_GRANULARITY[request.interval];
        const productId = request.symbol.includes(":")
            ? request.symbol.slice(request.symbol.indexOf(":") + 1)
            : request.symbol;
        const params = new URLSearchParams();
        params.set("granularity", String(granularity));
        const now = Date.now();
        const limit = Math.min(request.limit ?? 300, mapping_1.COINBASE_CANDLE_LIMIT);
        const to = request.to ? new Date(request.to).getTime() : now;
        const from = request.from
            ? new Date(request.from).getTime()
            : to - limit * types_1.INTERVAL_SECONDS[request.interval] * 1000;
        params.set("start", new Date(from).toISOString());
        params.set("end", new Date(to).toISOString());
        const raw = await this.request(`/products/${encodeURIComponent(productId)}/candles?${params.toString()}`);
        return (0, mapping_1.coinbaseCandlesToNormalized)(raw);
    }
    async request(path) {
        const url = `${this.baseUrl}${path}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const response = await this.fetchImpl(url, {
                method: "GET",
                headers: {
                    accept: "application/json",
                    "user-agent": this.userAgent,
                },
                signal: controller.signal,
            });
            if (response.status === 404) {
                throw new errors_1.MarketDataError(mapping_1.COINBASE_PROVIDER_ID, "not_found", `Coinbase endpoint not found: ${path}`);
            }
            if (response.status === 429) {
                throw new errors_1.MarketDataError(mapping_1.COINBASE_PROVIDER_ID, "rate_limited", "Coinbase rate limit hit");
            }
            if (!response.ok) {
                const text = await response.text().catch(() => "");
                throw new errors_1.MarketDataError(mapping_1.COINBASE_PROVIDER_ID, "upstream_error", `Coinbase request failed with ${response.status}: ${text.slice(0, 200)}`);
            }
            return (await response.json());
        }
        catch (error) {
            if (error instanceof errors_1.MarketDataError)
                throw error;
            if (error.name === "AbortError") {
                throw new errors_1.MarketDataError(mapping_1.COINBASE_PROVIDER_ID, "timeout", `Coinbase request to ${path} timed out after ${this.timeoutMs}ms`);
            }
            throw new errors_1.MarketDataError(mapping_1.COINBASE_PROVIDER_ID, "network_error", `Coinbase network error on ${path}`, error);
        }
        finally {
            clearTimeout(timer);
        }
    }
}
exports.CoinbaseRestClient = CoinbaseRestClient;
//# sourceMappingURL=coinbase.rest.js.map