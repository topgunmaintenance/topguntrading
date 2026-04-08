import { describe, expect, it } from "vitest";
import { TIMEFRAME_OPTIONS, intervalSeconds } from "./timeframe";

describe("TIMEFRAME_OPTIONS", () => {
  it("has a stable, non-empty order", () => {
    expect(TIMEFRAME_OPTIONS.length).toBeGreaterThan(0);
    expect(TIMEFRAME_OPTIONS[0]?.value).toBe("1m");
    expect(TIMEFRAME_OPTIONS.at(-1)?.value).toBe("1d");
  });

  it("has a positive defaultLimit for every entry", () => {
    for (const opt of TIMEFRAME_OPTIONS) {
      expect(opt.defaultLimit).toBeGreaterThan(0);
    }
  });
});

describe("intervalSeconds", () => {
  it("returns the right number of seconds", () => {
    expect(intervalSeconds("1m")).toBe(60);
    expect(intervalSeconds("1h")).toBe(3600);
    expect(intervalSeconds("1d")).toBe(86400);
  });
});
