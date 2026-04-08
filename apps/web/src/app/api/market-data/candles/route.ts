import { NextResponse, type NextRequest } from "next/server";
import { headers } from "next/headers";
import { IntervalSchema, SymbolRefSchema } from "@topgun/types";
import { marketDataClient } from "@/lib/market-data-client";
import { ApiCallError } from "@/lib/api-client";

export async function GET(req: NextRequest): Promise<Response> {
  const params = req.nextUrl.searchParams;

  const symbol = SymbolRefSchema.safeParse(params.get("symbol") ?? "");
  const interval = IntervalSchema.safeParse(params.get("interval") ?? "");
  if (!symbol.success || !interval.success) {
    return NextResponse.json(
      { code: "bad_request", message: "symbol and interval are required" },
      { status: 400 },
    );
  }

  const limitRaw = params.get("limit");
  const limit = limitRaw ? Number.parseInt(limitRaw, 10) || 300 : 300;

  const request: Parameters<typeof marketDataClient.getCandles>[0] = {
    symbol: symbol.data,
    interval: interval.data,
    limit,
  };
  const from = params.get("from");
  const to = params.get("to");
  if (from) request.from = from;
  if (to) request.to = to;

  const cookie = headers().get("cookie") ?? "";

  try {
    const candles = await marketDataClient.getCandles(request, cookie);
    return NextResponse.json({ candles }, { status: 200 });
  } catch (error) {
    if (error instanceof ApiCallError) {
      return NextResponse.json(error.body, { status: error.status });
    }
    throw error;
  }
}
