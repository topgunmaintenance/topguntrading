import { z } from "zod";
import { DisplayNameSchema, EmailSchema, IsoDateSchema, PasswordSchema } from "./common";
import { UserSchema } from "./user";

/**
 * Request and response shapes for the auth surface. These are the
 * contract both apps/api (NestJS) and apps/web (Next.js route handlers)
 * speak. No other file should define these.
 */

export const SignupRequestSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  displayName: DisplayNameSchema.optional(),
});
export type SignupRequest = z.infer<typeof SignupRequestSchema>;

export const LoginRequestSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

/** Tokens returned by signup/login/refresh. */
export const TokenPairSchema = z.object({
  accessToken: z.string().min(1),
  accessTokenExpiresAt: IsoDateSchema,
  refreshToken: z.string().min(1),
  refreshTokenExpiresAt: IsoDateSchema,
});
export type TokenPair = z.infer<typeof TokenPairSchema>;

export const AuthResponseSchema = z.object({
  user: UserSchema,
  tokens: TokenPairSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

/**
 * Cookie names used by apps/web to store tokens. Both sides import
 * these constants — there is no string-drift across the boundary.
 */
export const ACCESS_TOKEN_COOKIE = "tg_access" as const;
export const REFRESH_TOKEN_COOKIE = "tg_refresh" as const;

/** JWT payload the API signs. Kept small — not a general claims bag. */
export const JwtPayloadSchema = z.object({
  sub: z.string().min(1),
  sid: z.string().min(1),
  iat: z.number().int().nonnegative(),
  exp: z.number().int().nonnegative(),
});
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;
