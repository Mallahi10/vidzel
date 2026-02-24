"use client";

import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Button from "@/components/Button";

import TaskSection from "@/components/workspace/TaskSection";
import ResourceSection from "@/components/workspace/ResourceSection";
import SubmissionSection from "@/components/workspace/SubmissionSection";
import MessageSection from "@/components/workspace/MessageSection";

/* ========================
   TYPES
======================== */
type Workspace = {
  id: string;
  projectId: string;
  projectTitle: string;
  organizationEmail: string;
  status: "draft" | "active" | "completed";
  createdAt: string;
};

type WorkspaceMember = {
  id: string;
  workspaceId: string;
  userId: string;
  name: string;
  role: "organization" | "volunteer" | "student" | "mentor";
};

/* ========================
   COMPONENT
======================== */
export default function WorkspacePage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();

  const workspaceId = useMemo(() => {
    const raw = (params as any)?.workspaceId;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);

  /* ========================
     LOAD / CREATE WORKSPACE
  ======================== */
  useEffect(() => {
    if (!workspaceId || !user || typeof window === "undefined") return;

    const storedWorkspaces: Workspace[] = JSON.parse(
      localStorage.getItem("vidzel_workspaces") || "[]"
    );

    let found = storedWorkspaces.find(
      (w) => String(w.id) === String(workspaceId)
    );

    if (!found && user.role === "organization") {
      found = {
        id: workspaceId,
        projectId: workspaceId,
        projectTitle: "Untitled Project",
        organizationEmail: user.email!,
        status: "active",
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem(
        "vidzel_workspaces",
        JSON.stringify([...storedWorkspaces, found])
      );
    }

    setWorkspace(found || null);

    const storedMembers: WorkspaceMember[] = JSON.parse(
      localStorage.getItem("vidzel_workspace_members") || "[]"
    );

    setMembers(
      storedMembers.filter(
        (m) => String(m.workspaceId) === String(workspaceId)
      )
    );
  }, [workspaceId, user]);

  /* ========================
     GUARDS
  ======================== */
  if (!user) {
    return <div style={{ padding: "3rem" }}>Please log in.</div>;
  }

  if (!workspaceId) {
    return <div style={{ padding: "3rem" }}>Invalid workspace.</div>;
  }

  if (!workspace) {
    return <div style={{ padding: "3rem" }}>Loading workspace…</div>;
  }

  const isOrganizationOwner =
    user.role === "organization" &&
    workspace.organizationEmail.toLowerCase() === user.email?.toLowerCase();

  const isWorkspaceMember = members.some(
    (m) => String(m.userId) === String(user.id)
  );

  if (!isOrganizationOwner && !isWorkspaceMember) {
    return (
      <div style={{ padding: "3rem", color: "#b91c1c" }}>
        You do not have access to this workspace.
      </div>
    );
  }

  const isArchived = workspace.status === "completed";

  /* ========================
     COMPLETE PROJECT
  ======================== */
  const completeProject = () => {
    if (!isOrganizationOwner || isArchived) return;

    const all: Workspace[] = JSON.parse(
      localStorage.getItem("vidzel_workspaces") || "[]"
    );

    const updated = all.map((w) =>
      w.id === workspace.id ? { ...w, status: "completed" } : w
    );

    localStorage.setItem("vidzel_workspaces", JSON.stringify(updated));
    setWorkspace({ ...workspace, status: "completed" });
  };

  const panelStyle: CSSProperties = {
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "1.5rem",
    background: "white",
    marginBottom: "2rem",
  };

  /* ========================
     UI
  ======================== */
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: "2rem",
        padding: "3rem",
        maxWidth: "1400px",
        margin: "0 auto",
        alignItems: "start",
      }}
    >
      {/* ================= LEFT COLUMN ================= */}
      <div>
        <h1 style={{ marginBottom: "1.5rem" }}>
          {workspace.projectTitle}
        </h1>

        {isArchived && (
          <div style={{ marginBottom: "1rem", color: "#b45309" }}>
            This workspace is archived (read-only).
          </div>
        )}

        <div style={panelStyle}>
          <TaskSection workspaceId={workspaceId} />
        </div>

        <div style={panelStyle}>
          <ResourceSection workspaceId={workspaceId} />
        </div>

        <div style={panelStyle}>
          <SubmissionSection workspaceId={workspaceId} />
        </div>

        {/* ✅ BOTTOM ACTION BAR */}
        <div
          style={{
            marginTop: "3rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Back to Dashboard */}
          <Button
            variant="secondary"
            onClick={() => router.push("/dashboard")}
          >
            ← Back to Dashboard
          </Button>

          {/* Mark Complete (org only) */}
          {isOrganizationOwner && !isArchived && (
            <Button onClick={completeProject}>
              Mark Project as Completed
            </Button>
          )}
        </div>
      </div>

      {/* ================= RIGHT COLUMN: CONVERSATION ================= */}
      <div
        style={{
          marginTop: "4.65rem",
          position: "sticky",
          top: "6.5rem",
          height: "calc(100vh - 8rem)",
          overflow: "auto",
          border: "1px solid #e5e7eb",
          borderRadius: "14px",
          padding: "1.5rem",
          background: "white",
        }}
      >
        <MessageSection workspaceId={workspaceId} />
      </div>
    </div>
  );
}