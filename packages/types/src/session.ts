import { z } from "zod";
import { IdSchema, IsoDateSchema } from "./common";

/**
 * Public session shape. The actual refresh token is never returned
 * after issuance — only a session id and metadata.
 */
export const SessionSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  userAgent: z.string().nullable(),
  ipAddress: z.string().nullable(),
  createdAt: IsoDateSchema,
  lastUsedAt: IsoDateSchema,
  expiresAt: IsoDateSchema,
  revokedAt: IsoDateSchema.nullable(),
});

export type Session = z.infer<typeof SessionSchema>;
