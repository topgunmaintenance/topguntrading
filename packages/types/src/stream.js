"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerStreamMessageSchema = exports.ServerPongMessageSchema = exports.ServerErrorMessageSchema = exports.ServerAckMessageSchema = exports.ServerQuoteMessageSchema = exports.ClientStreamMessageSchema = exports.ClientPingMessageSchema = exports.ClientUnsubscribeMessageSchema = exports.ClientSubscribeMessageSchema = void 0;
const zod_1 = require("zod");
const market_data_1 = require("./market-data");
const errors_1 = require("./errors");
/**
 * Wire protocol for the market-data WebSocket stream. Both the
 * NestJS gateway and the browser client import these schemas so
 * nothing drifts.
 *
 * Nest's platform-ws adapter uses a `{event, data}` envelope, so our
 * messages follow that shape.
 */
// ---- Client → Server ---------------------------------------------------------
exports.ClientSubscribeMessageSchema = zod_1.z.object({
    event: zod_1.z.literal("subscribe"),
    data: zod_1.z.object({
        channel: zod_1.z.literal("quotes"),
        symbols: zod_1.z.array(market_data_1.SymbolRefSchema).min(1).max(100),
    }),
});
exports.ClientUnsubscribeMessageSchema = zod_1.z.object({
    event: zod_1.z.literal("unsubscribe"),
    data: zod_1.z.object({
        channel: zod_1.z.literal("quotes"),
        symbols: zod_1.z.array(market_data_1.SymbolRefSchema).min(1).max(100),
    }),
});
exports.ClientPingMessageSchema = zod_1.z.object({
    event: zod_1.z.literal("ping"),
    data: zod_1.z.object({}).optional(),
});
exports.ClientStreamMessageSchema = zod_1.z.discriminatedUnion("event", [
    exports.ClientSubscribeMessageSchema,
    exports.ClientUnsubscribeMessageSchema,
    exports.ClientPingMessageSchema,
]);
// ---- Server → Client ---------------------------------------------------------
exports.ServerQuoteMessageSchema = zod_1.z.object({
    event: zod_1.z.literal("quote"),
    data: market_data_1.QuoteSchema,
});
exports.ServerAckMessageSchema = zod_1.z.object({
    event: zod_1.z.literal("ack"),
    data: zod_1.z.object({
        channel: zod_1.z.literal("quotes"),
        subscribed: zod_1.z.array(market_data_1.SymbolRefSchema),
    }),
});
exports.ServerErrorMessageSchema = zod_1.z.object({
    event: zod_1.z.literal("error"),
    data: zod_1.z.object({
        code: errors_1.ApiErrorCodeSchema,
        message: zod_1.z.string(),
        symbol: market_data_1.SymbolRefSchema.optional(),
    }),
});
exports.ServerPongMessageSchema = zod_1.z.object({
    event: zod_1.z.literal("pong"),
    data: zod_1.z.object({
        ts: zod_1.z.string(),
    }),
});
exports.ServerStreamMessageSchema = zod_1.z.discriminatedUnion("event", [
    exports.ServerQuoteMessageSchema,
    exports.ServerAckMessageSchema,
    exports.ServerErrorMessageSchema,
    exports.ServerPongMessageSchema,
]);
//# sourceMappingURL=stream.js.map