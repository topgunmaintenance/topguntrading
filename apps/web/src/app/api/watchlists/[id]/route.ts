import { NextResponse, type NextRequest } from "next/server";
import { headers } from "next/headers";
import { UpdateWatchlistRequestSchema } from "@topgun/types";
import { watchlistsClient } from "@/lib/watchlists-client";
import { ApiCallError } from "@/lib/api-client";

interface RouteContext {
  params: { id: string };
}

export async function GET(_req: NextRequest, ctx: RouteContext): Promise<Response> {
  const cookie = headers().get("cookie") ?? "";
  try {
    const watchlist = await watchlistsClient.get(ctx.params.id, cookie);
    return NextResponse.json({ watchlist }, { status: 200 });
  } catch (error) {
    if (error instanceof ApiCallError) {
      return NextResponse.json(error.body, { status: error.status });
    }
    throw error;
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext): Promise<Response> {
  const raw = (await req.json().catch(() => null)) as unknown;
  const parsed = UpdateWatchlistRequestSchema.safeParse(raw ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { code: "unprocessable_entity", message: "Invalid update" },
      { status: 422 },
    );
  }
  const cookie = headers().get("cookie") ?? "";
  try {
    const watchlist = await watchlistsClient.update(
      ctx.params.id,
      parsed.data,
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

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext,
): Promise<Response> {
  const cookie = headers().get("cookie") ?? "";
  try {
    await watchlistsClient.delete(ctx.params.id, cookie);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ApiCallError) {
      return NextResponse.json(error.body, { status: error.status });
    }
    throw error;
  }
}
