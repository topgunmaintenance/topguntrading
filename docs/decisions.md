# Decisions Log

This is the architecture decision record (ADR) for TopGun Trading. Each
decision is small, dated, and either **Accepted**, **Proposed**, or
**Superseded**. We add to this file rather than rewriting history.

Format:

```
## ADR-NNNN: title
Status: Accepted | Proposed | Superseded
Date: YYYY-MM-DD
Context: ...
Decision: ...
Consequences: ...
```

---

## ADR-0001: Monorepo with pnpm workspaces
Status: Accepted
Date: 2026-04-08
Context: Web, API, extension, and worker share types, schemas, and UI
primitives. Splitting into multiple repos would force version drift and
slow iteration.
Decision: Single monorepo using pnpm workspaces with `apps/*` and
`packages/*`.
Consequences: We commit to a TypeScript-first stack and a single CI
pipeline. Tooling (turborepo or nx) may be added in Phase 2 if build
times warrant it.

## ADR-0002: NestJS over FastAPI for the API
Status: Accepted
Date: 2026-04-08
Context: A TypeScript-only stack lets us share zod schemas and types
between web, API, extension, and worker. NestJS provides battle-tested
modules, DI, guards, and WebSocket gateways.
Decision: Use NestJS for `apps/api`.
Consequences: Backend engineers must be comfortable with TypeScript and
Nest's idioms. We forgo Python-side ML libraries inside the API; ML
batch work, if any, will live in a separate worker.

## ADR-0003: PostgreSQL as the primary database
Status: Accepted
Date: 2026-04-08
Context: Relational data dominates the model (users, journals, trades,
rules, alerts, sessions). We need transactions and joins.
Decision: PostgreSQL via Prisma.
Consequences: We get a boring, correct default. Time-series storage for
candles will use Postgres partitioning to start; we may revisit if
volume forces a dedicated time-series store.

## ADR-0004: Redis for cache, pubsub, and queues
Status: Accepted
Date: 2026-04-08
Context: We need a hot store for quotes, a pubsub for realtime fan-out,
and a queue for background jobs.
Decision: Redis covers all three via BullMQ for queues.
Consequences: One operational dependency to learn well rather than
three. Redis becomes a critical service and must be sized accordingly.

## ADR-0005: Provider-agnostic market data layer
Status: Accepted
Date: 2026-04-08
Context: We will not bind the product to a single market data vendor.
Vendor terms, pricing, and coverage change.
Decision: All market data flows through `packages/market-data` adapters
implementing a stable interface.
Consequences: Slightly more upfront design work. Major upside on
flexibility, compliance, and pricing leverage.

## ADR-0006: Default AI provider is Anthropic Claude
Status: Accepted
Date: 2026-04-08
Context: Phase 5 AI features need a strong general model with structured
output and tool use.
Decision: Default to Anthropic Claude via the official SDK, behind an
abstraction in `packages/ai-prompts`.
Consequences: We adopt the latest Claude models. Other providers can be
swapped in per feature.

## ADR-0007: Dark theme first
Status: Accepted
Date: 2026-04-08
Context: The product is positioned as a premium, professional workspace.
Decision: Phase 1–2 ships dark theme only. Tokens are designed with a
future light variant in mind.
Consequences: Designers do not split focus. Light theme arrives later
without a redesign.

## ADR-0008: Lock-forward replay enforcement is server-side
Status: Accepted
Date: 2026-04-08
Context: Replay quality depends on never leaking future data. Client-
side enforcement is too easy to bypass and too easy to break by accident.
Decision: The replay channel only emits frames at or before the cursor.
Indicators are computed server-side from past data only.
Consequences: Slightly more server cost. Strong correctness guarantee.

## ADR-0017: OpenTelemetry deferred to Phase 6
Status: Accepted
Date: 2026-04-08
Context: Phase 2 brings the API and web skeletons online. Adding the
full OpenTelemetry pipeline now would burn scope without payoff — we
have nothing to trace yet beyond one auth flow.
Decision: Keep observability to structured logs + health endpoints in
Phase 2. Full OpenTelemetry lands in Phase 6 alongside alerts and the
observability track.
Consequences: Defer OTEL dependencies and exporters. Log schema is
designed so traces can be joined later without rewrites.

## ADR-0019: No Turborepo in Phase 2
Status: Accepted
Date: 2026-04-08
Context: Turborepo would accelerate repeat builds, but the workspace
is small (2 apps, 7 packages) and `pnpm -r` already runs in topological
order. The additional tool surface is not worth it yet.
Decision: Use `pnpm -r` directly. Revisit in Phase 4+ if build times
become painful.
Consequences: No remote caching. Incremental rebuilds rely on tsc
`incremental` output. Simpler mental model.

