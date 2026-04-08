# scripts

Repo automation and developer tooling for TopGun Trading.

## `bootstrap`

One-command local setup. Re-runnable.

```bash
pnpm bootstrap
# or: bash scripts/bootstrap
```

It will:

1. check for `pnpm` and `docker`
2. `pnpm install`
3. bring up `postgres` / `redis` / `mailhog` via
   `infra/docker/docker-compose.yml`
4. wait for Postgres to accept connections
5. copy `.env.example` → `.env` if missing
6. build `@topgun/config` and `@topgun/types` (required by the API)
7. `prisma generate`
8. `prisma migrate deploy` (applies the committed `0001_init`
   migration)

After it finishes, you can start the stack:

```bash
pnpm dev:api   # NestJS on :4000
pnpm dev:web   # Next.js on :3000
```

## Later scripts

As the project grows:

- `db:reset` — drop and recreate the local dev database
- `db:seed` — seed dev data
- `gen:types` — regenerate generated types from the Prisma schema
- repo-wide formatters / linters beyond `pnpm format`

## Owner

DevOps — see `agents/devops.md`.
