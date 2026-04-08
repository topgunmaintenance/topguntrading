import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@topgun/ui";
import { getCurrentUser } from "@/lib/session";
import { watchlistsClient } from "@/lib/watchlists-client";
import { marketDataClient } from "@/lib/market-data-client";

async function forwardedCookie(): Promise<string> {
  return headers().get("cookie") ?? "";
}

export default async function WatchlistsPage(): Promise<JSX.Element> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const cookie = await forwardedCookie();
  const [watchlists, attribution] = await Promise.all([
    watchlistsClient.list(cookie),
    marketDataClient.attribution(cookie),
  ]);

  if (watchlists.length === 0) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="flex flex-col gap-1">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-text-secondary">
            Watchlists
          </p>
          <h1 className="text-2xl font-semibold text-text-primary">
            Start with your first list
          </h1>
          <p className="text-sm text-text-secondary">
            Watchlists group symbols you want to observe. Click "Create"
            below, add your first symbol, then open a chart.
          </p>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Create a watchlist</CardTitle>
            <CardDescription>You can rename or delete it later.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action="/api/watchlists" method="post" className="flex gap-3">
              <input
                type="text"
                name="name"
                placeholder="Crypto majors"
                required
                className="flex h-10 w-full rounded-md border border-border-subtle bg-bg-sunken px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:border-accent-primary focus-visible:outline-none"
              />
              <button
                type="submit"
                className="inline-flex h-10 items-center rounded-md bg-accent-primary px-4 text-sm font-medium text-bg-base hover:bg-accent-primary/90"
              >
                Create
              </button>
            </form>
          </CardContent>
        </Card>
        <p className="text-[11px] text-text-muted">
          {attribution.simulated
            ? "Simulated data — not real market prices."
            : `${attribution.label}.`}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-text-secondary">
            Watchlists
          </p>
          <h1 className="text-2xl font-semibold text-text-primary">
            Your lists
          </h1>
        </div>
        <form action="/api/watchlists" method="post" className="flex gap-2">
          <input
            type="text"
            name="name"
            placeholder="New list"
            required
            className="h-9 w-48 rounded-md border border-border-subtle bg-bg-sunken px-3 text-sm text-text-primary placeholder:text-text-muted"
          />
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-md bg-accent-primary px-3 text-xs font-medium text-bg-base hover:bg-accent-primary/90"
          >
            Create
          </button>
        </form>
      </header>

      <ul className="grid gap-4 md:grid-cols-2">
        {watchlists.map((wl) => (
          <li key={wl.id}>
            <Link href={`/watchlists/${wl.id}`} className="block">
              <Card className="transition-colors hover:border-border-strong">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{wl.name}</span>
                    {wl.isDefault && (
                      <span className="rounded-full border border-border-subtle px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-muted">
                        default
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {wl.items.length} {wl.items.length === 1 ? "symbol" : "symbols"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-wrap gap-2">
                    {wl.items.slice(0, 5).map((item) => (
                      <li
                        key={item.id}
                        className="rounded-full border border-border-subtle px-2 py-0.5 font-mono text-xs text-text-secondary"
                      >
                        {item.symbol.providerSymbol}
                      </li>
                    ))}
                    {wl.items.length > 5 && (
                      <li className="text-xs text-text-muted">
                        +{wl.items.length - 5} more
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>

      <p className="text-[11px] text-text-muted">
        {attribution.simulated
          ? "Simulated data — not real market prices."
          : `${attribution.label}.`}
      </p>
    </div>
  );
}
