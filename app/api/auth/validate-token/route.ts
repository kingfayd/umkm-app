import { NextResponse, NextRequest } from "next/server";
import { jwtVerify } from "jose";
//app/api/validate-token/route.ts
const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "defaultsecret"
);

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie");
    console.log("Cookie Header:", cookieHeader);

    const token = cookieHeader
      ?.split("; ")
      .find((c: string) => c.startsWith("authToken="))
      ?.split("=")[1];

    console.log("Extracted Token:", token);

    if (!token) {
      console.error("Token not found in cookie");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, SECRET);
    console.log("Token payload:", payload);

    const userId = payload.id;
    console.log("Extracted userId:", userId);

    return NextResponse.json(
      { message: "Token valid", userId },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error validating token:", error.message);
    } else {
      console.error("Unexpected error:", error);
    }
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }
}
