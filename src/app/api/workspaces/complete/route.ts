import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";


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


  /* 4 ── Delegate certificate generation to the unified API */
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vidzel.vercel.app";
  const certRes = await fetch(`${baseUrl}/api/certificates/generate`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ projectId: workspace.project_id, workspaceId }),
  });
  const certData = certRes.ok ? await certRes.json() : { error: "cert API failed" };
  console.log("[workspaces/complete] Certificate result:", certData);

  return NextResponse.json({ workspace: updated, ...certData });
}
