import Link from "next/link";
import type { User } from "@topgun/types";
import { Button } from "@topgun/ui";

export function AppNav({ user }: { user: User }): JSX.Element {
  return (
    <header className="flex items-center justify-between border-b border-border-subtle bg-bg-raised px-6 py-4">
      <div className="flex items-center gap-6">
        <Link
          href="/dashboard"
          className="font-mono text-xs uppercase tracking-[0.3em] text-text-primary"
        >
          TopGun Trading
        </Link>
        <nav className="flex items-center gap-4 text-sm text-text-secondary">
          <Link className="hover:text-text-primary" href="/dashboard">
            Dashboard
          </Link>
          <Link className="hover:text-text-primary" href="/watchlists">
            Watchlists
          </Link>
          <span className="cursor-not-allowed text-text-muted">Journal</span>
          <span className="cursor-not-allowed text-text-muted">Replay</span>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-text-muted">{user.email}</span>
        <form action="/api/auth/logout" method="post">
          <Button type="submit" variant="ghost" size="sm">
            Log out
          </Button>
        </form>
      </div>
    </header>
  );
}
