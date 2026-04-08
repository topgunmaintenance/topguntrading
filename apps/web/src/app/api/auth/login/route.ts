import { NextResponse, type NextRequest } from "next/server";
import { LoginRequestSchema } from "@topgun/types";
import { apiClient, ApiCallError } from "@/lib/api-client";
import { writeAuthCookies } from "@/lib/session";

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

export async function POST(req: NextRequest): Promise<Response> {
  const raw = await readPayload(req);
  const parsed = LoginRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        code: "unprocessable_entity",
        message: "Request failed validation",
        fields: Object.fromEntries(
          parsed.error.issues.map((issue) => [issue.path.join("."), issue.message]),
        ),
      },
      { status: 422 },
    );
  }

  try {
    const auth = await apiClient.login(parsed.data);
    writeAuthCookies(auth.tokens);
    return NextResponse.redirect(new URL("/dashboard", req.url), { status: 303 });
  } catch (error) {
    if (error instanceof ApiCallError) {
      return NextResponse.json(error.body, { status: error.status });
    }
    throw error;
  }
}
