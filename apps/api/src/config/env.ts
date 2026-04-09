import * as fs from "node:fs";
import * as path from "node:path";
import { loadEnv } from "@topgun/config";
import { z } from "zod";

/**
 * Minimal .env loader. We intentionally avoid pulling in `dotenv` as
 * a direct dependency — this reads `apps/api/.env` (and `.env` at the
 * repo root as a fallback) and populates `process.env` for any keys
 * not already defined in the real environment. Quoted values, blank
 * lines, and `# comments` are supported.
 */
function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

// Load apps/api/.env first, then fall back to the repo-root .env.
loadEnvFile(path.resolve(__dirname, "../../.env"));
loadEnvFile(path.resolve(__dirname, "../../../../.env"));

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  API_PUBLIC_URL: z.string().url().default("http://localhost:4000"),

  /** Comma-separated list of allowed CORS origins. */
  API_CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),

  DATABASE_URL: z.string().url(),

  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters — generate with `openssl rand -base64 48`"),

  SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(60 * 15), // 15m
  REFRESH_TTL_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 24 * 30), // 30d

  // Market data (Phase 3)
  MARKET_DATA_PROVIDER: z.enum(["mock", "coinbase"]).default("mock"),
  MARKET_DATA_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(60),
  COINBASE_REST_URL: z.string().url().default("https://api.exchange.coinbase.com"),
  COINBASE_WS_URL: z.string().url().default("wss://advanced-trade-ws.coinbase.com"),

  // Phase 3.5 — Kraken public API (ADR-0026)
  // Enables the Whale Activity observational feature. Kraken is
  // unauthenticated public REST only — no credentials are sent.
  KRAKEN_REST_URL: z.string().url().default("https://api.kraken.com/0/public"),
  /** Default crypto pair the whale feed polls from. */
  WHALES_DEFAULT_SYMBOL: z
    .string()
    .regex(/^[a-z][a-z0-9_-]{1,19}:[A-Za-z0-9._/-]{1,32}$/)
    .default("kraken:XBTUSD"),
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = loadEnv(EnvSchema);
