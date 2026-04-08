# @topgun/trading-rules

> **Phase 1 scaffold.** Real rule engine and pattern detectors arrive
> in Phases 4 and 5.

Two things live here:

1. The **personal trading rule engine** — user-defined predicates
   evaluated against trade plans and trade outcomes, with severity
   `warn` or `block`.
2. The **pattern detector library** — small, well-tested chart pattern
   detectors that produce explainable `PatternHit` results.

Strategy:
- `docs/pattern-engine.md`
- `docs/journal-system.md` (for rule integration with the journal)

## Phase 4 deliverables

- Rule schema in `@topgun/types`
- Rule evaluation runtime
- Rule outcome logging

## Phase 5 deliverables

- Initial pattern catalog (8 detectors)
- Geometry contract for rendering
- Explanation tokens for AI explainer
- Golden test cases per pattern

## Owner

Data Engineer (patterns), Backend Lead (rules runtime), AI Orchestrator
(pattern explanations).
