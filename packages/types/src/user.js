"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
/**
 * Public user shape — what the API returns for the authenticated user.
 * Never includes password hashes, tokens, or other secrets.
 */
exports.UserSchema = zod_1.z.object({
    id: common_1.IdSchema,
    email: common_1.EmailSchema,
    displayName: common_1.DisplayNameSchema.nullable(),
    createdAt: common_1.IsoDateSchema,
    updatedAt: common_1.IsoDateSchema,
});
//# sourceMappingURL=user.js.map