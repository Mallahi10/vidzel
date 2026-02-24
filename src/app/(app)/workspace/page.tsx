"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useEffect, useState } from "react";

type Workspace = {
  id: string;
  projectTitle: string;
  organizationEmail: string;
};

type WorkspaceMember = {
  workspaceId: string;
  userEmail: string;
};

export default function MyWorkspacesPage() {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  useEffect(() => {
    if (!user) return;

    const allWorkspaces: Workspace[] = JSON.parse(
      localStorage.getItem("vidzel_workspaces") || "[]"
    );

    const members: WorkspaceMember[] = JSON.parse(
      localStorage.getItem("vidzel_workspace_members") || "[]"
    );

    if (user.role === "organization") {
      // ✅ ORG → workspaces they own
      setWorkspaces(
        allWorkspaces.filter(
          (w) => w.organizationEmail === user.email
        )
      );
    } else {
      // ✅ Contributors → workspaces they are members of
      const myWorkspaceIds = members
        .filter((m) => m.userEmail === user.email)
        .map((m) => m.workspaceId);

      setWorkspaces(
        allWorkspaces.filter((w) => myWorkspaceIds.includes(w.id))
      );
    }
  }, [user]);

  if (!user) {
    return <div style={{ padding: "3rem" }}>Please log in.</div>;
  }

  return (
    <div style={{ padding: "3rem", maxWidth: "900px" }}>
      <h1 style={{ marginBottom: "1.5rem" }}>My Workspaces</h1>

      {workspaces.length === 0 && (
        <p style={{ color: "#64748b" }}>
          You don’t have any workspaces yet.
        </p>
      )}

      {workspaces.map((w) => (
        <div
          key={w.id}
          style={{
            padding: "1rem",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            marginBottom: "1rem",
            background: "white",
          }}
        >
          <strong>{w.projectTitle}</strong>

          <div style={{ marginTop: "0.5rem" }}>
            <Link href={`/workspace/${w.id}`}>
              Open Workspace →
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
