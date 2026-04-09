import { z } from "zod";
/**
 * Request and response shapes for the auth surface. These are the
 * contract both apps/api (NestJS) and apps/web (Next.js route handlers)
 * speak. No other file should define these.
 */
export declare const SignupRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    displayName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    displayName?: string | undefined;
}, {
    email: string;
    password: string;
    displayName?: string | undefined;
}>;
export type SignupRequest = z.infer<typeof SignupRequestSchema>;
export declare const LoginRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
/** Tokens returned by signup/login/refresh. */
export declare const TokenPairSchema: z.ZodObject<{
    accessToken: z.ZodString;
    accessTokenExpiresAt: z.ZodString;
    refreshToken: z.ZodString;
    refreshTokenExpiresAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    accessToken: string;
    accessTokenExpiresAt: string;
    refreshToken: string;
    refreshTokenExpiresAt: string;
}, {
    accessToken: string;
    accessTokenExpiresAt: string;
    refreshToken: string;
    refreshTokenExpiresAt: string;
}>;
export type TokenPair = z.infer<typeof TokenPairSchema>;
export declare const AuthResponseSchema: z.ZodObject<{
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        displayName: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        id: string;
        displayName: string | null;
        createdAt: string;
        updatedAt: string;
    }, {
        email: string;
        id: string;
        displayName: string | null;
        createdAt: string;
        updatedAt: string;
    }>;
    tokens: z.ZodObject<{
        accessToken: z.ZodString;
        accessTokenExpiresAt: z.ZodString;
        refreshToken: z.ZodString;
        refreshTokenExpiresAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        accessToken: string;
        accessTokenExpiresAt: string;
        refreshToken: string;
        refreshTokenExpiresAt: string;
    }, {
        accessToken: string;
        accessTokenExpiresAt: string;
        refreshToken: string;
        refreshTokenExpiresAt: string;
    }>;
}, "strip", z.ZodTypeAny, {
    user: {
        email: string;
        id: string;
        displayName: string | null;
        createdAt: string;
        updatedAt: string;
    };
    tokens: {
        accessToken: string;
        accessTokenExpiresAt: string;
        refreshToken: string;
        refreshTokenExpiresAt: string;
    };
}, {
    user: {
        email: string;
        id: string;
        displayName: string | null;
        createdAt: string;
        updatedAt: string;
    };
    tokens: {
        accessToken: string;
        accessTokenExpiresAt: string;
        refreshToken: string;
        refreshTokenExpiresAt: string;
    };
}>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
/**
 * Cookie names used by apps/web to store tokens. Both sides import
 * these constants — there is no string-drift across the boundary.
 */
export declare const ACCESS_TOKEN_COOKIE: "tg_access";
export declare const REFRESH_TOKEN_COOKIE: "tg_refresh";
/** JWT payload the API signs. Kept small — not a general claims bag. */
export declare const JwtPayloadSchema: z.ZodObject<{
    sub: z.ZodString;
    sid: z.ZodString;
    iat: z.ZodNumber;
    exp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    sub: string;
    sid: string;
    iat: number;
    exp: number;
}, {
    sub: string;
    sid: string;
    iat: number;
    exp: number;
}>;
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;
//# sourceMappingURL=auth.d.ts.map