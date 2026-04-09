import { describe, expect, it } from "vitest";
import type { Trade } from "@topgun/types";
import {
  LARGE_TRADES_DEFAULTS,
  LARGE_TRADES_DETECTOR_ID,
  LARGE_TRADES_DETECTOR_VERSION,
  detectLargeTrades,
} from "./large-trades";

/**
 * Golden cases for `detectLargeTrades`. Five buckets per
 * docs/pattern-engine.md §Catalog and our Phase 3.5 plan:
 *
 *   1. clear whale — obvious fire
 *   2. boundary    — sits right at the threshold (must NOT fire —
 *                    we under-detect by design)
 *   3. no signal   — normal day, nothing qualifies
 *   4. cluster     — three whales in a row, all fire
 *   5. sparse data — tape is too short for the lookback window
 */

const SYMBOL = "kraken:XBTUSD";
const FIXED_PRICE = "67000";

function tradeAt(
  ts: string,
  size: string,
  side: Trade["side"] = "taker_buy",
  id?: string,
): Trade {
  return {
    symbol: SYMBOL,
    time: ts,
    price: FIXED_PRICE,
    size,
    side,
    tradeId: id ?? `t-${ts}-${size}`,
  };
}

function historyOf(size: string, count: number, startMs: number): Trade[] {
  const out: Trade[] = [];
  for (let i = 0; i < count; i++) {
    const ts = new Date(startMs + i * 1000).toISOString();
    out.push(tradeAt(ts, size, i % 2 === 0 ? "taker_buy" : "taker_sell"));
  }
  return out;
}

