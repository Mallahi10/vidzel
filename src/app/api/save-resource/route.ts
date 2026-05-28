import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// POST /api/save-resource
// Called after the client has uploaded the file directly to Supabase Storage.
// Inserts the resource row into the DB and returns the created record.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId, title, type, value, userId } = body;

    if (!workspaceId || !title || !type || !value || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
      (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!.trim(),
      { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } }
    );

    const { data, error } = await supabase
      .from("resources")
      .insert({ workspace_id: workspaceId, title, type, value, uploaded_by: userId })
      .select()
      .single();

    if (error) {
      console.error("[save-resource] insert:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ resource: data });
  } catch (err: any) {
    console.error("[save-resource] unexpected:", err?.message ?? err);
    return NextResponse.json({ error: err?.message ?? "Unexpected error" }, { status: 500 });
  }
}
