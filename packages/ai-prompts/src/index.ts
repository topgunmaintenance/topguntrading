/**
 * TopGun Trading — @topgun/ai-prompts
 *
 * Phase 1 placeholder.
 *
 * The provider client, prompt manifest, eval harness, and safety
 * blocklist arrive in Phase 5. This package is deliberately empty
 * during scaffolding so that no app accidentally calls an AI provider
 * before the safety machinery exists.
 *
 * Default provider when implemented: Anthropic Claude API.
 *
 * See: docs/ai-strategy.md, docs/compliance.md, agents/ai-orchestrator.md
 */

export const PHASE = 1 as const;
export const PACKAGE_NAME = "@topgun/ai-prompts" as const;
export const DEFAULT_AI_PROVIDER = "anthropic" as const;
