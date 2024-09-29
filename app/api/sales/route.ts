import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { products } = await req.json();

    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: "No products to save" },
        { status: 400 }
      );
    }

    // Simpan data penjualan
    const salesData = products.map((product: any) => ({
      product_id: product.id,
      product_name: product.name,
      quantity: product.quantity,
      price: product.price,
      total_revenue: product.price * product.quantity,
      created_at: new Date().toISOString(),
    }));

    const { data: salesDataResult, error: salesError } = await supabase
      .from("sales")
      .insert(salesData);

    if (salesError) {
      console.error("Supabase error:", salesError);
      throw salesError;
    }

    // Update stok produk setelah penjualan
    for (const product of products) {
      console.log("Product ID:", product.id); // Memastikan product.id sudah benar

      const { data: productionData, error: productionError } = await supabase
        .from("productions") // Pastikan ini adalah tabel yang benar
        .select("production_quantity") // Pastikan kolom ini ada
        .eq("id", product.id)
        .single();

      if (productionError) {
        console.error("Error fetching product stock:", productionError);
        return NextResponse.json(
          { error: `Failed to fetch stock for product ID: ${product.id}` },
          { status: 400 }
        );
      }

      console.log("Fetched production data:", productionData); // Memeriksa data yang diterima

      if (!productionData) {
        return NextResponse.json(
          { error: `Product with ID ${product.id} not found` },
          { status: 404 }
        );
      }

      const updatedStock =
        productionData.production_quantity - product.quantity; // Pastikan nama kolomnya benar

      if (updatedStock < 0) {
        return NextResponse.json(
          { error: "Stock is insufficient for product: " + product.name },
          { status: 400 }
        );
      }

      const { error: updateError } = await supabase
        .from("productions") // Pastikan ini adalah tabel yang benar
        .update({ production_quantity: updatedStock }) // Pastikan nama kolomnya benar
        .eq("id", product.id);

      if (updateError) {
        console.error("Error updating product stock:", updateError);
        throw updateError;
      }
    }

    return NextResponse.json(
      {
        message: "Sales data saved and stock updated successfully",
        salesDataResult,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving sales data:", error);
    return NextResponse.json(
      { error: "Failed to save sales data" },
      { status: 500 }
    );
  }
}
