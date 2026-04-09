"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddWatchlistItemRequestSchema = exports.UpdateWatchlistRequestSchema = exports.CreateWatchlistRequestSchema = exports.WatchlistSchema = exports.WatchlistItemSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
const market_data_1 = require("./market-data");
exports.WatchlistItemSchema = zod_1.z.object({
    id: common_1.IdSchema,
    watchlistId: common_1.IdSchema,
    symbol: market_data_1.SymbolMetaSchema,
    position: zod_1.z.number().int().nonnegative(),
    addedAt: common_1.IsoDateSchema,
});
exports.WatchlistSchema = zod_1.z.object({
    id: common_1.IdSchema,
    userId: common_1.IdSchema,
    name: zod_1.z.string().trim().min(1).max(80),
    isDefault: zod_1.z.boolean(),
    position: zod_1.z.number().int().nonnegative(),
    createdAt: common_1.IsoDateSchema,
    updatedAt: common_1.IsoDateSchema,
    items: zod_1.z.array(exports.WatchlistItemSchema),
});
// ---- Request shapes ---------------------------------------------------------
exports.CreateWatchlistRequestSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(80),
});
exports.UpdateWatchlistRequestSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(80).optional(),
    position: zod_1.z.number().int().nonnegative().optional(),
});
exports.AddWatchlistItemRequestSchema = zod_1.z.object({
    symbol: market_data_1.SymbolRefSchema,
});
//# sourceMappingURL=watchlist.js.map