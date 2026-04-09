/**
 * TopGun Trading — @topgun/trading-rules
 *
 * Pure-function detectors and indicator helpers. Activated in
 * Phase 3.5 for the Whale Activity observational feature.
 *
 * See: docs/pattern-engine.md, docs/decisions.md ADR-0027
 */

export {
  rollingMean,
  rollingMedian,
  relativeVolume,
} from "./indicators/rolling";

export {
  detectLargeTrades,
  LARGE_TRADES_DEFAULTS,
  LARGE_TRADES_DETECTOR_ID,
  LARGE_TRADES_DETECTOR_VERSION,
  type LargeTradesParams,
} from "./detectors/large-trades";

export const PACKAGE_NAME = "@topgun/trading-rules" as const;
