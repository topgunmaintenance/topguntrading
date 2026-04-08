# Working Rules

These are the rules of engagement for anyone — human or agent — working in
this repo. They are short on purpose. Read them. Follow them.

## 1. Plan before you code

- Read the relevant docs first.
- State the intended change in plain English.
- If the change touches more than one app or package, describe how.
- If the change is non-trivial, write it down in the PR description before
  the diff.

## 2. Stay in the lane

- Work in `topguntrading` only. Do not reference other repos.
- Make the smallest change that solves the problem.
- No drive-by refactors. Refactors get their own PR with their own
  justification.

## 3. Phase discipline

- We are in Phase 1 unless the roadmap and `decisions.md` say otherwise.
- Do not implement Phase 3+ features in Phase 1 PRs.
- If a Phase 1 task requires a Phase 2+ artifact, scaffold it as a clearly
  labeled placeholder and add a backlog item.

## 4. Label placeholders honestly

- Any file that is a stub or scaffold says so at the top:
  `// TopGun Trading — Phase 1 placeholder. Wired up in Phase N.`
- No fake completed features. No screenshots of features that do not
  exist.
- No claims of integration that is not implemented.

## 5. Write commits like an adult

- Imperative subject, 72 chars or less.
- Explain *why* in the body when the change is non-obvious.
- One logical change per commit when possible.
- See [`CONTRIBUTING.md`](../CONTRIBUTING.md).

## 6. Don't break the architecture

- The architecture in [`docs/architecture.md`](architecture.md) is the
  source of truth. Disagree with it? Open an ADR proposal in
  [`docs/decisions.md`](decisions.md), don't sneak the change in.
- Do not bypass the market data adapter contract.
- Do not bypass the AI prompt library.
- Do not put secrets in code.

## 7. Test what matters

- Write unit tests for pure logic.
- Write integration tests for service boundaries.
- Add a regression test for any bug you fix.
- See [`docs/testing-strategy.md`](testing-strategy.md).

## 8. Respect the user

- Never invent numbers in financial UI.
- Never frame AI output as advice.
- Never store broker credentials.
- Always include compliance disclaimers where they are required.

## 9. Audits are not optional

- Each phase has an exit audit. The audit is part of the work, not a
  bonus.
- Audit findings go into [`docs/decisions.md`](decisions.md) and the
  backlog.

## 10. When in doubt

- Ask. Use the AGENTS.md collaboration rules.
- It is better to pause for a question than to ship the wrong thing.

## Per-phase manual QA checklist (template)

Before declaring a phase done, the QA lead runs through:

- [ ] All required docs updated
- [ ] All new env variables in `.env.example`
- [ ] All new endpoints schema-validated
- [ ] All new UI surfaces accessible (keyboard + contrast)
- [ ] All placeholders clearly labeled
- [ ] No secrets in repo
- [ ] All ADRs proposed in this phase resolved or carried forward
- [ ] CI green on the merge commit
