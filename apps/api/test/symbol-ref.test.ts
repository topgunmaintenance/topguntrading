import { describe, expect, it } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { ensureSymbolRef } from "../src/market-data/symbol-ref";

describe("ensureSymbolRef", () => {
  it("parses a valid ref", () => {
    const { ref, provider, symbol } = ensureSymbolRef("coinbase:BTC-USD");
    expect(ref).toBe("coinbase:BTC-USD");
    expect(provider).toBe("coinbase");
    expect(symbol).toBe("BTC-USD");
  });

  it("throws BadRequestException with ApiError envelope on invalid input", () => {
    expect(() => ensureSymbolRef("not a ref")).toThrow(BadRequestException);
  });
});
