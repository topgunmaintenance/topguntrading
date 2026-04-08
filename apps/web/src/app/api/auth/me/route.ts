import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";

export async function GET(): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { code: "unauthorized", message: "Not signed in" },
      { status: 401 },
    );
  }
  return NextResponse.json({ user }, { status: 200 });
}
