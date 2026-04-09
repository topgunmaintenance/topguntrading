import { NextResponse, type NextRequest } from "next/server";
import { headers } from "next/headers";
import { SymbolRefSchema } from "@topgun/types";
import { marketDataClient } from "@/lib/market-data-client";
import { ApiCallError } from "@/lib/api-client";

/**
 * Web BFF handler for the Phase 3.5 whale-activity observations.
 *
 * Proxies to the Nest `/market-data/whales` route. The `symbol`
 * query param is optional — the API falls back to
 * `env.WHALES_DEFAULT_SYMBOL` when it's omitted.
 *
 * See ADR-0026 and ADR-0027.
 */
export async function GET(req: NextRequest): Promise<Response> {
  const symbolRaw = req.nextUrl.searchParams.get("symbol");
  let symbol: string | undefined;
  if (symbolRaw) {
    const parsed = SymbolRefSchema.safeParse(symbolRaw);
    if (!parsed.success) {
      return NextResponse.json(
        { code: "bad_request", message: "symbol must be `{provider}:{symbol}`" },
        { status: 400 },
      );
    }
    symbol = parsed.data;
  }

  const cookie = headers().get("cookie") ?? "";

  try {
    const result = await marketDataClient.getWhaleSignals(symbol, cookie);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof ApiCallError) {
      return NextResponse.json(error.body, { status: error.status });
    }
    throw error;
  }
}
