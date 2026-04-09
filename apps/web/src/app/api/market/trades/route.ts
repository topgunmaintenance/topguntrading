import { NextResponse, type NextRequest } from "next/server";
import { headers } from "next/headers";
import { IsoDateSchema, SymbolRefSchema } from "@topgun/types";
import { marketDataClient } from "@/lib/market-data-client";
import { ApiCallError } from "@/lib/api-client";

/**
 * Web BFF handler for the Phase 3.5 raw trade-tape endpoint.
 *
 * Proxies to the Nest `/market-data/trades` route. Validates query
 * params with zod before forwarding. Authenticated session cookie
 * is forwarded so the Nest `AuthGuard` can verify it.
 *
 * See ADR-0026.
 */
export async function GET(req: NextRequest): Promise<Response> {
  const params = req.nextUrl.searchParams;

  const symbol = SymbolRefSchema.safeParse(params.get("symbol") ?? "");
  if (!symbol.success) {
    return NextResponse.json(
      { code: "bad_request", message: "symbol must be `{provider}:{symbol}`" },
      { status: 400 },
    );
  }

  const limitRaw = params.get("limit");
  let limit: number | undefined;
  if (limitRaw) {
    const n = Number.parseInt(limitRaw, 10);
    if (!Number.isFinite(n) || n <= 0 || n > 1000) {
      return NextResponse.json(
        { code: "bad_request", message: "limit must be a positive integer ≤ 1000" },
        { status: 400 },
      );
    }
    limit = n;
  }

  let since: string | undefined;
  const sinceRaw = params.get("since");
  if (sinceRaw) {
    const parsed = IsoDateSchema.safeParse(sinceRaw);
    if (!parsed.success) {
      return NextResponse.json(
        { code: "bad_request", message: "since must be an ISO-8601 timestamp" },
        { status: 400 },
      );
    }
    since = parsed.data;
  }

  const cookie = headers().get("cookie") ?? "";

  try {
    const request: Parameters<typeof marketDataClient.getTrades>[0] = {
      symbol: symbol.data,
    };
    if (limit !== undefined) request.limit = limit;
    if (since !== undefined) request.since = since;
    const result = await marketDataClient.getTrades(request, cookie);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof ApiCallError) {
      return NextResponse.json(error.body, { status: error.status });
    }
    throw error;
  }
}
