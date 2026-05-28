// NEW ANNOUNCEMENT SYSTEM — POST (create) + GET (list for org)
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
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
   GET /api/announcements?org_id=...
   Returns the org's own announcements list.
═══════════════════════════════════════════════ */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get("org_id");

  if (!orgId) return NextResponse.json({ error: "Missing org_id" }, { status: 400 });

  const supabase = adminClient();
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

/* ═══════════════════════════════════════════════
   POST /api/announcements
   Body: { organizationId, title, message, audience?,
           announcement_type, target_roles?,
           cta_label?, cta_url?, workspace_id?, project_id?,
           send_email? }
═══════════════════════════════════════════════ */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      organizationId, title, message, audience,
      announcement_type, target_roles,
      cta_label, cta_url, workspace_id, project_id, send_email,
    } = body;

    if (!organizationId || !title?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const annType: string = announcement_type || "organization";

    if (annType === "opportunity_targeted" && (!target_roles || target_roles.length === 0)) {
      return NextResponse.json(
        { error: "Select at least one target role for targeted opportunities." },
        { status: 400 }
      );
    }

    const supabase = adminClient();

    // ── Step 1: Insert announcement
    const { data: announcement, error: annErr } = await supabase
      .from("announcements")
      .insert({
        organization_id:   organizationId,
        title:             title.trim(),
        message:           message.trim(),
        cta_label:         cta_label?.trim()  || null,
        cta_url:           cta_url?.trim()    || null,
        workspace_id:      workspace_id       || null,
        project_id:        project_id         || null,
        audience:          audience           || "all_members",
        announcement_type: annType,
        target_roles:      (target_roles && target_roles.length > 0) ? target_roles : null,
      })
      .select()
      .single();

    if (annErr) {
      console.error("[POST /api/announcements] insert:", annErr.message);
      return NextResponse.json({ error: annErr.message }, { status: 500 });
    }

    // ── Step 2: Denormalize opportunity metadata onto the project row
    // This lets the project detail page read opportunity_type + target_roles directly.
    if (project_id && annType.startsWith("opportunity_")) {
      await supabase
        .from("projects")
        .update({
          opportunity_type: annType,
          target_roles:     (target_roles && target_roles.length > 0) ? target_roles : null,
        })
        .eq("id", project_id);
    }

    // ── Step 3: Resolve target user IDs based on announcement type
    let targetUserIds: string[] = [];

    if (annType === "opportunity_private") {
      // PRIVATE OPPORTUNITY — no fan-out, invitations handle this
      targetUserIds = [];
    } else if (annType === "opportunity_public") {
      // PUBLIC OPPORTUNITY — all authenticated users excluding orgs
      targetUserIds = await resolveAllUsers(supabase);
    } else if (annType === "opportunity_targeted") {
      // TARGETED OPPORTUNITY — filter by roles platform-wide
      targetUserIds = await resolveUsersByRoles(supabase, target_roles);
    } else {
      // ORGANIZATION — workspace members (existing audience logic)
      targetUserIds = await resolveAudience(supabase, organizationId, audience, workspace_id);
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json({ announcement, notified: 0 });
    }

    // ── Step 4: Fan-out notifications
    const notifications = targetUserIds.map((userId: string) => ({
      user_id:      userId,
      type:         "announcement",
      title:        title.trim(),
      message:      message.trim(),
      workspace_id: workspace_id || null,
      project_id:   project_id   || null,
      is_read:      false,
    }));

    const { error: notifErr } = await supabase.from("notifications").insert(notifications);
    if (notifErr) {
      console.error("[POST /api/announcements] notifications insert:", notifErr.message);
      // Non-blocking: announcement saved, notification fan-out failed
    }

    // ── Step 5: Optional email — call Resend directly
    if (send_email && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("email")
        .in("id", targetUserIds);

      const emails = (profiles ?? [])
        .map((p: { email: string }) => p.email)
        .filter(Boolean) as string[];

      await Promise.allSettled(
        emails.map((email) =>
          resend.emails.send({
            from:    "Vidzel <onboarding@resend.dev>",
            to:      email,
            subject: `📢 ${title.trim()} — Vidzel`,
            html:    buildEmailHtml(title.trim(), message.trim(), cta_label, cta_url),
          }).catch(console.error)
        )
      );
    }

    return NextResponse.json({ announcement, notified: targetUserIds.length });

  } catch (err: any) {
    console.error("[POST /api/announcements] unexpected:", err?.message);
    return NextResponse.json({ error: err?.message ?? "Unexpected error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════
   AUDIENCE RESOLUTION — ALL USERS (public opportunity)
   Returns every non-org profile ID on the platform.
═══════════════════════════════════════════════ */
async function resolveAllUsers(supabase: any): Promise<string[]> {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .neq("role", "organization");
  return Array.from(new Set((data ?? []).map((p: any) => String(p.id)))) as string[];
}

/* ═══════════════════════════════════════════════
   AUDIENCE RESOLUTION — BY ROLES (targeted opportunity)
   Returns profile IDs whose role matches any of the given roles.
═══════════════════════════════════════════════ */
async function resolveUsersByRoles(supabase: any, roles: string[]): Promise<string[]> {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .in("role", roles);
  return Array.from(new Set((data ?? []).map((p: any) => String(p.id)))) as string[];
}

/* ═══════════════════════════════════════════════
   AUDIENCE RESOLUTION — WORKSPACE MEMBERS (organization type)
   Existing logic: resolves by workspace membership.
═══════════════════════════════════════════════ */
async function resolveAudience(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  organizationId: string,
  audience: string,
  workspaceId?: string | null
): Promise<string[]> {

  const { data: orgWorkspaces } = await supabase
    .from("workspaces")
    .select("id, type")
    .eq("organization_id", organizationId);

  if (!orgWorkspaces || orgWorkspaces.length === 0) return [];

  if (audience.startsWith("workspace:")) {
    const targetWsId = audience.replace("workspace:", "");
    const ws = orgWorkspaces.find((w: any) => w.id === targetWsId);
    if (!ws) return [];

    const { data: members } = await supabase
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", targetWsId)
      .eq("status", "active");

    return (members ?? []).map((m: any) => m.user_id);
  }

  const publicWsIds = orgWorkspaces
    .filter((w: any) => w.type === "open")
    .map((w: any) => w.id);

  if (workspaceId) {
    const linkedWs = orgWorkspaces.find((w: any) => w.id === workspaceId);
    if (linkedWs?.type === "private") {
      const { data: members } = await supabase
        .from("workspace_members")
        .select("user_id")
        .eq("workspace_id", workspaceId)
        .eq("status", "active");
      return (members ?? []).map((m: any) => m.user_id);
    }
  }

  if (publicWsIds.length === 0) return [];

  const { data: allMembers } = await supabase
    .from("workspace_members")
    .select("user_id, profiles(role)")
    .in("workspace_id", publicWsIds)
    .eq("status", "active");

  if (!allMembers) return [];

  let filtered = allMembers;

  if (audience.startsWith("role:")) {
    const role = audience.replace("role:", "");
    filtered = allMembers.filter((m: any) => m.profiles?.role === role);
  }

  const ids: string[] = Array.from(new Set(filtered.map((m: any) => String(m.user_id))));
  return ids;
}

/* ═══════════════════════════════════════════════
   EMAIL TEMPLATE
═══════════════════════════════════════════════ */
function buildEmailHtml(
  title: string,
  message: string,
  ctaLabel?: string | null,
  ctaUrl?: string | null
): string {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:2rem;background:#f8fafc;border-radius:12px;">
      <div style="background:linear-gradient(135deg,#1e3a5f,#395886,#638ECB);border-radius:10px;padding:1.5rem 2rem;margin-bottom:1.5rem;">
        <h1 style="color:white;margin:0;font-size:1.4rem;font-weight:800;">Vidzel</h1>
        <p style="color:rgba(255,255,255,0.75);margin:4px 0 0;font-size:0.85rem;">Announcement</p>
      </div>
      <h2 style="color:#0f172a;margin:0 0 0.75rem;">${title}</h2>
      <p style="color:#334155;line-height:1.7;margin:0 0 1.5rem;white-space:pre-wrap;">${message}</p>
      ${ctaLabel && ctaUrl ? `
        <a href="${ctaUrl}"
           style="display:inline-block;padding:0.75rem 1.75rem;background:#395886;color:white;border-radius:8px;text-decoration:none;font-weight:700;font-size:0.95rem;">
          ${ctaLabel} →
        </a>
      ` : ""}
      <p style="margin-top:2rem;color:#94a3b8;font-size:0.8rem;border-top:1px solid #e2e8f0;padding-top:1rem;">
        You received this because you are a member of a workspace on Vidzel.
      </p>
    </div>
  `;
}
