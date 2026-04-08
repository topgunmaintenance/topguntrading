import { loadEnv } from "@topgun/config";
import { z } from "zod";

/**
 * Web env. Public values are prefixed `NEXT_PUBLIC_` and are safe to
 * ship to the browser. Private values (AUTH_SECRET etc.) are used only
 * inside server-side route handlers — they must never leak to the
 * client bundle.
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  /** Base URL the server-side route handlers use to reach the API. */
  API_INTERNAL_URL: z.string().url().default("http://localhost:4000"),
});

export const env = loadEnv(EnvSchema);
export type WebEnv = typeof env;
