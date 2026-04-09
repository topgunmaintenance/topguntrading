import { describe, expect, it } from "vitest";
import { relativeVolume, rollingMean, rollingMedian } from "./rolling";

describe("rollingMean", () => {
  it("averages the last `window` samples", () => {
    expect(rollingMean([1, 2, 3, 4, 5], 3)).toBeCloseTo((3 + 4 + 5) / 3);
  });

  it("returns NaN when the input has fewer than window samples", () => {
    expect(rollingMean([1, 2], 3)).toBeNaN();
  });

  it("handles a single-sample window", () => {
    expect(rollingMean([7, 9, 11], 1)).toBe(11);
  });

  it("throws on a non-positive window", () => {
    expect(() => rollingMean([1, 2, 3], 0)).toThrow();
  });
});

describe("rollingMedian", () => {
  it("returns the middle value for an odd window", () => {
    expect(rollingMedian([1, 2, 3, 4, 5], 5)).toBe(3);
  });

  it("averages the two middle values for an even window", () => {
    expect(rollingMedian([1, 2, 3, 4], 4)).toBe(2.5);
  });

  it("ignores samples before the window", () => {
    // window of 3 over the last 3: [100, 1, 2] → sorted [1, 2, 100] → 2
    expect(rollingMedian([999, 998, 100, 1, 2], 3)).toBe(2);
  });

  it("returns NaN when fewer than window samples", () => {
    expect(rollingMedian([1, 2], 5)).toBeNaN();
  });
});

describe("relativeVolume", () => {
  it("divides current by the rolling mean of history", () => {
    // history mean of last 4 = (1+1+1+1)/4 = 1
    // current = 3 → RVOL = 3
    expect(relativeVolume(3, [1, 1, 1, 1], 4)).toBe(3);
  });

  it("returns NaN if history is too short", () => {
    expect(relativeVolume(5, [1, 1], 4)).toBeNaN();
  });

  it("returns NaN if the rolling mean is zero", () => {
    expect(relativeVolume(5, [0, 0, 0, 0], 4)).toBeNaN();
  });

  it("handles fractional values", () => {
    // history mean = 2, current = 5 → RVOL = 2.5
    expect(relativeVolume(5, [2, 2, 2, 2], 4)).toBeCloseTo(2.5);
  });
});
