"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PACKAGE_NAME = exports.AdapterRegistry = exports.COINBASE_CANDLE_LIMIT = exports.COINBASE_GRANULARITY = exports.COINBASE_PROVIDER_ID = exports.CoinbaseAdapter = exports.MockAdapter = exports.MarketDataError = void 0;
var errors_1 = require("./errors");
Object.defineProperty(exports, "MarketDataError", { enumerable: true, get: function () { return errors_1.MarketDataError; } });
var mock_adapter_1 = require("./mock/mock.adapter");
Object.defineProperty(exports, "MockAdapter", { enumerable: true, get: function () { return mock_adapter_1.MockAdapter; } });
var coinbase_adapter_1 = require("./coinbase/coinbase.adapter");
Object.defineProperty(exports, "CoinbaseAdapter", { enumerable: true, get: function () { return coinbase_adapter_1.CoinbaseAdapter; } });
var mapping_1 = require("./coinbase/mapping");
Object.defineProperty(exports, "COINBASE_PROVIDER_ID", { enumerable: true, get: function () { return mapping_1.COINBASE_PROVIDER_ID; } });
Object.defineProperty(exports, "COINBASE_GRANULARITY", { enumerable: true, get: function () { return mapping_1.COINBASE_GRANULARITY; } });
Object.defineProperty(exports, "COINBASE_CANDLE_LIMIT", { enumerable: true, get: function () { return mapping_1.COINBASE_CANDLE_LIMIT; } });
var registry_1 = require("./registry");
Object.defineProperty(exports, "AdapterRegistry", { enumerable: true, get: function () { return registry_1.AdapterRegistry; } });
exports.PACKAGE_NAME = "@topgun/market-data";
//# sourceMappingURL=index.js.map