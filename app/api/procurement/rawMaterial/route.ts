import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const items = await prisma.procurement.findMany({
      where: { userId, category: "Bahan Baku Produksi" },
      select: { id: true, itemName: true, currentQuantity: true, unit: true },
      orderBy: { id: "desc" },
    });
    return NextResponse.json(items, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("Error fetching raw materials:", error);
    return NextResponse.json(
      { error: "Unable to fetch raw materials" },
      { status: 500 }
    );
  }
}
