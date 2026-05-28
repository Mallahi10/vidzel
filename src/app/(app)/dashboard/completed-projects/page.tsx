"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/Button";
import { supabase } from "@/lib/supabaseClient";
import { Award, CheckCircle } from "lucide-react";

type CompletedProject = {
  workspace_id: string;
  project_id: string;
  project_title: string;
  completed_at: string | null;
};

export default function CompletedProjectsPage() {
  const { user, loading } = useAuth();
  const [projects, setProjects] = useState<CompletedProject[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("workspace_members")
      .select("workspace_id, workspaces(id, project_id, status, updated_at, projects(id, title))")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .then(({ data }) => {
        const list: CompletedProject[] = (data || []).map((m: any) => ({
          workspace_id:  m.workspace_id,
          project_id:    m.workspaces?.projects?.id    || m.workspaces?.project_id || "",
          project_title: m.workspaces?.projects?.title || "Untitled Project",
          completed_at:  m.workspaces?.updated_at     || null,
        }));
        setProjects(list);
        setLoadingData(false);
      });
  }, [user?.id]);

  if (loading) return null;
  if (!user) return <div style={{ padding: "3rem" }}>Please log in.</div>;

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1000, margin: "0 auto" }}>

      {/* HERO */}
      <div style={{
        background: "radial-gradient(circle,rgba(255,255,255,0.09) 1px,transparent 1px),linear-gradient(135deg,#047857 0%,#059669 50%,#34D399 100%)",
        backgroundSize: "22px 22px,100% 100%",
        borderRadius: 24, padding: "32px 36px", marginBottom: 28,
        boxShadow: "0 8px 32px rgba(5,150,105,0.28)",
        position: "relative", overflow: "hidden",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16,
      }}>
        <div style={{ position: "absolute", top: -50, right: -50, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "white", margin: "0 0 6px" }}>Completed Projects</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.82)", margin: "0 0 12px", lineHeight: 1.5 }}>
            Projects you have successfully completed on Vidzel.
          </p>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,0.18)", color: "white",
            padding: "5px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700,
            border: "1px solid rgba(255,255,255,0.30)", backdropFilter: "blur(4px)",
          }}>
            <CheckCircle size={12} /> {projects.length} Completed
          </span>
        </div>
        <Link href="/dashboard">
          <Button variant="secondary">← Back</Button>
        </Link>
      </div>

      {/* LOADING */}
      {loadingData && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8", fontSize: 14 }}>
          Loading…
        </div>
      )}

      {/* EMPTY */}
      {!loadingData && projects.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "linear-gradient(160deg,#F0F3FA 0%,white 50%)", borderRadius: 22, border: "1.5px solid rgba(99,142,203,0.14)", boxShadow: "0 4px 18px rgba(99,142,203,0.08)" }}>
          <p style={{ fontSize: 16, color: "#64748b", margin: 0 }}>You don&apos;t have any completed projects yet.</p>
        </div>
      )}

      {/* LIST */}
      {!loadingData && projects.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {projects.map((p) => (
            <div key={p.workspace_id} style={{
              background: "linear-gradient(160deg,#F0F3FA 0%,white 50%)",
              borderRadius: 18, padding: "20px 24px",
              boxShadow: "0 4px 14px rgba(99,142,203,0.08)",
              border: "1.5px solid rgba(99,142,203,0.12)",
              borderTop: "3px solid #059669",
              display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14,
            }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>{p.project_title}</h3>
                {p.completed_at && (
                  <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                    Completed: {new Date(p.completed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                )}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link href={`/dashboard/workspaces/${p.workspace_id}`}>
                  <Button variant="secondary">View Workspace →</Button>
                </Link>
                {p.project_id && (
                  <Link href={`/dashboard/certificates/${p.project_id}`}>
                    <Button>
                      <Award size={14} />
                      Certificate →
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
