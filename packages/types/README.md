# @topgun/types

Single source of truth for TypeScript types and zod schemas shared
across `@topgun/web`, `@topgun/api`, `@topgun/worker`, and
`@topgun/extension`.

If a type or schema is used by more than one app, it lives here. Period.

## Phase 2 contents

- `common` — `Id`, `IsoDate`, `Email`, `Password`, `DisplayName`
- `errors` — `ApiError`, `ApiErrorCode`
- `user` — `User`
- `session` — `Session`
- `workspace` — `Workspace`
- `auth` — `SignupRequest`, `LoginRequest`, `TokenPair`, `AuthResponse`,
  `JwtPayload`, `ACCESS_TOKEN_COOKIE`, `REFRESH_TOKEN_COOKIE`

## Later phases

- Phase 3: `Symbol`, `Candle`, `Quote`, `Trade`, market data adapter
  contracts
- Phase 4: `JournalEntry`, `TradeLog`, `ReplaySession`
- Phase 5: `Rule`, `RuleEvaluation`, `PatternHit`, `AIInteraction`

## Owner

Architect (contract), Backend Lead (implementation alongside Prisma).
