# AGENTS.md — TopGun Trading Operating System

This file is the master operating system for any agent — including Claude
Code — working in the `topguntrading` repo. If you are an agent reading
this, treat it as binding. If you are a human reading this, treat it as
the contract you can hold any agent to.

> **Repo mission.** Build TopGun Trading as a premium, disciplined trading
> intelligence and practice platform. Documentation, architecture, and
> agent governance come *before* feature work. Phases are gated. Audits
> are mandatory.

---

## 1. Behavior contract (read first)

1. **Stay in this repo.** Do not read from, copy from, or rely on any
   other repository. No Dum-Club. No topgun-ai. No prior project files.
   This is a clean-room build.
2. **Plan before code.** Every non-trivial task gets a written plan first.
   For Claude Code: that means a TodoWrite list and a brief plan in chat.
3. **Phase discipline.** Do not implement features for a future phase in
   the current phase. The roadmap in `docs/roadmap.md` is binding.
4. **No broad refactors without justification.** Refactors require an
   ADR proposal in `docs/decisions.md` or, at minimum, a paragraph of
   justification in the PR.
5. **Audit before advancing.** No phase ends without a written audit.
   Audit findings get fixed before the phase is declared done.
6. **Label placeholders.** Anything that is a stub, scaffold, or mock
   gets a comment header that says so and names the phase that will
   wire it up.
7. **Do not invent integrations.** If a market data provider, broker, or
   AI provider is not actually wired up, do not claim it is. Do not write
   code that pretends to call an integration that does not exist.
8. **Do not store broker credentials.** Ever.
9. **Do not skip documentation.** Documentation is the deliverable. A
   feature without docs is not done.
10. **Report what you did, honestly.** Distinguish "scaffolded" from
    "implemented" from "tested" in your reports.

If a request from a user conflicts with these rules, pause and ask.

---

## 2. Repo posture

- **Language:** TypeScript first. Python only for narrow ML batch work
  inside `apps/worker` if and when justified.
- **Tooling:** pnpm workspaces, Docker Compose for local services.
- **Style:** dark, dense, professional. See
  [`docs/design-system.md`](docs/design-system.md).
- **Tone:** confident, calm, technical. Not boastful. Not cute.
- **Compliance:** strict. See [`docs/compliance.md`](docs/compliance.md).
- **Security:** strict. See [`docs/security.md`](docs/security.md).

---

## 3. Phase-by-phase discipline

The phase plan lives in [`docs/roadmap.md`](docs/roadmap.md). You may not
work outside the current phase without explicit approval from the user
who is operating this repo.

| Phase | Theme | What is in scope |
|-------|-------|-------------------|
| 1     | Foundation | Docs, agents, governance, scaffolding |
| 2     | Web shell + API skeleton | Real local stack, real auth |
| 3     | Market data + chart workspace | Real adapter, real charts |
| 4     | Journal + replay | Journal CRUD, replay engine |
| 5     | Pattern engine + AI + extension | Detectors, copilot, MV3 |
| 6     | Alerts + observability | Alerts, metrics, traces, errors |
| 7     | Billing + GA | Subscriptions, marketing polish, launch |

Phase exit criteria are in `docs/roadmap.md`. Don't fudge them.

---

## 4. How to plan a task

1. Restate the task in your own words.
2. Identify the target phase. If it isn't the current phase, stop and
   surface that.
3. List the files you expect to read.
4. List the files you expect to create or change.
5. Identify the agent role this task belongs to (see `agents/`).
6. State the success criteria.
7. State what would make you abandon the task.

For Claude Code, this plan goes in TodoWrite and a short message before
the first edit.

---

## 5. How to report what you did

After finishing a task, report in this shape:

- **Goal.** One sentence.
- **What I changed.** Bulleted file list with one-line reasons.
- **What I did *not* change.** Anything you intentionally left alone.
- **What is still placeholder.** Explicitly.
- **Risks.** Any risks the user should know about.
- **Next steps.** Concrete suggestions, not vague hopes.