## ADR-0020: Shared packages are built CommonJS
Status: Accepted
Date: 2026-04-08
Context: `apps/api` is NestJS on CommonJS. Node cannot synchronously
`require()` an ESM module. If the shared packages shipped as ESM, the
API could not consume them.
Decision: `@topgun/config` and `@topgun/types` emit CommonJS to `dist/`.
Both apps consume them via the built dist at runtime. `@topgun/ui`
stays source-only (React/TSX) because it is only consumed by Next.js,
which transpiles it via `transpilePackages`. Typecheck and tests
bypass the dist via tsconfig `paths` and Vitest `resolve.alias`
pointing at source, so `pnpm lint|typecheck|test` work without a
prior build.
Consequences: `pnpm dev:api` and `pnpm dev:web` require a prior build
of the two shared CommonJS packages. The `scripts/bootstrap` script
does this automatically. When actively iterating on shared packages,
run `pnpm --filter @topgun/config build` (and the same for types)
between edits.

---

## Open decisions (Proposed)

The following are tracked but not yet decided:

- **ADR-0009 (Proposed):** Final equities market data provider for Phase 3
- **ADR-0010 (Proposed):** Initial crypto exchanges for Phase 3
- **ADR-0011 (Proposed):** Container platform for production (Fly.io,
  Render, ECS, Kubernetes)
- **ADR-0012 (Proposed):** Error tracker (Sentry vs. self-hosted)
- **ADR-0013 (Proposed):** Vector store strategy (`pgvector` vs. external)
- **ADR-0014 (Proposed):** Final accent color (afterburner orange vs.
  ice white vs. radar green)
- **ADR-0015 (Proposed):** License choice (see top-level `LICENSE`)
- **ADR-0016 (Proposed):** "Bring your own key" mode for AI
- **ADR-0018 (Proposed):** Firefox build of the extension

ADR-0017 (OpenTelemetry timing) and ADR-0019 (Turborepo) are now
**Accepted** — see above.
ADR-0020 (CommonJS shared packages) is new and **Accepted** — see
above.

These move to **Accepted** when the relevant phase begins and a
decision is made.

---

## Phase 1 self-audit
Date: 2026-04-08
Performed by: Claude Code, wearing each agent role in turn.

Phase 1 exit criteria from `docs/roadmap.md`:

- [x] All required `docs/*.md` files exist and are written, not stubs.
- [x] All required `agents/*.md` files exist and are written.
- [x] Repo governance files (`.gitignore`, `.editorconfig`,
      `.env.example`, `LICENSE`, `CONTRIBUTING.md`,
      `CODE_OF_CONDUCT.md`, `SECURITY.md`, PR template, issue
      templates, `docs/working-rules.md`) are in place.
- [x] Monorepo scaffolding for `apps/*`, `packages/*`, `infra/*`,
      `scripts/*` exists with placeholder shell files clearly labeled.
- [x] Phase 1 self-audit recorded here.

Audit checks:

- **Missing files:** none. All required docs, agents, and governance
  files present.
- **Cross-reference integrity:** every `docs/*.md` and `agents/*.md`
  reference resolves to a real file. Verified by repo-wide grep.
- **Placeholder labeling:** every scaffolded source file
  (`apps/*/src/placeholder.ts`, `packages/*/src/index.ts`) starts with
  a header naming Phase 1 and the phase that will replace it. Every
  scaffolded `package.json` script emits a Phase 1 placeholder
  warning. The `LICENSE` file is explicitly marked PLACEHOLDER and
  references ADR-0015.
- **Duplicated responsibilities:** reviewed each agent file. The
  potentially-overlapping pairs (architect ↔ product-manager,
  backend-lead ↔ data-engineer, frontend-lead ↔ designer,
  qa-lead ↔ each lead, security-reviewer ↔ devops, docs-owner ↔
  product-manager) all have clear, non-overlapping responsibility
  statements. The `apps/worker/README.md` explicitly co-owns worker
  jobs between Backend Lead and Data Engineer.
- **Architecture coherence:** the diagram in `docs/architecture.md`
  matches the package and app layout one-to-one.
- **Phase discipline:** no Phase 2+ logic was implemented. Every
  package's `src/index.ts` only exports a phase marker.
- **Hallucinated integrations:** none. No client SDKs are imported.
  No URLs are configured. No DB schema exists. The only placeholder
  values in `.env.example` are documented and intentional.
