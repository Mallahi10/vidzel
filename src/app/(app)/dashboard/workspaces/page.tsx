"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/Button";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  getWorkspacesByOrg,
  getWorkspacesForMember,
  type Workspace,
} from "@/lib/workspaceService";

/* ============================================================
   Extend Workspace with the joined project title from Supabase
============================================================ */
type WorkspaceWithProject = Workspace & {
  projects?: { title: string } | null;
};

/* ============================================================
   COMPONENT
============================================================ */
function WorkspacesListPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [activeWorkspaces, setActiveWorkspaces]       = useState<WorkspaceWithProject[]>([]);
  const [completedWorkspaces, setCompletedWorkspaces] = useState<WorkspaceWithProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function loadWorkspaces() {
      setLoading(true);

      // Org sees its own workspaces. All other roles see workspaces
      // where they are accepted members (workspace_members table).
      const workspaces: WorkspaceWithProject[] =
        user!.role === "organization"
          ? await getWorkspacesByOrg(user!.id)
          : await getWorkspacesForMember(user!.id);

      setActiveWorkspaces(workspaces.filter((w) => w.status === "active"));
      setCompletedWorkspaces(workspaces.filter((w) => w.status === "completed"));
      setLoading(false);
    }

    loadWorkspaces();
  // MODIFIÉ : [user] → [user?.id] pour éviter le double appel Supabase en React Strict Mode
  }, [user?.id]);

  if (!user) {
    return <div style={{ padding: "3rem" }}>Please log in.</div>;
  }

  if (loading) {
    return <div style={{ padding: "3rem" }}>Loading workspaces…</div>;
  }

  const isOrg = user.role === "organization";

  return (
    <div style={{ padding: "3rem", maxWidth: "1000px" }}>
      {/* BACK TO DASHBOARD */}
      <button onClick={() => router.push("/dashboard")} style={backButtonStyle}>
        ← Back to Dashboard
      </button>

      <h1>My Workspaces</h1>

      {/* ── ACTIVE ── */}
      <h2 style={{ marginTop: "2rem" }}>Active Projects</h2>

      {activeWorkspaces.length === 0 && (
        <p style={{ color: "#666", marginTop: "1rem" }}>
          {isOrg
            ? "No active workspaces yet. Create a project to get started."
            : "You haven't been added to any workspace yet."}
        </p>
      )}

      {activeWorkspaces.map((w) => (
        <div key={w.id} style={workspaceCardStyle}>
          {/* Project title comes from the Supabase join */}
          <h3>{w.projects?.title ?? w.title}</h3>
          <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "1rem" }}>
            {w.type === "private" ? "🔒 Private" : "🌐 Open"} ·{" "}
            {new Date(w.created_at).toLocaleDateString()}
          </p>

          <Link href={`/dashboard/workspaces/${w.id}`}>
            <Button>Open Workspace & Manage Tasks →</Button>
          </Link>
        </div>
      ))}

      {/* ── COMPLETED (non-org only) ── */}
      {!isOrg && completedWorkspaces.length > 0 && (
        <>
          <h2 style={{ marginTop: "3rem" }}>Completed Projects</h2>
          {completedWorkspaces.map((w) => (
            <div key={w.id} style={{ ...workspaceCardStyle, background: "#f8fafc" }}>
              <h3>{w.projects?.title ?? w.title}</h3>
              <Link href={`/dashboard/certificates/${w.project_id}`}>
                <Button variant="secondary">View Certificate →</Button>
              </Link>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

/* ============================================================
   STYLES
============================================================ */
const backButtonStyle = {
  position: "fixed" as const,
  top: "5.5rem",
  right: "2.5rem",
  zIndex: 1000,
  display: "inline-flex",
  alignItems: "center",
  gap: "0.5rem",
  padding: "0.55rem 1.4rem",
  borderRadius: "999px",
  border: "2px solid #2563eb",
  background: "white",
  color: "#2563eb",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.95rem",
  boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
};

const workspaceCardStyle = {
  marginTop: "1.25rem",
  padding: "1.5rem",
  borderRadius: "14px",
  border: "1px solid #e5e7eb",
  background: "white",
};

/* ============================================================
   EXPORT — keep dynamic to avoid SSR issues (same as before)
============================================================ */
export default dynamic(() => Promise.resolve(WorkspacesListPage), {
  ssr: false,
});