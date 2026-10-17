import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const lowStockItems = await prisma.procurement.findMany({
      where: {
        userId,
        currentQuantity: { lte: 10 },
        category: "Bahan Baku Produksi",
      },
      select: { id: true, itemName: true, currentQuantity: true },
    });
    return NextResponse.json(lowStockItems, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("Error fetching low stock items:", error);
    return NextResponse.json(
      { error: "Unable to fetch low stock items" },
      { status: 500 }
    );
  }
}
