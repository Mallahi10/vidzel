import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;

  /* ── 1. Parse body ──────────────────────────────────────────────── */
  try {
    body = await req.json();
    console.log("[certs/generate] ✅ Payload received:", JSON.stringify(body));
  } catch (e) {
    console.error("[certs/generate] ❌ JSON parse error:", e);
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  /* ── 2. Resolve projectId ───────────────────────────────────────── */
  let projectId: string | null =
    (body.projectId as string)                    ??
    ((body.record as any)?.project_id as string)  ??
    ((body.new    as any)?.project_id as string)  ??
    null;

  const inputWorkspaceId: string | null = (body.workspaceId as string) ?? null;

  if (!projectId && inputWorkspaceId) {
    console.log("[certs/generate] Resolving projectId from workspaceId:", inputWorkspaceId);
    const { data: ws, error: wsErr } = await supabaseAdmin
      .from("workspaces")
      .select("project_id")
      .eq("id", inputWorkspaceId)
      .maybeSingle();
    if (wsErr) console.error("[certs/generate] Workspace lookup error:", wsErr.message);
    projectId = ws?.project_id ?? null;
  }

  if (!projectId) {
    console.error("[certs/generate] ❌ No projectId resolved. Body:", JSON.stringify(body));
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
  }

  console.log("[certs/generate] 🎯 projectId:", projectId);

  try {
    /* ── 3. Fetch project info ──────────────────────────────────────── */
    const { data: project, error: projErr } = await supabaseAdmin
      .from("projects")
      .select("id, title, organization_email")
      .eq("id", projectId)
      .maybeSingle();

    if (projErr) console.error("[certs/generate] Project error:", projErr.message);
    const projectTitle      = project?.title          ?? "Project";
    const organizationEmail = project?.organization_email ?? "";
    console.log("[certs/generate] Project:", projectTitle);

    /* ── 4. Find ALL workspaces linked to this project ──────────────── */
    const { data: workspaces, error: wsListErr } = await supabaseAdmin
      .from("workspaces")
      .select("id")
      .eq("project_id", projectId);

    if (wsListErr) console.error("[certs/generate] Workspaces error:", wsListErr.message);
    const workspaceIds = (workspaces ?? []).map((w: any) => w.id);
    console.log("[certs/generate] Workspaces found:", workspaceIds.length);

    /* ── 5. Fetch ALL workspace_members (active) from those workspaces ── */
    let allWsMembers: { user_id: string; internal_role: string; workspace_id: string }[] = [];
    if (workspaceIds.length > 0) {
      const { data: members, error: memErr } = await supabaseAdmin
        .from("workspace_members")
        .select("user_id, internal_role, workspace_id")
        .in("workspace_id", workspaceIds)
        .eq("status", "active");

      if (memErr) console.error("[certs/generate] workspace_members error:", memErr.message);
      allWsMembers = members ?? [];
      console.log("[certs/generate] Active workspace members:", allWsMembers.length);

      /* ── 5b. Mark ALL workspace_members as "completed" (admin = no RLS) ── */
      if (allWsMembers.length > 0) {
        const { error: updateErr } = await supabaseAdmin
          .from("workspace_members")
          .update({ status: "completed" })
          .in("workspace_id", workspaceIds)
          .eq("status", "active");

        if (updateErr) {
          console.error("[certs/generate] workspace_members update error:", updateErr.message);
        } else {
          console.log("[certs/generate] ✅ workspace_members → 'completed'");
        }
      }
    }

    /* ── 6. Fetch accepted applicants ───────────────────────────────── */
    const { data: applicants, error: appErr } = await supabaseAdmin
      .from("applications")
      .select("applicant_id, role")
      .eq("project_id", projectId)
      .eq("status", "accepted");

    if (appErr) console.error("[certs/generate] Applications error:", appErr.message);
    console.log("[certs/generate] Accepted applicants:", applicants?.length ?? 0);

    /* ── 7. Merge both sources, deduplicate ─────────────────────────── */
    const participantMap = new Map<string, { userId: string; role: string }>();

    for (const a of applicants ?? []) {
      participantMap.set(a.applicant_id, {
        userId: a.applicant_id,
        role:   a.role ?? "Participant",
      });
    }
    for (const m of allWsMembers) {
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
      return NextResponse.json({
        issued: 0,
        message: "No accepted applicants or workspace members found. Make sure the student has an accepted application for this project.",
      });
    }

    /* ── 8. Generate one certificate per participant ────────────────── */
    const issued:  string[] = [];
    const errors:  string[] = [];

    for (const p of participants) {
      try {
        /* Skip if already issued */
        const { data: existing } = await supabaseAdmin
          .from("certificates")
          .select("id")
          .eq("user_id", p.userId)
          .eq("project_id", projectId)
          .maybeSingle();

        if (existing) {
          console.log("[certs/generate] Already issued for:", p.userId);
          continue;
        }

        /* Fetch auth user */
        const { data: { user: authUser }, error: authErr } =
          await supabaseAdmin.auth.admin.getUserById(p.userId);

        if (authErr || !authUser) {
          console.error("[certs/generate] Auth user not found:", p.userId, authErr?.message);
          continue;
        }

        const participantName =
          (authUser.user_metadata?.full_name as string) ||
          (authUser.user_metadata?.name      as string) ||
          authUser.email?.split("@")[0]                 ||
          "Participant";

        console.log("[certs/generate] Inserting cert for:", participantName, authUser.email);

        /* Insert certificate */
        const { error: insertErr } = await supabaseAdmin
          .from("certificates")
          .insert({
            user_id:            p.userId,
            project_id:         projectId,
            workspace_id:       workspaceIds[0] ?? inputWorkspaceId ?? null,
            user_name:          participantName,
            role:               p.role,
            organization_email: organizationEmail,
            issued_at:          new Date().toISOString(),
          });

        if (insertErr) {
          console.error("[certs/generate] ❌ Insert error:", p.userId, insertErr.message);
          errors.push(`${p.userId}: ${insertErr.message}`);
          continue;
        }

        console.log("[certs/generate] ✅ Certificate inserted:", authUser.email);
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

          if (emailErr) console.error("[certs/generate] Email error:", authUser.email, emailErr.message);
          else          console.log("[certs/generate] 📧 Email sent:", authUser.email);
        }
      } catch (err) {
        console.error("[certs/generate] Unexpected error for", p.userId, ":", err);
        errors.push(String(err));
      }
    }

    console.log("[certs/generate] 🏁 Done — issued:", issued.length, "| errors:", errors.length);
    return NextResponse.json({ issued: issued.length, emails: issued, errors });

  } catch (globalErr) {
    console.error("[certs/generate] 🔥 GLOBAL ERROR:", globalErr);
    return NextResponse.json({ error: String(globalErr) }, { status: 500 });
  }
}
