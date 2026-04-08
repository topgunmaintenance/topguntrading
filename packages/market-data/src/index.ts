/**
 * TopGun Trading — @topgun/market-data
 *
 * Phase 1 placeholder.
 *
 * The IMarketDataAdapter contract, the normalized schema, and the
 * first real provider adapter arrive in Phase 3.
 *
 * Until then, no production code should import from this package
 * expecting real data. Tests may import the MOCK_ADAPTER_ID constant
 * to assert that the package is wired into the workspace.
 *
 * See: docs/market-data-strategy.md, agents/data-engineer.md
 */

export const PHASE = 1 as const;
export const PACKAGE_NAME = "@topgun/market-data" as const;
export const MOCK_ADAPTER_ID = "mock" as const;
