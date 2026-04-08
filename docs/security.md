# Security

This document is the security posture of TopGun Trading. A separate
top-level [`SECURITY.md`](../SECURITY.md) covers how to report
vulnerabilities to us.

## Threat model (initial)

Primary assets:

1. User credentials and sessions
2. Personal journal contents
3. Trade history
4. Linked third-party API keys (if "bring your own key" lands)
5. Brand reputation (financial product trust)

Primary adversaries:

- Credential stuffers and password sprayers
- Opportunistic scrapers
- Malicious browser extensions colluding with ours
- Insider misuse of admin tooling

We are **not** in scope to defend against:

- Targeted nation-state attackers
- Physical attacks on user devices

## Identity and auth

- Email + password with strong hashing (Argon2id) and rate limiting.
- OAuth providers as a second option.
- Sessions are server-side, short-lived, refreshable, with rotation on
  refresh.
- The API issues short-lived JWTs for client → API calls; refresh tokens
  are HTTP-only, secure, same-site.
- The browser extension uses the same auth surface; no separate path.
- MFA (TOTP) targeted at Phase 6.

## Secrets

- Secrets live in environment variables in production, in the platform
  secret store, never in git.
- `.env.example` enumerates required variables.
- A pre-commit hook scans for accidental secrets (planned for Phase 2).
- Rotation procedures are documented per provider in `docs/observability.md`.

## Network

- HTTPS everywhere. HSTS in production.
- API CORS is allow-listed to known web origins and the extension id.
- WebSocket upgrades require an authenticated session.

## Input validation

- Every API endpoint validates input with zod schemas from
  `@topgun/types`.
- Every WebSocket message is schema-validated on receipt.
- Outputs to the browser are escaped by default; React handles most of
  this, but any `dangerouslySetInnerHTML` requires a documented reason.

## Storage

- Database access goes through Prisma; raw SQL is reviewed.
- Personal data fields (email, phone if added later) are encrypted at
  rest at the column level.
- Backups are encrypted at rest by the storage provider.
- Attachments live in object storage with private ACLs and signed URLs.

## Browser extension

- Content scripts run in isolated worlds.
- Messages between content script, service worker, and API are zod-
  validated.
- The extension never stores broker credentials.
- See [`docs/browser-extension-strategy.md`](browser-extension-strategy.md).

## AI

- Inputs to AI providers are scoped to the minimum needed.
- AI providers receive only what is necessary for the feature.
- AI outputs are not trusted as code; they are never executed.
- See [`docs/ai-strategy.md`](ai-strategy.md).

## Logging

- Logs never include passwords, full tokens, or full session ids.
- PII in logs is masked at the logging boundary.
- See [`docs/observability.md`](observability.md).

## Dependency hygiene

- Renovate (or equivalent) for automated dependency updates.
- `pnpm audit` runs in CI and fails on high-severity issues.
- A SBOM is produced for each release (Phase 6+).

## Incident response

- Severity levels and on-call rotation are defined in
  `docs/observability.md`.
- A vulnerability disclosed via [`SECURITY.md`](../SECURITY.md) follows
  a triage SLA documented there.
