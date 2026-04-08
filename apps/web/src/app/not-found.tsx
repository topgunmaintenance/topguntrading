import Link from "next/link";
import { Button } from "@topgun/ui";

export default function NotFound(): JSX.Element {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-start justify-center gap-6 px-6 py-10">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent-primary">
        404
      </p>
      <h1 className="text-3xl font-semibold text-text-primary">
        Target not on this bearing.
      </h1>
      <p className="text-text-secondary">The page you asked for does not exist.</p>
      <Link href="/">
        <Button variant="secondary" size="md">
          Return home
        </Button>
      </Link>
    </main>
  );
}
