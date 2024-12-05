// app/api/middleware-handler.ts
import { NextResponse } from "next/server";
import { jwtVerify } from "jose"; // Menggunakan jose untuk verifikasi JWT
import { cookies } from "next/headers"; // Menggunakan cookies dari Next.js untuk mengambil cookie

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "defaultsecret"
);

export async function POST(req: Request) {
  try {
    // Mengambil token dari cookie menggunakan 'next/headers' (Next.js 13)
    const tokenCookie = cookies().get("authToken");
    if (!tokenCookie) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = tokenCookie.value;

    // Verifikasi token JWT menggunakan jose
    const { payload } = await jwtVerify(token, SECRET);

    // Token valid, mengembalikan userId yang ditemukan di payload
    return NextResponse.json({ message: "Token valid", userId: payload.id });
  } catch (error) {
    // Jika token tidak valid atau ada error lain
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }
}
