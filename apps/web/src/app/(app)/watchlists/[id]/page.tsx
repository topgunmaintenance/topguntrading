import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { SymbolMeta } from "@topgun/types";
import { Card, CardContent, CardHeader, CardTitle } from "@topgun/ui";
import { getCurrentUser } from "@/lib/session";
import { watchlistsClient } from "@/lib/watchlists-client";
import { marketDataClient } from "@/lib/market-data-client";
import { ApiCallError } from "@/lib/api-client";
import { env } from "@/lib/env";
import { WatchlistPanel } from "@/components/watchlist-panel";
import { SymbolSearch } from "@/components/symbol-search";

async function forwardedCookie(): Promise<string> {
  return headers().get("cookie") ?? "";
}

export default async function WatchlistDetailPage({
  params,
}: {
  params: { id: string };
}): Promise<JSX.Element> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const cookie = await forwardedCookie();

  let watchlist;
  try {
    watchlist = await watchlistsClient.get(params.id, cookie);
  } catch (error) {
    if (error instanceof ApiCallError && error.status === 404) {
      notFound();
    }
    throw error;
  }
  const attribution = await marketDataClient.attribution(cookie);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link
            href="/watchlists"
            className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted hover:text-text-primary"
          >
            ← All watchlists
          </Link>
          <h1 className="text-2xl font-semibold text-text-primary">
            {watchlist.name}
          </h1>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Add a symbol</CardTitle>
        </CardHeader>
        <CardContent>
          <AddSymbolControl watchlistId={params.id} />
        </CardContent>
      </Card>

      <WatchlistPanel
        watchlist={watchlist}
        wsUrl={env.NEXT_PUBLIC_WS_URL}
        providerSimulated={attribution.simulated}
      />

      <p className="text-[11px] text-text-muted">
        {attribution.simulated
          ? "Simulated data — not real market prices."
          : `${attribution.label}.`}
      </p>
    </div>
  );
}

function AddSymbolControl({ watchlistId }: { watchlistId: string }): JSX.Element {
  return (
    <SymbolSearch
      actionLabel="Add"
      label="Find a symbol"
      onPick={async (symbol: SymbolMeta) => {
        await fetch(`/api/watchlists/${watchlistId}/items`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ symbol: symbol.ref }),
        });
      }}
    />
  );
}
