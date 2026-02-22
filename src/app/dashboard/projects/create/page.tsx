"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/Button";

export default function CreateProjectPage() {
  const router = useRouter();
  const { user } = useAuth();

  /* ================= HOOKS (ALWAYS FIRST) ================= */

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tasks, setTasks] = useState("");
  const [loading, setLoading] = useState(true);

  /* ================= ACCESS CONTROL ================= */

  useEffect(() => {
    if (!user) return;

    if (user.role !== "organization") {
      router.replace("/dashboard");
      return;
    }

    setLoading(false);
  }, [user, router]);

  if (!user || loading) {
    return <div style={{ padding: "3rem" }}>Loading…</div>;
  }

  /* ================= SUBMIT ================= */

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const id = "project_" + Date.now();

    const storedProjects = JSON.parse(
      localStorage.getItem("vidzel_projects") || "[]"
    );

    const project = {
      id,
      createdBy: user.email,
      title,
      description,
      tasks,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "vidzel_projects",
      JSON.stringify([...storedProjects, project])
    );

    const storedWorkspaces = JSON.parse(
      localStorage.getItem("vidzel_workspaces") || "[]"
    );

    const workspace = {
      id,
      projectId: id,
      projectTitle: title,
      organizationEmail: user.email,
      status: "active",
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "vidzel_workspaces",
      JSON.stringify([...storedWorkspaces, workspace])
    );

    router.push("/dashboard/workspaces");
  };

  /* ================= UI ================= */

  return (
    <div style={{ padding: "3rem", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: "100%",
          maxWidth: "1100px",
          background: "white",
          borderRadius: "10px",
          padding: "2.5rem",
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h1>Create Project</h1>

        <form onSubmit={handleSubmit}>
          <label>Project Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={input}
            required
          />

          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={textarea}
            required
          />

          <label>Key Tasks & Responsibilities</label>
          <textarea
            value={tasks}
            onChange={(e) => setTasks(e.target.value)}
            style={textarea}
            required
          />

          <div style={{ marginTop: "3rem", textAlign: "right" }}>
            <Button type="submit">Save Project</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const input = {
  width: "100%",
  padding: "0.75rem",
  borderRadius: "6px",
  border: "1px solid #d0d7e2",
  marginBottom: "1rem",
};

const textarea = {
  ...input,
  minHeight: "120px",
};