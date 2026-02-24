"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Button";
import Link from "next/link";

type Certificate = {
  id: string;
  projectId: string;
  workspaceId: string;
  userId: string;
  userName: string;
  role: string;
  organizationEmail: string;
  issuedAt: string;
};

type Project = {
  id: string;
  title?: string;
  createdBy?: string;
  status?: "draft" | "active" | "completed";
  completedAt?: string | null;
};

export default function CertificatePage() {
  const params = useParams();
  const projectId =
    typeof params.projectId === "string"
      ? params.projectId
      : Array.isArray(params.projectId)
      ? params.projectId[0]
      : "";

  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  useEffect(() => {
    if (!projectId) return;

    const projects: Project[] = JSON.parse(
      localStorage.getItem("vidzel_projects") || "[]"
    );

    const foundProject = projects.find(
      (p: any) => String(p.id) === String(projectId)
    );
    setProject(foundProject || null);

    setAccounts(
      JSON.parse(localStorage.getItem("vidzel_accounts") || "[]")
    );

    const storedCerts: Certificate[] = JSON.parse(
      localStorage.getItem("vidzel_certificates") || "[]"
    );
    setCertificates(storedCerts);
  }, [projectId]);

  if (!user) {
    return <div style={{ padding: "3rem" }}>Please log in.</div>;
  }

  // ✅ Find THIS user's certificate for THIS project
  const myCert = useMemo(() => {
    return certificates.find(
      (c) =>
        String(c.projectId) === String(projectId) &&
        String(c.userId) === String(user.id)
    );
  }, [certificates, projectId, user.id]);

  // ❌ Not available yet
  if (!project || project.status !== "completed" || !myCert) {
    return (
      <div style={{ padding: "3rem" }}>
        <h2 style={{ marginBottom: "0.75rem" }}>
          Certificate not available.
        </h2>
        <p style={{ color: "#64748b", marginBottom: "1.25rem" }}>
          This certificate will appear after the project is marked as completed
          and your certificate is issued automatically.
        </p>

        <Link href="/dashboard/completed-projects">
          <Button variant="secondary">← Back to Completed Projects</Button>
        </Link>
      </div>
    );
  }

  const orgAccount = accounts.find(
    (a: any) => a.email === (project.createdBy || myCert.organizationEmail)
  );

  const completedDate =
    project.completedAt || myCert.issuedAt || new Date().toISOString();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "3rem",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          width: "100%",
          background: "white",
          borderRadius: "16px",
          padding: "3rem",
          boxShadow: "0 20px 40px rgba(15,23,42,0.08)",
          textAlign: "center",
        }}
      >
        {/* HEADER */}
        <h1 style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>
          Certificate of Completion
        </h1>

        <p style={{ color: "#475569", marginBottom: "2.5rem" }}>
          This certifies that
        </p>

        {/* NAME */}
        <div
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            marginBottom: "1rem",
          }}
        >
          {myCert.userName || user.email}
        </div>

        <p style={{ fontSize: "1.1rem", marginBottom: "1.5rem" }}>
          successfully completed the project
        </p>

        {/* PROJECT */}
        <div
          style={{
            fontSize: "1.4rem",
            fontWeight: 600,
            marginBottom: "1.5rem",
          }}
        >
          {project.title || "Untitled Project"}
        </div>

        {/* DETAILS */}
        <div style={{ color: "#475569", marginBottom: "2rem" }}>
          Role: <strong>{myCert.role}</strong>
          <br />
          Organization:{" "}
          <strong>
            {orgAccount?.name || myCert.organizationEmail || "Organization"}
          </strong>
          <br />
          Completed on:{" "}
          <strong>{new Date(completedDate).toLocaleDateString()}</strong>
        </div>

        {/* FOOTER */}
        <div
          style={{
            marginTop: "3rem",
            display: "flex",
            justifyContent: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <Button variant="secondary" onClick={() => window.print()}>
            🖨 Print / Save as PDF
          </Button>

          <Link href="/dashboard/completed-projects">
            <Button variant="secondary">
              ← Back to Completed Projects
            </Button>
          </Link>
        </div>

        <div
          style={{
            marginTop: "3rem",
            fontSize: "0.85rem",
            color: "#94a3b8",
          }}
        >
          Issued via Vidzel — Virtual Impact & Development Zone for Engaged Leaders
        </div>
      </div>
    </div>
  );
}