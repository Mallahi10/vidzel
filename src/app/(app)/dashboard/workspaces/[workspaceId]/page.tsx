"use client";

import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Button from "@/components/Button";

import TaskSection       from "@/components/workspace/TaskSection";
import ResourceSection   from "@/components/workspace/ResourceSection";
import SubmissionSection from "@/components/workspace/SubmissionSection";
import MessageSection    from "@/components/workspace/MessageSection";

import {
  getWorkspaceById,
  getMyMembership,
  updateWorkspace,
  type Workspace,
  type WorkspaceMember,
} from "@/lib/workspaceService";

/* ============================================================
   COMPONENT
============================================================ */
export default function WorkspacePage() {
  const { user }  = useAuth();
  const router    = useRouter();
  const params    = useParams();

  const workspaceId = useMemo(() => {
    const raw = (params as any)?.workspaceId;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const [workspace,  setWorkspace]  = useState<Workspace | null>(null);
  const [membership, setMembership] = useState<WorkspaceMember | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  /* ============================================================
     LOAD WORKSPACE + CHECK ACCESS
  ============================================================ */
  useEffect(() => {
    if (!workspaceId || !user) return;

    async function load() {
      setLoading(true);

      // Fetch workspace from Supabase.
      // getWorkspaceById returns null if RLS blocks access.
      const ws = await getWorkspaceById(workspaceId);

      if (!ws) {
        // Could be not found OR RLS blocked it.
        // Either way the user has no business here.
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      setWorkspace(ws);

      // For org: owner check via organization_id.
      // For others: look up their workspace_members row.
      if (user!.role !== "organization") {
        const myMembership = await getMyMembership(workspaceId, user!.id);

        if (!myMembership) {
          // User is not a member → deny access
          setAccessDenied(true);
          setLoading(false);
          return;
        }

        setMembership(myMembership);
      }

      setLoading(false);
    }

    load();
  }, [workspaceId, user?.id]);

  /* ============================================================
     GUARDS
  ============================================================ */
  if (!user) {
    return <div style={{ padding: "3rem" }}>Please log in.</div>;
  }

  if (!workspaceId) {
    return <div style={{ padding: "3rem" }}>Invalid workspace.</div>;
  }

  if (loading) {
    return <div style={{ padding: "3rem" }}>Loading workspace…</div>;
  }

  if (accessDenied || !workspace) {
    return (
      <div style={{ padding: "3rem", color: "#b91c1c" }}>
        You do not have access to this workspace.
      </div>
    );
  }

  // True if the logged-in user is the org that owns this workspace
  const isOrganizationOwner =
    user.role === "organization" &&
    workspace.organization_id === user.id;

  // True if the user is an active member (non-org path)
  const isWorkspaceMember = membership !== null;

  // Redundant safety check — should already be caught above
  if (!isOrganizationOwner && !isWorkspaceMember) {
    return (
      <div style={{ padding: "3rem", color: "#b91c1c" }}>
        You do not have access to this workspace.
      </div>
    );
  }

  const isArchived = workspace.status === "completed";

  // The member's internal role — admin/member/reviewer.
  // Org owner is always treated as admin.
  const internalRole = isOrganizationOwner
    ? "admin"
    : membership?.internal_role ?? "member";

  /* ============================================================
     COMPLETE PROJECT — update status in Supabase
  ============================================================ */
  const completeProject = async () => {
    if (!isOrganizationOwner || isArchived) return;

    const updated = await updateWorkspace(workspace.id, {
      status: "completed",
    });

    if (updated) {
      setWorkspace(updated);
    }
  };

  /* ============================================================
     UI
  ============================================================ */
  const panelStyle: CSSProperties = {
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "1.5rem",
    background: "white",
    marginBottom: "2rem",
  };

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
      {/* ── LEFT COLUMN ── */}
      <div>
        <div style={{ marginBottom: "1.5rem" }}>
          <h1>{workspace.title}</h1>

          {/* Role badge for non-org members */}
          {!isOrganizationOwner && (
            <span
              style={{
                fontSize: "12px",
                padding: "2px 10px",
                borderRadius: "20px",
                background: internalRole === "admin" ? "#EDE9FE" : "#E0F2FE",
                color: internalRole === "admin" ? "#5B21B6" : "#0369A1",
                fontWeight: 500,
                marginTop: "4px",
                display: "inline-block",
              }}
            >
              Your role: {internalRole}
            </span>
          )}
        </div>

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

        {/* BOTTOM ACTION BAR */}
        <div
          style={{
            marginTop: "3rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Button variant="secondary" onClick={() => router.push("/dashboard")}>
            ← Back to Dashboard
          </Button>

          {/* Only org owner can mark as completed */}
          {isOrganizationOwner && !isArchived && (
            <Button onClick={completeProject}>
              Mark Project as Completed
            </Button>
          )}
        </div>
      </div>

      {/* ── RIGHT COLUMN: CHAT ── */}
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