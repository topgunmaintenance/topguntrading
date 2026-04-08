# @topgun/web

Next.js 14 (App Router) marketing site + authenticated app shell.
Phase 3 adds watchlists with live quotes and the chart workspace on
top of the Phase 2 auth shell.

## Routes

| Path                               | Purpose                                             |
|------------------------------------|-----------------------------------------------------|
| `/`                                | Marketing landing (public)                          |
| `/login`                           | Login                                               |
| `/signup`                          | Signup                                              |
| `/dashboard`                       | App shell dashboard                                 |
| `/watchlists`                      | List of the user's watchlists                       |
| `/watchlists/[id]`                 | Watchlist detail with live quotes                   |
| `/chart/[symbolRef]`               | Chart workspace for one symbol                      |
| `/api/auth/signup` etc.            | Auth proxy to `@topgun/api`                         |
| `/api/market-data/symbols`         | Symbol search proxy                                 |
| `/api/market-data/candles`         | Candle fetch proxy                                  |
| `/api/watchlists`                  | Watchlist list / create                             |
| `/api/watchlists/[id]`             | Watchlist get / update / delete                     |
| `/api/watchlists/[id]/items`       | Add an item                                         |
| `/api/watchlists/[id]/items/[itemId]` | Delete an item                                   |

The browser subscribes to live quotes over WebSocket at
`NEXT_PUBLIC_WS_URL` (defaults to `ws://localhost:4000/stream`) using
the `tg_access` HTTP-only cookie for auth.

## Auth model

- The browser never sees access or refresh tokens. Both are set as
  HTTP-only, SameSite=Lax cookies by the web's own route handlers.
- `getCurrentUser()` (server-only) calls `@topgun/api` `/auth/me` using
  the stored access token and returns the public user shape.
- The `(app)` layout redirects unauthenticated users to `/login`.
- The `(auth)` layout redirects authenticated users to `/dashboard`.

## Env

```
NEXT_PUBLIC_APP_URL=http://localhost:3000          # public
API_INTERNAL_URL=http://localhost:4000             # server-only
NEXT_PUBLIC_WS_URL=ws://localhost:4000/stream      # browser → API WS
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
