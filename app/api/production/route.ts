import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const productions = await prisma.production.findMany({
      where: { userId },
      include: {
        items: {
          where: { procurement: { is: { userId } } },
          include: { procurement: { select: { itemName: true } } },
        },
      },
      orderBy: { productionDate: "desc" },
    });
    return NextResponse.json(
      productions.map((production) => ({
        id: production.id,
        productName: production.productName,
        productionDate: production.productionDate.toISOString(),
        productionQuantity: production.productionQuantity,
        items: production.items.map((item) => ({
          itemName: item.procurement.itemName,
          quantity: item.quantity,
        })),
      }))
    );
  } catch (error) {
    console.error("Error fetching production data:", error);
    return new NextResponse("Error fetching production data", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { message: "Invalid request body" },
        { status: 400 }
      );
    }

    const input = body as Record<string, unknown>;
    const { items, productionDate, productName, productionQuantity } = input;
    if (
      typeof productName !== "string" || !productName.trim() ||
      typeof productionDate !== "string" ||
      typeof productionQuantity !== "number" ||
      !Number.isSafeInteger(productionQuantity) ||
      Number(productionQuantity) < 1 ||
      Number(productionQuantity) > 2147483647 ||
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > 100 ||
      items.some(
        (item) =>
          !item ||
          typeof item !== "object" ||
          typeof (item as Record<string, unknown>).id !== "number" ||
          !Number.isSafeInteger((item as Record<string, unknown>).id) ||
          Number((item as Record<string, unknown>).id) < 1 ||
          typeof (item as Record<string, unknown>).quantity !== "number" ||
          !Number.isSafeInteger((item as Record<string, unknown>).quantity) ||
          Number((item as Record<string, unknown>).quantity) < 1 ||
          Number((item as Record<string, unknown>).quantity) > 2147483647
      )
    ) {
      return NextResponse.json(
        { message: "Invalid production details" },
        { status: 400 }
      );
    }

    const parsedDate = new Date(productionDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { message: "Invalid productionDate" },
        { status: 400 }
      );
    }

    const quantities = new Map<number, number>();
    for (const item of items as { id: number; quantity: number }[]) {
      quantities.set(item.id, (quantities.get(item.id) ?? 0) + item.quantity);
    }
    if (Array.from(quantities.values()).some((quantity) => quantity > 2147483647)) {
      return NextResponse.json(
        { message: "Material quantity is too large" },
        { status: 400 }
      );
    }
    const orderedItems = Array.from(quantities.entries()).sort(([a], [b]) => a - b);

    const production = await prisma.$transaction(async (tx) => {
      for (const [procurementId, quantity] of orderedItems) {
        const update = await tx.procurement.updateMany({
          where: {
            id: procurementId,
            userId,
            category: "Bahan Baku Produksi",
            currentQuantity: { gte: quantity },
          },
          data: { currentQuantity: { decrement: quantity } },
        });
        if (update.count !== 1) {
          throw new Error("INSUFFICIENT_OR_INVALID_STOCK");
        }
      }

      return tx.production.create({
        data: {
          productName: productName.trim(),
          productionDate: parsedDate,
          productionQuantity: Number(productionQuantity),
          userId,
          items: {
            create: orderedItems.map(([procurementId, quantity]) => ({
              quantity,
              procurement: { connect: { id: procurementId } },
            })),
          },
        },
        include: { items: true },
      });
    });

    return NextResponse.json(production, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_OR_INVALID_STOCK") {
      return NextResponse.json(
        {
          message:
            "A selected raw material is unavailable or has insufficient stock",
        },
        { status: 409 }
      );
    }
    console.error("Error saving production:", error);
    return NextResponse.json(
      { message: "Error saving production" },
      { status: 500 }
    );
  }
}
