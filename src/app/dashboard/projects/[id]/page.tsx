"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProjectDetailsPage() {
  const params = useParams();

  // folder is [id]
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("vidzel_projects");
    const projects = stored ? JSON.parse(stored) : [];

    const found = projects.find(
      (p: any) => String(p.id) === String(id)
    );

    if (found) {
      setProject(found);
    }
  }, [id]);

  if (!project) {
    return (
      <div style={{ padding: "3rem" }}>
        <h2>Project not found</h2>
      </div>
    );
  }

  // 🔒 SAFE NORMALIZATION (prevents crashes)
  const title =
    project.title || project.projectTitle || "Untitled Project";

  const description =
    project.description ||
    project.projectDescription ||
    "";

  const tasks =
    Array.isArray(project.tasks)
      ? project.tasks
      : Array.isArray(project.keyTasks)
      ? project.keyTasks
      : typeof project.tasks === "string"
      ? project.tasks.split("\n").filter(Boolean)
      : [];

  return (
    <div
      style={{
        padding: "3rem",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      {/* ===== TITLE ===== */}
      <h1 style={{ marginBottom: "0.5rem" }}>{title}</h1>

      {/* ===== ORGANIZATION ===== */}
      <p style={{ color: "#475569", marginBottom: "1.5rem" }}>
        <strong>Organization:</strong> {project.createdBy}
      </p>

      {/* ===== DESCRIPTION ===== */}
      {description && (
        <>
          <h3 style={{ marginTop: "1.5rem" }}>
            Project Description
          </h3>
          <p style={{ lineHeight: 1.6, whiteSpace: "pre-line" }}>
            {description}
          </p>
        </>
      )}

      {/* ===== TASKS ===== */}
      {tasks.length > 0 && (
        <>
          <h3 style={{ marginTop: "2rem" }}>
            Key Tasks & Responsibilities
          </h3>
          <ul style={{ paddingLeft: "1.25rem" }}>
            {tasks.map((task: string, i: number) => (
              <li key={i}>{task}</li>
            ))}
          </ul>
        </>
      )}

      {/* ===== CAUSE AREAS ===== */}
      {Array.isArray(project.causeAreas) &&
        project.causeAreas.length > 0 && (
          <>
            <h3 style={{ marginTop: "2rem" }}>
              Cause Areas
            </h3>
            <ul style={{ paddingLeft: "1.25rem" }}>
              {project.causeAreas.map((c: string) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </>
        )}
    </div>
  );
}