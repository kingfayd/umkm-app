// app/api/procurement/barchart/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose"; // Menggunakan 'jose' untuk verifikasi token JWT
import { cookies } from "next/headers"; // Menggunakan cookies dari Next.js
import { MonthlyProcurement } from "@/@types/MonthlyProcurement";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "defaultsecret"
);

const bulanIndonesia = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export async function GET() {
  try {
    // Mengambil token dari cookie (ini hanya bisa diakses di server)
    const tokenCookie = cookies().get("authToken");
    if (!tokenCookie) {
      console.error("Token tidak ditemukan");
      return new NextResponse("Token tidak ditemukan", { status: 401 });
    }

    const token = tokenCookie.value;
    console.log("Token diterima:", token); // Debugging token

    // Verifikasi token JWT
    let decoded;
    try {
      decoded = await jwtVerify(token, SECRET);
    } catch (err) {
      console.error("Token tidak valid:", err);
      return new NextResponse("Token tidak valid", { status: 401 });
    }

    // Ambil userId dari payload token
    const userId = decoded.payload.id;
    if (!userId) {
      console.error("UserId tidak ditemukan dalam token");
      return new NextResponse("User ID tidak ditemukan dalam token", {
        status: 401,
      });
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-indexed (0 = Januari)

    const monthlyTotal: MonthlyProcurement[] = [];

    for (let i = 0; i < 6; i++) {
      const month = (currentMonth - i + 12) % 12;
      const year = currentMonth - i < 0 ? currentYear - 1 : currentYear;

      const total = await prisma.procurement.aggregate({
        where: {
          userId,
          purchaseDate: {
            gte: new Date(year, month, 1),
            lt: new Date(year, month + 1, 1),
          },
        },
        _sum: {
          totalPrice: true,
        },
      });

      monthlyTotal.push({
        name: bulanIndonesia[month],
        total: total._sum.totalPrice || 0,
      });
    }

    return NextResponse.json(monthlyTotal.reverse());
  } catch (error) {
    console.error("Error fetching procurement data:", error);
    return new NextResponse("Error fetching procurement data", { status: 500 });
  }
}
