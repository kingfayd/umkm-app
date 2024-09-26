import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Inisialisasi Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Interface untuk item produksi
interface ProductionItem {
  itemName: string; // Nama bahan
  quantity: number; // Jumlah item
  id: number; // ID dari item pengadaan
}

// GET: Mendapatkan data produksi
export async function GET() {
  try {
    const { data: productions, error } = await supabase
      .from("productions")
      .select(
        "id, product_name, production_date, production_quantity, production_items(quantity, procurement_id)"
      );

    if (error) throw error;

    // Ambil nama bahan berdasarkan procurement_id
    const itemsPromises = productions.map(async (production) => {
      const { data: items, error: itemsError } = await supabase
        .from("production_items")
        .select("quantity, procurement_id")
        .eq("production_id", production.id);

      if (itemsError) throw itemsError;

      const formattedItems = await Promise.all(
        items.map(async (item) => {
          const { data: procurementItem, error: procurementError } =
            await supabase
              .from("procurements")
              .select("item_name")
              .eq("id", item.procurement_id)
              .single();

          if (procurementError) throw procurementError;

          return {
            itemName: procurementItem?.item_name || "Unknown", // Ambil nama bahan dari tabel procurements
            quantity: item.quantity,
          };
        })
      );

      return {
        id: production.id,
        productName: production.product_name,
        productionDate: new Date(production.production_date).toISOString(),
        productionQuantity: production.production_quantity,
        items: formattedItems,
      };
    });

    const formattedProductions = await Promise.all(itemsPromises);

    return NextResponse.json(formattedProductions);
  } catch (error) {
    console.error("Error fetching production data:", error);
    return new NextResponse("Error fetching production data", { status: 500 });
  }
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
      productionQuantity == null
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

      // Ambil item pengadaan dari Supabase
      const { data: procurementItem, error: procurementError } = await supabase
        .from("procurements")
        .select("id, quantity, item_name")
        .eq("id", id)
        .single();

      if (procurementError || !procurementItem) {
        return new NextResponse(
          JSON.stringify({ error: `Item with ID '${id}' not found` }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      // Cek apakah quantity melebihi stok
      if (quantity > procurementItem.quantity) {
        return new NextResponse(
          JSON.stringify({
            error: `Quantity exceeds available stock for item '${procurementItem.item_name}'`,
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Update stok di Supabase
      await supabase
        .from("procurements")
        .update({ quantity: procurementItem.quantity - quantity })
        .eq("id", procurementItem.id);
    }

    // Tambahkan data produksi
    const { data: production, error: productionError } = await supabase
      .from("productions")
      .insert([
        {
          product_name: productName,
          production_date: parsedProductionDate.toISOString(),
          production_quantity: productionQuantity || 0, // Pastikan nilai quantity diisi
        },
      ])
      .select();

    if (productionError) throw productionError;

    // Insert items ke relasi production_items
    const itemsInsertPromises = items.map((item) => {
      return supabase.from("production_items").insert({
        procurement_id: item.id,
        production_id: production[0].id, // Ambil ID dari produksi yang baru saja dibuat
        quantity: item.quantity || 0, // Pastikan quantity tidak null
      });
    });

    await Promise.all(itemsInsertPromises); // Insert all items concurrently

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
