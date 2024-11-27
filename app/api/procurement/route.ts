// app/api/procurement/route.ts
import { supabase } from "../../../lib/supabaseClient";

// Handle GET request to fetch procurement data
export async function GET() {
  try {
    // Fetch all procurements from Supabase
    const { data: procurements, error } = await supabase
      .from("procurements")
      .select("*");

    if (error) {
      console.error(error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

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

    // Insert data ke tabel procurements di Supabase
    const { data: procurement, error } = await supabase
      .from("procurements")
      .insert([
        {
          item_name: itemName, // Periksa nama kolom di Supabase
          quantity: quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
          supplier_name: supplierName,
          purchase_date: parsedPurchaseDate.toISOString(),
        },
      ])
      .single();

    if (error) {
      console.error(error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(procurement), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Error saving procurement", { status: 500 });
  }
}
