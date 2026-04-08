import { NextResponse, type NextRequest } from "next/server";
import { apiClient, ApiCallError } from "@/lib/api-client";
import { clearAuthCookies, readRefreshToken } from "@/lib/session";

export async function POST(req: NextRequest): Promise<Response> {
  const refresh = readRefreshToken();
  if (refresh) {
    try {
      await apiClient.logout(refresh);
    } catch (error) {
      if (!(error instanceof ApiCallError)) throw error;
      // If the API rejects the logout (e.g. session already gone), we
      // still clear the local cookies below.
    }
  }
  clearAuthCookies();
  return NextResponse.redirect(new URL("/", req.url), { status: 303 });
}
