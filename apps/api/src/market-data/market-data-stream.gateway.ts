import { Logger } from "@nestjs/common";
import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  WebSocketGateway,
} from "@nestjs/websockets";
import { randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";
import type WebSocket from "ws";
import {
  ACCESS_TOKEN_COOKIE,
  ClientStreamMessageSchema,
  type ServerStreamMessage,
  type SymbolRef,
} from "@topgun/types";
import { TokenService } from "../auth/token.service";
import { SubscriptionHub } from "./subscription-hub";

interface ClientContext {
  id: string;
  userId: string;
  socket: WebSocket;
}

/**
 * Cookie-authenticated WebSocket gateway for live market data.
 *
 * Protocol (`{event, data}` envelopes to fit platform-ws):
 *
 *   C→S subscribe      { event: "subscribe",   data: {channel, symbols[]} }
 *   C→S unsubscribe    { event: "unsubscribe", data: {channel, symbols[]} }
 *   C→S ping           { event: "ping",        data?: {} }
 *
 *   S→C ack            { event: "ack",   data: {channel, subscribed[]} }
 *   S→C quote          { event: "quote", data: Quote }
 *   S→C error          { event: "error", data: {code, message, symbol?} }
 *   S→C pong           { event: "pong",  data: {ts} }
 */
@WebSocketGateway({ path: "/stream" })
export class MarketDataStreamGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(MarketDataStreamGateway.name);
  private readonly clients = new WeakMap<WebSocket, ClientContext>();

  constructor(
    private readonly tokens: TokenService,
    private readonly hub: SubscriptionHub,
  ) {}

  handleConnection(client: WebSocket, request: IncomingMessage): void {
    const accessToken = this.extractAccessToken(request);
    if (!accessToken) {
      this.closeUnauthorized(client, "Missing access token");
      return;
    }
    let userId: string;
    try {
      const payload = this.tokens.verifyAccessToken(accessToken);
      userId = payload.sub;
    } catch {
      this.closeUnauthorized(client, "Invalid access token");
      return;
    }

    const ctx: ClientContext = {
      id: randomUUID(),
      userId,
      socket: client,
    };
    this.clients.set(client, ctx);

    this.hub.registerClient(ctx.id, (_clientId, quote) => {
      this.sendMessage(client, { event: "quote", data: quote });
    });

    // Handle raw message frames ourselves — platform-ws routes via
    // `{event,data}` envelopes, but explicit handling lets us keep
    // strict schema validation and return typed errors.
    client.on("message", (raw: WebSocket.RawData) => {
      void this.handleRawMessage(ctx, raw);
    });

    this.logger.log(`Stream connected: client=${ctx.id} user=${userId}`);
  }

  handleDisconnect(client: WebSocket): void {
    const ctx = this.clients.get(client);
    if (!ctx) return;
    this.clients.delete(client);
    this.hub.unregisterClient(ctx.id);
    this.logger.log(`Stream disconnected: client=${ctx.id}`);
  }

  // ---- internals ------------------------------------------------------------

  private async handleRawMessage(
    ctx: ClientContext,
    raw: WebSocket.RawData,
  ): Promise<void> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw.toString());
    } catch {
      this.sendMessage(ctx.socket, {
        event: "error",
        data: {
          code: "bad_request",
          message: "Messages must be JSON with an {event,data} envelope",
        },
      });
      return;
    }
    const result = ClientStreamMessageSchema.safeParse(parsed);
    if (!result.success) {
      this.sendMessage(ctx.socket, {
        event: "error",
        data: {
          code: "bad_request",
          message: "Unknown or malformed stream message",
        },
      });
      return;
    }

    const message = result.data;
    switch (message.event) {
      case "subscribe": {
        const { accepted, skipped } = await this.hub.subscribe(
          ctx.id,
          message.data.symbols as SymbolRef[],
        );
        this.sendMessage(ctx.socket, {
          event: "ack",
          data: { channel: "quotes", subscribed: accepted },
        });
        for (const symbol of skipped) {
          this.sendMessage(ctx.socket, {
            event: "error",
            data: {
              code: "not_found",
              message: `Symbol ${symbol} is not served by the active provider`,
              symbol,
            },
          });
        }
        break;
      }
      case "unsubscribe": {
        this.hub.unsubscribe(ctx.id, message.data.symbols as SymbolRef[]);
        this.sendMessage(ctx.socket, {
          event: "ack",
          data: { channel: "quotes", subscribed: [] },
        });
        break;
      }
      case "ping": {
        this.sendMessage(ctx.socket, {
          event: "pong",
          data: { ts: new Date().toISOString() },
        });
        break;
      }
    }
  }

  private sendMessage(client: WebSocket, message: ServerStreamMessage): void {
    if (client.readyState !== client.OPEN) return;
    try {
      client.send(JSON.stringify(message));
    } catch (error) {
      this.logger.warn(`Failed to send stream message: ${String(error)}`);
    }
  }

  private closeUnauthorized(client: WebSocket, reason: string): void {
    try {
      client.close(1008, reason);
    } catch {
      // ignore
    }
  }

  private extractAccessToken(request: IncomingMessage): string | undefined {
    // 1. Authorization: Bearer <token>
    const auth = request.headers.authorization;
    if (typeof auth === "string" && auth.startsWith("Bearer ")) {
      return auth.slice("Bearer ".length);
    }
    // 2. Cookie: tg_access=<token>
    const cookieHeader = request.headers.cookie;
    if (typeof cookieHeader === "string") {
      for (const part of cookieHeader.split(";")) {
        const [rawKey, ...rest] = part.trim().split("=");
        if (rawKey === ACCESS_TOKEN_COOKIE) {
          return decodeURIComponent(rest.join("="));
        }
      }
    }
    return undefined;
  }
}
