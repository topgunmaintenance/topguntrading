import Link from "next/link";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@topgun/ui";
import { getCurrentUser } from "@/lib/session";
import { WhaleActivityCard } from "@/components/dashboard/whale-activity-card";

export default async function DashboardPage(): Promise<JSX.Element> {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-text-secondary">
          Dashboard
        </p>
        <h1 className="text-2xl font-semibold text-text-primary">
          Welcome{user?.displayName ? `, ${user.displayName}` : ""}.
        </h1>
        <p className="text-sm text-text-secondary">
          Phase 3 ships watchlists, live quotes, and the chart workspace. Phase
          3.5 adds observational edge signals — see{" "}
          <code>docs/roadmap.md</code>.
        </p>
      </header>

      <WhaleActivityCard />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Watchlists</CardTitle>
            <CardDescription>Live — Phase 3</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-text-muted">
              Build watchlists, stream live quotes, and jump into the chart
              workspace.
            </p>
            <Link href="/watchlists">
              <Button variant="primary" size="sm">
                Open watchlists
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Chart workspace</CardTitle>
            <CardDescription>Live — Phase 3</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-muted">
              Open a chart from any watchlist row. Candlesticks, timeframe
              switching, and a live quote ribbon.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Journal</CardTitle>
            <CardDescription>Phase 4</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-muted">
              Frictionless capture with chart context and AI review.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Replay</CardTitle>
            <CardDescription>Phase 4</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-muted">
              Bar-accurate historical playback with lock-forward enforcement.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
