import { z } from "zod";

/**
 * ISO-8601 timestamp string. We use strings on the wire so JSON
 * serialization is boring and deterministic. Services convert to `Date`
 * at their boundaries.
 */
export const IsoDateSchema = z
  .string()
  .datetime({ offset: true })
  .describe("ISO-8601 timestamp with offset");

export type IsoDate = z.infer<typeof IsoDateSchema>;

/**
 * Opaque id type. We use cuid2-style strings in the database but do
 * not constrain length here to keep the wire type permissive.
 */
export const IdSchema = z.string().min(1).max(64);
export type Id = z.infer<typeof IdSchema>;

export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email()
  .max(254, "Email must be 254 characters or fewer");
export type Email = z.infer<typeof EmailSchema>;

/**
 * Password rules for Phase 2. These are not the last word on password
 * policy — MFA lands in Phase 6 — but they are defensible baseline.
 */
export const PasswordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(256, "Password must be 256 characters or fewer");
export type Password = z.infer<typeof PasswordSchema>;

export const DisplayNameSchema = z
  .string()
  .trim()
  .min(1, "Display name is required")
  .max(80, "Display name must be 80 characters or fewer");
export type DisplayName = z.infer<typeof DisplayNameSchema>;
