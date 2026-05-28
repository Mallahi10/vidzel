"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/Button";
import { supabase } from "@/lib/supabaseClient";
import { ClipboardList, Clock, CheckCircle, XCircle, Inbox } from "lucide-react";

type Application = {
  id: string;
  project_id: string;
  status: "pending" | "accepted" | "rejected" | null;
  created_at: string;
  projects: { title: string | null } | null;
};

export default function MyApplicationsPage() {
  const { user, loading } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("applications")
      .select("id, project_id, status, created_at, projects(title)")
      .eq("applicant_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setApplications((data as unknown as Application[]) || []);
        setLoadingApps(false);
      });
  }, [user?.id]);

  if (loading) return null;
  if (!user) return <div style={{ padding: "3rem" }}>Please log in.</div>;

  const statusColor: Record<string, { bg: string; color: string; border: string }> = {
    pending:  { bg: "rgba(249,115,22,0.08)",  color: "#c2410c", border: "rgba(249,115,22,0.22)" },
    accepted: { bg: "rgba(16,185,129,0.08)",  color: "#059669", border: "rgba(16,185,129,0.22)" },
    rejected: { bg: "rgba(220,38,38,0.08)",   color: "#dc2626", border: "rgba(220,38,38,0.22)"  },
  };

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
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "white", margin: "0 0 6px" }}>My Applications</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.82)", margin: "0 0 12px", lineHeight: 1.5 }}>
          Track all your project applications.
        </p>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(255,255,255,0.18)", color: "white",
          padding: "5px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700,
          border: "1px solid rgba(255,255,255,0.30)", backdropFilter: "blur(4px)",
        }}>
          <ClipboardList size={12} /> {applications.length} Application{applications.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* LOADING */}
      {loadingApps && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8", fontSize: 14 }}>
          Loading applications…
        </div>
      )}

      {/* EMPTY STATE */}
      {!loadingApps && applications.length === 0 && (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          background: "linear-gradient(160deg,#F0F3FA 0%,white 50%)",
          borderRadius: 22, border: "1.5px solid rgba(99,142,203,0.14)",
          boxShadow: "0 4px 18px rgba(99,142,203,0.08)",
        }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg,rgba(99,142,203,0.10),rgba(138,174,224,0.08))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", color: "#638ECB" }}>
            <Inbox size={36} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>No applications yet</h3>
          <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px", maxWidth: 360, marginLeft: "auto", marginRight: "auto" }}>
            Browse open projects and apply to get started.
          </p>
          <Link href="/dashboard/explore">
            <Button>Explore Projects</Button>
          </Link>
        </div>
      )}

      {/* LIST */}
      {!loadingApps && applications.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {applications.map((app) => {
            const s = statusColor[app.status || "pending"] || statusColor.pending;
            const dateStr = app.created_at
              ? new Date(app.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
              : "—";

            return (
              <div key={app.id} style={{
                background: "linear-gradient(160deg,#F0F3FA 0%,white 50%)",
                borderRadius: 18, padding: "18px 22px",
                boxShadow: "0 4px 14px rgba(99,142,203,0.08)",
                border: "1.5px solid rgba(99,142,203,0.12)",
                display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap",
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: "linear-gradient(135deg,#395886,#638ECB)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", boxShadow: "0 3px 10px rgba(99,142,203,0.32)" }}>
                  <ClipboardList size={20} />
                </div>

                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                      {app.projects?.title || "Untitled Project"}
                    </h3>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
                      borderRadius: 999, padding: "3px 12px", fontSize: 12, fontWeight: 700, flexShrink: 0,
                    }}>
                      {app.status === "accepted" && <CheckCircle size={11} />}
                      {app.status === "rejected" && <XCircle size={11} />}
                      {(!app.status || app.status === "pending") && <Clock size={11} />}
                      {app.status ? app.status.charAt(0).toUpperCase() + app.status.slice(1) : "Pending"}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>Applied on {dateStr}</p>
                </div>

                <Link href={`/dashboard/projects/${app.project_id}`} style={{ flexShrink: 0 }}>
                  <Button variant="outline" style={{ fontSize: 13 }}>View Project →</Button>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 28 }}>
        <Link href="/dashboard" style={{ color: "#638ECB", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
