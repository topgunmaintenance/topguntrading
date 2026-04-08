import { z } from "zod";
import { IdSchema, IsoDateSchema } from "./common";

/**
 * Workspace shape. Phase 2 keeps workspaces minimal — name and a
 * default flag. Watchlists, layouts, and default symbols land in
 * Phase 3 when the market data layer arrives.
 */
export const WorkspaceSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  name: z.string().trim().min(1).max(80),
  isDefault: z.boolean(),
  createdAt: IsoDateSchema,
  updatedAt: IsoDateSchema,
});

export type Workspace = z.infer<typeof WorkspaceSchema>;
