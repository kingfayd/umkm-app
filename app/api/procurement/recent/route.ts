import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";
import { serializeProcurement } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);
    const items = await prisma.procurement.findMany({
      where: { userId, purchaseDate: { gte: currentMonthStart } },
      orderBy: { purchaseDate: "desc" },
      take: 5,
    });
    return NextResponse.json(items.map(serializeProcurement), {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("Error fetching recent procurements:", error);
    return NextResponse.json(
      { error: "Unable to fetch recent procurements" },
      { status: 500 }
    );
  }
}
