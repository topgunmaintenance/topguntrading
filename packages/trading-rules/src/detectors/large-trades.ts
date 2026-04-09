/**
 * TopGun Trading — `detectLargeTrades` detector.
 *
 * Observational whale-trade detector for crypto tape data. Emits
 * one `EdgeSignal` per trade that qualifies as "unusually large"
 * vs. the recent rolling median trade size, with a minimum
 * absolute-notional floor so small-cap dust trades never fire.
 *
 * Per ADR-0027: this is an observation, not a recommendation. The
 * detector never emits prose — the `headline` is a short factual
 * one-liner the UI renders as-is. The AI layer in a later phase
 * consumes the structured `evidence` field, not the headline.
 *
 * Per docs/pattern-engine.md:82 — we prefer false negatives to
 * false positives. The defaults are deliberately conservative.
 *
 * Defaults (documented in LARGE_TRADES_DEFAULTS below):
 *   - `notionalFloorUsd: 250_000` — ignore anything under $250k
 *   - `rollingMedianMultiple: 8` — trade must be ≥ 8x rolling median
 *   - `lookback: 200` — use the 200 most-recent trades for the median
 *
 * Severity calibration:
 *   - `low`    : passes both thresholds, ≤ 16x rolling median
 *   - `medium` : > 16x rolling median
 *   - `high`   : > 40x rolling median AND ≥ 2x the floor
 */

import type { EdgeSignal, Trade } from "@topgun/types";
import { rollingMedian } from "../indicators/rolling";

export interface LargeTradesParams {
  /**
   * Dust filter in quote-currency notional. Trades whose
   * `price * size` falls below this value never qualify, even if
   * they are statistical outliers within a thin tape. USD-denominated
   * in practice — detector does not unit-convert.
   */
  notionalFloorUsd: number;

  /**
   * Multiple of the rolling-median trade SIZE (in base units).
   * A trade qualifies only when `size >= rolling_median * multiple`.
   */
  rollingMedianMultiple: number;

  /**
   * Number of most-recent prior trades to compute the rolling
   * median over. Must be positive.
   */
  lookback: number;
}

export const LARGE_TRADES_DEFAULTS: Readonly<LargeTradesParams> = {
  notionalFloorUsd: 250_000,
  rollingMedianMultiple: 8,
  lookback: 200,
};

export const LARGE_TRADES_DETECTOR_ID = "detectLargeTrades" as const;
export const LARGE_TRADES_DETECTOR_VERSION = "1.0.0" as const;

/**
 * Pure detector. Inputs:
 *   - `trades`: chronological (oldest-first) array of normalized
 *     `Trade` records from a single symbol. The detector walks
 *     them forward and emits signals for the ones that qualify.
 *   - `params`: threshold tuning. Pass `LARGE_TRADES_DEFAULTS`
 *     unless you have a specific reason.
 *   - `now`: injected clock, per docs/testing-strategy.md "Time is
 *     always injected." Used only to tag derived IDs when a trade
 *     has a blank `tradeId`.
 */
export function detectLargeTrades(
  trades: readonly Trade[],
  params: LargeTradesParams = LARGE_TRADES_DEFAULTS,
  now: Date = new Date(),
): EdgeSignal[] {
  if (params.lookback <= 0) return [];
  if (!Number.isFinite(params.rollingMedianMultiple)) return [];
  if (params.rollingMedianMultiple <= 0) return [];

  const signals: EdgeSignal[] = [];
  const sizeHistory: number[] = [];

  for (let i = 0; i < trades.length; i++) {
    const trade = trades[i];
    if (!trade) continue;

    const size = Number.parseFloat(trade.size);
    const price = Number.parseFloat(trade.price);
    if (!Number.isFinite(size) || !Number.isFinite(price)) {
      // Decimal-string hygiene broke somewhere upstream; skip the
      // sample rather than pollute history.
      continue;
    }

    // Always record the history AFTER evaluating, so the current
    // trade is compared against the prior window.
    if (sizeHistory.length >= params.lookback) {
      const median = rollingMedian(sizeHistory, params.lookback);
      const notional = size * price;
      if (
        Number.isFinite(median) &&
        median > 0 &&
        notional >= params.notionalFloorUsd &&
        size >= median * params.rollingMedianMultiple
      ) {
        const multiple = size / median;
        signals.push(buildSignal(trade, size, price, notional, multiple, params, now));
      }
    }

    sizeHistory.push(size);
    // Bound the history at `lookback + 1` so rollingMedian stays O(window).
    if (sizeHistory.length > params.lookback + 1) {
      sizeHistory.shift();
    }
  }

  return signals;
}

function buildSignal(
  trade: Trade,
  size: number,
  price: number,
  notional: number,
  multiple: number,
  params: LargeTradesParams,
  now: Date,
): EdgeSignal {
  // Severity is a calibrated function of the multiple and the
  // notional. See header comment for calibration table.
  let severity: EdgeSignal["severity"];
  if (multiple > 40 && notional >= params.notionalFloorUsd * 2) {
    severity = "high";
  } else if (multiple > 16) {
    severity = "medium";
  } else {
    severity = "low";
  }

  // Direction maps taker-aggressor side 1:1. For unknown side we
  // omit the direction field rather than guessing.
  const direction: EdgeSignal["direction"] | undefined =
    trade.side === "taker_buy"
      ? "taker_buy"
      : trade.side === "taker_sell"
        ? "taker_sell"
        : undefined;

  const id = trade.tradeId
    ? `${LARGE_TRADES_DETECTOR_ID}:${trade.symbol}:${trade.tradeId}`
    : `${LARGE_TRADES_DETECTOR_ID}:${trade.symbol}:${now.getTime()}:${size}`;

  // Keep headline factual, past-tense, observational.
  const baseLabel = trade.symbol.includes(":")
    ? trade.symbol.slice(trade.symbol.indexOf(":") + 1)
    : trade.symbol;
  const headline = formatHeadline(baseLabel, size, notional, multiple, trade.side);

  const signal: EdgeSignal = {
    id,
    kind: "large_trade",
    symbol: trade.symbol,
    observedAt: trade.time,
    severity,
    headline,
    evidence: {
      size: trade.size,
      price: trade.price,
      notional_usd: notional.toFixed(2),
      multiple_vs_median: multiple.toFixed(2),
      taker_side: trade.side,
      lookback: params.lookback,
      rolling_median_multiple: params.rollingMedianMultiple,
      notional_floor_usd: params.notionalFloorUsd,
    },
    source: {
      detectorId: LARGE_TRADES_DETECTOR_ID,
      version: LARGE_TRADES_DETECTOR_VERSION,
    },
  };
  if (direction) {
    signal.direction = direction;
  }
  return signal;
}

function formatHeadline(
  symbol: string,
  size: number,
  notional: number,
  multiple: number,
  side: Trade["side"],
): string {
  const sizeFmt = formatCompactNumber(size);
  const notionalFmt = formatNotional(notional);
  const multipleFmt = `${multiple.toFixed(1)}x`;
  const sideFmt =
    side === "taker_buy"
      ? "taker lifted offer"
      : side === "taker_sell"
        ? "taker hit bid"
        : "aggressor unknown";
  return `${symbol} — ${sizeFmt} (${notionalFmt}) trade, ${multipleFmt} recent median — ${sideFmt}`;
}

function formatCompactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}k`;
  return n.toFixed(2);
}

function formatNotional(n: number): string {
  if (n >= 1_000_000) return `~$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `~$${(n / 1_000).toFixed(1)}k`;
  return `~$${n.toFixed(0)}`;
}
