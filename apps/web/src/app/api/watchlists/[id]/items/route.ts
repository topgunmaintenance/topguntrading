import { NextResponse, type NextRequest } from "next/server";
import { headers } from "next/headers";
import { AddWatchlistItemRequestSchema } from "@topgun/types";
import { watchlistsClient } from "@/lib/watchlists-client";
import { ApiCallError } from "@/lib/api-client";

interface RouteContext {
  params: { id: string };
}

export async function POST(req: NextRequest, ctx: RouteContext): Promise<Response> {
  const raw = (await req.json().catch(() => null)) as unknown;
  const parsed = AddWatchlistItemRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        code: "unprocessable_entity",
        message: "Invalid symbol payload",
      },
      { status: 422 },
    );
  }
  const cookie = headers().get("cookie") ?? "";
  try {
    const watchlist = await watchlistsClient.addItem(
      ctx.params.id,
      parsed.data.symbol,
      cookie,
    );
    return NextResponse.json({ watchlist }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiCallError) {
      return NextResponse.json(error.body, { status: error.status });
    }
    throw error;
  }
}
