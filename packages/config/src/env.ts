/**
 * TopGun Trading — env loader.
 *
 * A thin wrapper around `process.env` that validates values against a
 * zod schema. Throws a readable error at startup if anything required
 * is missing. Every app imports this and supplies its own schema.
 */
import { z, type ZodType } from "zod";

export type EnvSource = Record<string, string | undefined>;

export function loadEnv<T>(schema: ZodType<T>, source: EnvSource = process.env): T {
  const result = schema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `TopGun Trading — invalid environment:\n${issues}\n\n` +
        `Fix the reported variables in your .env file (see .env.example at the repo root).`,
    );
  }
  return result.data;
}
