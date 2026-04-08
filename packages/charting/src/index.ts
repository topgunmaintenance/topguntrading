/**
 * TopGun Trading — @topgun/charting
 *
 * Thin abstraction over `lightweight-charts`. Consumers import the
 * `<Chart>` component and the `TIMEFRAME_OPTIONS` list. We do not
 * import lightweight-charts anywhere else in the app.
 */
export { Chart, type ChartProps } from "./chart";
export { TIMEFRAME_OPTIONS, intervalSeconds, type TimeframeOption } from "./timeframe";

export const PACKAGE_NAME = "@topgun/charting" as const;
