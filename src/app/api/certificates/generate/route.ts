import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { workspaceId } = await req.json();
  if (!workspaceId) {
    return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
  }

  /* 1 ── Fetch workspace + project info */
  const { data: workspace, error: wsErr } = await supabaseAdmin
    .from("workspaces")
    .select("id, title, organization_id, project_id")
    .eq("id", workspaceId)
    .single();

  if (wsErr || !workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("title, organization_email")
    .eq("id", workspace.project_id)
    .maybeSingle();

  const projectTitle     = project?.title          ?? workspace.title;
  const organizationEmail = project?.organization_email ?? "";

  /* 2 ── Fetch all active members of this workspace */
  const { data: members, error: memErr } = await supabaseAdmin
    .from("workspace_members")
    .select("user_id, internal_role")
    .eq("workspace_id", workspaceId)
    .eq("status", "active");

  if (memErr || !members || members.length === 0) {
    return NextResponse.json({ issued: 0, message: "No active members found" });
  }

  const issued: string[] = [];

  for (const member of members) {
    /* 3 ── Check for existing certificate (avoid duplicates) */
    const { data: existing } = await supabaseAdmin
      .from("certificates")
      .select("id")
      .eq("user_id", member.user_id)
      .eq("project_id", workspace.project_id)
      .maybeSingle();

    if (existing) continue;

    /* 4 ── Get participant info from auth */
    const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(
      member.user_id
    );

    if (!authUser) continue;

    const participantName =
      (authUser.user_metadata?.full_name as string) ||
      (authUser.user_metadata?.name   as string) ||
      authUser.email?.split("@")[0]              ||
      "Participant";

    const participantEmail = authUser.email ?? "";

    /* 5 ── Insert certificate record */
    const { error: insertErr } = await supabaseAdmin
      .from("certificates")
      .insert({
        user_id:            member.user_id,
        project_id:         workspace.project_id,
        workspace_id:       workspaceId,
        user_name:          participantName,
        role:               member.internal_role,
        organization_email: organizationEmail,
        issued_at:          new Date().toISOString(),
      });

    if (insertErr) {
      console.error("[certificates/generate] insert error:", insertErr.message);
      continue;
    }

    issued.push(participantEmail);

    /* 6 ── Send email notification via Resend */
    if (participantEmail) {
      const certUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://vidzel.vercel.app"}/dashboard/certificates/${workspace.project_id}`;

      await resend.emails.send({
        from:    "Vidzel <onboarding@resend.dev>",
        to:      participantEmail,
        subject: `🎓 Your certificate for "${projectTitle}" is ready`,
        html: `
          <div style="font-family:-apple-system,sans-serif;background:#F0F3FA;padding:40px 20px;margin:0">
            <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(57,88,134,0.10)">
              <div style="background:linear-gradient(135deg,#1e3a5f 0%,#395886 60%,#638ECB 100%);padding:36px 40px;text-align:center">
                <p style="margin:0;font-size:22px;font-weight:700;color:#fff">Vidzel</p>
                <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.55);letter-spacing:0.06em;text-transform:uppercase">Certificate of Participation</p>
              </div>
              <div style="padding:36px 40px">
                <p style="font-size:20px;font-weight:700;color:#395886;margin:0 0 8px">Congratulations, ${participantName}!</p>
                <p style="font-size:14px;color:#94A3B8;line-height:1.6;margin:0 0 24px">
                  You have successfully completed your participation in
                  <strong style="color:#395886">${projectTitle}</strong>.
                  Your certificate is now available.
                </p>
                <a href="${certUrl}" style="display:inline-block;background:linear-gradient(135deg,#395886,#638ECB);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px">
                  View My Certificate →
                </a>
                <hr style="border:none;border-top:1px solid #D5DEEF;margin:28px 0 20px"/>
                <p style="font-size:12px;color:#B1C9EF;text-align:center;margin:0">
                  Vidzel · Collaborative Impact Platform
                </p>
              </div>
            </div>
          </div>
        `,
      });
    }
  }

  return NextResponse.json({ issued: issued.length, emails: issued });
}
