"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/Button";
import { supabase } from "@/lib/supabaseClient";
import styles from "./workspace.module.css";
import { Upload, ExternalLink, Clock, Send, User } from "lucide-react";

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

export default function SubmissionSection({ workspaceId }: { workspaceId: string }) {
  const { user } = useAuth();
  const isOrganization = user?.role === "organization";

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink]               = useState("");
  const [submitError, setSubmitError]  = useState<string | null>(null);

  /* Load submissions + realtime sync */
  useEffect(() => {
    if (!workspaceId) return;

    const fetchSubmissions = async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("*, profiles!submitted_by(email, role)")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: true });

      if (error) { console.error("[SubmissionSection] fetch error:", error.message); return; }
      setSubmissions(data || []);
    };

    fetchSubmissions();

    const channel = supabase
      .channel(`submissions:${workspaceId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "submissions", filter: `workspace_id=eq.${workspaceId}` },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            // Refetch with profiles join to get the full row
            const { data } = await supabase
              .from("submissions")
              .select("*, profiles!submitted_by(email, role)")
              .eq("id", payload.new.id)
              .single();
            if (data) setSubmissions((prev) => prev.some((s) => s.id === data.id) ? prev : [...prev, data]);
          } else if (payload.eventType === "UPDATE") {
            const { data } = await supabase
              .from("submissions")
              .select("*, profiles!submitted_by(email, role)")
              .eq("id", payload.new.id)
              .single();
            if (data) setSubmissions((prev) => prev.map((s) => s.id === data.id ? data : s));
          }
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [workspaceId]);

  /* Submit work */
  const submitWork = async () => {
    if (!user || isOrganization) return;
    setSubmitError(null);

    if (!title.trim()) {
      setSubmitError("Please enter a submission title.");
      return;
    }
    if (!link.trim()) {
      setSubmitError("Please paste a link to your work (Google Drive, GitHub, etc.).");
      return;
    }

    const { data, error } = await supabase
      .from("submissions")
      .insert({ workspace_id: workspaceId, submitted_by: user.id, title: title.trim(), description: description.trim() || null, link: link.trim(), feedback_status: "pending" })
      .select("*, profiles!submitted_by(email, role)")
      .single();

    if (error) {
      console.error("[SubmissionSection] insert error:", error.message);
      setSubmitError("Failed to submit. Please try again.");
      return;
    }
    setSubmissions((prev) => [...prev, data]);
    setTitle(""); setDescription(""); setLink("");
  };

  /* Save feedback (logique inchangée) */
  const saveFeedback = async (submissionId: string, comment: string, status: Submission["feedback_status"]) => {
    if (!isOrganization || !comment.trim()) return;

    const { data, error } = await supabase
      .from("submissions")
      .update({ feedback: comment, feedback_status: status, reviewed_by: user!.id, reviewed_at: new Date().toISOString() })
      .eq("id", submissionId)
      .select("*, profiles!submitted_by(email, role)")
      .single();

    if (error) { console.error("[SubmissionSection] feedback error:", error.message); return; }
    setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? data : s)));
  };

  /* Visibility (logique inchangée) */
  const visibleSubmissions = isOrganization
    ? submissions
    : submissions.filter((s) => s.submitted_by === user?.id);

  const statusClass = (status: Submission["feedback_status"]) => {
    if (status === "approved") return styles.statusApproved;
    if (status === "reviewed") return styles.statusReviewed;
    if (status === "needs_changes") return styles.statusNeedsChanges;
    return styles.statusPending;
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>
        <Upload size={17} className={styles.sectionTitleIconAmber} />
        Submissions
        {visibleSubmissions.length > 0 && (
          <span className={`${styles.countBadge} ${styles.countBadgeAmber}`}>{visibleSubmissions.length}</span>
        )}
      </h2>

      {/* Member submit form (logique inchangée) */}
      {!isOrganization && (
        <div className={styles.form}>
          <div className={styles.formField}>
            <input type="text" placeholder="Submission title" value={title} onChange={(e) => setTitle(e.target.value)} className={styles.formInput} />
          </div>
          <div className={styles.formField}>
            <textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className={styles.formTextarea} />
          </div>
          <div className={styles.formField}>
            <input type="url" placeholder="Paste file or document link" value={link} onChange={(e) => setLink(e.target.value)} className={styles.formInput} />
          </div>
          <div className={styles.submitBtnWrapper}>
            <Button onClick={submitWork}>
              <Send size={15} />
              Submit Work
            </Button>
          </div>
          {submitError && (
            <p style={{ margin: "8px 0 0", fontSize: "0.82rem", color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "6px 10px" }}>
              ⚠ {submitError}
            </p>
          )}
        </div>
      )}

      {/* Submission list — NEW: header/body structure */}
      {visibleSubmissions.length === 0 ? (
        <p className={styles.emptyText}>No submissions yet.</p>
      ) : (
        /* OLD STYLE BACKUP: flat .submissionCard with no header/body separation */
        /* NEW MODERN UI UPDATE: .submissionHeader + .submissionBody split */
        <div className={styles.submissionList}>
          {visibleSubmissions.map((s) => (
            <div key={s.id} className={styles.submissionCard}>

              {/* NEW: gradient header band */}
              <div className={styles.submissionHeader}>
                <p className={styles.submissionAuthor}>
                  <User size={12} />
                  {s.profiles?.email ?? s.submitted_by}
                  {s.profiles?.role && (
                    <span className={`${styles.statusBadge} ${styles.statusReviewed}`} style={{ background: 'rgba(0,51,255,0.08)', color: '#395886', marginLeft: 4 }}>
                      {s.profiles.role}
                    </span>
                  )}
                </p>

                <span className={`${styles.statusBadge} ${statusClass(s.feedback_status)}`}>
                  {s.feedback_status.replace("_", " ")}
                </span>
              </div>

              {/* NEW: body section */}
              <div className={styles.submissionBody}>
                <h4 className={styles.submissionTitle}>{s.title}</h4>
                {s.description && <p className={styles.submissionDesc}>{s.description}</p>}

                <a href={s.link} target="_blank" rel="noopener noreferrer" className={styles.submissionLink}>
                  <ExternalLink size={13} />
                  Open submission
                </a>

                <p className={styles.submissionMeta}>
                  <Clock size={10} />
                  {new Date(s.created_at).toLocaleString()}
                </p>

                {/* Existing feedback */}
                {s.feedback && (
                  <div className={styles.feedbackBox}>
                    <div className={styles.feedbackHeader}>
                      Feedback
                    </div>
                    <p className={styles.feedbackText}>{s.feedback}</p>
                  </div>
                )}

                {/* Org feedback form (logique inchangée) */}
                {isOrganization && (
                  <OrgFeedbackForm onSave={(comment, status) => saveFeedback(s.id, comment, status)} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ── Org feedback form (logique inchangée, styles modernisés) ── */
function OrgFeedbackForm({ onSave }: { onSave: (comment: string, status: "reviewed" | "approved" | "needs_changes") => void }) {
  const [comment, setComment] = useState("");
  const [status, setStatus]   = useState<"reviewed" | "approved" | "needs_changes">("reviewed");

  return (
    <div className={styles.feedbackForm}>
      <textarea placeholder="Leave feedback..." value={comment} onChange={(e) => setComment(e.target.value)} className={styles.formTextarea} />
      <div className={styles.feedbackFormRow}>
        <select value={status} onChange={(e) => setStatus(e.target.value as "reviewed" | "approved" | "needs_changes")} className={styles.formSelect} style={{ flex: 1 }}>
          <option value="reviewed">Reviewed</option>
          <option value="approved">Approved</option>
          <option value="needs_changes">Needs changes</option>
        </select>
        <Button onClick={() => { onSave(comment, status); setComment(""); }}>
          Save Feedback
        </Button>
      </div>
    </div>
  );
}
