/**
 * TopGun Trading — rolling-window indicator helpers.
 *
 * Pure, deterministic, allocation-light. No IO. No clock. No state
 * between calls. Used by detectors in the same package.
 *
 * Numeric inputs are `number` because callers convert at the edge.
 * Price and size values in the wider platform are decimal strings
 * (see packages/types/src/market-data.ts:84) — callers must use
 * `Number.parseFloat` once, at the boundary, and hand the result
 * here for comparison math only. Never echo a computed number back
 * into a UI or a stored record as authoritative.
 */

/**
 * Simple moving average over the last `window` samples.
 * Returns NaN if the input has fewer than `window` samples so
 * callers can treat "not enough data" uniformly.
 */
export function rollingMean(values: readonly number[], window: number): number {
  if (window <= 0) {
    throw new Error("rollingMean: window must be positive");
  }
  if (values.length < window) return Number.NaN;
  let sum = 0;
  for (let i = values.length - window; i < values.length; i++) {
    const v = values[i];
    if (v === undefined) return Number.NaN;
    sum += v;
  }
  return sum / window;
}

/**
 * Rolling median over the last `window` samples. O(window log window)
 * because we sort a copy. Detectors typically call this once per
 * observation, not per tick, so the cost is fine in this scope.
 *
 * Returns NaN if fewer than `window` samples are available.
 */
export function rollingMedian(
  values: readonly number[],
  window: number,
): number {
  if (window <= 0) {
    throw new Error("rollingMedian: window must be positive");
  }
  if (values.length < window) return Number.NaN;
  const slice = values.slice(values.length - window).sort((a, b) => a - b);
  const mid = Math.floor(window / 2);
  if (window % 2 === 1) {
    const v = slice[mid];
    return v === undefined ? Number.NaN : v;
  }
  const a = slice[mid - 1];
  const b = slice[mid];
  if (a === undefined || b === undefined) return Number.NaN;
  return (a + b) / 2;
}

/**
 * Relative-volume ratio: `current / rollingMean(history, window)`.
 * `history` must NOT include `current` — callers pass the N prior
 * samples and the new sample separately. Returns NaN if history
 * is too short.
 */
export function relativeVolume(
  current: number,
  history: readonly number[],
  window: number,
): number {
  const avg = rollingMean(history, window);
  if (!Number.isFinite(avg) || avg === 0) return Number.NaN;
  return current / avg;
}
