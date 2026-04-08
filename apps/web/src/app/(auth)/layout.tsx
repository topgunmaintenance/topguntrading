import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}): Promise<JSX.Element> {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-10">
      <Link
        href="/"
        className="font-mono text-xs uppercase tracking-[0.3em] text-text-secondary"
      >
        ← TopGun Trading
      </Link>
      {children}
      <p className="text-xs leading-relaxed text-text-muted">
        TopGun Trading is software for analysis, practice, and journaling. It is
        not investment advice. By creating an account you acknowledge that
        trading carries risk of loss.
      </p>
    </main>
  );
}
