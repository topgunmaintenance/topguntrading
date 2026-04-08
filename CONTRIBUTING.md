# Contributing to TopGun Trading

Thanks for your interest. This repo is operated under strict phase
discipline. Read this file before opening a PR.

## Before you write code

1. Read [`README.md`](README.md).
2. Read [`AGENTS.md`](AGENTS.md).
3. Read the docs relevant to your change in [`docs/`](docs/).
4. Confirm the change fits the current phase per
   [`docs/roadmap.md`](docs/roadmap.md).
5. If the change is non-trivial, draft a short plan in the issue or PR
   description before any commits.

## Branching

- Default branch: `main`.
- Feature branches: `feature/<short-name>`.
- Fix branches: `fix/<short-name>`.
- Docs-only branches: `docs/<short-name>`.

## Commit style

- Imperative mood, 72 chars or less for the subject.
- Body explains *why* when the change is non-obvious.
- One logical change per commit when possible.
- Reference issues by number.

Examples:

```
docs: clarify replay lock-forward enforcement
feat(api): add /healthz endpoint
fix(web): preserve workspace state on hot reload
```

## Pull requests

- Use [`.github/pull_request_template.md`](.github/pull_request_template.md).
- Keep PRs small.
- Include a test plan in the PR body.
- Tag the relevant agent role in the description.
- Make sure CI is green before requesting review.

## Code style

- TypeScript everywhere except where explicitly justified.
- Lint and format with the shared config in `packages/config`.
- No `any` types in shared package code.
- No `console.log` left behind.

## Tests

- New code requires tests where the testing strategy applies.
- Bug fixes require a regression test.
- See [`docs/testing-strategy.md`](docs/testing-strategy.md).

## Docs

- Features that change behavior must update the relevant docs in the
  same PR.
- New env variables go into `.env.example` in the same PR.
- ADR-worthy decisions go into `docs/decisions.md`.

## Security

- Do not commit secrets. Ever.
- Security-sensitive PRs require review from the security reviewer
  agent (see `agents/security-reviewer.md`).
- See [`SECURITY.md`](SECURITY.md) for vulnerability reporting.

## Code of conduct

Be the kind of person you want to work with. See
[`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

## Questions

If you are unsure, ask before merging. The cost of a question is
always lower than the cost of an avoidable mistake.
