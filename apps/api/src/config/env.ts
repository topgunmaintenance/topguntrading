import { loadEnv } from "@topgun/config";
import { z } from "zod";

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
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = loadEnv(EnvSchema);
