import { z } from "zod";
/**
 * Public session shape. The actual refresh token is never returned
 * after issuance — only a session id and metadata.
 */
export declare const SessionSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    userAgent: z.ZodNullable<z.ZodString>;
    ipAddress: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    lastUsedAt: z.ZodString;
    expiresAt: z.ZodString;
    revokedAt: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    userId: string;
    userAgent: string | null;
    ipAddress: string | null;
    lastUsedAt: string;
    expiresAt: string;
    revokedAt: string | null;
}, {
    id: string;
    createdAt: string;
    userId: string;
    userAgent: string | null;
    ipAddress: string | null;
    lastUsedAt: string;
    expiresAt: string;
    revokedAt: string | null;
}>;
export type Session = z.infer<typeof SessionSchema>;
//# sourceMappingURL=session.d.ts.map