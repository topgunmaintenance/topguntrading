"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
/**
 * Public session shape. The actual refresh token is never returned
 * after issuance — only a session id and metadata.
 */
exports.SessionSchema = zod_1.z.object({
    id: common_1.IdSchema,
    userId: common_1.IdSchema,
    userAgent: zod_1.z.string().nullable(),
    ipAddress: zod_1.z.string().nullable(),
    createdAt: common_1.IsoDateSchema,
    lastUsedAt: common_1.IsoDateSchema,
    expiresAt: common_1.IsoDateSchema,
    revokedAt: common_1.IsoDateSchema.nullable(),
});
//# sourceMappingURL=session.js.map