# AI Strategy

AI in TopGun Trading is a **review and explanation** layer, not a trade engine.
It explains. It questions. It summarizes. It does not predict, recommend, or
execute.

## Principles

1. **Bounded.** AI features are scoped to specific surfaces with specific
   prompts. There is no free-form chat that can drift into financial advice.
2. **Traceable.** Every AI call records prompt id, prompt version, inputs,
   model, provider, output, and cost in `AIInteraction`.
3. **Versioned.** All prompts live in `packages/ai-prompts` and are change-
   controlled like code.
4. **Honest.** Outputs are always labeled as AI-generated and never framed as
   advice.
5. **Provider-agnostic.** A thin client lets us swap providers behind a
   stable interface.
6. **Cheap by default.** We pick the smallest model that does the job per
   feature, and only escalate when needed.

## Default provider

We default to Anthropic's Claude API. The model used per feature is declared
in the prompt manifest, not hardcoded into application code. The latest
Anthropic SDK is used through a thin internal client.

## Surfaces (planned)

| Surface | Phase | Purpose |
|--------|-------|---------|
| Trade review | 5 | Summarize a closed trade against the user's stated plan and rules |
| Journal Q&A | 5 | Answer questions over the user's own journal entries |
| Pattern explainer | 5 | Plain-language explanation of a detected pattern |
| Replay coach | 6 | Commentary during a replay session, on demand |
| Rule drafting | 6 | Help a user articulate a personal trading rule from examples |
| Daily review | 6 | End-of-day summary built from the user's session |

## Prompt library

- Each prompt has an id, semantic version, owner, schema for inputs, schema
  for outputs (where structured), evaluation cases, and a changelog.
- Prompts are tested with a small evaluation harness in
  `packages/ai-prompts` before release.
- Breaking changes bump major version and require a migration note.

## Inputs and grounding

- AI is grounded in user-owned data: the user's journal, the user's trades,
  the chart range they are looking at, the rules they have authored.
- Public market context (news, filings) may be added later via authorized
  providers.
- AI is **not** grounded in private broker data.

## Output handling

- Structured outputs are validated against zod schemas before being shown.
- Free-form text outputs are sanitized and stripped of fabricated numeric
  claims where possible.
- Numeric figures echoed back to the user must come from input data, not
  the model's memory.

## Safety

- A blocklist of phrases and patterns prevents the assistant from issuing
  buy/sell recommendations or guarantees.
- Outputs that trip the blocklist are regenerated with a stricter system
  prompt or surfaced to the user with a clear notice.
- All AI surfaces carry the disclaimer required by [`docs/compliance.md`](compliance.md).

## Cost and rate limiting

- Per-user daily token budgets per feature.
- Per-feature monthly budget caps with alerts to ops.
- Caching of identical inputs where outputs are deterministic enough.

## Evaluation

- Each prompt ships with at least three evaluation cases.
- A weekly evaluation run regressions across the prompt library.
- Failed evaluations block prompt promotion to production.

## Open decisions

Tracked in [`docs/decisions.md`](decisions.md):

- Whether to support a "bring your own key" mode for power users
- Whether to expose model selection in the UI
- Long-term storage policy for `AIInteraction` records
