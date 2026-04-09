"use client";

import { useCallback, useEffect, useState } from "react";
import type { AttributionInfo, EdgeSignal } from "@topgun/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  DataDisclaimer,
} from "@topgun/ui";

/**
 * TopGun Trading — Whale Activity dashboard card.
 *
 * Phase 3.5 (ADR-0026, ADR-0027). Polls `/api/market/whales` every
 * 15 seconds and renders the resulting `EdgeSignal[]` as a dense,
 * tabular-figures list. Each row is a factual observation — never
 * a recommendation. No "Buy"/"Sell" verbs appear anywhere. Trade
 * aggressor is rendered as "bid lift" / "offer hit" / "aggressor
 * unknown" per docs/design-system.md §Voice and microcopy.
 *
 * Decimal strings are preserved from provider → API → web — the
 * card does not reparse `price` or `size` for display, it reads
 * the formatted `headline` and the raw strings in `evidence`.
 */

const POLL_INTERVAL_MS = 15_000;

interface WhalesResponse {
  signals: EdgeSignal[];
  attribution: AttributionInfo;
}

interface ErrorState {
  code: string;
  message: string;
}

export function WhaleActivityCard(): JSX.Element {
  const [signals, setSignals] = useState<EdgeSignal[] | null>(null);
  const [attribution, setAttribution] = useState<AttributionInfo | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [lastFetchAt, setLastFetchAt] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/market/whales", {
        method: "GET",
        headers: { accept: "application/json" },
        cache: "no-store",
        ...(signal ? { signal } : {}),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { code?: string; message?: string }
          | null;
        setError({
          code: body?.code ?? "unknown",
          message:
            body?.message ??
            `Upstream returned ${response.status}. Observations paused.`,
        });
        return;
      }
      const data = (await response.json()) as WhalesResponse;
      setSignals(data.signals);
      setAttribution(data.attribution);
      setLastFetchAt(new Date().toISOString());
      setError(null);
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") return;
      setError({
        code: "network_error",
        message: "Network error while loading observations.",
      });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    const id = setInterval(() => {
      void load(controller.signal);
    }, POLL_INTERVAL_MS);
    return () => {
      controller.abort();
      clearInterval(id);
    };
  }, [load]);

  return (
    <Card className="min-h-[260px] flex flex-col">
      <CardHeader>
        <CardTitle>Whale Activity</CardTitle>
        <CardDescription>
          Public trade tape — unusually large prints observed on the default
          crypto universe. Observational only.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {error ? (
          <div
            role="status"
            className="text-sm text-state-warn"
            data-testid="whale-error"
          >
            {error.message}
          </div>
        ) : signals === null ? (
          <div className="text-sm text-text-muted" data-testid="whale-loading">
            Loading tape…
          </div>
        ) : signals.length === 0 ? (
          <div className="text-sm text-text-muted" data-testid="whale-empty">
            No unusual prints in the current window. Tape is calm.
          </div>
        ) : (
          <ul className="flex flex-col gap-2" data-testid="whale-list">
            {signals.slice(0, 12).map((signal) => (
              <WhaleRow key={signal.id} signal={signal} />
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-1">
        {attribution ? (
          <DataDisclaimer
            providerLabel={attribution.label}
            {...(attribution.delayed ? { delayNote: "Delayed" } : {})}
          />
        ) : (
          <span className="text-[11px] text-text-muted">
            Awaiting data provider response.
          </span>
        )}
        {lastFetchAt ? (
          <span className="font-mono text-[11px] text-text-muted/80">
            Last polled {formatRelative(lastFetchAt)}
          </span>
        ) : null}
      </CardFooter>
    </Card>
  );
}

function WhaleRow({ signal }: { signal: EdgeSignal }): JSX.Element {
  // `signal.headline` is a neutral one-liner from the detector.
  // We render it verbatim and surface a small severity chip.
  const severity = signal.severity;
  const chipClass =
    severity === "high"
      ? "border-state-warn/60 text-state-warn"
      : severity === "medium"
        ? "border-accent-secondary/60 text-accent-secondary"
        : "border-text-muted/60 text-text-secondary";

  const aggressorLabel =
    signal.direction === "taker_buy"
      ? "bid lift"
      : signal.direction === "taker_sell"
        ? "offer hit"
        : "aggressor n/a";

  return (
    <li
      className="flex items-start gap-3 border-b border-border-subtle/60 pb-2 last:border-b-0 last:pb-0"
      data-testid="whale-row"
    >
      <span
        className={`rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${chipClass}`}
      >
        {severity}
      </span>
      <div className="flex flex-1 flex-col">
        <span className="text-sm leading-tight text-text-primary">
          {signal.headline}
        </span>
        <span className="mt-0.5 flex flex-wrap gap-x-3 font-mono text-[11px] text-text-muted">
          <span>{aggressorLabel}</span>
          <span>{formatRelative(signal.observedAt)}</span>
        </span>
      </div>
    </li>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return iso;
  const deltaSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (deltaSec < 60) return `${deltaSec}s ago`;
  if (deltaSec < 3600) return `${Math.floor(deltaSec / 60)}m ago`;
  if (deltaSec < 86400) return `${Math.floor(deltaSec / 3600)}h ago`;
  return `${Math.floor(deltaSec / 86400)}d ago`;
}
