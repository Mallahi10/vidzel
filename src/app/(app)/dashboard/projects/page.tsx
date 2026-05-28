"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/Button";
import { supabase } from "@/lib/supabaseClient";
// NEW MODERN UI UPDATE — CSS module + Lucide icons replace inline styles and emojis
import styles from "./projects.module.css";
import {
  Plus,
  Users,
  PenLine,
  LayoutGrid,
  CheckCircle,
  Trash2,
  FolderOpen,
  Loader2,
  Lock,
  Globe,
  Calendar,
} from "lucide-react";

export default function Page() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ===== FETCH DATA =====
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const isOrgUser = user.role?.toLowerCase() === "organization";

        let query = supabase
          .from("projects")
          .select("*, workspaces(id)")
          .order("created_at", { ascending: false });

        if (isOrgUser) {
          // Orgs see only their own projects
          query = query.eq("organization_id", user.id);
        } else {
          // Non-orgs see only open/public, non-completed projects
          query = query.eq("visibility", "open").neq("status", "completed");
        }

        const { data, error } = await query;
        if (!error) setProjects(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user?.id]);

  if (!user) {
    return <div className={styles.page}>Please log in first.</div>;
  }

  const role = user.role?.toLowerCase();
  const isOrg = role === "organization";

  // ===== FILTER (logique inchangée) =====
  const myProjects = projects.filter((p) => p.organization_id === user.id);

  // ===== ACTIONS (logique inchangée) =====
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    // organization_id guard: prevents deleting projects not owned by this org
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("organization_id", user.id);
    if (!error) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleComplete = async (id: string) => {
    if (!confirm("Mark this project as completed?")) return;
    // organization_id guard: prevents completing projects not owned by this org
    const { error } = await supabase
      .from("projects")
      .update({ status: "completed" })
      .eq("id", id)
      .eq("organization_id", user.id);
    if (!error) {
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "completed" } : p))
      );
    }
  };

  // Fetch is already filtered server-side per role — no client-side filter needed
  const displayProjects = projects;

  return (
    // OLD STYLE BACKUP: <div style={{ padding: "3rem", maxWidth: "1200px", margin: "0 auto" }}>
    <div className={styles.page}>

      {/* ===== HERO BANNER ===== */}
      <div className={styles.pageHero}>
        <div>
          <h1 className={styles.heroTitle}>
            {isOrg ? "My Projects" : "Browse Projects"}
          </h1>
          <p className={styles.heroSubtitle}>
            {isOrg
              ? "Build and manage impact projects for your organization."
              : "Explore open projects and get involved."}
          </p>
          <span className={styles.heroBadge}>
            {isOrg ? "Organization" : "Explorer"}
          </span>
        </div>

        {isOrg && (
          <Link href="/dashboard/projects/create">
            <Button>
              <Plus size={16} />
              Create Project
            </Button>
          </Link>
        )}
      </div>

      {/* ===== PROJECT LIST ===== */}
      {loading ? (
        // OLD STYLE BACKUP: <p>Loading projects...</p>
        <div className={styles.loadingState}>
          <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
          Loading projects…
        </div>
      ) : displayProjects.length === 0 ? (
        // OLD STYLE BACKUP: <p style={{ color: "#64748b" }}>No projects available yet.</p>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <FolderOpen size={40} />
          </div>
          <p className={styles.emptyTitle}>No projects yet</p>
          <p className={styles.emptyText}>
            {isOrg
              ? "Create your first project to start collaborating."
              : "No projects available yet. Check back soon."}
          </p>
          {isOrg && (
            <Link href="/dashboard/projects/create">
              <Button>
                <Plus size={16} />
                Create your first project
              </Button>
            </Link>
          )}
        </div>
      ) : (
        displayProjects.map((project) => {
          const isCompleted = project.status === "completed";
          const isPrivate = project.visibility === "private";

          return (
            // OLD STYLE BACKUP: <div key={project.id} style={{ border: "1px solid #e5e7eb", borderRadius: "14px", padding: "1.5rem", ... }}>
            <div
              key={project.id}
              className={`${styles.projectCard} ${isCompleted ? styles.projectCardCompleted : ""}`}
            >
              {/* Card top: title + badges */}
              {/* OLD STYLE BACKUP: <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}> */}
              <div className={styles.cardTop}>
                <h3 className={styles.cardTitle}>
                  {project.title || "Untitled Project"}
                </h3>

                {/* OLD STYLE BACKUP: <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "12px", background: conditional, color: conditional }}> */}
                {/* NEW MODERN UI UPDATE — Lucide icons replace emoji 🔒/🌐 */}
                <span className={`${styles.badge} ${isPrivate ? styles.badgePrivate : styles.badgeOpen}`}>
                  {isPrivate ? <Lock size={11} /> : <Globe size={11} />}
                  {isPrivate ? "Private" : "Open"}
                </span>

                {isCompleted && (
                  <span className={`${styles.badge} ${styles.badgeCompleted}`}>
                    <CheckCircle size={11} />
                    Completed
                  </span>
                )}
              </div>

              {/* Meta: creation date */}
              {/* OLD STYLE BACKUP: <div style={{ marginBottom: "1rem", color: "#475569" }}> */}
              <div className={styles.cardMeta}>
                <Calendar size={13} />
                Created:{" "}
                {project.created_at
                  ? new Date(project.created_at).toLocaleDateString()
                  : "N/A"}
              </div>

              {/* Action buttons */}
              {/* OLD STYLE BACKUP: <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}> */}
              <div className={styles.cardActions}>
                {isOrg && (
                  <>
                    {/* OLD STYLE BACKUP: <Button variant="secondary">👤 Applicants</Button> */}
                    <Link href={`/dashboard/projects/${project.id}/applicants`}>
                      <Button variant="secondary">
                        <Users size={15} />
                        Applicants
                      </Button>
                    </Link>

                    {/* OLD STYLE BACKUP: <Button variant="secondary">✏️ Edit</Button> */}
                    <Link href={`/dashboard/projects/create?edit=${project.id}`}>
                      <Button variant="secondary">
                        <PenLine size={15} />
                        Edit
                      </Button>
                    </Link>

                    {/* OLD STYLE BACKUP: <Button variant="secondary">📂 Workspace</Button> */}
                    <Link href={`/dashboard/workspaces/${project.workspaces?.[0]?.id ?? project.id}`}>
                      <Button variant="secondary">
                        <LayoutGrid size={15} />
                        Workspace
                      </Button>
                    </Link>

                    {!isCompleted && (
                      /* OLD STYLE BACKUP: <Button variant="secondary">✅ Complete</Button> */
                      <Button variant="secondary" onClick={() => handleComplete(project.id)}>
                        <CheckCircle size={15} />
                        Mark Complete
                      </Button>
                    )}

                    {/* OLD STYLE BACKUP: <button style={{ background: "transparent", color: "#dc2626", border: "none" }}>🗑 Delete</button> */}
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(project.id)}
                    >
                      <Trash2 size={15} />
                      Delete
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
