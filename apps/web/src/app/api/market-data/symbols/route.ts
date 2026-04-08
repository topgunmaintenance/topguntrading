import { NextResponse, type NextRequest } from "next/server";
import { headers } from "next/headers";
import { marketDataClient } from "@/lib/market-data-client";
import { ApiCallError } from "@/lib/api-client";

export async function GET(req: NextRequest): Promise<Response> {
  const params = req.nextUrl.searchParams;
  const q = params.get("q") ?? "";
  const limit = Number.parseInt(params.get("limit") ?? "20", 10) || 20;
  const cookie = headers().get("cookie") ?? "";

  try {
    const symbols = await marketDataClient.searchSymbols(q, cookie, limit);
    return NextResponse.json({ symbols }, { status: 200 });
  } catch (error) {
    if (error instanceof ApiCallError) {
      return NextResponse.json(error.body, { status: error.status });
    }
    throw error;
  }
}
