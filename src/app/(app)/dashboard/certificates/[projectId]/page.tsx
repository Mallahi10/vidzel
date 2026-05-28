"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Button from "@/components/Button";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type CertData = {
  id: string;
  user_name: string | null;
  role: string | null;
  organization_email: string | null;
  issued_at: string;
  projects: { title: string | null; status: string | null } | null;
};

export default function CertificatePage() {
  const params    = useParams();
  const projectId = typeof params.projectId === "string" ? params.projectId : Array.isArray(params.projectId) ? params.projectId[0] : "";
  const { user }  = useAuth();

  const [cert, setCert]         = useState<CertData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!user || !projectId) return;
    supabase
      .from("certificates")
      .select("id, user_name, role, organization_email, issued_at, projects(title, status)")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) setNotFound(true);
        else setCert(data as unknown as CertData);
        setLoading(false);
      });
  }, [user?.id, projectId]);

  if (!user)  return <div style={{ padding: "3rem" }}>Please log in.</div>;
  if (loading) return <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Loading…</div>;

  if (notFound || !cert) {
    return (
      <div style={{ padding: "3rem" }}>
        <h2 style={{ marginBottom: "0.75rem" }}>Certificate not available.</h2>
        <p style={{ color: "#64748b", marginBottom: "1.25rem" }}>
          This certificate will appear after the project is marked as completed and your certificate is issued.
        </p>
        <Link href="/dashboard/completed-projects">
          <Button variant="secondary">← Back to Completed Projects</Button>
        </Link>
      </div>
    );
  }

  const completedDate = cert.issued_at || new Date().toISOString();

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "3rem", display: "flex", justifyContent: "center" }}>
      <div style={{
        maxWidth: 900, width: "100%",
        background: "white", borderRadius: 16, padding: "3rem",
        boxShadow: "0 20px 40px rgba(15,23,42,0.08)",
        textAlign: "center",
      }}>
        <h1 style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>Certificate of Completion</h1>
        <p style={{ color: "#475569", marginBottom: "2.5rem" }}>This certifies that</p>

        <div style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "1rem" }}>
          {cert.user_name || user.email}
        </div>

        <p style={{ fontSize: "1.1rem", marginBottom: "1.5rem" }}>successfully completed the project</p>

        <div style={{ fontSize: "1.4rem", fontWeight: 600, marginBottom: "1.5rem" }}>
          {cert.projects?.title || "Untitled Project"}
        </div>

        <div style={{ color: "#475569", marginBottom: "2rem" }}>
          Role: <strong>{cert.role || "—"}</strong>
          <br />
          Organization: <strong>{cert.organization_email || "—"}</strong>
          <br />
          Completed on: <strong>{new Date(completedDate).toLocaleDateString()}</strong>
        </div>

        <div style={{ marginTop: "3rem", display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
          <Button variant="secondary" onClick={() => window.print()}>
            🖨 Print / Save as PDF
          </Button>
          <Link href="/dashboard/completed-projects">
            <Button variant="secondary">← Back to Completed Projects</Button>
          </Link>
        </div>

        <div style={{ marginTop: "3rem", fontSize: "0.85rem", color: "#94a3b8" }}>
          Issued via Vidzel — Virtual Impact &amp; Development Zone for Engaged Leaders
        </div>
      </div>
    </div>
  );
}
