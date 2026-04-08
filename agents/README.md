# agents/

Per-role agent operating instructions for TopGun Trading.

These files are practical, not fluffy. Each one defines:

- **Role** — what this agent owns
- **Responsibilities** — what they do
- **Non-responsibilities** — what they explicitly do not do
- **Inputs / Outputs** — what flows in and out
- **Success criteria** — measurable bar for "doing the job"
- **Collaboration rules** — how this role works with the others
- **Guardrails** — hard limits
- **Review checklist** — what to look at on a PR

## Roles

- [`architect.md`](architect.md) — System architecture
- [`frontend-lead.md`](frontend-lead.md) — `apps/web` and `packages/ui`
- [`backend-lead.md`](backend-lead.md) — `apps/api` and `apps/worker`
- [`extension-lead.md`](extension-lead.md) — `apps/extension`
- [`data-engineer.md`](data-engineer.md) — Market data and patterns
- [`ai-orchestrator.md`](ai-orchestrator.md) — Prompt library and AI
- [`product-manager.md`](product-manager.md) — Scope and sequencing
- [`qa-lead.md`](qa-lead.md) — Quality and tests
- [`security-reviewer.md`](security-reviewer.md) — Security posture
- [`designer.md`](designer.md) — Visual identity and design system
- [`devops.md`](devops.md) — CI/CD, infra, observability
- [`docs-owner.md`](docs-owner.md) — Documentation accuracy

The master operating contract for the whole repo lives in
[`../AGENTS.md`](../AGENTS.md).

## How a single agent (e.g. Claude Code) uses this folder

When Claude Code is the only agent at the keyboard, it plays each role
in turn. Before making a decision, it explicitly names the role it is
wearing — for example: *"Wearing the security-reviewer hat, I am
flagging X."* This keeps reasoning auditable and prevents one
discipline from quietly overruling another.
