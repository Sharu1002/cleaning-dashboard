import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("cleaners")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Fetch cleaners error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
