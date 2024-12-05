import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "defaultsecret"
);

export async function GET(req: Request) {
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
    const rawMaterialItems = await prisma.procurement.findMany({
      where: { userId, category: "Bahan Baku Produksi" },
      select: {
        id: true,
        itemName: true,
        currentQuantity: true,
      },
    });

    return NextResponse.json(rawMaterialItems);
  } catch (error) {
    console.error("Error fetching raw material items:", error);
    return NextResponse.json(
      { error: "Error fetching raw material items" },
      { status: 500 }
    );
  }
}
