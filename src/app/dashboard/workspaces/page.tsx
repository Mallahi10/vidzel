"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/Button";
import { useRouter } from "next/navigation";

export default function WorkspacesListPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [activeWorkspaces, setActiveWorkspaces] = useState<any[]>([]);
  const [completedWorkspaces, setCompletedWorkspaces] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const allWorkspaces = JSON.parse(
      localStorage.getItem("vidzel_workspaces") || "[]"
    );

    const projects = JSON.parse(
      localStorage.getItem("vidzel_projects") || "[]"
    );

    const members = JSON.parse(
      localStorage.getItem("vidzel_workspace_members") || "[]"
    );

    let myWorkspaces: any[] = [];

    if (user.role === "organization") {
      myWorkspaces = allWorkspaces.filter(
        (w: any) => w.organizationEmail === user.email
      );
    } else {
      const myWorkspaceIds = members
        .filter((m: any) => m.userId === user.id)
        .map((m: any) => m.workspaceId);

      myWorkspaces = allWorkspaces.filter((w: any) =>
        myWorkspaceIds.includes(w.id)
      );
    }

    const enriched = myWorkspaces.map((w: any) => {
      const project = projects.find(
        (p: any) => String(p.id) === String(w.projectId)
      );

      return {
        ...w,
        projectTitle: project?.title || "Untitled Project",
        status: w.status || "active",
      };
    });

    setActiveWorkspaces(enriched.filter((w: any) => w.status === "active"));
    setCompletedWorkspaces(enriched.filter((w: any) => w.status === "completed"));
  }, [user]);

  if (!user) {
    return <div style={{ padding: "3rem" }}>Please log in.</div>;
  }

  const isOrg = user.role === "organization";

  return (
    <div style={{ padding: "3rem", maxWidth: "1000px" }}>
      {/* ✅ FIXED BACK BUTTON — ALWAYS VISIBLE */}
      <button
        onClick={() => router.push("/dashboard")}
        style={backButtonStyle}
      >
        ← Back to Dashboard
      </button>

      <h1>My Workspaces</h1>

      {/* ================= ACTIVE PROJECTS ================= */}
      <h2 style={{ marginTop: "2rem" }}>Active Projects</h2>

      {activeWorkspaces.length === 0 && (
        <p style={{ color: "#666", marginTop: "1rem" }}>
          You don’t have any active projects right now.
        </p>
      )}

      {activeWorkspaces.map((w) => (
        <div
          key={w.id}
          style={{
            marginTop: "1.25rem",
            padding: "1.5rem",
            borderRadius: "14px",
            border: "1px solid #e5e7eb",
            background: "white",
          }}
        >
          <h3>{w.projectTitle}</h3>

          <Link href={`/dashboard/workspaces/${w.id}`}>
            <Button>Open Workspace & Manage Tasks →</Button>
          </Link>
        </div>
      ))}

      {/* ================= COMPLETED PROJECTS (NON-ORG ONLY) ================= */}
      {!isOrg && completedWorkspaces.length > 0 && (
        <>
          <h2 style={{ marginTop: "3rem" }}>Completed Projects</h2>

          {completedWorkspaces.map((w) => (
            <div
              key={w.id}
              style={{
                marginTop: "1.25rem",
                padding: "1.5rem",
                borderRadius: "14px",
                border: "1px solid #e5e7eb",
                background: "#f8fafc",
              }}
            >
              <h3>{w.projectTitle}</h3>

              <Link href={`/dashboard/certificates/${w.projectId}`}>
                <Button variant="secondary">
                  View Certificate →
                </Button>
              </Link>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

/* =========================
   STYLES
========================= */

const backButtonStyle = {
  position: "fixed" as const,   // ✅ KEY FIX
  top: "5.5rem",                // below header
  right: "2.5rem",
  zIndex: 1000,                 // above everything
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