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
- **ADR-0017 (Proposed):** Whether OpenTelemetry ships in Phase 2 or
  Phase 6
- **ADR-0018 (Proposed):** Firefox build of the extension
- **ADR-0019 (Proposed):** Whether to add `turborepo` in Phase 2

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
