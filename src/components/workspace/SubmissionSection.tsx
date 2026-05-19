"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
// AJOUTÉ [Étape 2] : client Supabase pour remplacer localStorage
import { supabase } from "@/lib/supabaseClient";

/* ========================
   TYPES
   MODIFIÉ [Étape 2] : type flat correspondant à la table Supabase submissions.
   Le versioning (versions[]) a été supprimé — chaque submit = une nouvelle ligne.
======================== */
type Submission = {
  id: string;
  workspace_id: string;
  submitted_by: string;
  title: string;
  description: string | null;
  link: string;
  feedback: string | null;
  feedback_status: "pending" | "reviewed" | "approved" | "needs_changes";
  reviewed_by: string | null;
  created_at: string;
  profiles: { email: string; role: string } | null;
};

export default function SubmissionSection({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const { user } = useAuth();
  const isOrganization = user?.role === "organization";

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");

  /* ========================
     LOAD SUBMISSIONS
     MODIFIÉ [Étape 2] : lecture depuis Supabase avec join profiles (remplace localStorage)
  ======================== */
  useEffect(() => {
    if (!workspaceId) return;

    const fetchSubmissions = async () => {
      const { data, error } = await supabase
        .from("submissions")
        // MODIFIÉ : profiles!submitted_by pour lever l'ambiguïté (2 FK vers profiles)
        .select("*, profiles!submitted_by(email, role)")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("[SubmissionSection] fetch error:", error.message);
        return;
      }

      setSubmissions(data || []);
    };

    fetchSubmissions();
  }, [workspaceId]);

  /* ========================
     SUBMIT WORK
     MODIFIÉ [Étape 2] : INSERT dans Supabase (remplace localStorage)
     submitted_by utilise user.id (UUID) — requis par la FK profiles
  ======================== */
  const submitWork = async () => {
    if (!user || isOrganization) return;
    if (!title.trim() || !link.trim()) return;

    const { data, error } = await supabase
      .from("submissions")
      .insert({
        workspace_id: workspaceId,
        submitted_by: user.id,
        title: title.trim(),
        description: description.trim() || null,
        link: link.trim(),
        feedback_status: "pending",
      })
      // MODIFIÉ : profiles!submitted_by pour lever l'ambiguïté (2 FK vers profiles)
        .select("*, profiles!submitted_by(email, role)")
      .single();

    if (error) {
      console.error("[SubmissionSection] insert error:", error.message);
      return;
    }

    setSubmissions((prev) => [...prev, data]);
    setTitle("");
    setDescription("");
    setLink("");
  };

  /* ========================
     SAVE FEEDBACK (ORG ONLY)
     MODIFIÉ [Étape 2] : UPDATE dans Supabase (remplace localStorage)
  ======================== */
  const saveFeedback = async (
    submissionId: string,
    comment: string,
    status: Submission["feedback_status"]
  ) => {
    if (!isOrganization || !comment.trim()) return;

    const { data, error } = await supabase
      .from("submissions")
      .update({
        feedback: comment,
        feedback_status: status,
        reviewed_by: user!.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", submissionId)
      // MODIFIÉ : profiles!submitted_by pour lever l'ambiguïté (2 FK vers profiles)
        .select("*, profiles!submitted_by(email, role)")
      .single();

    if (error) {
      console.error("[SubmissionSection] feedback error:", error.message);
      return;
    }

    setSubmissions((prev) =>
      prev.map((s) => (s.id === submissionId ? data : s))
    );
  };

  /* ========================
     VISIBILITY
     Org voit toutes les submissions. Membre voit uniquement les siennes.
  ======================== */
  const visibleSubmissions = isOrganization
    ? submissions
    : submissions.filter((s) => s.submitted_by === user?.id);

  return (
    <section>
      <h2 style={{ marginBottom: "1rem" }}>Submissions</h2>

      {/* MEMBER SUBMIT FORM */}
      {!isOrganization && (
        <div style={{ marginBottom: "1.5rem" }}>
          <input
            type="text"
            placeholder="Submission title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: "100%", marginBottom: "0.5rem" }}
          />

          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: "100%", marginBottom: "0.5rem" }}
          />

          <input
            type="url"
            placeholder="Paste file or document link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            style={{ width: "100%", marginBottom: "0.5rem" }}
          />

          <button onClick={submitWork}>Submit Work</button>
        </div>
      )}

      {/* SUBMISSION LIST */}
      {visibleSubmissions.length === 0 ? (
        <p style={{ color: "#64748b" }}>No submissions yet.</p>
      ) : (
        visibleSubmissions.map((s) => (
          <div
            key={s.id}
            style={{
              padding: "0.75rem",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              marginBottom: "0.75rem",
            }}
          >
            {/* Auteur — email + rôle depuis profiles (join Supabase) */}
            <h4>
              {s.profiles?.email ?? s.submitted_by} ({s.profiles?.role ?? ""})
            </h4>

            <p style={{ fontWeight: 600 }}>{s.title}</p>
            {s.description && <p>{s.description}</p>}

            <a href={s.link} target="_blank" rel="noopener noreferrer">
              Open submission
            </a>

            <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#64748b" }}>
              {new Date(s.created_at).toLocaleString()}
            </div>

            {/* Feedback existant */}
            {s.feedback && (
              <div
                style={{
                  marginTop: "0.5rem",
                  background: "#f8fafc",
                  padding: "0.5rem",
                  borderRadius: "8px",
                }}
              >
                <strong>Feedback ({s.feedback_status})</strong>
                <p>{s.feedback}</p>
              </div>
            )}

            {/* Formulaire feedback org */}
            {isOrganization && (
              <OrgFeedbackForm
                onSave={(comment, status) =>
                  saveFeedback(s.id, comment, status)
                }
              />
            )}
          </div>
        ))
      )}
    </section>
  );
}

/* ========================
   ORG FEEDBACK FORM — visuel inchangé
======================== */
function OrgFeedbackForm({
  onSave,
}: {
  onSave: (
    comment: string,
    status: "reviewed" | "approved" | "needs_changes"
  ) => void;
}) {
  const [comment, setComment] = useState("");
  const [status, setStatus] =
    useState<"reviewed" | "approved" | "needs_changes">("reviewed");

  return (
    <div style={{ marginTop: "0.5rem" }}>
      <textarea
        placeholder="Leave feedback..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        style={{ width: "100%", marginBottom: "0.5rem" }}
      />

      <select
        value={status}
        onChange={(e) =>
          setStatus(
            e.target.value as "reviewed" | "approved" | "needs_changes"
          )
        }
      >
        <option value="reviewed">Reviewed</option>
        <option value="approved">Approved</option>
        <option value="needs_changes">Needs changes</option>
      </select>

      <button
        onClick={() => {
          onSave(comment, status);
          setComment("");
        }}
        style={{ marginLeft: "0.5rem" }}
      >
        Save
      </button>
    </div>
  );
}
