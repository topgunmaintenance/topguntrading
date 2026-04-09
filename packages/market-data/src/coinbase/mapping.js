"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COINBASE_CANDLE_LIMIT = exports.COINBASE_GRANULARITY = exports.COINBASE_PROVIDER_ID = void 0;
exports.productToSymbolMeta = productToSymbolMeta;
exports.isTradableProduct = isTradableProduct;
exports.coinbaseCandlesToNormalized = coinbaseCandlesToNormalized;
exports.tickerEventToQuote = tickerEventToQuote;
exports.isTickerEnvelope = isTickerEnvelope;
const types_1 = require("@topgun/types");
const errors_1 = require("../errors");
exports.COINBASE_PROVIDER_ID = "coinbase";
/**
 * Coinbase exchange uses seconds for granularity. Only these values
 * are supported; requesting anything else returns a 400.
 */
exports.COINBASE_GRANULARITY = {
    "1m": 60,
    "5m": 300,
    "15m": 900,
    "1h": 3600,
    "6h": 21600,
    "1d": 86400,
};
/** Coinbase returns at most 300 candles per request. */
exports.COINBASE_CANDLE_LIMIT = 300;
function productToSymbolMeta(product) {
    return {
        ref: (0, types_1.formatSymbolRef)(exports.COINBASE_PROVIDER_ID, product.id),
        provider: exports.COINBASE_PROVIDER_ID,
        providerSymbol: product.id,
        assetClass: "crypto",
        baseAsset: product.base_currency,
        quoteAsset: product.quote_currency,
        displayName: product.display_name ?? `${product.base_currency} / ${product.quote_currency}`,
        minPriceIncrement: product.quote_increment ?? null,
        minSizeIncrement: product.base_increment ?? null,
    };
}
function isTradableProduct(product) {
    if (product.trading_disabled)
        return false;
    if (product.status && product.status !== "online")
        return false;
    return true;
}
function coinbaseCandlesToNormalized(rows) {
    if (!Array.isArray(rows)) {
        throw new errors_1.MarketDataError(exports.COINBASE_PROVIDER_ID, "bad_response", "Expected an array of candles");
    }
    const candles = [];
    for (const row of rows) {
        if (!Array.isArray(row) || row.length < 6)
            continue;
        const [time, low, high, open, close, volume] = row;
        if (typeof time !== "number" ||
            typeof low !== "number" ||
            typeof high !== "number" ||
            typeof open !== "number" ||
            typeof close !== "number" ||
            typeof volume !== "number") {
            continue;
        }
        candles.push({
            openTime: new Date(time * 1000).toISOString(),
            open: open.toString(),
            high: high.toString(),
            low: low.toString(),
            close: close.toString(),
            volume: volume.toString(),
        });
    }
    candles.sort((a, b) => a.openTime.localeCompare(b.openTime));
    return candles;
}
function tickerEventToQuote(event, timestamp) {
    return {
        symbol: (0, types_1.formatSymbolRef)(exports.COINBASE_PROVIDER_ID, event.product_id),
        time: timestamp,
        last: event.price ?? null,
        bid: event.best_bid ?? null,
        ask: event.best_ask ?? null,
        volume24h: event.volume_24_h ?? null,
    };
}
function isTickerEnvelope(msg) {
    if (typeof msg !== "object" || msg === null)
        return false;
    const m = msg;
    return m.channel === "ticker" && Array.isArray(m.events);
}
//# sourceMappingURL=mapping.js.map