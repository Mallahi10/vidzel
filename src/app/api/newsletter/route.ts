import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role key so we can insert without user session
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!
);

/* ── POST /api/newsletter — subscribe ── */
export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const normalized = email.toLowerCase().trim();

  const { error } = await supabaseAdmin
    .from("newsletter_subscriptions")
    .upsert({ email: normalized, subscribed: true, updated_at: new Date().toISOString() }, { onConflict: "email" });

  if (error) {
    console.error("[newsletter] subscribe error:", error.message);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/* ── DELETE /api/newsletter — unsubscribe ── */
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("newsletter_subscriptions")
    .update({ subscribed: false, updated_at: new Date().toISOString() })
    .eq("email", email.toLowerCase().trim());

  if (error) {
    console.error("[newsletter] unsubscribe error:", error.message);
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
