"use client";

// ANNOUNCEMENT FLOW — Project detail page
// Reached from: announcement notification click, explore page, direct URL
// SEPARATION RULE:
//   - This page handles the ANNOUNCEMENT → discover → apply flow (public projects only)
//   - This page does NOT handle invitations (invitations → /dashboard/invitations)
//   - Apply button only shown for public (visibility="open") projects
//   - Private projects show a restricted message, no apply button

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import {
  ArrowLeft, MapPin, Tag, Users, FileText,
  Lock, Globe, CheckCircle2, Clock, Send, Target,
} from "lucide-react";

type Project = {
  id:                 string;
  title:              string;
  description:        string | null;
  organization_id:    string;
  organization_email: string | null;
  status:             string;
  visibility:         "open" | "private";
  category:           string | null;
  location:           string | null;
  tasks:              string | null;
  roles:              string[] | null;
  participants_needed: string | null;
  problem:            string | null;
  outcomes:           string | null;
  communication:      string | null;
  created_at:         string;
  opportunity_type:   string | null;
  target_roles:       string[] | null;
};

export default function ProjectDetailPage() {
  const { id }       = useParams<{ id: string }>();
  const router       = useRouter();
  const { user }     = useAuth();

  const [project, setProject]         = useState<Project | null>(null);
  const [loading, setLoading]         = useState(true);
  const [notFound, setNotFound]       = useState(false);

  // ANNOUNCEMENT FLOW — apply state (separate from invitation logic)
  const [hasApplied, setHasApplied]   = useState(false);
  const [applying, setApplying]       = useState(false);
  const [applyError, setApplyError]   = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);

  // ── Fetch project from Supabase
  useEffect(() => {
    if (!id) return;

    supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); }
        else                { setProject(data as Project); }
        setLoading(false);
      });
  }, [id]);

  // ── Check if current user already applied (ANNOUNCEMENT FLOW only)
  useEffect(() => {
    if (!user || !id || user.role === "organization") return;

    supabase
      .from("applications")
      .select("id")
      .eq("project_id", id)
      .eq("applicant_id", user.id)
      .maybeSingle()
      .then(({ data }) => { if (data) setHasApplied(true); });
  }, [user?.id, id]);

  // ── Apply handler — ANNOUNCEMENT FLOW, public projects only
  // SEPARATION RULE: this is NOT used for invitations
  const handleApply = async () => {
    if (!user || !project) return;
    setApplying(true);
    setApplyError(null);

    const { error } = await supabase
      .from("applications")
      .insert({
        project_id:      project.id,
        applicant_id:    user.id,
        applicant_email: user.email,
        applicant_role:  user.role,
        status:          "pending",
      });

    if (error) {
      // code 23505 = unique_violation = already applied
      if (error.code === "23505") {
        setHasApplied(true);
      } else {
        setApplyError("Could not submit application. Please try again.");
      }
    } else {
      setHasApplied(true);
      setApplySuccess(true);
    }
    setApplying(false);
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
        <Clock size={32} style={{ margin: "0 auto 1rem", display: "block", opacity: 0.4 }} />
        Loading project…
      </div>
    );
  }

  /* ── Not found ── */
  if (notFound || !project) {
    return (
      <div style={{ padding: "3rem", maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
        <FileText size={40} color="#94a3b8" style={{ marginBottom: "1rem" }} />
        <h2 style={{ color: "#0f172a", marginBottom: "0.5rem" }}>Project not found</h2>
        <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
          This project may have been removed or the link is invalid.
        </p>
        <button onClick={() => router.back()} style={backBtnStyle}>
          ← Go back
        </button>
      </div>
    );
  }

  const isOrg      = user?.role === "organization";
  const isPublic   = project.visibility === "open";
  const isOwner    = user?.id === project.organization_id;
  const isTargeted = project.opportunity_type === "opportunity_targeted";
  const isEligible = !isTargeted || Boolean(project.target_roles?.includes(user?.role ?? ""));
  const canApply   = !isOrg && isPublic && !hasApplied && isEligible;

  /* ── Render ── */
  return (
    <div style={{ padding: "2.5rem", maxWidth: 780, margin: "0 auto" }}>

      {/* Back button */}
      <button onClick={() => router.back()} style={backBtnStyle}>
        <ArrowLeft size={15} /> Back
      </button>

      {/* Header card */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a5f 0%, #395886 50%, #638ECB 100%)",
        borderRadius: 20, padding: "2rem 2.25rem", marginBottom: "1.5rem",
        boxShadow: "0 8px 32px rgba(57,88,134,0.28)",
      }}>
        {/* Visibility + opportunity type badges */}
        <div style={{ marginBottom: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "0.3rem",
            padding: "0.25rem 0.75rem", borderRadius: 20,
            background: isPublic ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
            color: isPublic ? "#6ee7b7" : "#fca5a5",
            fontSize: "0.78rem", fontWeight: 700,
          }}>
            {isPublic ? <><Globe size={12} /> Public</> : <><Lock size={12} /> Private</>}
          </span>
          {isTargeted && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "0.3rem",
              padding: "0.25rem 0.75rem", borderRadius: 20,
              background: "rgba(234,179,8,0.25)", color: "#fef08a",
              fontSize: "0.78rem", fontWeight: 700,
            }}>
              <Target size={12} /> Targeted Opportunity
            </span>
          )}
        </div>

        <h1 style={{ color: "white", fontSize: "1.75rem", fontWeight: 800, margin: "0 0 0.5rem" }}>
          {project.title}
        </h1>

        <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
          {project.organization_email && (
            <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.85rem" }}>
              🏢 {project.organization_email}
            </span>
          )}
          {project.category && (
            <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <Tag size={13} /> {project.category}
            </span>
          )}
          {project.location && (
            <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <MapPin size={13} /> {project.location}
            </span>
          )}
        </div>
      </div>

      {/* ── ANNOUNCEMENT FLOW: Apply CTA — public projects only ── */}
      {/* SEPARATION RULE: This block handles ANNOUNCEMENT → apply flow ONLY.
          Invitations use /dashboard/invitations and bypass this block entirely. */}
      {!isOrg && (
        <div style={{
          borderRadius: 16, padding: "1.25rem 1.5rem", marginBottom: "1.5rem",
          background: !isPublic ? "#fff7ed" : (isTargeted && !isEligible) ? "#fffbeb" : "#f0fdf4",
          border: `1.5px solid ${!isPublic ? "#fed7aa" : (isTargeted && !isEligible) ? "#fde68a" : "#86efac"}`,
        }}>
          {isPublic ? (
            <>
              {applySuccess && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", color: "#166534", fontWeight: 600, fontSize: "0.875rem" }}>
                  <CheckCircle2 size={16} /> Application submitted successfully!
                </div>
              )}
              {hasApplied && !applySuccess && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#0369a1", fontWeight: 600, fontSize: "0.875rem" }}>
                  <CheckCircle2 size={16} /> You have already applied to this project.
                </div>
              )}
              {!isEligible && !hasApplied && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                  <Target size={20} color="#b45309" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ fontWeight: 700, color: "#b45309", margin: "0 0 0.25rem", fontSize: "0.9rem" }}>
                      Targeted opportunity
                    </p>
                    <p style={{ color: "#92400e", fontSize: "0.82rem", margin: 0 }}>
                      Open to:{" "}
                      <strong>
                        {project.target_roles
                          ?.map(r => r.charAt(0).toUpperCase() + r.slice(1))
                          .join(", ") ?? "specific roles"}
                      </strong>. Your account role does not match the requirements.
                    </p>
                  </div>
                </div>
              )}
              {canApply && (
                <>
                  <p style={{ color: "#166534", fontWeight: 600, margin: "0 0 0.75rem", fontSize: "0.875rem" }}>
                    This project is open for applications.
                  </p>
                  {applyError && (
                    <p style={{ color: "#dc2626", fontSize: "0.82rem", margin: "0 0 0.75rem", background: "#fef2f2", padding: "6px 10px", borderRadius: 8, border: "1px solid #fecaca" }}>
                      ⚠ {applyError}
                    </p>
                  )}
                  <button
                    onClick={handleApply}
                    disabled={applying}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "0.4rem",
                      padding: "0.65rem 1.5rem", borderRadius: 12,
                      background: applying ? "#94a3b8" : "linear-gradient(135deg, #166534, #16a34a)",
                      color: "white", border: "none", fontWeight: 700,
                      fontSize: "0.9rem", cursor: applying ? "wait" : "pointer",
                      boxShadow: "0 4px 12px rgba(22,163,74,0.3)",
                    }}
                  >
                    <Send size={15} />
                    {applying ? "Submitting…" : "Apply for this Project"}
                  </button>
                </>
              )}
            </>
          ) : (
            // PRIVATE PROJECT — no apply, no invitation bypass
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Lock size={20} color="#c2410c" />
              <div>
                <p style={{ fontWeight: 700, color: "#c2410c", margin: "0 0 0.2rem", fontSize: "0.9rem" }}>
                  This project is private.
                </p>
                <p style={{ color: "#92400e", fontSize: "0.82rem", margin: 0 }}>
                  You must be invited to join. Check your invitations if you received one.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* Description */}
        {project.description && (
          <Section title="About this Project">
            <p style={{ color: "#334155", lineHeight: 1.7, margin: 0, whiteSpace: "pre-line" }}>
              {project.description}
            </p>
          </Section>
        )}

        {/* Problem */}
        {project.problem && (
          <Section title="Problem We're Solving">
            <p style={{ color: "#334155", lineHeight: 1.7, margin: 0, whiteSpace: "pre-line" }}>
              {project.problem}
            </p>
          </Section>
        )}

        {/* Tasks */}
        {project.tasks && (
          <Section title="Key Tasks & Responsibilities">
            <p style={{ color: "#334155", lineHeight: 1.7, margin: 0, whiteSpace: "pre-line" }}>
              {project.tasks}
            </p>
          </Section>
        )}

        {/* Roles */}
        {project.roles && project.roles.length > 0 && (
          <Section title="Roles Needed">
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {project.roles.map((r) => (
                <span key={r} style={{
                  padding: "0.3rem 0.85rem", borderRadius: 20,
                  background: "#ede9fe", color: "#5b21b6",
                  fontSize: "0.8rem", fontWeight: 600,
                }}>
                  {r}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Outcomes */}
        {project.outcomes && (
          <Section title="Expected Outcomes">
            <p style={{ color: "#334155", lineHeight: 1.7, margin: 0, whiteSpace: "pre-line" }}>
              {project.outcomes}
            </p>
          </Section>
        )}

        {/* Communication */}
        {project.communication && (
          <Section title="Communication Tools">
            <p style={{ color: "#334155", lineHeight: 1.7, margin: 0 }}>
              {project.communication}
            </p>
          </Section>
        )}

        {/* Participants needed */}
        {project.participants_needed && (
          <Section title="Participants Needed">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#0369a1" }}>
              <Users size={16} />
              <span style={{ fontWeight: 600 }}>{project.participants_needed}</span>
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

/* ── Reusable section card ── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "white", borderRadius: 16,
      border: "1px solid #f1f5f9",
      boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
      padding: "1.25rem 1.5rem",
    }}>
      <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.75rem" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

const backBtnStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "0.4rem",
  padding: "0.45rem 1rem", borderRadius: 999,
  border: "1.5px solid #e2e8f0", background: "white",
  color: "#475569", fontWeight: 600, fontSize: "0.85rem",
  cursor: "pointer", marginBottom: "1.5rem",
};
