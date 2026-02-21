"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/Button";

export default function CreateProjectPage() {
  const { user } = useAuth();
  const router = useRouter();

  /* 🔒 Access control */
  if (!user) {
    return <div style={{ padding: "3rem" }}>Please log in first.</div>;
  }
  if (user.role !== "organization") {
    return (
      <div style={{ padding: "3rem" }}>
        Only organizations can create projects.
      </div>
    );
  }

  /* ================= STATE ================= */

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tasks, setTasks] = useState("");

  const [contributors, setContributors] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([""]);

  const [causes, setCauses] = useState<string[]>([]);
  const [otherCause, setOtherCause] = useState("");

  const [formats, setFormats] = useState<string[]>([]);
  const [otherFormat, setOtherFormat] = useState("");

  const [languages, setLanguages] = useState<string[]>([]);
  const [otherLanguage, setOtherLanguage] = useState("");

  const [files, setFiles] = useState<string[]>([]);

  const [outcomes, setOutcomes] = useState<string[]>([]);
  const [otherOutcome, setOtherOutcome] = useState("");

  /* ================= SUBMIT ================= */

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 🔑 SINGLE SOURCE OF TRUTH FOR ID
    const id = "project_" + Date.now();

    /* 1️⃣ SAVE PROJECT */
    const storedProjects = JSON.parse(
      localStorage.getItem("vidzel_projects") || "[]"
    );

    const project = {
      id,
      createdBy: user.email,
      title,
      description,
      tasks,
      contributors,
      roles,

      causes:
        causes.includes("Other") && otherCause
          ? [...causes.filter(c => c !== "Other"), otherCause]
          : causes,

      formats:
        formats.includes("Other") && otherFormat
          ? [...formats.filter(f => f !== "Other"), otherFormat]
          : formats,

      languages:
        languages.includes("Other") && otherLanguage
          ? [...languages.filter(l => l !== "Other"), otherLanguage]
          : languages,

      outcomes:
        outcomes.includes("Other") && otherOutcome
          ? [...outcomes.filter(o => o !== "Other"), otherOutcome]
          : outcomes,

      files,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "vidzel_projects",
      JSON.stringify([...storedProjects, project])
    );

    /* 2️⃣ CREATE WORKSPACE (✅ SAME ID) */
    const storedWorkspaces = JSON.parse(
      localStorage.getItem("vidzel_workspaces") || "[]"
    );

    const workspace = {
      id, // ✅ SAME AS PROJECT ID
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

    /* 3️⃣ REDIRECT TO MY WORKSPACES */
    router.push("/dashboard/workspaces");
  };

  /* ================= STYLES ================= */

  const page = {
    minHeight: "100vh",
    background: "#f5f7fb",
    padding: "3rem",
    display: "flex",
    justifyContent: "center",
  };

  const card = {
    width: "100%",
    maxWidth: "1100px",
    background: "white",
    borderRadius: "10px",
    padding: "2.5rem",
    boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
  };

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

  const sectionTitle = {
    fontSize: "1.1rem",
    fontWeight: 600,
    margin: "2rem 0 0.5rem",
  };

  /* ================= UI ================= */

  return (
    <div style={page}>
      <div style={card}>
        <h1>Create Project</h1>

        <form onSubmit={handleSubmit}>
          <div style={sectionTitle}>1. Project Title</div>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Enter a clear, short project name"
            style={input}
            required
          />

          <div style={sectionTitle}>
            2. Organization & Project Description
          </div>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={textarea}
            required
          />

          <div style={sectionTitle}>
            3. Key Tasks & Responsibilities
          </div>
          <textarea
            value={tasks}
            onChange={e => setTasks(e.target.value)}
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
