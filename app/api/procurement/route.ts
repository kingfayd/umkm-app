import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";
import { serializeProcurement } from "@/lib/serializers";

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const procurementData = await prisma.procurement.findMany({
      where: { userId },
      orderBy: { purchaseDate: "desc" },
    });
    return NextResponse.json(procurementData.map(serializeProcurement));
  } catch (error) {
    console.error("Error fetching procurement data:", error);
    return new NextResponse("Error fetching procurement data", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data: unknown = await req.json();
    if (!data || typeof data !== "object") {
      return NextResponse.json(
        { message: "Invalid request body" },
        { status: 400 }
      );
    }
    const input = data as Record<string, unknown>;
    const { category, itemName, quantity, totalPrice, supplierName, purchaseDate, unit } = input;

    if (
      typeof category !== "string" || !category.trim() ||
      typeof purchaseDate !== "string" ||
      (typeof totalPrice !== "number" && typeof totalPrice !== "string")
    ) {
      return NextResponse.json(
        { message: "Category, purchaseDate, and totalPrice are required" },
        { status: 400 }
      );
    }

    const parsedQuantity = quantity == null || quantity === "" ? null : Number(quantity);
    const parsedTotalPrice = Number(totalPrice);
    if (
      !Number.isFinite(parsedTotalPrice) || parsedTotalPrice < 0 ||
      parsedTotalPrice > 9999999999.99 ||
      (parsedQuantity !== null &&
        (!Number.isSafeInteger(parsedQuantity) ||
          parsedQuantity < 0 ||
          parsedQuantity > 2147483647))
    ) {
      return NextResponse.json(
        { message: "Quantity and total price must be valid non-negative numbers" },
        { status: 400 }
      );
    }

    const parsedPurchaseDate = new Date(purchaseDate);
    if (Number.isNaN(parsedPurchaseDate.getTime())) {
      return NextResponse.json(
        { message: "Invalid purchaseDate" },
        { status: 400 }
      );
    }

    const procurement = await prisma.procurement.create({
      data: {
        category: category.trim(),
        itemName: typeof itemName === "string" ? itemName.trim() : "",
        initialQuantity: parsedQuantity ?? undefined,
        currentQuantity: parsedQuantity ?? undefined,
        unit: typeof unit === "string" && unit ? unit : null,
        unitPrice: 0,
        totalPrice: parsedTotalPrice.toFixed(2),
        supplierName: typeof supplierName === "string" && supplierName.trim()
          ? supplierName.trim()
          : null,
        purchaseDate: parsedPurchaseDate,
        userId,
      },
    });

    return NextResponse.json(serializeProcurement(procurement), { status: 201 });
  } catch (error) {
    console.error("Error saving procurement:", error);
    return NextResponse.json(
      { message: "Error saving procurement" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id"));
    if (!Number.isSafeInteger(id) || id < 1) {
      return new NextResponse("Valid ID is required", { status: 400 });
    }
    const userId = await getAuthenticatedUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const result = await prisma.$transaction(async (tx) => {
      const procurement = await tx.procurement.findFirst({
        where: { id, userId },
        select: { id: true },
      });
      if (!procurement) return "not-found" as const;

      const hasProductionHistory = await tx.productionItem.findFirst({
        where: { procurementId: id },
        select: { id: true },
      });
      if (hasProductionHistory) return "in-use" as const;

      await tx.procurement.delete({ where: { id } });
      return "deleted" as const;
    });

    if (result === "not-found") {
      return new NextResponse("Data not found or you don't have permission", {
        status: 404,
      });
    }
    if (result === "in-use") {
      return new NextResponse("Procurement referenced by production history cannot be deleted", {
        status: 409,
      });
    }
    return NextResponse.json({ message: "Data successfully deleted" });
  } catch (error) {
    console.error("Error deleting procurement:", error);
    return new NextResponse("Error deleting procurement", { status: 500 });
  }
}
