"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockAdapter = void 0;
const types_1 = require("@topgun/types");
/**
 * Mock market data adapter.
 *
 * Produces deterministic synthetic data. This adapter is for tests,
 * local development without network, and UI scaffolding. Every
 * response is explicitly marked `simulated: true` in the attribution
 * so the UI can warn the user that what they are seeing is NOT real
 * market data.
 *
 * Determinism is achieved with a cheap LCG keyed on symbol + time.
 */
class MockAdapter {
    id = "mock";
    capabilities = {
        assetClasses: ["crypto"],
        intervals: ["1m", "5m", "15m", "1h", "6h", "1d"],
        streaming: { quotes: true, trades: false, level2: false },
    };
    attribution = {
        provider: "mock",
        label: "Simulated data — not real market prices",
        url: null,
        delayed: false,
        simulated: true,
    };
    universe = [
        this.meta("BTC-USD", "BTC", "USD", "Bitcoin / US Dollar", "0.01", "0.00000001"),
        this.meta("ETH-USD", "ETH", "USD", "Ether / US Dollar", "0.01", "0.00000001"),
        this.meta("SOL-USD", "SOL", "USD", "Solana / US Dollar", "0.001", "0.001"),
    ];
    async searchSymbols(query, limit = 20) {
        const q = query.trim().toLowerCase();
        if (!q)
            return this.universe.slice(0, limit);
        return this.universe
            .filter((s) => s.providerSymbol.toLowerCase().includes(q) ||
            s.baseAsset.toLowerCase().includes(q) ||
            s.displayName.toLowerCase().includes(q))
            .slice(0, limit);
    }
    async getSymbol(symbol) {
        return this.universe.find((s) => s.providerSymbol === symbol) ?? null;
    }
    async listSupportedSymbols(limit = 50) {
        return this.universe.slice(0, limit);
    }
    async getCandles(request) {
        const intervalSeconds = types_1.INTERVAL_SECONDS[request.interval];
        const now = Date.now();
        const to = request.to ? new Date(request.to).getTime() : now;
        const limit = Math.min(request.limit ?? 300, 1000);
        const from = request.from
            ? new Date(request.from).getTime()
            : to - limit * intervalSeconds * 1000;
        const symbolKey = request.symbol;
        const candles = [];
        const base = this.symbolBasePrice(symbolKey);
        // Snap to interval boundary.
        let cursor = Math.floor(from / 1000 / intervalSeconds) * intervalSeconds * 1000;
        const end = Math.min(to, cursor + limit * intervalSeconds * 1000);
        while (cursor < end) {
            const seed = this.hash(symbolKey, cursor);
            const walk = (lcg(seed) - 0.5) * base * 0.002; // ±0.1% drift per bar
            const open = base + walk;
            const high = open * (1 + Math.abs(lcg(seed + 1) - 0.5) * 0.003);
            const low = open * (1 - Math.abs(lcg(seed + 2) - 0.5) * 0.003);
            const close = low + (high - low) * lcg(seed + 3);
            const volume = 10 + lcg(seed + 4) * 90;
            candles.push({
                openTime: new Date(cursor).toISOString(),
                open: open.toFixed(2),
                high: high.toFixed(2),
                low: low.toFixed(2),
                close: close.toFixed(2),
                volume: volume.toFixed(4),
            });
            cursor += intervalSeconds * 1000;
        }
        return candles;
    }
    streamQuotes(symbols, handler) {
        const symbolSet = new Set(symbols);
        let stopped = false;
        const tick = () => {
            if (stopped)
                return;
            const now = Date.now();
            for (const symbol of symbolSet) {
                const base = this.symbolBasePrice(symbol);
                const seed = this.hash(symbol, Math.floor(now / 500));
                const delta = (lcg(seed) - 0.5) * base * 0.001;
                const last = base + delta;
                const quote = {
                    symbol,
                    time: new Date(now).toISOString(),
                    last: last.toFixed(2),
                    bid: (last - 0.5).toFixed(2),
                    ask: (last + 0.5).toFixed(2),
                    volume24h: (1000 + lcg(seed + 1) * 9000).toFixed(2),
                };
                try {
                    handler(quote);
                }
                catch {
                    // handlers are not allowed to throw; swallow per contract
                }
            }
        };
        const interval = setInterval(tick, 500);
        return {
            symbols: symbolSet,
            async close() {
                stopped = true;
                clearInterval(interval);
            },
        };
    }
    async dispose() {
        // nothing persistent to clean up
    }
    // ---- helpers --------------------------------------------------------------
    meta(providerSymbol, baseAsset, quoteAsset, displayName, minPriceIncrement, minSizeIncrement) {
        return {
            ref: (0, types_1.formatSymbolRef)(this.id, providerSymbol),
            provider: this.id,
            providerSymbol,
            assetClass: "crypto",
            baseAsset,
            quoteAsset,
            displayName,
            minPriceIncrement,
            minSizeIncrement,
        };
    }
    symbolBasePrice(symbolKey) {
        if (symbolKey.includes("BTC"))
            return 50000;
        if (symbolKey.includes("ETH"))
            return 3000;
        if (symbolKey.includes("SOL"))
            return 150;
        return 100;
    }
    hash(symbol, time) {
        let h = 2166136261 >>> 0;
        for (let i = 0; i < symbol.length; i++) {
            h ^= symbol.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        h ^= time & 0xffffffff;
        h = Math.imul(h, 16777619);
        return h >>> 0;
    }
}
exports.MockAdapter = MockAdapter;
/** Linear-congruential generator — deterministic pseudo-random in [0, 1). */
function lcg(seed) {
    const a = 1664525;
    const c = 1013904223;
    const m = 2 ** 32;
    const next = (Math.imul(seed, a) + c) >>> 0;
    return (next % m) / m;
}
//# sourceMappingURL=mock.adapter.js.map