"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { Candle, Interval, Quote, SymbolRef } from "@topgun/types";
import { TIMEFRAME_OPTIONS } from "@topgun/charting/timeframe";
import { Button } from "@topgun/ui";
import { useQuotesStream } from "@/lib/ws-client";

// lightweight-charts touches `window` at module load, so the chart
// must load client-side only.
const Chart = dynamic(
  () => import("@topgun/charting/chart").then((m) => m.Chart),
  { ssr: false },
);

export interface ChartCanvasProps {
  symbolRef: SymbolRef;
  symbolLabel: string;
  initialInterval: Interval;
  initialCandles: Candle[];
  wsUrl: string;
  providerSimulated: boolean;
}

export function ChartCanvas({
  symbolRef,
  symbolLabel,
  initialInterval,
  initialCandles,
  wsUrl,
  providerSimulated,
}: ChartCanvasProps): JSX.Element {
  const [interval, setInterval] = useState<Interval>(initialInterval);
  const [candles, setCandles] = useState<Candle[]>(initialCandles);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { quotes } = useQuotesStream(wsUrl, useMemo(() => [symbolRef], [symbolRef]));
  const liveQuote: Quote | null = quotes[symbolRef] ?? null;

  const loadInterval = async (next: Interval): Promise<void> => {
    setInterval(next);
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        symbol: symbolRef,
        interval: next,
        limit: "300",
      });
      const response = await fetch(
        `/api/market-data/candles?${params.toString()}`,
        { cache: "no-store" },
      );
      if (!response.ok) {
        setError("Failed to load candles");
        return;
      }
      const body = (await response.json()) as { candles: Candle[] };
      setCandles(body.candles);
    } catch {
      setError("Failed to load candles");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {providerSimulated && (
        <div className="rounded-md border border-state-warn/40 bg-state-warn/10 px-3 py-2 text-xs text-state-warn">
          Simulated data — not real market prices.
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-text-secondary">
            Chart workspace
          </p>
          <h1 className="text-xl font-semibold text-text-primary">{symbolLabel}</h1>
        </div>
        <div className="flex items-center gap-1">
          {TIMEFRAME_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={option.value === interval ? "primary" : "secondary"}
              size="sm"
              onClick={() => loadInterval(option.value)}
              disabled={loading}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
      {error && (
        <div className="rounded-md border border-state-danger/40 bg-state-danger/10 px-3 py-2 text-xs text-state-danger">
          {error}
        </div>
      )}
      <div className="rounded-md border border-border-subtle bg-bg-raised p-2">
        <Chart
          candles={candles}
          symbol={symbolRef}
          interval={interval}
          liveQuote={liveQuote}
          height={480}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>Last: {liveQuote?.last ?? "—"}</span>
        <span>
          Bid {liveQuote?.bid ?? "—"} / Ask {liveQuote?.ask ?? "—"}
        </span>
        <span>24h vol {liveQuote?.volume24h ?? "—"}</span>
      </div>
    </div>
  );
}
