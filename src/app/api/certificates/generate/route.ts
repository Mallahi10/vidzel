import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;

  /* ── Parse body ─────────────────────────────────────────────────── */
  try {
    body = await req.json();
    console.log("[certs/generate] ✅ Payload received:", JSON.stringify(body));
  } catch (e) {
    console.error("[certs/generate] ❌ Failed to parse JSON body:", e);
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  /* ── Resolve projectId ──────────────────────────────────────────── */
  // Supports:
  //   - Direct call:          { projectId }
  //   - Webhook (new format): { record: { project_id } } or { new: { project_id } }
  //   - Via workspaceId:      { workspaceId }

  let projectId: string | null =
    (body.projectId as string) ??
    ((body.record as any)?.project_id as string) ??
    ((body.new    as any)?.project_id as string) ??
    null;

  const workspaceId: string | null = (body.workspaceId as string) ?? null;

  if (!projectId && workspaceId) {
    console.log("[certs/generate] No projectId — resolving from workspaceId:", workspaceId);
    const { data: ws, error: wsErr } = await supabaseAdmin
      .from("workspaces")
      .select("project_id")
      .eq("id", workspaceId)
      .maybeSingle();

    if (wsErr) console.error("[certs/generate] Workspace lookup error:", wsErr.message);
    projectId = ws?.project_id ?? null;
  }

  if (!projectId) {
    console.error("[certs/generate] ❌ Cannot determine projectId. Full body:", JSON.stringify(body));
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
  }

  console.log("[certs/generate] 🎯 Processing projectId:", projectId);

  try {
    /* ── Fetch project info ───────────────────────────────────────── */
    const { data: project, error: projErr } = await supabaseAdmin
      .from("projects")
      .select("id, title, organization_email")
      .eq("id", projectId)
      .maybeSingle();

    if (projErr) console.error("[certs/generate] Project fetch error:", projErr.message);

    const projectTitle      = project?.title          ?? "Project";
    const organizationEmail = project?.organization_email ?? "";
    console.log("[certs/generate] Project:", projectTitle);

    /* ── Fetch participants (accepted applications) ───────────────── */
    const { data: applicants, error: appErr } = await supabaseAdmin
      .from("applications")
      .select("applicant_id, role")
      .eq("project_id", projectId)
      .eq("status", "accepted");

    if (appErr) console.error("[certs/generate] Applications fetch error:", appErr.message);
    console.log("[certs/generate] Accepted applicants found:", applicants?.length ?? 0);

    /* Also fetch workspace members if workspaceId was provided */
    let wsMembers: { user_id: string; internal_role: string }[] = [];
    if (workspaceId) {
      const { data } = await supabaseAdmin
        .from("workspace_members")
        .select("user_id, internal_role")
        .eq("workspace_id", workspaceId)
        .eq("status", "active");
      wsMembers = data ?? [];
      console.log("[certs/generate] Workspace members found:", wsMembers.length);
    }

    /* Merge & deduplicate by user_id */
    const participantMap = new Map<string, { userId: string; role: string }>();
    for (const a of applicants ?? []) {
      participantMap.set(a.applicant_id, {
        userId: a.applicant_id,
        role:   a.role ?? "Participant",
      });
    }
    for (const m of wsMembers) {
      if (!participantMap.has(m.user_id)) {
        participantMap.set(m.user_id, {
          userId: m.user_id,
          role:   m.internal_role ?? "Member",
        });
      }
    }

    const participants = Array.from(participantMap.values());
    console.log("[certs/generate] Total unique participants:", participants.length);

    if (participants.length === 0) {
      console.warn("[certs/generate] ⚠️ No participants found for project:", projectId);
      return NextResponse.json({ issued: 0, message: "No accepted applicants found for this project" });
    }

    /* ── Generate certificate per participant ─────────────────────── */
    const issued: string[] = [];
    const errors: string[] = [];

    for (const p of participants) {
      try {
        /* Skip duplicates */
        const { data: existing } = await supabaseAdmin
          .from("certificates")
          .select("id")
          .eq("user_id", p.userId)
          .eq("project_id", projectId)
          .maybeSingle();

        if (existing) {
          console.log("[certs/generate] Certificate already exists for user:", p.userId);
          continue;
        }

        /* Get auth user info */
        const { data: { user: authUser }, error: authErr } =
          await supabaseAdmin.auth.admin.getUserById(p.userId);

        if (authErr || !authUser) {
          console.error("[certs/generate] Auth user not found for:", p.userId, authErr?.message);
          continue;
        }

        const participantName =
          (authUser.user_metadata?.full_name as string) ||
          (authUser.user_metadata?.name      as string) ||
          authUser.email?.split("@")[0]                 ||
          "Participant";

        console.log("[certs/generate] Inserting certificate for:", participantName, authUser.email);

        /* Insert certificate */
        const { error: insertErr } = await supabaseAdmin
          .from("certificates")
          .insert({
            user_id:            p.userId,
            project_id:         projectId,
            workspace_id:       workspaceId ?? null,
            user_name:          participantName,
            role:               p.role,
            organization_email: organizationEmail,
            issued_at:          new Date().toISOString(),
          });

        if (insertErr) {
          console.error("[certs/generate] ❌ Insert error for", p.userId, ":", insertErr.message);
          errors.push(`${p.userId}: ${insertErr.message}`);
          continue;
        }

        console.log("[certs/generate] ✅ Certificate inserted for:", authUser.email);
        issued.push(authUser.email ?? p.userId);

        /* Send email */
        if (authUser.email) {
          const certUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://vidzel.vercel.app"}/dashboard/certificates/${projectId}`;

          const { error: emailErr } = await resend.emails.send({
            from:    "Vidzel <onboarding@resend.dev>",
            to:      authUser.email,
            subject: `Your certificate for "${projectTitle}" is ready`,
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
                      Your certificate is now available on Vidzel.
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

          if (emailErr) console.error("[certs/generate] Email error for", authUser.email, ":", emailErr.message);
          else          console.log("[certs/generate] 📧 Email sent to:", authUser.email);
        }
      } catch (participantErr) {
        console.error("[certs/generate] Unexpected error for participant", p.userId, ":", participantErr);
        errors.push(String(participantErr));
      }
    }

    console.log("[certs/generate] 🏁 Done — issued:", issued.length, "errors:", errors.length);
    return NextResponse.json({ issued: issued.length, emails: issued, errors });

  } catch (globalErr) {
    console.error("[certs/generate] 🔥 GLOBAL ERROR:", globalErr);
    return NextResponse.json({ error: String(globalErr) }, { status: 500 });
  }
}
