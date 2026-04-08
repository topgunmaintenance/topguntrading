# Observability

## What we want to see

1. Is the platform up?
2. Are users having a bad time?
3. Where is money being spent (AI tokens, market data quota, infra)?
4. Where are the slow paths?
5. What did we ship and when?

## Pillars

- **Logs** — structured JSON, stdout, shipped by the platform
- **Metrics** — Prometheus-compatible scrape endpoints
- **Traces** — OpenTelemetry SDK in `apps/api` and `apps/worker`
- **Errors** — error tracker (Sentry or equivalent)
- **Audit** — append-only audit log for sensitive admin actions

## Logs

- Format: JSON, one event per line
- Required fields: `ts`, `level`, `service`, `traceId`, `userId?`,
  `event`, `msg`
- PII masking happens at the logger boundary
- No secrets in logs, ever

## Metrics

- Service health: process up, event loop lag, GC pressure
- API: request rate, error rate, latency p50/p95/p99 per route
- WebSocket: connections, fan-out depth, dropped frames
- Worker: job rate, retry rate, dead-letter depth
- Market data adapters: provider call rate, quota usage, error rate
- AI: tokens in/out per feature, cost per feature, latency
- Replay: active sessions, frame rate, snapshot cache hit rate

## Tracing

- Every API request opens a root span.
- Worker jobs open a root span keyed by job id.
- Market data and AI calls are children of the originating request span.

## Dashboards

- "Live ops" — API health, WS health, error rate
- "Cost" — AI spend, market data quota, infra spend
- "Replay" — replay session health and capacity
- "Alerts" — alert evaluation latency and miss rate

## Alerting

- Alerts page on-call when:
  - API error rate exceeds threshold
  - WS connection failure rate exceeds threshold
  - Worker dead-letter depth grows
  - Daily AI cost exceeds budget
  - Database connection pool saturation
- Alerts have runbooks linked from the alert text.

## Incident response

- Severity levels:
  - **SEV1** — platform down or data integrity at risk
  - **SEV2** — major feature degraded
  - **SEV3** — minor degradation, customer-impacting
  - **SEV4** — internal-only
- Each SEV has a documented response, comms, and postmortem template.

## Audit log

- Records: admin login, admin impersonation (never silent), entitlement
  changes, prompt promotions, secret rotations.
- Append-only. Stored separately from application logs.

## Cost observability

- AI token spend per feature, surfaced on the cost dashboard.
- Market data quota usage per provider.
- Infra spend exported from the cloud provider.

## Open decisions

Tracked in [`docs/decisions.md`](decisions.md):

- Final error tracker (Sentry vs. self-hosted)
- Whether to ship OpenTelemetry from Phase 2 or Phase 6
