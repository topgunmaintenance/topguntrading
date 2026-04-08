"use client";

import { useEffect, useRef, useState } from "react";
import type {
  ClientStreamMessage,
  Quote,
  ServerStreamMessage,
  SymbolRef,
} from "@topgun/types";

export interface UseQuotesStreamResult {
  quotes: Record<SymbolRef, Quote>;
  status: "idle" | "connecting" | "open" | "closed" | "error";
}

/**
 * Subscribe to a set of symbols on the API's WebSocket stream and
 * expose the latest quote per symbol. Cookie-based auth — the
 * browser sends `tg_access` automatically when the WS URL is
 * same-origin-ish (SameSite=Lax).
 *
 * The hook reconnects with bounded backoff and throws nothing — the
 * caller reads `status` to decide what to render.
 */
export function useQuotesStream(
  wsUrl: string,
  symbols: SymbolRef[],
): UseQuotesStreamResult {
  const [quotes, setQuotes] = useState<Record<SymbolRef, Quote>>({});
  const [status, setStatus] = useState<UseQuotesStreamResult["status"]>("idle");
  const socketRef = useRef<WebSocket | null>(null);
  const keyRef = useRef<string>("");

  const symbolsKey = symbols.slice().sort().join(",");

  useEffect(() => {
    if (!symbolsKey) {
      setStatus("idle");
      return;
    }
    keyRef.current = symbolsKey;

    let cancelled = false;
    let reconnectAttempt = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = (): void => {
      if (cancelled) return;
      setStatus("connecting");
      let socket: WebSocket;
      try {
        socket = new WebSocket(wsUrl);
      } catch {
        scheduleReconnect();
        return;
      }
      socketRef.current = socket;

      socket.onopen = () => {
        if (cancelled) {
          socket.close();
          return;
        }
        reconnectAttempt = 0;
        setStatus("open");
        const subscribe: ClientStreamMessage = {
          event: "subscribe",
          data: { channel: "quotes", symbols: symbolsKey.split(",") as SymbolRef[] },
        };
        try {
          socket.send(JSON.stringify(subscribe));
        } catch {
          // next onerror will deal with it
        }
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(String(event.data)) as ServerStreamMessage;
          if (parsed.event === "quote") {
            setQuotes((prev) => ({ ...prev, [parsed.data.symbol]: parsed.data }));
          }
        } catch {
          // ignore malformed frames; server is the authority
        }
      };

      socket.onerror = () => {
        setStatus("error");
      };

      socket.onclose = () => {
        if (cancelled) return;
        setStatus("closed");
        socketRef.current = null;
        scheduleReconnect();
      };
    };

    const scheduleReconnect = (): void => {
      if (cancelled) return;
      reconnectAttempt = Math.min(reconnectAttempt + 1, 6);
      const delay = Math.min(30_000, 500 * 2 ** reconnectAttempt);
      reconnectTimer = setTimeout(connect, delay);
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      const socket = socketRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        try {
          const unsubscribe: ClientStreamMessage = {
            event: "unsubscribe",
            data: {
              channel: "quotes",
              symbols: symbolsKey.split(",") as SymbolRef[],
            },
          };
          socket.send(JSON.stringify(unsubscribe));
        } catch {
          // ignore
        }
      }
      socket?.close();
      socketRef.current = null;
    };
  }, [wsUrl, symbolsKey]);

  return { quotes, status };
}
