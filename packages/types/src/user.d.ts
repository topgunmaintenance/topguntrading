import { z } from "zod";
/**
 * Public user shape — what the API returns for the authenticated user.
 * Never includes password hashes, tokens, or other secrets.
 */
export declare const UserSchema: z.ZodObject<{
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
export type User = z.infer<typeof UserSchema>;
//# sourceMappingURL=user.d.ts.map