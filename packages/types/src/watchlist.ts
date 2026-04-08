import { z } from "zod";
import { IdSchema, IsoDateSchema } from "./common";
import { SymbolMetaSchema, SymbolRefSchema } from "./market-data";

export const WatchlistItemSchema = z.object({
  id: IdSchema,
  watchlistId: IdSchema,
  symbol: SymbolMetaSchema,
  position: z.number().int().nonnegative(),
  addedAt: IsoDateSchema,
});
export type WatchlistItem = z.infer<typeof WatchlistItemSchema>;

export const WatchlistSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  name: z.string().trim().min(1).max(80),
  isDefault: z.boolean(),
  position: z.number().int().nonnegative(),
  createdAt: IsoDateSchema,
  updatedAt: IsoDateSchema,
  items: z.array(WatchlistItemSchema),
});
export type Watchlist = z.infer<typeof WatchlistSchema>;

// ---- Request shapes ---------------------------------------------------------

export const CreateWatchlistRequestSchema = z.object({
  name: z.string().trim().min(1).max(80),
});
export type CreateWatchlistRequest = z.infer<typeof CreateWatchlistRequestSchema>;

export const UpdateWatchlistRequestSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  position: z.number().int().nonnegative().optional(),
});
export type UpdateWatchlistRequest = z.infer<typeof UpdateWatchlistRequestSchema>;

export const AddWatchlistItemRequestSchema = z.object({
  symbol: SymbolRefSchema,
});
export type AddWatchlistItemRequest = z.infer<typeof AddWatchlistItemRequestSchema>;
