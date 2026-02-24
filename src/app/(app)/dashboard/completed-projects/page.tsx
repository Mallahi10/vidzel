"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Button from "@/components/Button";

type ProjectStatus = "draft" | "active" | "completed";

type Project = {
  id: string;
  title?: string;
  createdAt?: string;
  createdBy?: string;
  causes?: string[];
  status: ProjectStatus;
  completedAt?: string;
};

type Workspace = {
  id: string;
  projectId: string;
  organizationEmail: string;
};

export default function CompletedProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  useEffect(() => {
    // ✅ Normalize projects (FIX #1)
    const rawProjects = JSON.parse(
      localStorage.getItem("vidzel_projects") || "[]"
    );

    const normalizedProjects: Project[] = rawProjects.map((p: any) => ({
      ...p,
      status: p.status ?? "active", // 👈 DEFAULT STATUS
    }));

    setProjects(normalizedProjects);

    const storedWorkspaces: Workspace[] = JSON.parse(
      localStorage.getItem("vidzel_workspaces") || "[]"
    );
    setWorkspaces(storedWorkspaces);
  }, []);

  if (!user) {
    return <div style={{ padding: "3rem" }}>Please log in.</div>;
  }

  // ✅ Get projectIds from workspaces where user is a member
  const myWorkspaceProjectIds = useMemo(() => {
    const members = JSON.parse(
      localStorage.getItem("vidzel_workspace_members") || "[]"
    );

    const myWorkspaceIds = members
      .filter((m: any) => m.userId === user.id)
      .map((m: any) => m.workspaceId);

    return workspaces
      .filter((w) => myWorkspaceIds.includes(w.id))
      .map((w) => String(w.projectId)); // 👈 normalize to string
  }, [workspaces, user.id]);

  // ✅ Only completed projects (FIX #2)
  const completedProjects = useMemo(() => {
    return projects.filter(
      (p) =>
        myWorkspaceProjectIds.includes(String(p.id)) &&
        p.status === "completed"
    );
  }, [projects, myWorkspaceProjectIds]);

  return (
    <div style={{ padding: "3rem", maxWidth: "960px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>Completed Projects</h1>

        <Link href="/dashboard">
          <Button variant="secondary">← Back</Button>
        </Link>
      </div>

      <p style={{ color: "#64748b", marginTop: "0.5rem" }}>
        Projects you’ve completed on Vidzel.
      </p>

      {completedProjects.length === 0 && (
        <div style={{ marginTop: "2rem", color: "#64748b" }}>
          You don’t have any completed projects yet.
        </div>
      )}

      {completedProjects.map((p) => (
        <div
          key={p.id}
          style={{
            marginTop: "1rem",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "1.25rem",
            background: "white",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>
            {p.title || "Untitled Project"}
          </div>

          <div style={{ marginTop: "0.5rem", color: "#475569" }}>
            <strong>Causes:</strong> {p.causes?.join(", ") || "—"}
          </div>

          <div style={{ marginTop: "0.5rem", color: "#475569" }}>
            <strong>Completed:</strong>{" "}
            {p.completedAt
              ? new Date(p.completedAt).toLocaleString()
              : "—"}
          </div>

          <div style={{ marginTop: "1rem" }}>
            <Link href={`/dashboard/certificates/${p.id}`}>
  <Button>
    View Certificate →
  </Button>
</Link>

          </div>
        </div>
      ))}
    </div>
  );
}
