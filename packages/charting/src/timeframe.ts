import { INTERVAL_SECONDS, type Interval } from "@topgun/types";

export interface TimeframeOption {
  value: Interval;
  label: string;
  /** Default number of candles to request when the user selects this interval. */
  defaultLimit: number;
}

/**
 * Stable ordering used by the timeframe picker. Extend by adding
 * entries here; do not sprinkle timeframe strings across the app.
 */
export const TIMEFRAME_OPTIONS: readonly TimeframeOption[] = [
  { value: "1m", label: "1m", defaultLimit: 300 },
  { value: "5m", label: "5m", defaultLimit: 300 },
  { value: "15m", label: "15m", defaultLimit: 300 },
  { value: "1h", label: "1h", defaultLimit: 300 },
  { value: "6h", label: "6h", defaultLimit: 300 },
  { value: "1d", label: "1d", defaultLimit: 300 },
];

export function intervalSeconds(interval: Interval): number {
  return INTERVAL_SECONDS[interval];
}