describe("detectLargeTrades — golden cases", () => {
  it("1. clear whale: 20x rolling median fires a signal", () => {
    // 200 trades of 0.05 BTC, then one 10 BTC trade. Median = 0.05,
    // so 10 BTC = 200x — way past the 8x threshold. Notional at
    // $67k/BTC = $670k, past the $250k floor.
    const base = historyOf("0.05", LARGE_TRADES_DEFAULTS.lookback, 0);
    const whale = tradeAt(
      new Date(LARGE_TRADES_DEFAULTS.lookback * 1000).toISOString(),
      "10",
      "taker_buy",
      "whale-1",
    );
    const signals = detectLargeTrades(
      [...base, whale],
      LARGE_TRADES_DEFAULTS,
      new Date(0),
    );
    expect(signals).toHaveLength(1);
    const [signal] = signals;
    if (!signal) throw new Error("signal missing");
    expect(signal.kind).toBe("large_trade");
    expect(signal.symbol).toBe(SYMBOL);
    expect(signal.direction).toBe("taker_buy");
    // 10 BTC / 0.05 median = 200x → "high"
    expect(signal.severity).toBe("high");
    expect(signal.source).toEqual({
      detectorId: LARGE_TRADES_DETECTOR_ID,
      version: LARGE_TRADES_DETECTOR_VERSION,
    });
    // Decimal strings preserved in evidence.
    expect(signal.evidence["size"]).toBe("10");
    expect(signal.evidence["price"]).toBe("67000");
    expect(signal.headline).toContain("XBTUSD");
    expect(signal.headline).toContain("taker lifted offer");
  });

  it("2. boundary: a trade at exactly 8x the median does NOT fire (under-detect by design)", () => {
    // 200 trades of 1 BTC, then one 7.9 BTC trade. 7.9 < 8 → no signal.
    const base = historyOf("1", LARGE_TRADES_DEFAULTS.lookback, 0);
    const subThreshold = tradeAt(
      new Date(LARGE_TRADES_DEFAULTS.lookback * 1000).toISOString(),
      "7.9",
      "taker_buy",
      "near-miss",
    );
    const signals = detectLargeTrades(
      [...base, subThreshold],
      LARGE_TRADES_DEFAULTS,
      new Date(0),
    );
    expect(signals).toHaveLength(0);
  });

  it("3. no signal: normal day of small trades emits nothing", () => {
    // 300 trades of ~0.05 BTC, uniform. Nothing stands out.
    const trades: Trade[] = [];
    for (let i = 0; i < 300; i++) {
      const size = (0.05 + (i % 5) * 0.001).toString();
      trades.push(tradeAt(new Date(i * 1000).toISOString(), size));
    }
    const signals = detectLargeTrades(trades, LARGE_TRADES_DEFAULTS, new Date(0));
    expect(signals).toHaveLength(0);
  });

  it("4. cluster: three whales in a row all fire", () => {
    const base = historyOf("0.02", LARGE_TRADES_DEFAULTS.lookback, 0);
    const startMs = LARGE_TRADES_DEFAULTS.lookback * 1000;
    // 0.02 median, 5 BTC trades → 250x multiple, $335k notional each.
    const whales = [
      tradeAt(new Date(startMs + 1000).toISOString(), "5", "taker_buy", "w1"),
      tradeAt(new Date(startMs + 2000).toISOString(), "5", "taker_sell", "w2"),
      tradeAt(new Date(startMs + 3000).toISOString(), "5", "taker_buy", "w3"),
    ];
    const signals = detectLargeTrades(
      [...base, ...whales],
      LARGE_TRADES_DEFAULTS,
      new Date(0),
    );
    expect(signals).toHaveLength(3);
    expect(signals.map((s) => s.direction)).toEqual([
      "taker_buy",
      "taker_sell",
      "taker_buy",
    ]);
    expect(new Set(signals.map((s) => s.id)).size).toBe(3);
  });

  it("5. sparse data: tape shorter than the lookback emits nothing", () => {
    // Only 50 trades, lookback is 200 — the rolling median is never
    // computed, so nothing can qualify. Size alone does not count.
    const trades: Trade[] = [];
    for (let i = 0; i < 50; i++) {
      trades.push(tradeAt(new Date(i * 1000).toISOString(), "9999"));
    }
    const signals = detectLargeTrades(trades, LARGE_TRADES_DEFAULTS, new Date(0));
    expect(signals).toHaveLength(0);
  });

  it("calibration: conservative defaults do not fire on a busy-but-normal tape", () => {
    // Mix of 0.5-2 BTC retail trades, no whales. Should be quiet.
    const trades: Trade[] = [];
    const sizes = ["0.5", "1.2", "0.8", "1.9", "0.6", "1.1", "1.5", "0.9"];
    for (let i = 0; i < 400; i++) {
      const chosen = sizes[i % sizes.length];
      if (!chosen) continue;
      trades.push(tradeAt(new Date(i * 1000).toISOString(), chosen));
    }
    const signals = detectLargeTrades(trades, LARGE_TRADES_DEFAULTS, new Date(0));
    expect(signals).toHaveLength(0);
  });

  it("notional floor: a big size under the floor does not fire", () => {
    // History of 0.001 BTC trades. Current = 1 BTC (1000x) but at
    // $200/BTC (fictional) → $200 notional, under the $250k floor.
    const base: Trade[] = [];
    for (let i = 0; i < LARGE_TRADES_DEFAULTS.lookback; i++) {
      base.push({
        symbol: SYMBOL,
        time: new Date(i * 1000).toISOString(),
        price: "200",
        size: "0.001",
        side: "taker_buy",
        tradeId: `s-${i}`,
      });
    }
    base.push({
      symbol: SYMBOL,
      time: new Date(LARGE_TRADES_DEFAULTS.lookback * 1000).toISOString(),
      price: "200",
      size: "1",
      side: "taker_buy",
      tradeId: "under-floor",
    });
    const signals = detectLargeTrades(base, LARGE_TRADES_DEFAULTS, new Date(0));
    expect(signals).toHaveLength(0);
  });

  it("unknown aggressor: signal fires without a direction field", () => {
    const base = historyOf("0.05", LARGE_TRADES_DEFAULTS.lookback, 0);
    const whale = tradeAt(
      new Date(LARGE_TRADES_DEFAULTS.lookback * 1000).toISOString(),
      "10",
      "unknown",
      "mystery",
    );
    const signals = detectLargeTrades(
      [...base, whale],
      LARGE_TRADES_DEFAULTS,
      new Date(0),
    );
    expect(signals).toHaveLength(1);
    const [signal] = signals;
    if (!signal) throw new Error("signal missing");
    expect(signal.direction).toBeUndefined();
    expect(signal.headline).toContain("aggressor unknown");
  });
});
