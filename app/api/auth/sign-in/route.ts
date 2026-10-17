// app/api/auth/sign-in/route.ts
import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import bcrypt from "bcryptjs";
import {
  AUTH_COOKIE_MAX_AGE,
  AUTH_COOKIE_NAME,
} from "../../../../lib/auth";
import { createAuthToken } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    if (
      !body ||
      typeof body !== "object" ||
      !("email" in body) ||
      !("password" in body) ||
      typeof body.email !== "string" ||
      typeof body.password !== "string" ||
      !body.email.trim() ||
      !body.password
    ) {
      return NextResponse.json(
        { message: "Both email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        email: { equals: body.email.trim(), mode: "insensitive" },
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(body.password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = await createAuthToken({ id: user.id, email: user.email });

    const response = NextResponse.json({ message: "Sign-in successful" });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true, // Agar cookie hanya bisa diakses oleh server
      secure: process.env.NODE_ENV === "production", // Menggunakan secure cookie jika di production
      sameSite: "strict", // Mencegah akses cookie oleh situs lain
      path: "/", // Cookie dapat diakses di seluruh aplikasi
      maxAge: AUTH_COOKIE_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("Error signing in:", error);
    return NextResponse.json(
      { message: "Error signing in" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
