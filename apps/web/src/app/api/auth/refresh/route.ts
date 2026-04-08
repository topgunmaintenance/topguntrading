import { NextResponse, type NextRequest } from "next/server";
import { apiClient, ApiCallError } from "@/lib/api-client";
import { readRefreshToken, writeAuthCookies, clearAuthCookies } from "@/lib/session";

export async function POST(_req: NextRequest): Promise<Response> {
  const refresh = readRefreshToken();
  if (!refresh) {
    return NextResponse.json(
      { code: "unauthorized", message: "Missing refresh token" },
      { status: 401 },
    );
  }
  try {
    const auth = await apiClient.refresh(refresh);
    writeAuthCookies(auth.tokens);
    return NextResponse.json({ user: auth.user }, { status: 200 });
  } catch (error) {
    if (error instanceof ApiCallError) {
      clearAuthCookies();
      return NextResponse.json(error.body, { status: error.status });
    }
    throw error;
  }
}
