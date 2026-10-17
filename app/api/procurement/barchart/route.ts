import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

const monthNames = [
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
    const userId = await getAuthenticatedUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const now = new Date();
    const monthlyTotals = await Promise.all(
      Array.from({ length: 6 }, (_, index) => {
        const monthDate = new Date(
          now.getFullYear(),
          now.getMonth() - 5 + index,
          1
        );
        return prisma.procurement
          .aggregate({
            where: {
              userId,
              purchaseDate: {
                gte: monthDate,
                lt: new Date(
                  monthDate.getFullYear(),
                  monthDate.getMonth() + 1,
                  1
                ),
              },
            },
            _sum: { totalPrice: true },
          })
          .then((result) => ({
            name: monthNames[monthDate.getMonth()],
            total: Number(result._sum.totalPrice ?? 0),
          }));
      })
    );

    return NextResponse.json(monthlyTotals);
  } catch (error) {
    console.error("Error fetching procurement chart:", error);
    return NextResponse.json(
      { error: "Unable to fetch procurement chart" },
      { status: 500 }
    );
  }
}
