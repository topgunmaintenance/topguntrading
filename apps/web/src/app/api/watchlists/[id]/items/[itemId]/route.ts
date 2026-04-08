import { NextResponse, type NextRequest } from "next/server";
import { headers } from "next/headers";
import { watchlistsClient } from "@/lib/watchlists-client";
import { ApiCallError } from "@/lib/api-client";

interface RouteContext {
  params: { id: string; itemId: string };
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext,
): Promise<Response> {
  const cookie = headers().get("cookie") ?? "";
  try {
    const watchlist = await watchlistsClient.removeItem(
      ctx.params.id,
      ctx.params.itemId,
      cookie,
    );
    return NextResponse.json({ watchlist }, { status: 200 });
  } catch (error) {
    if (error instanceof ApiCallError) {
      return NextResponse.json(error.body, { status: error.status });
    }
    throw error;
  }
}
