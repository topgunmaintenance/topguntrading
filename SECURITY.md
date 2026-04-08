# Security Policy

## Reporting a vulnerability

If you believe you have found a security issue in TopGun Trading,
please report it privately. Do **not** open a public issue.

Email: security@topguntrading.example

Please include:

- A clear description of the issue
- Steps to reproduce
- Affected components (web, api, extension, worker, package)
- Impact you believe it has
- Your contact information if you want a follow-up

We will acknowledge receipt within 3 business days and provide an
initial assessment within 7 business days.

## Disclosure

We follow coordinated disclosure. We ask that you give us a reasonable
window to fix the issue before any public disclosure. If the issue is
actively being exploited, we will move faster.

## Scope

In scope:

- Source code in this repository (`topguntrading`)
- Production deployments owned by TopGun Trading once we ship
- The TopGun Trading Chrome extension once published

Out of scope:

- Third-party services we depend on (please report those to the
  relevant vendor)
- Social engineering of TopGun Trading staff
- Physical attacks
- Denial-of-service testing against production

## Safe harbor

We will not pursue legal action against researchers who:

- Make a good-faith effort to follow this policy
- Avoid privacy violations, destruction of data, and degradation of
  service
- Give us reasonable time to fix issues before disclosure

## Hall of fame

Once we ship, researchers who report valid issues will be acknowledged
here with their permission.

---

For internal security posture and threat model, see
[`docs/security.md`](docs/security.md).
