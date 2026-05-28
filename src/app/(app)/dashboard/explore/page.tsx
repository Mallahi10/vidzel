"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Building2, MapPin } from "lucide-react";
import styles from "./explore.module.css";

type Project = {
  id: string;
  title: string;
  description: string;
  organization_email: string;
  status: string;
  visibility: string;
  category: string | null;
  location: string | null;
};


/* Category → badge colour mapping */
const CATEGORY_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  "Technology":          { bg: "#dbeafe", color: "#1d4ed8", border: "#bfdbfe" },
  "Technology for Good": { bg: "#dbeafe", color: "#1d4ed8", border: "#bfdbfe" },
  "Education":           { bg: "#ede9fe", color: "#6d28d9", border: "#ddd6fe" },
  "Health":              { bg: "#d1fae5", color: "#065f46", border: "#a7f3d0" },
  "Environment":         { bg: "#ccfbf1", color: "#0f766e", border: "#99f6e4" },
  "Social":              { bg: "#ffedd5", color: "#c2410c", border: "#fed7aa" },
  "Social Innovation":   { bg: "#ffedd5", color: "#c2410c", border: "#fed7aa" },
  "Youth Development":   { bg: "#fef9c3", color: "#854d0e", border: "#fde68a" },
  "Human Rights":        { bg: "#fce7f3", color: "#9d174d", border: "#fbcfe8" },
  "Public Policy":       { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" },
  "Entrepreneurship":    { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
};

const DEFAULT_CAT = { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" };

function getCatStyle(cat?: string | null) {
  return CATEGORY_STYLE[cat ?? ""] ?? DEFAULT_CAT;
}

/* ================= PAGE ================= */

export default function ExploreProjectsPage() {
  const { user, loading } = useAuth();
  const [projects, setProjects]   = useState<Project[]>([]);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("projects")
      .select("id, title, description, organization_email, status, visibility, category, location")
      .eq("visibility", "open")
      .neq("status", "completed")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error) setProjects(data || []);
      });

    supabase
      .from("applications")
      .select("project_id")
      .eq("applicant_id", user.id)
      .then(({ data }) => {
        setAppliedIds((data ?? []).map((a: any) => a.project_id));
      });
  }, [user?.id]);

  if (loading) return <div style={{ padding: "3rem" }}>Loading...</div>;
  if (!user)   return <div style={{ padding: "3rem" }}>Please log in.</div>;

  if (user.role === "organization") {
    return <div style={{ padding: "3rem" }}>Organizations cannot apply to projects.</div>;
  }


  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <h1>Explore Projects</h1>
        <p>Discover open opportunities and make an impact.</p>
        {projects.length > 0 && (
          <span className={styles.count}>
            {projects.length} project{projects.length !== 1 ? "s" : ""} available
          </span>
        )}
      </div>

      {/* Grid */}
      <div className={styles.grid}>

        {/* Empty state */}
        {projects.length === 0 && (
          <div className={styles.empty}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🔍</div>
            <p style={{ color: "#334155", fontWeight: 600, margin: "0 0 0.25rem" }}>No projects available</p>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0 }}>Check back soon for new opportunities.</p>
          </div>
        )}

        {projects.map((project) => {
          const cat     = getCatStyle(project.category);
          const applied = appliedIds.includes(project.id);

          return (
            <div key={project.id} className={styles.card}>

              {/* Badges */}
              <div className={styles.cardTop}>
                {project.category && (
                  <span
                    className={styles.badge}
                    style={{ background: cat.bg, color: cat.color, borderColor: cat.border }}
                  >
                    {project.category}
                  </span>
                )}
                {project.location && (
                  <span
                    className={styles.badge}
                    style={{ background: "#f1f5f9", color: "#475569", borderColor: "#e2e8f0" }}
                  >
                    <MapPin size={10} />
                    {project.location}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className={styles.cardTitle}>{project.title}</h3>

              {/* Description */}
              {project.description && (
                <p className={styles.cardDesc}>{project.description}</p>
              )}

              {/* Organization */}
              <div className={styles.orgRow}>
                <div className={styles.orgIcon}><Building2 size={14} /></div>
                <span>{project.organization_email}</span>
              </div>

              {/* Actions */}
              <div className={styles.cardActions}>
                <Link href={`/dashboard/projects/${project.id}`} className={styles.btnSecondary}>
                  View Details
                </Link>
                {applied && (
                  <span className={styles.btnApplied}>✓ Applied</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
