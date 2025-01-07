// api/procurement/total/route.ts
import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "defaultsecret"
);

async function verifyToken(token: string) {
  try {
    const decoded = await jwtVerify(token, SECRET);
    return decoded.payload.id;
  } catch (err) {
    console.error("Invalid token:", err);
    return null;
  }
}

export async function GET() {
  try {
    const tokenCookie = cookies().get("authToken");
    if (!tokenCookie) {
      return new NextResponse("Token not provided", { status: 401 });
    }

    const userId = await verifyToken(tokenCookie.value);
    if (!userId) {
      return new NextResponse("Invalid token", { status: 401 });
    }

    // Dapatkan tanggal awal dan akhir bulan ini
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Hitung total pengeluaran bulan ini
    const totalProcurement = await prisma.procurement.aggregate({
      where: {
        userId: Number(userId),
        purchaseDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        totalPrice: true,
      },
    });

    const total = totalProcurement._sum.totalPrice || 0;

    return NextResponse.json({ total }, { status: 200 });
  } catch (error) {
    console.error("Error fetching total procurement:", error);
    return new NextResponse("Error fetching total procurement", {
      status: 500,
    });
  }
}
