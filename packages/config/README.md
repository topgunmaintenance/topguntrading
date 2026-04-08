# @topgun/config

> **Phase 1 scaffold.** Real shared config arrives in Phase 2.

Shared `tsconfig`, `eslint`, `prettier`, and runtime env helpers. Every
app and package consumes its standards from here so we never argue
about formatting or per-repo lint drift.

## Phase 2 deliverables

- `tsconfig.base.json` (already at repo root, will move here)
- `eslint` flat config
- `prettier` config
- `env` helper that loads and validates env vars per app

## Owner

DevOps + Architect.
