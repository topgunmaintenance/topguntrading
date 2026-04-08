import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SymbolRefSchema } from "@topgun/types";
import { getCurrentUser } from "@/lib/session";
import { marketDataClient } from "@/lib/market-data-client";
import { ApiCallError } from "@/lib/api-client";
import { env } from "@/lib/env";
import { ChartCanvas } from "@/components/chart-canvas";

async function forwardedCookie(): Promise<string> {
  return headers().get("cookie") ?? "";
}

export default async function ChartWorkspacePage({
  params,
}: {
  params: { symbolRef: string };
}): Promise<JSX.Element> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const decoded = decodeURIComponent(params.symbolRef);
  const parsed = SymbolRefSchema.safeParse(decoded);
  if (!parsed.success) notFound();
  const symbolRef = parsed.data;

  const cookie = await forwardedCookie();

  try {
    const [symbol, candles, attribution] = await Promise.all([
      marketDataClient.getSymbol(symbolRef, cookie),
      marketDataClient.getCandles(
        { symbol: symbolRef, interval: "1h", limit: 300 },
        cookie,
      ),
      marketDataClient.attribution(cookie),
    ]);

    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <Link
          href="/watchlists"
          className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted hover:text-text-primary"
        >
          ← Watchlists
        </Link>
        <ChartCanvas
          symbolRef={symbolRef}
          symbolLabel={`${symbol.displayName} — ${symbol.providerSymbol}`}
          initialInterval="1h"
          initialCandles={candles}
          wsUrl={env.NEXT_PUBLIC_WS_URL}
          providerSimulated={attribution.simulated}
        />
        <p className="text-[11px] text-text-muted">
          {attribution.simulated
            ? "Simulated data — not real market prices."
            : `${attribution.label}.`}{" "}
          This is not investment advice.
        </p>
      </div>
    );
  } catch (error) {
    if (error instanceof ApiCallError && error.status === 404) notFound();
    throw error;
  }
}
