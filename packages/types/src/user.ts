import { z } from "zod";
import { DisplayNameSchema, EmailSchema, IdSchema, IsoDateSchema } from "./common";

/**
 * Public user shape — what the API returns for the authenticated user.
 * Never includes password hashes, tokens, or other secrets.
 */
export const UserSchema = z.object({
  id: IdSchema,
  email: EmailSchema,
  displayName: DisplayNameSchema.nullable(),
  createdAt: IsoDateSchema,
  updatedAt: IsoDateSchema,
});

export type User = z.infer<typeof UserSchema>;
