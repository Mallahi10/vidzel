// NEW ANNOUNCEMENT SYSTEM — PUT (edit) + DELETE
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

/* ═══════════════════════════════════════════════
   PUT /api/announcements/[id]
   Edit title, message, cta_label, cta_url.
   Verifies ownership before updating.
═══════════════════════════════════════════════ */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { organizationId, title, message, cta_label, cta_url } = body;
    const { id } = params;

    if (!organizationId || !id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = adminClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from("announcements")
      .select("id")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Not found or access denied" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("announcements")
      .update({
        title:     title?.trim()     ?? undefined,
        message:   message?.trim()   ?? undefined,
        cta_label: cta_label?.trim() || null,
        cta_url:   cta_url?.trim()   || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ announcement: data });

  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unexpected error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════
   DELETE /api/announcements/[id]
   Verifies ownership before deleting.
═══════════════════════════════════════════════ */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("org_id");
    const { id } = params;

    if (!organizationId || !id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = adminClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from("announcements")
      .select("id")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Not found or access denied" }, { status: 404 });
    }

    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });

  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unexpected error" }, { status: 500 });
  }
}
