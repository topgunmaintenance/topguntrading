/**
 * TopGun Trading — env loader.
 *
 * A thin wrapper around `process.env` that validates values against a
 * zod schema. Throws a readable error at startup if anything required
 * is missing. Every app imports this and supplies its own schema.
 */
import { z } from "zod";
export type EnvSource = Record<string, string | undefined>;
export declare function loadEnv<T extends z.ZodTypeAny>(schema: T, source?: EnvSource): z.infer<T>;
//# sourceMappingURL=env.d.ts.map