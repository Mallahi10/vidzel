import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!.trim(),
    { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } }
  );
}

// POST /api/upload-resource
//   file/video  → returns { signedUrl, publicUrl }  (browser uploads directly to Supabase)
//   link/note   → inserts DB record, returns { resource }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId, title, type, userId, fileName, value } = body;

    if (!workspaceId || !title || !type || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = adminClient();

    if (type === "file" || type === "video") {
      const safeName = (fileName ?? "file").replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${workspaceId}/${Date.now()}_${safeName}`;

      const { data, error } = await supabase.storage
        .from("workspace-resources")
        .createSignedUploadUrl(filePath);

      if (error) {
        console.error("[upload-resource] createSignedUploadUrl:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const publicUrl =
        `${process.env.NEXT_PUBLIC_SUPABASE_URL!.trim()}/storage/v1/object/public/workspace-resources/${filePath}`;

      return NextResponse.json({ signedUrl: data.signedUrl, publicUrl });

    } else {
      if (!value?.trim()) {
        return NextResponse.json({ error: "Missing value" }, { status: 400 });
      }

      const { data, error: insertError } = await supabase
        .from("resources")
        .insert({ workspace_id: workspaceId, title, type, value: value.trim(), uploaded_by: userId })
        .select()
        .single();

      if (insertError) {
        console.error("[upload-resource] insert:", insertError.message);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({ resource: data });
    }
  } catch (err: any) {
    console.error("[upload-resource] unexpected:", err?.message ?? err);
    return NextResponse.json({ error: err?.message ?? "Unexpected error" }, { status: 500 });
  }
}
