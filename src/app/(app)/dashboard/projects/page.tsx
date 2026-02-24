"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/Button";

export default function Page() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const stored = JSON.parse(
      localStorage.getItem("vidzel_projects") || "[]"
    );
    setProjects(stored);
  }, []);

  if (!user) {
    return <div style={{ padding: "3rem" }}>Please log in first.</div>;
  }

  if (user.role !== "organization") {
    return (
      <div style={{ padding: "3rem" }}>
        Only organizations can view this page.
      </div>
    );
  }

  const myProjects = projects.filter(
    (p) => p.createdBy === user.email
  );

  const handleDelete = (id: string) => {
    if (!confirm("Delete this project?")) return;

    const updated = projects.filter((p) => p.id !== id);
    localStorage.setItem(
      "vidzel_projects",
      JSON.stringify(updated)
    );
    setProjects(updated);
  };

  const handleComplete = (id: string) => {
    if (!confirm("Mark this project as completed?")) return;

    const updated = projects.map((p) =>
      p.id === id
        ? {
            ...p,
            status: "completed",
            completedAt: new Date().toISOString(),
          }
        : p
    );

    localStorage.setItem(
      "vidzel_projects",
      JSON.stringify(updated)
    );
    setProjects(updated);
  };

  return (
    <div
      style={{
        padding: "3rem",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      {/* ===== HEADER ===== */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "3rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
            Organization Dashboard
          </h1>
          <p style={{ color: "#475569", maxWidth: "520px" }}>
            Build and manage impact projects with students, volunteers, and mentors.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          {/* ✅ FIXED */}
          <Button variant="secondary" onClick={() => router.back()}>
            ← Back
          </Button>

          <Link href="/dashboard/projects/create">
            <Button>+ Create Project</Button>
          </Link>
        </div>
      </div>

      {/* ===== PROJECT LIST ===== */}
      <h2 style={{ marginBottom: "1.5rem" }}>Your Projects</h2>

      {myProjects.length === 0 && (
        <p style={{ color: "#64748b" }}>
          You haven’t created any projects yet.
        </p>
      )}

      {myProjects.map((project) => {
        const isCompleted = project.status === "completed";

        return (
          <div
            key={project.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "14px",
              padding: "1.5rem",
              marginBottom: "1.25rem",
              background: "white",
              boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
              opacity: isCompleted ? 0.85 : 1,
            }}
          >
            <div style={{ marginBottom: "0.75rem" }}>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "20px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  background: isCompleted ? "#e5e7eb" : "#dcfce7",
                  color: isCompleted ? "#334155" : "#166534",
                }}
              >
                {isCompleted ? "Completed" : "Active"}
              </span>
            </div>

            <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>
              {project.title || project.projectTitle || "Untitled Project"}
            </h3>

            <div style={{ marginBottom: "1rem", color: "#475569" }}>
              <strong>Created:</strong>{" "}
              {new Date(project.createdAt).toLocaleString()}
            </div>

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <Link href={`/dashboard/projects/${project.id}/applicants`}>
                <Button variant="secondary">👤➕ Applicants</Button>
              </Link>

              <Link href={`/dashboard/projects/create?edit=${project.id}`}>
                <Button variant="secondary">✏️ Edit</Button>
              </Link>

              {/* ✅ FIXED */}
              <Link href={`/dashboard/workspaces/${project.id}`}>
                <Button variant="secondary">📂 Open Workspace</Button>
              </Link>

              {!isCompleted && (
                <Button
                  variant="secondary"
                  onClick={() => handleComplete(project.id)}
                >
                  ✅ Mark Completed
                </Button>
              )}

              <button
                onClick={() => handleDelete(project.id)}
                style={{
                  background: "transparent",
                  color: "#dc2626",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                🗑 Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}