Distinguish carefully:

- **Scaffolded** — files exist, structure is right, no real logic.
- **Implemented** — logic is real and runs locally.
- **Tested** — covered by automated tests that pass.
- **Verified** — manually exercised end to end.

Do not blur these. They mean different things.

---

## 6. How to mark placeholders

Every placeholder file starts with a header like this:

```ts
/**
 * TopGun Trading — Phase 1 placeholder.
 *
 * This module is a scaffold. It is intentionally minimal.
 * It will be implemented in Phase N — see docs/roadmap.md.
 */
```

For Markdown:

```md
> **Placeholder.** This document is a Phase 1 stub. It will be expanded
> in Phase N.
```

For SQL, Dockerfiles, configs: add a comment with the same intent.

If a function returns mock data, the function name or a comment must say
so.

---

## 7. How to avoid hallucinated integrations

- Never write code that imports a client SDK we have not added to
  `package.json`.
- Never write code that calls a URL we have not configured in
  `.env.example`.
- Never write code that pretends a database table exists when it does
  not.
- Never write tests that pass against fictional behavior.

If you need an integration that does not exist yet, scaffold the
abstraction (interface + a mock implementation) and add a backlog item.

---

## 8. How to avoid fake claims

- "Implemented" means implemented. Do not say it about a scaffold.
- "Tested" means there is a test that runs and passes.
- "Production-ready" is reserved for things that are actually
  production-ready.
- Screenshots, demo links, and examples must come from real running
  code.

---

## 9. How to keep work repo-local

- Do not read files outside `topguntrading`.
- Do not import code from outside this repo.
- Do not reference patterns, names, or architecture from prior projects.
- Do not create vendored copies of unrelated repos.
- If something seems to require external context, surface that to the
  user; do not invent it.

---

## 10. How to preserve architecture integrity

- Read `docs/architecture.md` before changing structural code.
- Adapter contracts (`@topgun/market-data`, `@topgun/charting`,
  `@topgun/ai-prompts`) are stable interfaces. Bypassing them is a
  red flag.
- Cross-package imports must be explicit and small.
- Shared types live in `@topgun/types` and only there.
- New top-level directories require an ADR.

---

## 11. Collaboration between agents

The roles in `agents/*.md` are not turf wars. They are for clarity. When
a task crosses boundaries:

1. The originating agent drafts the plan.
2. The agents whose areas are touched review the plan.
3. The product manager mediates if scope is unclear.
4. The architect mediates if structure is unclear.
5. The QA lead defines acceptance.
6. The security reviewer checks any change touching auth, secrets,
   inputs, or external surfaces.

In practice, when Claude Code is the only agent at the keyboard, *it
plays each role in turn* and explicitly names which role it is wearing
when it makes a decision.

---

## 12. The "do not" list

Do not:

- skip documentation
- skip the audit step
- jump phases
- invent broker access
- store broker credentials
- scrape private broker internals as a primary architecture
- claim live integrations that do not exist
- claim "production-ready" for scaffolds
- import code from other repos
- use unlabeled mock data
- add features the user did not ask for
- run destructive git commands without explicit permission
- push to branches other than the one assigned by the user
- bypass the adapter contracts
- add a top-level directory without an ADR

---

## 13. The "always" list

Always:

- read the relevant docs first
- plan before edit
- label placeholders
- write the smallest correct change
- test what matters
- run the audit at phase end
- write honest reports
- ask when unsure

---

## 14. Where to look

- Mission and product: [`docs/vision.md`](docs/vision.md),
  [`docs/product.md`](docs/product.md)
- How it is built: [`docs/architecture.md`](docs/architecture.md)
- What ships when: [`docs/roadmap.md`](docs/roadmap.md)
- How to act day to day: [`docs/working-rules.md`](docs/working-rules.md)
- Decisions: [`docs/decisions.md`](docs/decisions.md)
- Roles: `agents/*.md`
