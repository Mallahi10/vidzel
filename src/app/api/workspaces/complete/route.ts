import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { workspaceId, organizationUserId } = await req.json();
  if (!workspaceId || !organizationUserId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  /* 1 ── Verify the caller owns this workspace */
  const { data: workspace, error: wsErr } = await supabaseAdmin
    .from("workspaces")
    .select("id, title, organization_id, project_id, status")
    .eq("id", workspaceId)
    .single();

  if (wsErr || !workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  if (workspace.organization_id !== organizationUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (workspace.status === "completed") {
    return NextResponse.json({ error: "Already completed" }, { status: 400 });
  }

  /* 2 ── Mark workspace as completed (admin bypasses RLS) */
  const { data: updated, error: updateErr } = await supabaseAdmin
    .from("workspaces")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", workspaceId)
    .select()
    .single();

  if (updateErr || !updated) {
    return NextResponse.json({ error: "Failed to update workspace" }, { status: 500 });
  }

  /* 3 ── Fetch project info */
  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("title, organization_email")
    .eq("id", workspace.project_id)
    .maybeSingle();

  const projectTitle      = project?.title          ?? workspace.title;
  const organizationEmail = project?.organization_email ?? "";

  /* 4 ── Fetch participants: accepted applicants + active workspace members (union) */
  const [{ data: applicants }, { data: wsMembers }] = await Promise.all([
    supabaseAdmin
      .from("applications")
      .select("applicant_id, role")
      .eq("project_id", workspace.project_id)
      .eq("status", "accepted"),
    supabaseAdmin
      .from("workspace_members")
      .select("user_id, internal_role")
      .eq("workspace_id", workspaceId)
      .eq("status", "active"),
  ]);

  /* Merge both sources, deduplicate by user_id */
  const participantMap = new Map<string, { userId: string; role: string }>();
  for (const a of applicants ?? []) {
    participantMap.set(a.applicant_id, { userId: a.applicant_id, role: a.role ?? "participant" });
  }
  for (const m of wsMembers ?? []) {
    if (!participantMap.has(m.user_id)) {
      participantMap.set(m.user_id, { userId: m.user_id, role: m.internal_role ?? "member" });
    }
  }

  const issued: string[] = [];

  for (const participant of Array.from(participantMap.values())) {
    /* Skip duplicates */
    const { data: existing } = await supabaseAdmin
      .from("certificates")
      .select("id")
      .eq("user_id", participant.userId)
      .eq("project_id", workspace.project_id)
      .maybeSingle();

    if (existing) continue;

    /* Get participant info */
    const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(
      participant.userId
    );
    if (!authUser) continue;

    const participantName =
      (authUser.user_metadata?.full_name as string) ||
      (authUser.user_metadata?.name   as string) ||
      authUser.email?.split("@")[0]              ||
      "Participant";

    /* Insert certificate */
    const { error: insertErr } = await supabaseAdmin
      .from("certificates")
      .insert({
        user_id:            participant.userId,
        project_id:         workspace.project_id,
        workspace_id:       workspaceId,
        user_name:          participantName,
        role:               participant.role,
        organization_email: organizationEmail,
        issued_at:          new Date().toISOString(),
      });

    if (insertErr) continue;

    issued.push(authUser.email ?? "");

    /* Send email */
    if (authUser.email) {
      const certUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://vidzel.vercel.app"}/dashboard/certificates/${workspace.project_id}`;
      await resend.emails.send({
        from:    "Vidzel <onboarding@resend.dev>",
        to:      authUser.email,
        subject: `🎓 Your certificate for "${projectTitle}" is ready`,
        html: `
          <div style="font-family:-apple-system,sans-serif;background:#F0F3FA;padding:40px 20px">
            <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(57,88,134,0.10)">
              <div style="background:linear-gradient(135deg,#1e3a5f 0%,#395886 60%,#638ECB 100%);padding:36px 40px;text-align:center">
                <p style="margin:0;font-size:22px;font-weight:700;color:#fff">Vidzel</p>
                <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.55);letter-spacing:0.06em;text-transform:uppercase">Certificate of Participation</p>
              </div>
              <div style="padding:36px 40px">
                <p style="font-size:20px;font-weight:700;color:#395886;margin:0 0 8px">Congratulations, ${participantName}!</p>
                <p style="font-size:14px;color:#94A3B8;line-height:1.6;margin:0 0 24px">
                  You have successfully completed <strong style="color:#395886">${projectTitle}</strong>.
                </p>
                <a href="${certUrl}" style="display:inline-block;background:linear-gradient(135deg,#395886,#638ECB);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px">
                  View My Certificate →
                </a>
                <hr style="border:none;border-top:1px solid #D5DEEF;margin:28px 0 20px"/>
                <p style="font-size:12px;color:#B1C9EF;text-align:center;margin:0">Vidzel · Collaborative Impact Platform</p>
              </div>
            </div>
          </div>`,
      });
    }
  }

  return NextResponse.json({ workspace: updated, issued: issued.length, emails: issued });
}
