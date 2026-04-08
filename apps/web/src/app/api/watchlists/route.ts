import { NextResponse, type NextRequest } from "next/server";
import { headers } from "next/headers";
import { CreateWatchlistRequestSchema } from "@topgun/types";
import { watchlistsClient } from "@/lib/watchlists-client";
import { ApiCallError } from "@/lib/api-client";

async function readPayload(req: NextRequest): Promise<unknown> {
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("application/json")) return req.json();
  const form = await req.formData();
  const entries: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") entries[key] = value;
  }
  return entries;
}

export async function GET(): Promise<Response> {
  const cookie = headers().get("cookie") ?? "";
  try {
    const watchlists = await watchlistsClient.list(cookie);
    return NextResponse.json({ watchlists }, { status: 200 });
  } catch (error) {
    if (error instanceof ApiCallError) {
      return NextResponse.json(error.body, { status: error.status });
    }
    throw error;
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  const raw = await readPayload(req);
  const parsed = CreateWatchlistRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        code: "unprocessable_entity",
        message: "Invalid watchlist payload",
        fields: Object.fromEntries(
          parsed.error.issues.map((issue) => [issue.path.join("."), issue.message]),
        ),
      },
      { status: 422 },
    );
  }
  const cookie = headers().get("cookie") ?? "";
  try {
    const watchlist = await watchlistsClient.create(parsed.data, cookie);
    const type = req.headers.get("content-type") ?? "";
    if (type.includes("application/json")) {
      return NextResponse.json({ watchlist }, { status: 201 });
    }
    // Form post — redirect back to the new watchlist.
    return NextResponse.redirect(
      new URL(`/watchlists/${watchlist.id}`, req.url),
      { status: 303 },
    );
  } catch (error) {
    if (error instanceof ApiCallError) {
      return NextResponse.json(error.body, { status: error.status });
    }
    throw error;
  }
}
