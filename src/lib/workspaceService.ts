import { supabase } from "@/lib/supabaseClient";

/* ============================================================
   TYPES — mirror the Supabase workspaces table exactly
============================================================ */

export type WorkspaceType   = "open" | "private";
export type WorkspaceStatus = "draft" | "active" | "completed" | "archived";
export type MemberRole      = "admin" | "member" | "reviewer";
export type MemberStatus    = "active" | "removed" | "left";

export type Workspace = {
  id:              string;
  project_id:      string;
  organization_id: string;
  title:           string;
  description:     string | null;
  type:            WorkspaceType;
  status:          WorkspaceStatus;
  created_at:      string;
  updated_at:      string;
};

export type WorkspaceMember = {
  id:            string;
  workspace_id:  string;
  user_id:       string;
  internal_role: MemberRole;
  status:        MemberStatus;
  joined_at:     string;
};

// What we send when creating — id, created_at, updated_at come from Supabase
export type CreateWorkspaceInput = {
  project_id:      string;
  organization_id: string;
  title:           string;
  description?:    string;
  type?:           WorkspaceType;
  status?:         WorkspaceStatus;
};


/* ============================================================
   CREATE — insert a new workspace row.
   Returns the created workspace with its real UUID.
============================================================ */

export async function createWorkspace(
  input: CreateWorkspaceInput
): Promise<Workspace | null> {
  const { data, error } = await supabase
    .from("workspaces")
    .insert({
      project_id:      input.project_id,
      organization_id: input.organization_id,
      title:           input.title,
      description:     input.description ?? null,
      type:            input.type   ?? "open",
      status:          input.status ?? "active",
    })
    .select()
    .single();

  if (error) {
    console.error("[createWorkspace]", error.message);
    return null;
  }

  return data as Workspace;
}


/* ============================================================
   GET ALL — fetch every workspace owned by an organization.
   Used on the "My Workspaces" dashboard page.
============================================================ */

export async function getWorkspacesByOrg(
  organizationId: string
): Promise<Workspace[]> {
  const { data, error } = await supabase
    .from("workspaces")
    .select("*, projects(title)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getWorkspacesByOrg]", error.message);
    return [];
  }

  return data as Workspace[];
}


/* ============================================================
   GET ALL FOR MEMBER — fetch workspaces where the user
   is an active workspace_member (for non-org users).
============================================================ */

export async function getWorkspacesForMember(
  userId: string
): Promise<Workspace[]> {
  // First get the workspace IDs where this user is an active member
  const { data: memberships, error: memberError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .eq("status", "active");

  if (memberError) {
    console.error("[getWorkspacesForMember]", memberError.message);
    return [];
  }

  if (!memberships || memberships.length === 0) return [];

  const workspaceIds = memberships.map((m) => m.workspace_id);

  const { data, error } = await supabase
    .from("workspaces")
    .select("*, projects(title)")
    .in("id", workspaceIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getWorkspacesForMember]", error.message);
    return [];
  }

  return data as Workspace[];
}


/* ============================================================
   GET ONE — fetch a single workspace by its UUID.
   If userId is provided, verifies the caller is either the org
   owner or an active workspace_member before returning data.
   Returns null if not found, access denied, or RLS blocks.
============================================================ */

export async function getWorkspaceById(
  workspaceId: string,
  userId?: string
): Promise<Workspace | null> {
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("[getWorkspaceById]", error.message);
    }
    return null;
  }

  const workspace = data as Workspace;

  // Defense-in-depth: verify access if userId provided
  if (userId && workspace.organization_id !== userId) {
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (!membership) return null;
  }

  return workspace;
}


/* ============================================================
   UPDATE — edit an existing workspace row.
============================================================ */

export async function updateWorkspace(
  workspaceId: string,
  changes: Partial<Pick<Workspace, "title" | "description" | "type" | "status">>
): Promise<Workspace | null> {
  const { data, error } = await supabase
    .from("workspaces")
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq("id", workspaceId)
    .select()
    .single();

  if (error) {
    console.error("[updateWorkspace]", error.message);
    return null;
  }

  return data as Workspace;
}


/* ============================================================
   DELETE — remove a workspace (cascades to members/content).
============================================================ */

export async function deleteWorkspace(
  workspaceId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("workspaces")
    .delete()
    .eq("id", workspaceId);

  if (error) {
    console.error("[deleteWorkspace]", error.message);
    return false;
  }

  return true;
}


/* ============================================================
   GET MEMBERS — fetch all active members of a workspace,
   joined with their profile info (name, email, role).
============================================================ */

export type WorkspaceMemberWithProfile = WorkspaceMember & {
  profiles: {
    id:        string;
    email:     string;
    full_name: string | null;
    role:      string;
  };
};

export async function getWorkspaceMembers(
  workspaceId: string
): Promise<WorkspaceMemberWithProfile[]> {
  const { data, error } = await supabase
    .from("workspace_members")
    .select(`
      *,
      profiles (
        id,
        email,
        full_name,
        role
      )
    `)
    .eq("workspace_id", workspaceId)
    .eq("status", "active")
    .order("joined_at", { ascending: true });

  if (error) {
    console.error("[getWorkspaceMembers]", error.message);
    return [];
  }

  return data as WorkspaceMemberWithProfile[];
}


/* ============================================================
   CHECK MEMBERSHIP — returns the current user's membership
   row for a given workspace. Returns null if not a member.
   Use this to guard access and check internal_role.
============================================================ */

export async function getMyMembership(
  workspaceId: string,
  userId: string
): Promise<WorkspaceMember | null> {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    // Not a member — this is expected, not an error
    return null;
  }

  return data as WorkspaceMember;
}