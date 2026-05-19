"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Button from "@/components/Button";
import Link from "next/link";
// AJOUTÉ [Étape 4] : client Supabase pour remplacer localStorage
import { supabase } from "@/lib/supabaseClient";

// MODIFIÉ [Étape 4] : type mis à jour pour correspondre aux colonnes Supabase
type Project = {
  id: string;
  title: string;
  description: string;
  organization_email: string;
  status: string;
  visibility: string;
};

type Application = {
  id: string;
  projectId: string;
  projectTitle: string;

  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantRole: string;

  status: "pending" | "accepted" | "rejected";
  createdAt: string;
};

export default function ExploreProjectsPage() {
  const { user, loading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;

    // MODIFIÉ [Étape 4] : lecture depuis Supabase (remplace localStorage)
    // La RLS filtre automatiquement les projets privés pour les non-membres
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, description, organization_email, status, visibility")
        .neq("status", "completed")
        .order("created_at", { ascending: false });

      if (!error) setProjects(data || []);
    };

    fetchProjects();

    const apps: Application[] = JSON.parse(
      localStorage.getItem("vidzel_applications") || "[]"
    );

    // ✅ Match by BOTH id and email (defensive)
    const myApplied = apps
      .filter(
        (a) =>
          a.applicantId === user.id ||
          a.applicantEmail === user.email
      )
      .map((a) => a.projectId);

    setAppliedIds(myApplied);
  // FIX : [user?.id] au lieu de [user] — évite les appels multiples quand React re-crée l'objet user
  }, [user?.id]);

  if (loading) {
    return <div style={{ padding: "3rem" }}>Loading...</div>;
  }

  if (!user) {
    return <div style={{ padding: "3rem" }}>Please log in.</div>;
  }

  // ❌ Organizations cannot apply
  if (user.role === "organization") {
    return (
      <div style={{ padding: "3rem" }}>
        Organizations cannot apply to projects.
      </div>
    );
  }

  const applyToProject = (project: Project) => {
    const apps: Application[] = JSON.parse(
      localStorage.getItem("vidzel_applications") || "[]"
    );

    const alreadyApplied = apps.some(
      (a) =>
        a.projectId === project.id &&
        (a.applicantId === user.id ||
          a.applicantEmail === user.email)
    );

    if (alreadyApplied) return;

    // ✅ GUARANTEED COMPLETE APPLICATION OBJECT
    const application: Application = {
      id: "app_" + Date.now(),
      projectId: project.id,
      projectTitle: project.title,

      applicantId: user.id,
      applicantName: user.email || "Unnamed Applicant",
      applicantEmail: user.email || "",
      applicantRole: user.role || "participant",

      status: "pending",
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "vidzel_applications",
      JSON.stringify([...apps, application])
    );

    setAppliedIds((prev) => [...prev, project.id]);
  };

  return (
    <div style={{ padding: "3rem", maxWidth: "1100px" }}>
      <h1>Explore Projects</h1>

      {projects.length === 0 && (
        <p style={{ color: "#64748b", marginTop: "1rem" }}>
          No projects available at the moment.
        </p>
      )}

      {projects.map((project) => (
        <div
          key={project.id}
          style={{
            marginTop: "1.5rem",
            padding: "1.75rem",
            borderRadius: "16px",
            border: "1px solid #e5e7eb",
            background: "white",
          }}
        >
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>
            {project.title}
          </h3>

          {/* MODIFIÉ [Étape 4] : organization_email remplace organizationName/createdBy */}
          <p style={{ marginTop: "0.25rem", color: "#475569" }}>
            Organization: {project.organization_email}
          </p>

          <div
            style={{
              marginTop: "1.25rem",
              display: "flex",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <Link href={`/dashboard/projects/${project.id}`}>
              <Button variant="secondary">
                View Details
              </Button>
            </Link>

            {appliedIds.includes(project.id) ? (
              <Button variant="secondary" disabled>
                Applied
              </Button>
            ) : (
              <Button onClick={() => applyToProject(project)}>
                Apply / Ask to Join
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}