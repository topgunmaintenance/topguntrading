# @topgun/web

Next.js 14 (App Router) marketing site + authenticated app shell.
Phase 2 skeleton: landing page, signup, login, dashboard, and
server-side route handlers that proxy auth to `@topgun/api` and set
HTTP-only cookies.

## Routes

| Path              | Purpose                                                      |
|-------------------|--------------------------------------------------------------|
| `/`               | Marketing landing page (public)                              |
| `/login`          | Login form (public, redirects signed-in users to /dashboard) |
| `/signup`         | Signup form (public, same redirect behavior)                 |
| `/dashboard`      | Authenticated app shell with Phase 3+ placeholders           |
| `/api/auth/signup`| Route handler → POST `@topgun/api` `/auth/signup`            |
| `/api/auth/login` | Route handler → POST `@topgun/api` `/auth/login`             |
| `/api/auth/logout`| Route handler → POST `@topgun/api` `/auth/logout`            |
| `/api/auth/refresh`| Route handler → POST `@topgun/api` `/auth/refresh`          |
| `/api/auth/me`    | Route handler → GET `@topgun/api` `/auth/me`                 |

## Auth model

- The browser never sees access or refresh tokens. Both are set as
  HTTP-only, SameSite=Lax cookies by the web's own route handlers.
- `getCurrentUser()` (server-only) calls `@topgun/api` `/auth/me` using
  the stored access token and returns the public user shape.
- The `(app)` layout redirects unauthenticated users to `/login`.
- The `(auth)` layout redirects authenticated users to `/dashboard`.

## Env

```
NEXT_PUBLIC_APP_URL=http://localhost:3000   # public
API_INTERNAL_URL=http://localhost:4000      # server-only, how the web reaches the API
```

See `.env.example` at the repo root.

## Local development

```bash
# 1. bring up Postgres/Redis/mailhog
docker compose -f infra/docker/docker-compose.yml up -d

# 2. generate Prisma client and apply the initial migration
pnpm --filter @topgun/api prisma:generate
pnpm --filter @topgun/api prisma:migrate:deploy

# 3. run the API
pnpm --filter @topgun/api dev

# 4. in another terminal, run the web
pnpm --filter @topgun/web dev
```

Open http://localhost:3000.

## Tests

```bash
pnpm --filter @topgun/web test
```

## Owner

Frontend Lead — see `agents/frontend-lead.md`.
