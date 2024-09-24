import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// GET: Mendapatkan data produksi
export async function GET() {
  try {
    const productions = await prisma.production.findMany({
      include: {
        items: {
          include: {
            procurement: true, // Menyertakan detail pengadaan
          },
        },
      },
    });

    // Format data agar sesuai dengan yang diharapkan di komponen
    const formattedProductions = productions.map((production) => ({
      id: production.id,
      productName: production.productName,
      productionDate: production.productionDate.toISOString(), // Format ISO untuk tanggal
      productionQuantity: production.productionQuantity,
      items: production.items.map((item) => ({
        itemName: item.procurement.itemName,
        quantity: item.quantity,
      })),
    }));

    return NextResponse.json(formattedProductions);
  } catch (error) {
    console.error(error);
    return new NextResponse("Error fetching production data", { status: 500 });
  }
}

// Interface untuk item produksi
interface ProductionItem {
  itemName: string;
  quantity: number;
  id: number; // ID dari item
}

// POST: Menyimpan data produksi
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const {
      items,
      productionDate,
      productName,
      productionQuantity,
    }: {
      items: ProductionItem[];
      productionDate: string;
      productName: string;
      productionQuantity: number;
    } = await req.json();

    // Validasi input
    if (
      !items ||
      items.length === 0 ||
      !productionDate ||
      !productName ||
      !productionQuantity
    ) {
      return new NextResponse(
        JSON.stringify({ error: "All fields are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const parsedProductionDate = new Date(productionDate);
    if (isNaN(parsedProductionDate.getTime())) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid productionDate format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Loop untuk memeriksa ketersediaan stok dan memperbarui stok
    for (const item of items) {
      const { id, quantity } = item;

      if (quantity <= 0 || !id) {
        return new NextResponse(
          JSON.stringify({
            error: "Valid ID and positive quantity are required",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const procurementItem = await prisma.procurement.findUnique({
        where: { id },
      });
      if (!procurementItem) {
        return new NextResponse(
          JSON.stringify({ error: `Item with ID '${id}' not found` }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      if (quantity > procurementItem.quantity) {
        return new NextResponse(
          JSON.stringify({
            error: `Quantity exceeds available stock for item '${procurementItem.itemName}'`,
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Update stok
      await prisma.procurement.update({
        where: { id: procurementItem.id },
        data: { quantity: procurementItem.quantity - quantity },
      });
    }

    // Tambahkan data produksi
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0); // Hitung total quantity

    const production = await prisma.production.create({
      data: {
        productName,
        productionDate: parsedProductionDate,
        productionQuantity,
        quantity: totalQuantity, // Sertakan total quantity
        items: {
          create: items.map(({ id, quantity }) => ({
            procurementId: id,
            quantity,
          })), // Sertakan quantity dalam relasi
        },
      },
    });

    return new NextResponse(
      JSON.stringify({ message: "Production data saved", production }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error saving production data:", error);
    return new NextResponse(
      JSON.stringify({
        error: "An error occurred while saving production data",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
