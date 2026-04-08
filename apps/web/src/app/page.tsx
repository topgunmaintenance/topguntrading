import Link from "next/link";
import { Button } from "@topgun/ui";

export default function LandingPage(): JSX.Element {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="font-mono text-sm uppercase tracking-[0.3em] text-text-primary"
        >
          TopGun Trading
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            Log in
          </Link>
          <Link href="/signup">
            <Button variant="primary" size="sm">
              Request access
            </Button>
          </Link>
        </nav>
      </header>

      <section className="flex flex-1 flex-col justify-center gap-6 py-20">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent-primary">
          Phase 2 preview
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-text-primary sm:text-5xl">
          A disciplined workspace for traders who are trying to get serious.
        </h1>
        <p className="max-w-2xl text-base text-text-secondary">
          Observe. Practice. Journal. Review. TopGun Trading is built for analysis,
          replay, and AI-assisted trade review — not hype, signals, or guaranteed
          returns. This is a craft tool.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/signup">
            <Button variant="primary" size="lg">
              Create an account
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" size="lg">
              I already have one
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border-subtle pt-6 text-xs text-text-muted">
        <p>
          TopGun Trading is software for analysis, practice, and journaling. It is
          not investment advice. It does not execute trades. Past performance,
          replays, and simulations do not predict future results. All trading
          carries risk of loss.
        </p>
      </footer>
    </main>
  );
}
