import { z } from "zod";
/**
 * Wire protocol for the market-data WebSocket stream. Both the
 * NestJS gateway and the browser client import these schemas so
 * nothing drifts.
 *
 * Nest's platform-ws adapter uses a `{event, data}` envelope, so our
 * messages follow that shape.
 */
export declare const ClientSubscribeMessageSchema: z.ZodObject<{
    event: z.ZodLiteral<"subscribe">;
    data: z.ZodObject<{
        channel: z.ZodLiteral<"quotes">;
        symbols: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        channel: "quotes";
        symbols: string[];
    }, {
        channel: "quotes";
        symbols: string[];
    }>;
}, "strip", z.ZodTypeAny, {
    event: "subscribe";
    data: {
        channel: "quotes";
        symbols: string[];
    };
}, {
    event: "subscribe";
    data: {
        channel: "quotes";
        symbols: string[];
    };
}>;
export type ClientSubscribeMessage = z.infer<typeof ClientSubscribeMessageSchema>;
export declare const ClientUnsubscribeMessageSchema: z.ZodObject<{
    event: z.ZodLiteral<"unsubscribe">;
    data: z.ZodObject<{
        channel: z.ZodLiteral<"quotes">;
        symbols: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        channel: "quotes";
        symbols: string[];
    }, {
        channel: "quotes";
        symbols: string[];
    }>;
}, "strip", z.ZodTypeAny, {
    event: "unsubscribe";
    data: {
        channel: "quotes";
        symbols: string[];
    };
}, {
    event: "unsubscribe";
    data: {
        channel: "quotes";
        symbols: string[];
    };
}>;
export type ClientUnsubscribeMessage = z.infer<typeof ClientUnsubscribeMessageSchema>;
export declare const ClientPingMessageSchema: z.ZodObject<{
    event: z.ZodLiteral<"ping">;
    data: z.ZodOptional<z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>>;
}, "strip", z.ZodTypeAny, {
    event: "ping";
    data?: {} | undefined;
}, {
    event: "ping";
    data?: {} | undefined;
}>;
export type ClientPingMessage = z.infer<typeof ClientPingMessageSchema>;
export declare const ClientStreamMessageSchema: z.ZodDiscriminatedUnion<"event", [z.ZodObject<{
    event: z.ZodLiteral<"subscribe">;
    data: z.ZodObject<{
        channel: z.ZodLiteral<"quotes">;
        symbols: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        channel: "quotes";
        symbols: string[];
    }, {
        channel: "quotes";
        symbols: string[];
    }>;
}, "strip", z.ZodTypeAny, {
    event: "subscribe";
    data: {
        channel: "quotes";
        symbols: string[];
    };
}, {
    event: "subscribe";
    data: {
        channel: "quotes";
        symbols: string[];
    };
}>, z.ZodObject<{
    event: z.ZodLiteral<"unsubscribe">;
    data: z.ZodObject<{
        channel: z.ZodLiteral<"quotes">;
        symbols: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        channel: "quotes";
        symbols: string[];
    }, {
        channel: "quotes";
        symbols: string[];
    }>;
}, "strip", z.ZodTypeAny, {
    event: "unsubscribe";
    data: {
        channel: "quotes";
        symbols: string[];
    };
}, {
    event: "unsubscribe";
    data: {
        channel: "quotes";
        symbols: string[];
    };
}>, z.ZodObject<{
    event: z.ZodLiteral<"ping">;
    data: z.ZodOptional<z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>>;
}, "strip", z.ZodTypeAny, {
    event: "ping";
    data?: {} | undefined;
}, {
    event: "ping";
    data?: {} | undefined;
}>]>;
export type ClientStreamMessage = z.infer<typeof ClientStreamMessageSchema>;
export declare const ServerQuoteMessageSchema: z.ZodObject<{
    event: z.ZodLiteral<"quote">;
    data: z.ZodObject<{
        symbol: z.ZodString;
        time: z.ZodString;
        last: z.ZodNullable<z.ZodString>;
        bid: z.ZodNullable<z.ZodString>;
        ask: z.ZodNullable<z.ZodString>;
        volume24h: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        symbol: string;
        time: string;
        last: string | null;
        bid: string | null;
        ask: string | null;
        volume24h: string | null;
    }, {
        symbol: string;
        time: string;
        last: string | null;
        bid: string | null;
        ask: string | null;
        volume24h: string | null;
    }>;
}, "strip", z.ZodTypeAny, {
    event: "quote";
    data: {
        symbol: string;
        time: string;
        last: string | null;
        bid: string | null;
        ask: string | null;
        volume24h: string | null;
    };
}, {
    event: "quote";
    data: {
        symbol: string;
        time: string;
        last: string | null;
        bid: string | null;
        ask: string | null;
        volume24h: string | null;
    };
}>;
export type ServerQuoteMessage = z.infer<typeof ServerQuoteMessageSchema>;
export declare const ServerAckMessageSchema: z.ZodObject<{
    event: z.ZodLiteral<"ack">;
    data: z.ZodObject<{
        channel: z.ZodLiteral<"quotes">;
        subscribed: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        channel: "quotes";
        subscribed: string[];
    }, {
        channel: "quotes";
        subscribed: string[];
    }>;
}, "strip", z.ZodTypeAny, {
    event: "ack";
    data: {
        channel: "quotes";
        subscribed: string[];
    };
}, {
    event: "ack";
    data: {
        channel: "quotes";
        subscribed: string[];
    };
}>;
export type ServerAckMessage = z.infer<typeof ServerAckMessageSchema>;
export declare const ServerErrorMessageSchema: z.ZodObject<{
    event: z.ZodLiteral<"error">;
    data: z.ZodObject<{
        code: z.ZodEnum<["bad_request", "unauthorized", "forbidden", "not_found", "conflict", "unprocessable_entity", "rate_limited", "internal_error"]>;
        message: z.ZodString;
        symbol: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        code: "bad_request" | "unauthorized" | "forbidden" | "not_found" | "conflict" | "unprocessable_entity" | "rate_limited" | "internal_error";
        message: string;
        symbol?: string | undefined;
    }, {
        code: "bad_request" | "unauthorized" | "forbidden" | "not_found" | "conflict" | "unprocessable_entity" | "rate_limited" | "internal_error";
        message: string;
        symbol?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    event: "error";
    data: {
        code: "bad_request" | "unauthorized" | "forbidden" | "not_found" | "conflict" | "unprocessable_entity" | "rate_limited" | "internal_error";
        message: string;
        symbol?: string | undefined;
    };
}, {
    event: "error";
    data: {
        code: "bad_request" | "unauthorized" | "forbidden" | "not_found" | "conflict" | "unprocessable_entity" | "rate_limited" | "internal_error";
        message: string;
        symbol?: string | undefined;
    };
}>;
export type ServerErrorMessage = z.infer<typeof ServerErrorMessageSchema>;
export declare const ServerPongMessageSchema: z.ZodObject<{
    event: z.ZodLiteral<"pong">;
    data: z.ZodObject<{
        ts: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        ts: string;
    }, {
        ts: string;
    }>;
}, "strip", z.ZodTypeAny, {
    event: "pong";
    data: {
        ts: string;
    };
}, {
    event: "pong";
    data: {
        ts: string;
    };
}>;
export type ServerPongMessage = z.infer<typeof ServerPongMessageSchema>;
export declare const ServerStreamMessageSchema: z.ZodDiscriminatedUnion<"event", [z.ZodObject<{
    event: z.ZodLiteral<"quote">;
    data: z.ZodObject<{
        symbol: z.ZodString;
        time: z.ZodString;
        last: z.ZodNullable<z.ZodString>;
        bid: z.ZodNullable<z.ZodString>;
        ask: z.ZodNullable<z.ZodString>;
        volume24h: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        symbol: string;
        time: string;
        last: string | null;
        bid: string | null;
        ask: string | null;
        volume24h: string | null;
    }, {
        symbol: string;
        time: string;
        last: string | null;
        bid: string | null;
        ask: string | null;
        volume24h: string | null;
    }>;
}, "strip", z.ZodTypeAny, {
    event: "quote";
    data: {
        symbol: string;
        time: string;
        last: string | null;
        bid: string | null;
        ask: string | null;
        volume24h: string | null;
    };
}, {
    event: "quote";
    data: {
        symbol: string;
        time: string;
        last: string | null;
        bid: string | null;
        ask: string | null;
        volume24h: string | null;
    };
}>, z.ZodObject<{
    event: z.ZodLiteral<"ack">;
    data: z.ZodObject<{
        channel: z.ZodLiteral<"quotes">;
        subscribed: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        channel: "quotes";
        subscribed: string[];
    }, {
        channel: "quotes";
        subscribed: string[];
    }>;
}, "strip", z.ZodTypeAny, {
    event: "ack";
    data: {
        channel: "quotes";
        subscribed: string[];
    };
}, {
    event: "ack";
    data: {
        channel: "quotes";
        subscribed: string[];
    };
}>, z.ZodObject<{
    event: z.ZodLiteral<"error">;
    data: z.ZodObject<{
        code: z.ZodEnum<["bad_request", "unauthorized", "forbidden", "not_found", "conflict", "unprocessable_entity", "rate_limited", "internal_error"]>;
        message: z.ZodString;
        symbol: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        code: "bad_request" | "unauthorized" | "forbidden" | "not_found" | "conflict" | "unprocessable_entity" | "rate_limited" | "internal_error";
        message: string;
        symbol?: string | undefined;
    }, {
        code: "bad_request" | "unauthorized" | "forbidden" | "not_found" | "conflict" | "unprocessable_entity" | "rate_limited" | "internal_error";
        message: string;
        symbol?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    event: "error";
    data: {
        code: "bad_request" | "unauthorized" | "forbidden" | "not_found" | "conflict" | "unprocessable_entity" | "rate_limited" | "internal_error";
        message: string;
        symbol?: string | undefined;
    };
}, {
    event: "error";
    data: {
        code: "bad_request" | "unauthorized" | "forbidden" | "not_found" | "conflict" | "unprocessable_entity" | "rate_limited" | "internal_error";
        message: string;
        symbol?: string | undefined;
    };
}>, z.ZodObject<{
    event: z.ZodLiteral<"pong">;
    data: z.ZodObject<{
        ts: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        ts: string;
    }, {
        ts: string;
    }>;
}, "strip", z.ZodTypeAny, {
    event: "pong";
    data: {
        ts: string;
    };
}, {
    event: "pong";
    data: {
        ts: string;
    };
}>]>;
export type ServerStreamMessage = z.infer<typeof ServerStreamMessageSchema>;
//# sourceMappingURL=stream.d.ts.map