import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

// api/procurement/route.ts

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "defaultsecret"
);

export async function GET() {
  try {
    // Ambil token dari cookie
    const tokenCookie = cookies().get("authToken");
    if (!tokenCookie) {
      return new NextResponse("Token not provided", { status: 401 });
    }

    const token = tokenCookie.value;

    // Verifikasi token
    let decoded;
    try {
      decoded = await jwtVerify(token, SECRET);
    } catch (err) {
      console.error("Invalid token:", err);
      return new NextResponse("Invalid token", { status: 401 });
    }

    const userId = decoded.payload.id;
    if (!userId) {
      return new NextResponse("User ID not found in token", { status: 401 });
    }

    // Ambil data dari database untuk user tertentu
    const procurementData = await prisma.procurement.findMany({
      where: { userId },
    });

    return NextResponse.json(procurementData, { status: 200 });
  } catch (error) {
    console.error("Error fetching procurement data:", error);
    return new NextResponse("Error fetching procurement data", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Mendapatkan data dari request body
    const data: {
      category?: string;
      itemName?: string;
      quantity?: string | number;
      unit?: string;
      totalPrice?: string | number;
      supplierName?: string;
      purchaseDate?: string;
    } = await req.json();
    console.log("Data received:", data); // Debugging: log data yang diterima

    // Ambil token dari cookie
    const tokenCookie = cookies().get("authToken");
    if (!tokenCookie) {
      return new NextResponse("Token not provided", { status: 401 });
    }

    const token = tokenCookie.value;

    // Verifikasi dan dekode token
    let decoded;
    try {
      decoded = await jwtVerify(token, SECRET);
    } catch (err) {
      console.error("Invalid token:", err);
      return new NextResponse("Invalid token", { status: 401 });
    }

    const userId = decoded.payload.id;
    if (!userId || typeof userId !== "number") {
      return new NextResponse("Invalid token: userId not found", {
        status: 401,
      });
    }

    // Extract data dari request
    const {
      category,
      itemName,
      quantity,
      totalPrice,
      supplierName,
      purchaseDate,
    } = data;
    console.log("userId:", userId); // Debugging: log nilai userId

    // Validasi input
    if (!category || !purchaseDate || totalPrice == null) {
      return new NextResponse(
        "Category, purchaseDate, and unitPrice are required",
        { status: 400 }
      );
    }

    const parsedQuantity = quantity ? Number(quantity) : null;
    const parsedUnitPrice = Number(totalPrice);

    if (
      isNaN(parsedUnitPrice) ||
      (parsedQuantity !== null && isNaN(parsedQuantity))
    ) {
      console.warn("Invalid quantity or unitPrice format");
      return new NextResponse("Quantity and unit price must be valid numbers", {
        status: 400,
      });
    }

    const parsedPurchaseDate = new Date(purchaseDate);
    if (isNaN(parsedPurchaseDate.getTime())) {
      console.warn("Invalid purchaseDate format");
      return new NextResponse("Invalid purchaseDate", { status: 400 });
    }

    // Menyimpan procurement ke database
    const procurement = await prisma.procurement.create({
      data: {
        category,
        itemName: itemName ?? "", // Menggunakan string kosong sebagai nilai default
        initialQuantity: parsedQuantity ?? undefined,
        currentQuantity: parsedQuantity ?? undefined,
        unit: data.unit ?? null,
        unitPrice: 0,
        totalPrice: parsedUnitPrice,
        supplierName: supplierName ?? null, // Tetap null jika supplierName kosong
        purchaseDate: parsedPurchaseDate,
        userId,
      },
    });

    // Mengembalikan response dengan data procurement yang telah disimpan
    return NextResponse.json(procurement, { status: 201 });
  } catch (error) {
    console.error("Error saving procurement:", error);
    return new NextResponse("Error saving procurement", { status: 500 });
  }
}
