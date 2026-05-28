"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Button from "@/components/Button";
import { supabase } from "@/lib/supabaseClient";
import { Award, ExternalLink, CheckCircle, Inbox } from "lucide-react";

type Certificate = {
  id: string;
  project_id: string;
  user_name: string | null;
  role: string | null;
  organization_email: string | null;
  issued_at: string;
  projects: { title: string | null } | null;
};

export default function CertificatesPage() {
  const { user, loading } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loadingData, setLoadingData]   = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("certificates")
      .select("id, project_id, user_name, role, organization_email, issued_at, projects(title)")
      .eq("user_id", user.id)
      .order("issued_at", { ascending: false })
      .then(({ data }) => {
        setCertificates((data as unknown as Certificate[]) || []);
        setLoadingData(false);
      });
  }, [user?.id]);

  if (loading) return null;
  if (!user)   return <div style={{ padding: "3rem" }}>Please log in.</div>;

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100, margin: "0 auto" }}>

      {/* HERO */}
      <div style={{
        background: "radial-gradient(circle,rgba(255,255,255,0.09) 1px,transparent 1px),linear-gradient(135deg,#1e3a5f 0%,#395886 40%,#638ECB 80%,#8AAEE0 100%)",
        backgroundSize: "22px 22px,100% 100%",
        borderRadius: 24, padding: "32px 36px", marginBottom: 28,
        boxShadow: "0 8px 32px rgba(57,88,134,0.28)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -50, right: -50, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "white", margin: "0 0 6px" }}>My Certificates</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.82)", margin: "0 0 12px", lineHeight: 1.5 }}>
          Certificates earned from completed projects.
        </p>
        <span style={{
          display: "inline-block", background: "rgba(255,255,255,0.18)", color: "white",
          padding: "5px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700,
          border: "1px solid rgba(255,255,255,0.30)", backdropFilter: "blur(4px)",
        }}>
          {certificates.length} Certificate{certificates.length !== 1 ? "s" : ""} Earned
        </span>
      </div>

      {/* LOADING */}
      {loadingData && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8", fontSize: 14 }}>
          Loading certificates…
        </div>
      )}

      {/* EMPTY */}
      {!loadingData && certificates.length === 0 && (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          background: "linear-gradient(160deg,#F0F3FA 0%,white 50%)",
          borderRadius: 22, border: "1.5px solid rgba(99,142,203,0.14)",
          boxShadow: "0 4px 18px rgba(99,142,203,0.08)",
        }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg,rgba(99,142,203,0.10),rgba(138,174,224,0.08))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", color: "#638ECB" }}>
            <Inbox size={36} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>No certificates yet</h3>
          <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px", maxWidth: 380, marginLeft: "auto", marginRight: "auto" }}>
            Complete a project to earn your first certificate. They&apos;ll appear here automatically.
          </p>
          <Link href="/dashboard/explore">
            <Button>Explore Projects</Button>
          </Link>
        </div>
      )}

      {/* GRID */}
      {!loadingData && certificates.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          {certificates.map((cert) => {
            const issuedDate = cert.issued_at
              ? new Date(cert.issued_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
              : "—";

            return (
              <div key={cert.id} style={{
                background: "linear-gradient(160deg,#F0F3FA 0%,white 50%)",
                borderRadius: 22, padding: 24,
                boxShadow: "0 4px 18px rgba(99,142,203,0.09)",
                border: "1.5px solid rgba(99,142,203,0.14)",
                borderTop: "3px solid #059669",
                display: "flex", flexDirection: "column", gap: 14,
                transition: "box-shadow 0.2s ease, transform 0.2s ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 28px rgba(99,142,203,0.13)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 18px rgba(99,142,203,0.09)"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#047857,#059669)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", boxShadow: "0 4px 14px rgba(5,150,105,0.35)" }}>
                    <Award size={22} />
                  </div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(5,150,105,0.10)", color: "#059669", border: "1px solid rgba(5,150,105,0.22)", borderRadius: 999, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>
                    <CheckCircle size={12} /> Completed
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>
                    {cert.projects?.title || "Untitled Project"}
                  </h3>
                  <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>
                    {cert.organization_email || "Organization"}
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "12px 14px", borderRadius: 12, background: "rgba(99,142,203,0.04)", border: "1px solid rgba(99,142,203,0.09)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "#64748b" }}>Role</span>
                    <strong style={{ color: "#0f172a" }}>{cert.role || "—"}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "#64748b" }}>Issued</span>
                    <strong style={{ color: "#0f172a" }}>{issuedDate}</strong>
                  </div>
                </div>

                <Link href={`/dashboard/certificates/${cert.project_id}`} style={{ marginTop: "auto" }}>
                  <Button variant="secondary" style={{ width: "100%", justifyContent: "center" }}>
                    <ExternalLink size={14} />
                    View Certificate
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 28 }}>
        <Link href={user.role === "volunteer" ? "/dashboard/volunteer" : user.role === "student" ? "/dashboard/student" : "/dashboard"} style={{ color: "#638ECB", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
