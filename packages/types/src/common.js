"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisplayNameSchema = exports.PasswordSchema = exports.EmailSchema = exports.IdSchema = exports.IsoDateSchema = void 0;
const zod_1 = require("zod");
/**
 * ISO-8601 timestamp string. We use strings on the wire so JSON
 * serialization is boring and deterministic. Services convert to `Date`
 * at their boundaries.
 */
exports.IsoDateSchema = zod_1.z
    .string()
    .datetime({ offset: true })
    .describe("ISO-8601 timestamp with offset");
/**
 * Opaque id type. We use cuid2-style strings in the database but do
 * not constrain length here to keep the wire type permissive.
 */
exports.IdSchema = zod_1.z.string().min(1).max(64);
exports.EmailSchema = zod_1.z
    .string()
    .trim()
    .toLowerCase()
    .email()
    .max(254, "Email must be 254 characters or fewer");
/**
 * Password rules for Phase 2. These are not the last word on password
 * policy — MFA lands in Phase 6 — but they are defensible baseline.
 */
exports.PasswordSchema = zod_1.z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(256, "Password must be 256 characters or fewer");
exports.DisplayNameSchema = zod_1.z
    .string()
    .trim()
    .min(1, "Display name is required")
    .max(80, "Display name must be 80 characters or fewer");
//# sourceMappingURL=common.js.map