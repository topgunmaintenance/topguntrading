# @topgun/api

NestJS + Prisma + Postgres. Phase 2 skeleton: health endpoints, auth
foundation (email + password), users and workspaces wiring.

## Endpoints (Phase 2)

| Method | Path            | Auth | Purpose                                        |
|--------|-----------------|------|------------------------------------------------|
| GET    | `/healthz`      | none | Liveness                                       |
| GET    | `/readyz`       | none | Readiness (DB round-trip)                      |
| POST   | `/auth/signup`  | none | Create account + issue session                 |
| POST   | `/auth/login`   | none | Authenticate + issue session                   |
| POST   | `/auth/refresh` | cookie/body | Rotate refresh token + issue new access token |
| POST   | `/auth/logout`  | cookie/body | Revoke the current session                    |
| GET    | `/auth/me`      | access token | Return the authenticated user                  |
| GET    | `/users/me`     | access token | Same, behind the `users` module                 |

All non-2xx responses match the `ApiError` shape in `@topgun/types`.

## Auth details

- Passwords are hashed with **Argon2id** (`memoryCost` 64 MB,
  `timeCost` 3).
- Access tokens are **HS256 JWTs** signed with `AUTH_SECRET`. TTL
  defaults to 15 minutes.
- Refresh tokens are 48-byte random strings. We store a SHA-256 hash
  in the `sessions` table. Rotation happens on every refresh: the old
  session is revoked in the same transaction that creates the new one.
- The `AuthGuard` accepts the access token either as a
  `Bearer` header or as the `tg_access` HTTP-only cookie so the Next.js
  web app can use cookie-based auth end to end.

## Data model (Phase 2)

- `users` — id, email (unique), passwordHash, displayName, timestamps
- `sessions` — id, userId, refreshTokenHash (unique), userAgent,
  ipAddress, expiresAt, revokedAt, timestamps
- `workspaces` — id, userId, name, isDefault, timestamps

Schema: `prisma/schema.prisma`. Initial migration:
`prisma/migrations/20260408120000_init/migration.sql`.

## Local development

```bash
# From the repo root, bring up Postgres / Redis / mailhog
docker compose -f infra/docker/docker-compose.yml up -d

# Generate the Prisma client and apply the initial migration
pnpm --filter @topgun/api prisma:generate
pnpm --filter @topgun/api prisma:migrate:deploy

# Run the API in watch mode
pnpm --filter @topgun/api dev
```

## Tests

```bash
pnpm --filter @topgun/api test
```

Tests run under Vitest. They mock Prisma (no database required) and
exercise the password hashing, JWT round-trip, and the auth service
happy / sad paths.

## Owner

Backend Lead — see `agents/backend-lead.md`.
