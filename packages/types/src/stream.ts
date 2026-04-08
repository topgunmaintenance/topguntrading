import { z } from "zod";
import { QuoteSchema, SymbolRefSchema } from "./market-data";
import { ApiErrorCodeSchema } from "./errors";

/**
 * Wire protocol for the market-data WebSocket stream. Both the
 * NestJS gateway and the browser client import these schemas so
 * nothing drifts.
 *
 * Nest's platform-ws adapter uses a `{event, data}` envelope, so our
 * messages follow that shape.
 */

// ---- Client → Server ---------------------------------------------------------

export const ClientSubscribeMessageSchema = z.object({
  event: z.literal("subscribe"),
  data: z.object({
    channel: z.literal("quotes"),
    symbols: z.array(SymbolRefSchema).min(1).max(100),
  }),
});
export type ClientSubscribeMessage = z.infer<typeof ClientSubscribeMessageSchema>;

export const ClientUnsubscribeMessageSchema = z.object({
  event: z.literal("unsubscribe"),
  data: z.object({
    channel: z.literal("quotes"),
    symbols: z.array(SymbolRefSchema).min(1).max(100),
  }),
});
export type ClientUnsubscribeMessage = z.infer<typeof ClientUnsubscribeMessageSchema>;

export const ClientPingMessageSchema = z.object({
  event: z.literal("ping"),
  data: z.object({}).optional(),
});
export type ClientPingMessage = z.infer<typeof ClientPingMessageSchema>;

export const ClientStreamMessageSchema = z.discriminatedUnion("event", [
  ClientSubscribeMessageSchema,
  ClientUnsubscribeMessageSchema,
  ClientPingMessageSchema,
]);
export type ClientStreamMessage = z.infer<typeof ClientStreamMessageSchema>;

// ---- Server → Client ---------------------------------------------------------

export const ServerQuoteMessageSchema = z.object({
  event: z.literal("quote"),
  data: QuoteSchema,
});
export type ServerQuoteMessage = z.infer<typeof ServerQuoteMessageSchema>;

export const ServerAckMessageSchema = z.object({
  event: z.literal("ack"),
  data: z.object({
    channel: z.literal("quotes"),
    subscribed: z.array(SymbolRefSchema),
  }),
});
export type ServerAckMessage = z.infer<typeof ServerAckMessageSchema>;

export const ServerErrorMessageSchema = z.object({
  event: z.literal("error"),
  data: z.object({
    code: ApiErrorCodeSchema,
    message: z.string(),
    symbol: SymbolRefSchema.optional(),
  }),
});
export type ServerErrorMessage = z.infer<typeof ServerErrorMessageSchema>;

export const ServerPongMessageSchema = z.object({
  event: z.literal("pong"),
  data: z.object({
    ts: z.string(),
  }),
});
export type ServerPongMessage = z.infer<typeof ServerPongMessageSchema>;

export const ServerStreamMessageSchema = z.discriminatedUnion("event", [
  ServerQuoteMessageSchema,
  ServerAckMessageSchema,
  ServerErrorMessageSchema,
  ServerPongMessageSchema,
]);
export type ServerStreamMessage = z.infer<typeof ServerStreamMessageSchema>;
