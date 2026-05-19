"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/Button";
import { supabase } from "@/lib/supabaseClient"; // 👈 Zid hadi darouri

export default function Page() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // 👈 Bach n-gérer l'affichage

  // ===== FETCH DATA (Supabase blassa localStorage) =====
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
        .from("projects")
        .select("*, workspaces(id)")
        .order("created_at", { ascending: false });

        if (!error) setProjects(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user?.id]); // 👈 user?.id bach mat-traich boucle infinie

  if (!user) {
    return <div style={{ padding: "3rem" }}>Please log in first.</div>;
  }

  const role = user.role?.toLowerCase();
  const isOrg = role === "organization";

  // ===== FILTER (organization_id blassa email) =====
  const myProjects = projects.filter(
    (p) => p.organization_id === user.id
  );

  // ===== ACTIONS (Supabase blassa localStorage) =====
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project?")) return;

    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (!error) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleComplete = async (id: string) => {
    if (!confirm("Mark this project as completed?")) return;

    const { error } = await supabase
      .from("projects")
      .update({ status: "completed" })
      .eq("id", id);

    if (!error) {
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "completed" } : p))
      );
    }
  };

  return (
    <div style={{ padding: "3rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* ===== HEADER ===== */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "3rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
            {isOrg ? "Organization Dashboard" : "Browse Projects"}
          </h1>
          <p style={{ color: "#475569", maxWidth: "520px" }}>
            {isOrg ? "Build and manage impact projects." : "Explore open projects and get involved."}
          </p>
        </div>
        {isOrg && (
          <Link href="/dashboard/projects/create">
            <Button>+ Create Project</Button>
          </Link>
        )}
      </div>

      {/* ===== PROJECT LIST ===== */}
      {loading ? (
        <p>Loading projects...</p>
      ) : (isOrg ? myProjects : projects).length === 0 ? (
        <p style={{ color: "#64748b" }}>No projects available yet.</p>
      ) : (
        (isOrg ? myProjects : projects).map((project) => {
          const isCompleted = project.status === "completed";

          return (
            <div key={project.id} style={{ border: "1px solid #e5e7eb", borderRadius: "14px", padding: "1.5rem", marginBottom: "1.25rem", background: "white", boxShadow: "0 8px 24px rgba(15,23,42,0.04)", opacity: isCompleted ? 0.85 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>{project.title || "Untitled Project"}</h3>
                <span style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  background: project.visibility === "private" ? "#FEF2F2" : "#F0FDF4",
                  color: project.visibility === "private" ? "#991B1B" : "#166534",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}>
                  {project.visibility === "private" ? "🔒 Private" : "🌐 Open"}
                </span>
              </div>

              <div style={{ marginBottom: "1rem", color: "#475569" }}>
                <strong>Created:</strong>{" "}
                {/* 👈 created_at blassa createdAt */}
                {project.created_at ? new Date(project.created_at).toLocaleDateString() : "N/A"}
              </div>

              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                {isOrg && (
                  <>
                    <Link href={`/dashboard/projects/${project.id}/applicants`}>
                      <Button variant="secondary">👤 Applicants</Button>
                    </Link>

                    {/* 👈 Passina l-ID f l-URL bach l-Edit ykhdem */}
                    <Link href={`/dashboard/projects/create?edit=${project.id}`}>
                      <Button variant="secondary">✏️ Edit</Button>
                    </Link>

                    <Link href={`/dashboard/workspaces/${project.workspaces?.[0]?.id ?? project.id}`}>
                        <Button variant="secondary">📂 Workspace</Button>
                    </Link>

                    {!isCompleted && (
                      <Button variant="secondary" onClick={() => handleComplete(project.id)}>
                        ✅ Complete
                      </Button>
                    )}

                    <button onClick={() => handleDelete(project.id)} style={{ background: "transparent", color: "#dc2626", border: "none", cursor: "pointer", fontWeight: 600 }}>
                      🗑 Delete
                    </button>
                  </>
                )}

                {!isOrg && (
                  <>
                    <Link href={`/dashboard/projects/${project.id}`}>
                      <Button variant="secondary">View Details</Button>
                    </Link>
                    <Button>Apply</Button>
                  </>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}