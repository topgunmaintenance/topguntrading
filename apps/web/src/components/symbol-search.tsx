"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@topgun/ui";
import type { SymbolMeta } from "@topgun/types";

export interface SymbolSearchProps {
  /** Called when the user picks a symbol. */
  onPick: (symbol: SymbolMeta) => Promise<void> | void;
  /** Label shown above the input. */
  label?: string;
  /** Button copy. */
  actionLabel?: string;
  /** Disable the input/button while an outer action is running. */
  disabled?: boolean;
}

/**
 * Server-backed symbol search with a debounced fetch against
 * `/api/market-data/symbols`. Pure client component — it does not
 * talk to the API directly, only to our own proxy.
 */
export function SymbolSearch({
  onPick,
  label = "Find a symbol",
  actionLabel = "Add",
  disabled = false,
}: SymbolSearchProps): JSX.Element {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SymbolMeta[]>([]);
  const [selected, setSelected] = useState<SymbolMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: query, limit: "10" });
        const response = await fetch(
          `/api/market-data/symbols?${params.toString()}`,
          { cache: "no-store" },
        );
        if (!response.ok) {
          setError("Search failed");
          return;
        }
        const body = (await response.json()) as { symbols: SymbolMeta[] };
        setResults(body.symbols);
        setError(null);
      } catch {
        setError("Search failed");
      }
    }, 150);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleAction = (): void => {
    if (!selected) return;
    startTransition(async () => {
      try {
        await onPick(selected);
        setQuery("");
        setSelected(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed");
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="symbol-search">{label}</Label>
      <div className="flex gap-2">
        <Input
          id="symbol-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. BTC, ETH, SOL"
          disabled={disabled || isPending}
          autoComplete="off"
        />
        <Button
          type="button"
          variant="primary"
          onClick={handleAction}
          disabled={disabled || isPending || !selected}
        >
          {actionLabel}
        </Button>
      </div>
      {results.length > 0 && (
        <ul className="divide-y divide-border-subtle rounded-md border border-border-subtle bg-bg-sunken">
          {results.map((symbol) => {
            const isSelected = selected?.ref === symbol.ref;
            return (
              <li key={symbol.ref}>
                <button
                  type="button"
                  className={
                    "flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-bg-raised " +
                    (isSelected ? "bg-bg-raised text-text-primary" : "text-text-secondary")
                  }
                  onClick={() => setSelected(symbol)}
                >
                  <span className="font-mono">{symbol.providerSymbol}</span>
                  <span className="text-text-muted">{symbol.displayName}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {error && <p className="text-xs text-state-danger">{error}</p>}
    </div>
  );
}
