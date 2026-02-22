"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

/* ========================
   TYPES
======================== */
type SubmissionVersion = {
  id: string;
  title: string;
  description?: string;
  link: string;
  createdAt: string;
  feedback?: {
    comment: string;
    status: "reviewed" | "approved" | "needs_changes";
    reviewedAt: string;
    reviewedBy: string;
  };
};

type Submission = {
  id: string;
  workspaceId: string;
  userId: string;
  userName: string;
  userRole: string;
  versions: SubmissionVersion[];
};

/* ========================
   NORMALIZE LEGACY DATA
======================== */
function normalizeSubmission(s: any): Submission {
  if (Array.isArray(s.versions)) {
    return s;
  }

  return {
    id: s.id,
    workspaceId: s.workspaceId,
    userId: s.userId,
    userName: s.userName,
    userRole: s.userRole,
    versions: [
      {
        id: crypto.randomUUID(),
        title: s.title || "Initial submission",
        description: s.description,
        link: s.link,
        createdAt: s.createdAt || new Date().toISOString(),
        feedback: s.feedback,
      },
    ],
  };
}

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
  ======================== */
  useEffect(() => {
    if (!workspaceId) return;

    const stored: any[] = JSON.parse(
      localStorage.getItem("vidzel_workspace_submissions") || "[]"
    );

    setSubmissions(
      stored
        .filter((s) => String(s.workspaceId) === String(workspaceId))
        .map(normalizeSubmission)
    );
  }, [workspaceId]);

  /* ========================
     SUBMIT / RESUBMIT
  ======================== */
  const submitWork = () => {
    if (!user || isOrganization) return;
    if (!title.trim() || !link.trim()) return;

    const stored: Submission[] = JSON.parse(
      localStorage.getItem("vidzel_workspace_submissions") || "[]"
    ).map(normalizeSubmission);

    const existing = stored.find(
      (s) =>
        String(s.workspaceId) === String(workspaceId) &&
        String(s.userId) === String(user.id)
    );

    const newVersion: SubmissionVersion = {
      id: crypto.randomUUID(),
      title,
      description,
      link,
      createdAt: new Date().toISOString(),
    };

    let updated: Submission[];

    if (existing) {
      updated = stored.map((s) =>
        s.id === existing.id
          ? { ...s, versions: [...s.versions, newVersion] }
          : s
      );
    } else {
      updated = [
        ...stored,
        {
          id: crypto.randomUUID(),
          workspaceId,
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          versions: [newVersion],
        },
      ];
    }

    localStorage.setItem(
      "vidzel_workspace_submissions",
      JSON.stringify(updated)
    );

    setSubmissions(
      updated
        .filter((s) => String(s.workspaceId) === String(workspaceId))
        .map(normalizeSubmission)
    );

    setTitle("");
    setDescription("");
    setLink("");
  };

  /* ========================
     SAVE FEEDBACK (ORG ONLY)
  ======================== */
  const saveFeedback = (
    submissionId: string,
    versionId: string,
    comment: string,
    status: NonNullable<SubmissionVersion["feedback"]>["status"]
  ) => {
    if (!isOrganization || !comment.trim()) return;

    const stored: Submission[] = JSON.parse(
      localStorage.getItem("vidzel_workspace_submissions") || "[]"
    ).map(normalizeSubmission);

    const updated = stored.map((s) =>
      s.id === submissionId
        ? {
            ...s,
            versions: s.versions.map((v) =>
              v.id === versionId
                ? {
                    ...v,
                    feedback: {
                      comment,
                      status,
                      reviewedAt: new Date().toISOString(),
                      reviewedBy: user?.name || "Organization",
                    },
                  }
                : v
            ),
          }
        : s
    );

    localStorage.setItem(
      "vidzel_workspace_submissions",
      JSON.stringify(updated)
    );

    setSubmissions(
      updated
        .filter((s) => String(s.workspaceId) === String(workspaceId))
        .map(normalizeSubmission)
    );
  };

  /* ========================
     VISIBILITY
  ======================== */
  const visibleSubmissions = isOrganization
    ? submissions
    : submissions.filter((s) => s.userId === user?.id);

  return (
    <section>
      <h2 style={{ marginBottom: "1rem" }}>Submissions</h2>

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

          <button onClick={submitWork}>Submit / Resubmit</button>
        </div>
      )}

      {visibleSubmissions.length === 0 ? (
        <p style={{ color: "#64748b" }}>No submissions yet.</p>
      ) : (
        visibleSubmissions.map((s) => (
          <div key={s.id} style={{ marginBottom: "1.5rem" }}>
            <h4>
              {s.userName} ({s.userRole})
            </h4>

            {s.versions.map((v, index) => (
              <div
                key={v.id}
                style={{
                  padding: "0.75rem",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  marginBottom: "0.75rem",
                }}
              >
                <strong>Version {index + 1}</strong>
                <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                  {new Date(v.createdAt).toLocaleString()}
                </div>

                <p>{v.title}</p>
                {v.description && <p>{v.description}</p>}

                <a href={v.link} target="_blank" rel="noopener noreferrer">
                  Open submission
                </a>

                {v.feedback && (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      background: "#f8fafc",
                      padding: "0.5rem",
                      borderRadius: "8px",
                    }}
                  >
                    <strong>Feedback ({v.feedback.status})</strong>
                    <p>{v.feedback.comment}</p>
                  </div>
                )}

                {isOrganization && (
                  <OrgFeedbackForm
                    onSave={(comment, status) =>
                      saveFeedback(s.id, v.id, comment, status)
                    }
                  />
                )}
              </div>
            ))}
          </div>
        ))
      )}
    </section>
  );
}

/* ========================
   ORG FEEDBACK FORM
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
            e.target.value as
              | "reviewed"
              | "approved"
              | "needs_changes"
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