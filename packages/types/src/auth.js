"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtPayloadSchema = exports.REFRESH_TOKEN_COOKIE = exports.ACCESS_TOKEN_COOKIE = exports.AuthResponseSchema = exports.TokenPairSchema = exports.LoginRequestSchema = exports.SignupRequestSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
const user_1 = require("./user");
/**
 * Request and response shapes for the auth surface. These are the
 * contract both apps/api (NestJS) and apps/web (Next.js route handlers)
 * speak. No other file should define these.
 */
exports.SignupRequestSchema = zod_1.z.object({
    email: common_1.EmailSchema,
    password: common_1.PasswordSchema,
    displayName: common_1.DisplayNameSchema.optional(),
});
exports.LoginRequestSchema = zod_1.z.object({
    email: common_1.EmailSchema,
    password: common_1.PasswordSchema,
});
/** Tokens returned by signup/login/refresh. */
exports.TokenPairSchema = zod_1.z.object({
    accessToken: zod_1.z.string().min(1),
    accessTokenExpiresAt: common_1.IsoDateSchema,
    refreshToken: zod_1.z.string().min(1),
    refreshTokenExpiresAt: common_1.IsoDateSchema,
});
exports.AuthResponseSchema = zod_1.z.object({
    user: user_1.UserSchema,
    tokens: exports.TokenPairSchema,
});
/**
 * Cookie names used by apps/web to store tokens. Both sides import
 * these constants — there is no string-drift across the boundary.
 */
exports.ACCESS_TOKEN_COOKIE = "tg_access";
exports.REFRESH_TOKEN_COOKIE = "tg_refresh";
/** JWT payload the API signs. Kept small — not a general claims bag. */
exports.JwtPayloadSchema = zod_1.z.object({
    sub: zod_1.z.string().min(1),
    sid: zod_1.z.string().min(1),
    iat: zod_1.z.number().int().nonnegative(),
    exp: zod_1.z.number().int().nonnegative(),
});
//# sourceMappingURL=auth.js.map