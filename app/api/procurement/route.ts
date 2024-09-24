import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Handle GET request to fetch procurement data
export async function GET() {
  try {
    const procurements = await prisma.procurement.findMany(); // Fetch all procurements
    return new Response(JSON.stringify(procurements), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Error fetching procurement data", { status: 500 });
  }
}

// Handle POST request to create procurement data
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { itemName, quantity, unitPrice, supplierName, purchaseDate } = data;

    // Validasi input
    if (
      !itemName ||
      quantity == null ||
      unitPrice == null ||
      !supplierName ||
      !purchaseDate
    ) {
      return new Response("All fields are required", { status: 400 });
    }

    // Pastikan purchaseDate adalah objek Date
    const parsedPurchaseDate = new Date(purchaseDate);
    if (isNaN(parsedPurchaseDate.getTime())) {
      return new Response("Invalid purchaseDate", { status: 400 });
    }

    // Hitung totalPrice
    const totalPrice = quantity * unitPrice;

    // Simpan data ke database
    const procurement = await prisma.procurement.create({
      data: {
        itemName,
        quantity,
        unitPrice,
        totalPrice,
        supplierName,
        purchaseDate: parsedPurchaseDate,
      },
    });

    return new Response(JSON.stringify(procurement), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Error saving procurement", { status: 500 });
  }
}