- **Compliance posture:** disclaimers are described in
  `docs/compliance.md` and required slot is mentioned in
  `docs/design-system.md`, `agents/designer.md`, and
  `agents/ai-orchestrator.md`.
- **Security posture:** auth, secrets, input validation, and the
  threat model are documented in `docs/security.md` and reinforced
  in `agents/security-reviewer.md` and `agents/backend-lead.md`.

Findings fixed during audit:

- Added this self-audit record (this section).
- Added `.nvmrc` to pin Node version for onboarding.

Remaining open items (intentionally deferred to later phases):

- ADR-0009 through ADR-0019 in this document remain Proposed.
- No CI workflow exists yet — Phase 2.
- No Prisma schema exists yet — Phase 2.
- No real adapter or chart code exists yet — Phase 3.

Conclusion: **Phase 1 exit criteria met.** Phase 2 may begin upon
explicit approval from the project owner.

---

## Phase 2 self-audit
Date: 2026-04-08
Performed by: Claude Code, wearing each agent role in turn.

Phase 2 exit criteria from `docs/roadmap.md`:

- [x] pnpm workspace wired up
- [x] `apps/web` runs locally (landing, auth, dashboard) via
      `pnpm dev:web`
- [x] `apps/api` runs locally (health, auth, user endpoints) via
      `pnpm dev:api`
- [x] Postgres + Redis up via `infra/docker/docker-compose.yml` and a
      one-command bootstrap
- [x] Shared `@topgun/types` and `@topgun/config` consumed by both apps
- [x] CI scripts exist (`pnpm lint` / `typecheck` / `test` / `build`)
      — a hosted CI runner is Phase 6
- [x] Initial design system primitives in `@topgun/ui` (Button, Input,
      Label, Card, plus the `cn` helper and token module)

### What is complete

**`@topgun/config`** — Shared `tsconfig/{base,node,nextjs,react}.json`,
flat ESLint configs (`base`, `node`, `react`), Prettier config,
zod-backed `loadEnv` helper. Built CommonJS. Consumed by every other
workspace package.

**`@topgun/types`** — Real zod schemas for `User`, `Session`,
`Workspace`, `SignupRequest`, `LoginRequest`, `TokenPair`,
`AuthResponse`, `JwtPayload`, plus `ApiError` and `ACCESS_TOKEN_COOKIE`
/ `REFRESH_TOKEN_COOKIE` constants. Built CommonJS. Tests passing
under Vitest. Consumed by both apps.

**`@topgun/ui`** — `cn` merge helper, design `tokens`, `Button` (with
`cva` variants), `Input`, `Label`, and `Card*` primitives. Vitest +
Testing Library setup with a working `Button` test. Source-only
consumption via Next.js `transpilePackages`.

**`@topgun/api`** — NestJS bootstrap with `cookie-parser` and a
`HttpErrorFilter` that normalizes to the shared `ApiError` shape.
Prisma schema + initial migration for `users`, `sessions`,
`workspaces`. `HealthController` with `/healthz` and `/readyz`.
Auth module: `/auth/signup`, `/auth/login`, `/auth/refresh`,
`/auth/logout`, `/auth/me`. `AuthService` uses Argon2id for passwords,
HS256 JWTs for access tokens, and 48-byte refresh tokens stored as
SHA-256 hashes in the `sessions` table with rotation on every
refresh. `AuthGuard` accepts either a `Bearer` header or the
`tg_access` HTTP-only cookie. `UsersService` + `UsersController`
expose `/users/me`. `WorkspacesService` provides a
`getOrCreateDefault` stub (no controller until Phase 3). Tests cover
the password service, token service, and auth service happy + sad
paths using a hand-rolled Prisma mock — no database required.

**`@topgun/web`** — Next.js 14 App Router with a dark `globals.css`,
tokens mirrored into Tailwind, a premium landing page, `(auth)` route
group with `login` and `signup` server pages, `(app)` route group
with an authenticated `dashboard` and a logout-capable `AppNav`.
Route handlers under `src/app/api/auth/*` proxy signup / login /
refresh / logout / me to the API and set the `tg_access` and
`tg_refresh` cookies as HTTP-only. `(app)/layout.tsx` redirects
unauthenticated users to `/login`; `(auth)/layout.tsx` redirects
authenticated users to `/dashboard`. `not-found.tsx` matches the
brand voice. A small Vitest smoke test covers `ApiCallError`.

