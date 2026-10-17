import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [sales, dailyTotals, dailyItems] = await prisma.$transaction([
      prisma.sale.findMany({
        where: { userId },
        include: { items: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.sale.aggregate({
        where: { userId, createdAt: { gte: today } },
        _sum: { totalAmount: true },
      }),
      prisma.saleItem.aggregate({
        where: { sale: { is: { userId, createdAt: { gte: today } } } },
        _sum: { quantity: true },
      }),
    ]);

    return NextResponse.json({
      sales: sales.map((sale) => ({
        id: sale.id,
        createdAt: sale.createdAt.toISOString(),
        totalAmount: Number(sale.totalAmount),
        items: sale.items.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
        })),
      })),
      dailyRevenue: Number(dailyTotals._sum.totalAmount ?? 0),
      dailyQuantity: dailyItems._sum.quantity ?? 0,
    });
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json({ message: "Unable to fetch sales" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body: unknown = await req.json();
    if (
      !body ||
      typeof body !== "object" ||
      !("products" in body) ||
      !Array.isArray(body.products) ||
      body.products.length === 0 ||
      body.products.length > 100 ||
      body.products.some(
        (item) =>
          !item ||
          typeof item !== "object" ||
          typeof (item as Record<string, unknown>).id !== "number" ||
          !Number.isSafeInteger((item as Record<string, unknown>).id) ||
          Number((item as Record<string, unknown>).id) < 1 ||
          typeof (item as Record<string, unknown>).quantity !== "number" ||
          !Number.isSafeInteger((item as Record<string, unknown>).quantity) ||
          Number((item as Record<string, unknown>).quantity) < 1 ||
          Number((item as Record<string, unknown>).quantity) > 2147483647 ||
          typeof (item as Record<string, unknown>).price !== "number" ||
          !Number.isFinite((item as Record<string, unknown>).price) ||
          Number((item as Record<string, unknown>).price) < 0.01 ||
          Number((item as Record<string, unknown>).price) > 9999999999.99
      )
    ) {
      return NextResponse.json({ message: "Invalid sale details" }, { status: 400 });
    }

    const lineItems = body.products as { id: number; price: number; quantity: number }[];
    const products = new Map<number, { priceCents: number; quantity: number }>();
    for (const item of lineItems) {
      const existing = products.get(item.id);
      const priceCents = Math.round(item.price * 100);
      if (existing && existing.priceCents !== priceCents) {
        return NextResponse.json(
          { message: "A product cannot have multiple prices in one sale" },
          { status: 400 }
        );
      }
      products.set(item.id, {
        priceCents,
        quantity: (existing?.quantity ?? 0) + item.quantity,
      });
    }
    if (
      Array.from(products.values()).some(
        (item) =>
          !Number.isSafeInteger(item.quantity) ||
          item.quantity > 2147483647 ||
          !Number.isSafeInteger(item.priceCents * item.quantity)
      )
    ) {
      return NextResponse.json({ message: "Sale quantity is too large" }, { status: 400 });
    }

    const sortedProducts = Array.from(products.entries()).sort(([a], [b]) => a - b);
    const sale = await prisma.$transaction(async (tx) => {
      const productionRows = await tx.production.findMany({
        where: { id: { in: sortedProducts.map(([id]) => id) }, userId },
        select: { id: true, productName: true },
      });
      if (productionRows.length !== sortedProducts.length) {
        throw new Error("INVALID_OR_UNOWNED_PRODUCT");
      }
      const namesById = new Map(productionRows.map((product) => [product.id, product.productName]));

      for (const [productionId, item] of sortedProducts) {
        const updated = await tx.production.updateMany({
          where: {
            id: productionId,
            userId,
            productionQuantity: { gte: item.quantity },
          },
          data: { productionQuantity: { decrement: item.quantity } },
        });
        if (updated.count !== 1) throw new Error("INSUFFICIENT_PRODUCT_STOCK");
      }

      const totalCents = sortedProducts.reduce(
        (total, [, item]) => total + item.priceCents * item.quantity,
        0
      );
      if (!Number.isSafeInteger(totalCents) || totalCents > 999999999999) {
        throw new Error("SALE_TOTAL_OUT_OF_RANGE");
      }

      return tx.sale.create({
        data: {
          userId,
          totalAmount: (totalCents / 100).toFixed(2),
          items: {
            create: sortedProducts.map(([productionId, item]) => ({
              productionId,
              productName: namesById.get(productionId)!,
              quantity: item.quantity,
              unitPrice: (item.priceCents / 100).toFixed(2),
            })),
          },
        },
        include: { items: true },
      });
    });

    return NextResponse.json(
      {
        id: sale.id,
        createdAt: sale.createdAt.toISOString(),
        totalAmount: Number(sale.totalAmount),
        items: sale.items.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
        })),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_OR_UNOWNED_PRODUCT") {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }
    if (
      error instanceof Error &&
      (error.message === "INSUFFICIENT_PRODUCT_STOCK" ||
        error.message === "SALE_TOTAL_OUT_OF_RANGE")
    ) {
      return NextResponse.json(
        { message: "Insufficient stock or sale total exceeds the allowed limit" },
        { status: 409 }
      );
    }
    console.error("Error saving sale:", error);
    return NextResponse.json({ message: "Unable to save sale" }, { status: 500 });
  }
}
