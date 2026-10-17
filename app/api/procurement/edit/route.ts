import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";
import { serializeProcurement } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!Number.isSafeInteger(id) || id < 1) {
      return NextResponse.json({ message: "Valid ID is required" }, { status: 400 });
    }

    const procurement = await prisma.procurement.findFirst({
      where: { id, userId },
    });
    if (!procurement) {
      return NextResponse.json(
        { message: "Data pengadaan tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...serializeProcurement(procurement),
      quantity: procurement.initialQuantity,
      purchaseDate: procurement.purchaseDate.toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("Error fetching procurement data:", error);
    return NextResponse.json(
      { message: "Error fetching procurement data" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
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
    const id = Number(input.id);
    const { category, itemName, quantity, unit, totalPrice, supplierName, purchaseDate } = input;
    if (
      !Number.isSafeInteger(id) || id < 1 ||
      typeof category !== "string" || !category.trim() ||
      typeof purchaseDate !== "string" ||
      (typeof totalPrice !== "number" && typeof totalPrice !== "string")
    ) {
      return NextResponse.json(
        { message: "ID, category, purchaseDate, and totalPrice are required" },
        { status: 400 }
      );
    }

    const parsedQuantity =
      quantity == null || quantity === "" ? null : Number(quantity);
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
        { message: "Quantity and totalPrice must be valid non-negative numbers" },
        { status: 400 }
      );
    }

    const parsedPurchaseDate = new Date(purchaseDate);
    if (Number.isNaN(parsedPurchaseDate.getTime())) {
      return NextResponse.json(
        { message: "Invalid purchaseDate format" },
        { status: 400 }
      );
    }

    const updateResult = await prisma.$transaction(async (tx) => {
      const existing = await tx.procurement.findFirst({
        where: { id, userId },
        select: { initialQuantity: true },
      });
      if (!existing) return "not-found" as const;

      const quantityDelta =
        parsedQuantity === null
          ? null
          : parsedQuantity - existing.initialQuantity;
      const updated = await tx.procurement.updateMany({
        where: {
          id,
          userId,
          ...(quantityDelta !== null
            ? {
                initialQuantity: existing.initialQuantity,
                currentQuantity: { gte: Math.max(0, -quantityDelta) },
              }
            : {}),
        },
        data: {
          category: category.trim(),
          ...(typeof itemName === "string" ? { itemName: itemName.trim() } : {}),
          ...(parsedQuantity !== null && quantityDelta !== null
            ? {
                initialQuantity: parsedQuantity,
                currentQuantity: { increment: quantityDelta },
              }
            : {}),
          unit: typeof unit === "string" && unit ? unit : null,
          totalPrice: parsedTotalPrice.toFixed(2),
          supplierName:
            typeof supplierName === "string" && supplierName.trim()
              ? supplierName.trim()
              : null,
          purchaseDate: parsedPurchaseDate,
        },
      });
      return updated.count === 1 ? ("updated" as const) : ("conflict" as const);
    });
    if (updateResult === "not-found") {
      return NextResponse.json(
        { message: "Data pengadaan tidak ditemukan" },
        { status: 404 }
      );
    }
    if (updateResult === "conflict") {
      return NextResponse.json(
        { message: "Stok berubah atau tidak cukup untuk menurunkan jumlah pengadaan" },
        { status: 409 }
      );
    }

    const procurement = await prisma.procurement.findFirst({
      where: { id, userId },
    });
    return procurement
      ? NextResponse.json(serializeProcurement(procurement))
      : NextResponse.json(
          { message: "Data pengadaan tidak ditemukan" },
          { status: 404 }
        );
  } catch (error) {
    console.error("Error updating procurement data:", error);
    return NextResponse.json(
      { message: "Error updating procurement data" },
      { status: 500 }
    );
  }
}
