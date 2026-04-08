import { BadRequestException } from "@nestjs/common";
import { SymbolRefSchema, parseSymbolRef, type SymbolRef } from "@topgun/types";

/**
 * Small helper that validates and parses a symbol reference at the
 * controller boundary. Throws a 400-shaped `BadRequestException` with
 * the shared `ApiError` envelope on failure.
 */
export function ensureSymbolRef(raw: string): {
  ref: SymbolRef;
  provider: string;
  symbol: string;
} {
  const parsed = SymbolRefSchema.safeParse(raw);
  if (!parsed.success) {
    throw new BadRequestException({
      code: "bad_request",
      message: "Invalid symbol reference. Expected `{provider}:{symbol}`.",
    });
  }
  const { provider, symbol } = parseSymbolRef(parsed.data);
  return { ref: parsed.data, provider, symbol };
}
