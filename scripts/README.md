# scripts

Repo automation and developer tooling for TopGun Trading.

> **Phase 1 placeholder.** No real scripts yet. The first scripts land
> in Phase 2 (workspace bootstrap, db reset, dev seed).

## Phase 2 plan

- `bootstrap` — install deps, build shared packages, run initial
  migrations, seed dev data
- `db:reset` — drop and recreate the local Postgres dev database
- `db:migrate` — apply Prisma migrations
- `db:seed` — seed dev data
- `gen:types` — regenerate generated types from the Prisma schema
- `lint:all`, `typecheck:all`, `test:all` — repo-wide convenience runners

## Owner

DevOps — see `agents/devops.md`.
