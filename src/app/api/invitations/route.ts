import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service role bypasses RLS — invitees are not yet workspace members,
// so the normal client can't read workspace/project details before accepting.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const normalized = email.toLowerCase().trim();

  // Step 1 — fetch invitations
  const { data: invitations, error: invErr } = await supabaseAdmin
    .from("invitations")
    .select("*")
    .eq("invited_email", normalized)
    .order("created_at", { ascending: false });

  if (invErr) {
    console.error("[GET /api/invitations]", invErr.message);
    return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 });
  }

  if (!invitations || invitations.length === 0) {
    return NextResponse.json({ data: [] });
  }

  // Step 2 — fetch workspaces for all workspace_ids in one query
  const workspaceIds = Array.from(new Set(invitations.map((i: any) => i.workspace_id).filter(Boolean)));

  const { data: workspaces } = await supabaseAdmin
    .from("workspaces")
    .select("id, title, project_id")
    .in("id", workspaceIds);

  const wsMap: Record<string, { id: string; title: string; project_id: string | null }> = {};
  (workspaces ?? []).forEach((w: any) => { wsMap[w.id] = w; });

  // Step 3 — fetch projects for all project_ids in one query
  const projectIds = Array.from(new Set(
    Object.values(wsMap)
      .map(w => w.project_id)
      .filter(Boolean) as string[]
  ));

  let projMap: Record<string, any> = {};

  if (projectIds.length > 0) {
    const { data: projects } = await supabaseAdmin
      .from("projects")
      .select("id, title, description, tasks, category, location, organization_email, roles")
      .in("id", projectIds);

    (projects ?? []).forEach((p: any) => { projMap[p.id] = p; });
  }

  // Step 4 — merge workspace + project into each invitation
  const merged = invitations.map((inv: any) => {
    const ws = wsMap[inv.workspace_id] ?? null;
    const proj = ws?.project_id ? (projMap[ws.project_id] ?? null) : null;

    return {
      ...inv,
      workspaces: ws
        ? { title: ws.title, projects: proj }
        : null,
    };
  });

  return NextResponse.json({ data: merged });
}
