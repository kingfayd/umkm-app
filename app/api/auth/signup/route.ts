import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

// Inisialisasi Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL and Key must be provided");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Memeriksa apakah pengguna sudah terdaftar
    const { data: existingUser, error: existingUserError } = await supabase
      .from("users") // Ganti dengan nama tabel yang sesuai
      .select("*")
      .eq("email", email)
      .single();

    if (existingUserError && existingUserError.code !== "PGRST204") {
      return NextResponse.json(
        { message: "Internal server error while checking existing user" },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 400 }
      );
    }

    // Meng-hash password sebelum disimpan
    const hashedPassword = await bcrypt.hash(password, 12);

    // Menambahkan pengguna baru
    const { data: user, error: createUserError } = await supabase
      .from("users") // Ganti dengan nama tabel yang sesuai
      .insert([
        {
          username,
          email,
          password: hashedPassword,
        },
      ])
      .single();

    if (createUserError) {
      return NextResponse.json(
        { message: "Error creating user" },
        { status: 500 }
      );
    }

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
