import { z } from "zod";
/**
 * ISO-8601 timestamp string. We use strings on the wire so JSON
 * serialization is boring and deterministic. Services convert to `Date`
 * at their boundaries.
 */
export declare const IsoDateSchema: z.ZodString;
export type IsoDate = z.infer<typeof IsoDateSchema>;
/**
 * Opaque id type. We use cuid2-style strings in the database but do
 * not constrain length here to keep the wire type permissive.
 */
export declare const IdSchema: z.ZodString;
export type Id = z.infer<typeof IdSchema>;
export declare const EmailSchema: z.ZodString;
export type Email = z.infer<typeof EmailSchema>;
/**
 * Password rules for Phase 2. These are not the last word on password
 * policy — MFA lands in Phase 6 — but they are defensible baseline.
 */
export declare const PasswordSchema: z.ZodString;
export type Password = z.infer<typeof PasswordSchema>;
export declare const DisplayNameSchema: z.ZodString;
export type DisplayName = z.infer<typeof DisplayNameSchema>;
//# sourceMappingURL=common.d.ts.map