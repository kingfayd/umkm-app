import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const now = new Date();
    const total = await prisma.procurement.aggregate({
      _sum: { totalPrice: true },
      where: {
        userId,
        purchaseDate: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1),
          lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        },
      },
    });
    return NextResponse.json({
      total: Number(total._sum.totalPrice ?? 0),
      month: monthNames[now.getMonth()],
      year: now.getFullYear(),
    });
  } catch (error) {
    console.error("Error fetching total procurement:", error);
    return NextResponse.json(
      { message: "Unable to fetch procurement total" },
      { status: 500 }
    );
  }
}
