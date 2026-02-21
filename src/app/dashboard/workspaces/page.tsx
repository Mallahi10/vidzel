"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/Button";

export default function WorkspacesListPage() {
  const { user } = useAuth();
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

    // ===============================
    // Determine which workspaces belong to user
    // ===============================
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

    // ===============================
    // Attach project title
    // ===============================
    const enriched = myWorkspaces.map((w: any) => {
      const project = projects.find(
        (p: any) => String(p.id) === String(w.projectId)
      );

      return {
        ...w,
        projectTitle: project?.title || "Untitled Project",
        status: w.status || "active", // 🔥 fallback safety
      };
    });

    // ===============================
    // STRICT STATUS SPLIT
    // ===============================
    setActiveWorkspaces(
      enriched.filter((w: any) => w.status === "active")
    );

    setCompletedWorkspaces(
      enriched.filter((w: any) => w.status === "completed")
    );
  }, [user]);

  if (!user) {
    return <div style={{ padding: "3rem" }}>Please log in.</div>;
  }

  const isOrg = user.role === "organization";

  return (
    <div style={{ padding: "3rem", maxWidth: "1000px" }}>
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
