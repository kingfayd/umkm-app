import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "defaultsecret"
);

export async function GET() {
  try {
    // Ambil token dari cookie
    const tokenCookie = cookies().get("authToken");
    if (!tokenCookie) {
      return NextResponse.json(
        { error: "Token tidak tersedia" },
        { status: 401 }
      );
    }

    const token = tokenCookie.value;

    // Verifikasi token
    let decoded;
    try {
      decoded = await jwtVerify(token, SECRET);
    } catch (err) {
      console.error("Token tidak valid:", err);
      return NextResponse.json({ error: "Token tidak valid" }, { status: 401 });
    }

    // Pastikan payload dan ID tersedia
    const userId = decoded.payload.id;
    if (!userId) {
      return NextResponse.json(
        { error: "ID Pengguna tidak ditemukan" },
        { status: 401 }
      );
    }

    // Konversi userId ke number jika diperlukan
    const userIdNumber = Number(userId);

    // Ambil data bahan baku dari database untuk user tertentu
    const rawMaterialItems = await prisma.procurement.findMany({
      where: {
        userId: userIdNumber, // Gunakan userId yang sudah dikonversi ke number
        category: "Bahan Baku Produksi",
      },
      select: {
        id: true,
        itemName: true,
        currentQuantity: true,
        unit: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    // Kembalikan respons JSON dengan data bahan baku
    return NextResponse.json(rawMaterialItems, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Kesalahan saat mengambil item bahan baku:", error);

    // Tangani error dengan lebih spesifik
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: "Gagal mengambil item bahan baku",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Fallback untuk error yang tidak diketahui
    return NextResponse.json(
      { error: "Kesalahan server internal" },
      { status: 500 }
    );
  }
}
