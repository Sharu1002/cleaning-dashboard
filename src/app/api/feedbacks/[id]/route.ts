import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";
import type { Status } from "@/types";

type FeedbackUpdate = {
  status?: Status;
  assigned_cleaner?: string | null;
  assigned_cleaner_phone?: string | null;
  internal_note?: string | null;
  forwarded_at?: string | null;
  done_at?: string | null;
  replied_at?: string | null;
};

const ALLOWED_FIELDS: (keyof FeedbackUpdate)[] = [
  "status",
  "assigned_cleaner",
  "assigned_cleaner_phone",
  "internal_note",
  "forwarded_at",
  "done_at",
  "replied_at",
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as FeedbackUpdate;

    const updates: Record<string, unknown> = {};
    for (const field of ALLOWED_FIELDS) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("feedbacks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Update feedback error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
