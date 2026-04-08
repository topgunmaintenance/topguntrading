# @topgun/config

Shared `tsconfig`, `eslint`, `prettier`, and a runtime env helper.

Every app and package gets its standards from here. There is no
per-repo drift.

## Exports

- `@topgun/config/tsconfig/base.json` — strict base config
- `@topgun/config/tsconfig/node.json` — Node services (NestJS, worker)
- `@topgun/config/tsconfig/react.json` — React libraries (ui package)
- `@topgun/config/tsconfig/nextjs.json` — Next.js apps
- `@topgun/config/eslint/base` — base flat config (typescript-eslint)
- `@topgun/config/eslint/node` — Node overrides
- `@topgun/config/eslint/react` — browser globals for UI code
- `@topgun/config/prettier` — shared Prettier config
- `@topgun/config` (runtime) — `loadEnv(schema)` helper built on zod

## Usage

```ts
// apps/api/src/config/env.ts
import { loadEnv } from "@topgun/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
});

export const env = loadEnv(schema);
export type Env = typeof env;
```

## Owner

DevOps + Architect. See `agents/devops.md` and `agents/architect.md`.
