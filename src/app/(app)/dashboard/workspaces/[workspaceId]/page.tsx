"use client";

import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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

// NEW MODERN UI UPDATE — CSS module replaces inline styles
import styles from "./workspaceDetail.module.css";
import { ArrowLeft, Archive, CheckCircle, ShieldCheck, User } from "lucide-react";

/* ============================================================
   COMPONENT — business logic entirely unchanged
============================================================ */
export default function WorkspacePage() {
  const { user }  = useAuth();
  const router    = useRouter();
  const params    = useParams();

  const workspaceId = useMemo(() => {
    const raw = (params as any)?.workspaceId;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const [workspace,    setWorkspace]    = useState<Workspace | null>(null);
  const [membership,   setMembership]   = useState<WorkspaceMember | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  /* ============================================================
     LOAD WORKSPACE + CHECK ACCESS (logique inchangée)
  ============================================================ */
  useEffect(() => {
    if (!workspaceId || !user) return;

    async function load() {
      setLoading(true);

      const ws = await getWorkspaceById(workspaceId, user!.id);

      if (!ws) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      setWorkspace(ws);

      if (user!.role !== "organization") {
        const myMembership = await getMyMembership(workspaceId, user!.id);

        if (!myMembership) {
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
     GUARDS (logique inchangée, styles modernisés)
  ============================================================ */
  if (!user) {
    // OLD STYLE BACKUP: <div style={{ padding: "3rem" }}>Please log in.</div>
    return <div className={styles.guardState}>Please log in.</div>;
  }

  if (!workspaceId) {
    return <div className={styles.guardState}>Invalid workspace.</div>;
  }

  if (loading) {
    return <div className={styles.guardState}>Loading workspace…</div>;
  }

  if (accessDenied || !workspace) {
    // OLD STYLE BACKUP: <div style={{ padding: "3rem", color: "#b91c1c" }}>You do not have access...</div>
    return <div className={styles.errorState}>You do not have access to this workspace.</div>;
  }

  const isOrganizationOwner =
    user.role === "organization" && workspace.organization_id === user.id;

  const isWorkspaceMember = membership !== null;

  if (!isOrganizationOwner && !isWorkspaceMember) {
    return <div className={styles.errorState}>You do not have access to this workspace.</div>;
  }

  const isArchived = workspace.status === "completed";

  const internalRole = isOrganizationOwner
    ? "admin"
    : membership?.internal_role ?? "member";

  /* ============================================================
     COMPLETE PROJECT (logique inchangée)
  ============================================================ */
  const completeProject = async () => {
    if (!isOrganizationOwner || isArchived) return;

    /* Use server-side API (admin client) to bypass RLS on workspace UPDATE */
    const res = await fetch("/api/workspaces/complete", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ workspaceId: workspace.id, organizationUserId: user.id }),
    });

    if (res.ok) {
      const { workspace: updated } = await res.json();
      if (updated) setWorkspace(updated);
    }
  };

  /* ============================================================
     UI
  ============================================================ */
  return (
    // OLD STYLE BACKUP: <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:"2rem", padding:"3rem" }}>
    <div className={styles.page}>

      {/* ── LEFT COLUMN ── */}
      <div className={styles.leftColumn}>

        {/* Workspace header */}
        {/* OLD STYLE BACKUP: <div style={{ marginBottom: "1.5rem" }}> */}
        <div className={styles.workspaceHeader}>
          <h1 className={styles.workspaceTitle}>{workspace.title}</h1>

          {/* Role badge for non-org members */}
          {/* OLD STYLE BACKUP: <span style={{ fontSize:"12px", padding:"2px 10px", borderRadius:"20px", background: conditional }}> */}
          {!isOrganizationOwner && (
            <span className={`${styles.roleBadge} ${internalRole === "admin" ? styles.roleBadgeAdmin : styles.roleBadgeMember}`}>
              {internalRole === "admin" ? <ShieldCheck size={12} /> : <User size={12} />}
              Your role: {internalRole}
            </span>
          )}
        </div>

        {/* Archived notice */}
        {/* OLD STYLE BACKUP: <div style={{ marginBottom: "1rem", color: "#b45309" }}> */}
        {isArchived && (
          <div className={styles.archivedNotice}>
            <Archive size={16} />
            This workspace is archived (read-only).
          </div>
        )}

        {/* Panels */}
        {/* OLD STYLE BACKUP: <div style={panelStyle}> */}
        <div className={`${styles.panel} ${styles.panelTasks}`}>
          <TaskSection workspaceId={workspaceId} />
        </div>

        <div className={`${styles.panel} ${styles.panelResources}`}>
          <ResourceSection workspaceId={workspaceId} />
        </div>

        <div className={`${styles.panel} ${styles.panelSubmissions}`}>
          <SubmissionSection workspaceId={workspaceId} />
        </div>

        {/* Bottom action bar */}
        {/* OLD STYLE BACKUP: <div style={{ marginTop:"3rem", display:"flex", justifyContent:"space-between" }}> */}
        <div className={styles.bottomBar}>
          <Button variant="secondary" onClick={() => router.push("/dashboard")}>
            <ArrowLeft size={15} />
            Back to Dashboard
          </Button>

          {isOrganizationOwner && !isArchived && (
            <Button onClick={completeProject}>
              <CheckCircle size={15} />
              Mark Project as Completed
            </Button>
          )}
        </div>
      </div>

      {/* ── RIGHT COLUMN: CHAT ── */}
      {/* OLD STYLE BACKUP: <div style={{ marginTop:"4.65rem", position:"sticky", top:"6.5rem", height:"calc(100vh - 8rem)", ... }}> */}
      <div className={styles.chatColumn}>
        <MessageSection workspaceId={workspaceId} />
      </div>

    </div>
  );
}
