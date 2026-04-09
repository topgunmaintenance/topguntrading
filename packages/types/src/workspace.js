"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
/**
 * Workspace shape. Phase 2 keeps workspaces minimal — name and a
 * default flag. Watchlists, layouts, and default symbols land in
 * Phase 3 when the market data layer arrives.
 */
exports.WorkspaceSchema = zod_1.z.object({
    id: common_1.IdSchema,
    userId: common_1.IdSchema,
    name: zod_1.z.string().trim().min(1).max(80),
    isDefault: zod_1.z.boolean(),
    createdAt: common_1.IsoDateSchema,
    updatedAt: common_1.IsoDateSchema,
});
//# sourceMappingURL=workspace.js.map