**Root** — `pnpm bootstrap`, `pnpm build`, `pnpm lint`, `pnpm typecheck`,
`pnpm test`, `pnpm format`, `pnpm dev:api`, `pnpm dev:web`. Root ESLint
flat config, Prettier re-export, `.prettierignore`, `.nvmrc`.
`scripts/bootstrap` performs the whole install-to-migration path.

### What is still placeholder

- `apps/worker` — Phase 1 placeholder (no real code)
- `apps/extension` — Phase 1 placeholder (no real code)
- `packages/market-data` — Phase 1 placeholder (contract lands Phase 3)
- `packages/charting` — Phase 1 placeholder (lands Phase 3)
- `packages/ai-prompts` — Phase 1 placeholder (lands Phase 5)
- `packages/trading-rules` — Phase 1 placeholder (lands Phase 4/5)
- OAuth providers in `.env.example` (Phase 6)
- Mail sending (Phase 4+)
- Object storage (Phase 4+)
- Sentry / OTEL wiring (Phase 6)
- No hosted CI runner yet; scripts exist but `.github/workflows/` is
  empty

### Audit checks run

- **Cross-references:** repo-wide grep confirms no `tsconfig.base.json`
  references survive the move into `@topgun/config/tsconfig/`.
- **ESM / CJS boundaries:** `@topgun/config` and `@topgun/types`
  source files contain no `.js` extensions in imports; both emit
  CommonJS. `@topgun/ui` keeps `.js` extensions because it uses
  `moduleResolution: Bundler` and is consumed via Next.js
  `transpilePackages`. `apps/api` sources contain no `.js`
  extensions.
- **Import cycles:** none introduced. `@topgun/api` imports only from
  `@topgun/config` and `@topgun/types`. `@topgun/web` imports from
  `@topgun/config`, `@topgun/types`, and `@topgun/ui`.
- **Auth contract drift:** web route handlers, API controllers, and
  Vitest tests all import `SignupRequestSchema` / `LoginRequestSchema`
  / cookie constants from `@topgun/types`. There is no parallel
  definition anywhere in the repo.
- **Placeholder labeling:** every remaining Phase 1 placeholder file
  still carries its `Phase 1 placeholder` header. No un-labeled
  scaffolds remain.
- **Compliance:** the landing page, the `(auth)` layout, and the
  dashboard all render the non-advice disclaimer copy.
- **Security:** passwords hashed with Argon2id; refresh tokens
  SHA-256'd in DB with rotation; cookies are `httpOnly` +
  `sameSite: "lax"` + `secure` in production; API validates every
  body with zod; `AuthGuard` applies to protected routes.
- **Lint/typecheck/test/build scripts** exist on every active
  package. Phase-1 placeholder packages still use `echo` scripts that
  exit 0.

### Findings fixed during the audit

- Initial shared packages were ESM (`"type": "module"`); the NestJS
  API could not `require()` them synchronously. Flipped both to
  CommonJS and stripped `.js` extensions from their source imports.
  Codified as ADR-0020.
- `@topgun/config` devDependencies (`@eslint/js`, `typescript-eslint`,
  `globals`) had to be promoted to `dependencies` so consumer packages
  can load the flat ESLint configs.
- `apps/web` `package.json` originally depended on
  `eslint-config-next` and used `next lint`, which does not cleanly
  support ESLint 9 flat config. Replaced with `eslint src
  --max-warnings=0` so it matches the rest of the workspace.
- `apps/api/tsconfig.json` initially declared `rootDir: src` while
  including `test/**/*.ts`, which tsc rejects. Split into
  `tsconfig.json` (typecheck, no `rootDir`, includes src + test) and
  `tsconfig.build.json` (build, `rootDir: src`, excludes tests).
- Added `apps/api/tsconfig.json` `paths` and `apps/api/vitest.config.ts`
  `resolve.alias` for `@topgun/config` + `@topgun/types` so typecheck
  and tests work without a prior build of the shared packages.
- Added `postinstall: "prisma generate || true"` to `apps/api` so the
  Prisma client is ready immediately after `pnpm install`.
- `.env.example` updated to replace the now-unused
  `NEXT_PUBLIC_API_URL` with the server-only `API_INTERNAL_URL` the
  web actually reads.

### Remaining open items (deferred to Phase 3+)

- Hosted CI workflow file(s) in `.github/workflows/`
- Worker and extension build pipelines
- Market data adapters, chart workspace, journal, replay, patterns,
  AI, alerts, billing

Conclusion: **Phase 2 exit criteria met.** Phase 3 may begin upon
explicit approval from the project owner.
