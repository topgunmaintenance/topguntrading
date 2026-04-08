"use client";

import { useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@topgun/ui";
import type { SymbolRef, Watchlist, WatchlistItem } from "@topgun/types";
import { useQuotesStream } from "@/lib/ws-client";

export interface WatchlistPanelProps {
  watchlist: Watchlist;
  wsUrl: string;
  providerSimulated: boolean;
}

export function WatchlistPanel({
  watchlist,
  wsUrl,
  providerSimulated,
}: WatchlistPanelProps): JSX.Element {
  const symbols = useMemo<SymbolRef[]>(
    () => watchlist.items.map((item) => item.symbol.ref),
    [watchlist.items],
  );
  const { quotes, status } = useQuotesStream(wsUrl, symbols);

  return (
    <div className="flex flex-col gap-3">
      {providerSimulated && (
        <div className="rounded-md border border-state-warn/40 bg-state-warn/10 px-3 py-2 text-xs text-state-warn">
          Simulated data — not real market prices. Configure a live provider
          in <code>.env</code> to switch.
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span className="font-mono uppercase tracking-[0.2em]">
          {symbols.length} symbols
        </span>
        <StreamStatus status={status} />
      </div>
      {watchlist.items.length === 0 ? (
        <div className="rounded-md border border-border-subtle bg-bg-raised px-4 py-8 text-center text-sm text-text-muted">
          No symbols yet. Add one above.
        </div>
      ) : (
        <ul className="divide-y divide-border-subtle rounded-md border border-border-subtle bg-bg-raised">
          {watchlist.items.map((item) => (
            <WatchlistRow
              key={item.id}
              watchlistId={watchlist.id}
              item={item}
              quote={quotes[item.symbol.ref]}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function WatchlistRow({
  watchlistId,
  item,
  quote,
}: {
  watchlistId: string;
  item: WatchlistItem;
  quote: ReturnType<typeof useQuotesStream>["quotes"][string] | undefined;
}): JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRemove = (): void => {
    startTransition(async () => {
      await fetch(`/api/watchlists/${watchlistId}/items/${item.id}`, {
        method: "DELETE",
      });
      router.refresh();
    });
  };

  const last = quote?.last ?? null;
  const bid = quote?.bid ?? null;
  const ask = quote?.ask ?? null;

  return (
    <li className="flex items-center justify-between px-4 py-3">
      <div className="flex min-w-0 flex-col">
        <Link
          href={`/chart/${encodeURIComponent(item.symbol.ref)}`}
          className="truncate font-mono text-sm text-text-primary hover:text-accent-primary"
        >
          {item.symbol.providerSymbol}
        </Link>
        <span className="truncate text-xs text-text-muted">
          {item.symbol.displayName}
        </span>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="font-mono text-sm text-text-primary">
            {last ?? <span className="text-text-muted">—</span>}
          </div>
          <div className="text-[10px] font-mono text-text-muted">
            {bid ?? "—"} / {ask ?? "—"}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          disabled={isPending}
          aria-label={`Remove ${item.symbol.providerSymbol}`}
        >
          Remove
        </Button>
      </div>
    </li>
  );
}

function StreamStatus({
  status,
}: {
  status: ReturnType<typeof useQuotesStream>["status"];
}): JSX.Element {
  const label =
    status === "open"
      ? "Live"
      : status === "connecting"
        ? "Connecting"
        : status === "error"
          ? "Reconnecting"
          : status === "closed"
            ? "Reconnecting"
            : "Idle";
  const color =
    status === "open"
      ? "text-state-up"
      : status === "error"
        ? "text-state-warn"
        : "text-text-muted";
  return (
    <span className={`inline-flex items-center gap-1 font-mono uppercase ${color}`}>
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
