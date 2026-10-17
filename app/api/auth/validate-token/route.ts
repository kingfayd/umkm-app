import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ message: "Token valid", userId });
  } catch (error) {
    console.error("Error validating token:", error);
    return NextResponse.json({ message: "Unable to validate token" }, { status: 500 });
  }
}
