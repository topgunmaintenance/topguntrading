# @topgun/ai-prompts

> **Phase 1 scaffold.** Real prompts arrive in Phase 5.

The versioned prompt library and the provider client for TopGun
Trading. All AI calls go through this package. Default provider is the
Anthropic Claude API. The latest Claude model family is used by default;
the specific model id per feature is declared in the prompt manifest.

Strategy lives in `docs/ai-strategy.md`.

## Phase 5 deliverables

- Provider client abstraction (default: Anthropic Claude)
- Prompt manifest schema
- Prompt versioning and changelog conventions
- Eval harness with golden cases per prompt
- Safety blocklist module
- `AIInteraction` write helper

## Owner

AI Orchestrator — see `agents/ai-orchestrator.md`.
