import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@topgun/ui";
import { getCurrentUser } from "@/lib/session";

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
          Phase 2 shell. Workspaces, watchlists, charts, journal, and replay
          land in later phases — see <code>docs/roadmap.md</code>.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Watchlists</CardTitle>
            <CardDescription>Phase 3</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-muted">
              Live quote streaming and custom lists arrive with the market data
              layer.
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
        <Card>
          <CardHeader>
            <CardTitle>AI copilot</CardTitle>
            <CardDescription>Phase 5</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-muted">
              Versioned prompts. Bounded surfaces. Never frames output as
              advice.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
