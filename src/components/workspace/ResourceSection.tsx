"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/Button";

/* ========================
   TYPES
======================== */
type Resource = {
  id: string;
  workspaceId: string;
  title: string;
  type: "file" | "link" | "video" | "note";
  value: string; // URL or text
  uploadedBy: string;
  createdAt: string;
};

export default function ResourceSection({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const { user } = useAuth();

  const [resources, setResources] = useState<Resource[]>([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<Resource["type"]>("link");
  const [value, setValue] = useState("");

  const isOrganization = user?.role === "organization";

  /* ========================
     LOAD RESOURCES
  ======================== */
  useEffect(() => {
    if (!workspaceId) return;

    const stored: Resource[] = JSON.parse(
      localStorage.getItem("vidzel_workspace_resources") || "[]"
    );

    setResources(
      stored.filter((r) => String(r.workspaceId) === String(workspaceId))
    );
  }, [workspaceId]);

  /* ========================
     ADD RESOURCE (ORG ONLY)
  ======================== */
  const addResource = () => {
    if (!isOrganization) return;
    if (!title.trim() || !value.trim()) return;

    const newResource: Resource = {
      id: crypto.randomUUID(),
      workspaceId,
      title,
      type,
      value,
      uploadedBy: user.email,
      createdAt: new Date().toISOString(),
    };

    const all: Resource[] = JSON.parse(
      localStorage.getItem("vidzel_workspace_resources") || "[]"
    );

    const updated = [...all, newResource];
    localStorage.setItem(
      "vidzel_workspace_resources",
      JSON.stringify(updated)
    );

    setResources(
      updated.filter((r) => String(r.workspaceId) === String(workspaceId))
    );

    setTitle("");
    setValue("");
  };

  return (
    <section>
      <h2 style={{ marginBottom: "1rem" }}>Resources</h2>

      {/* ORG UPLOAD FORM */}
      {isOrganization && (
        <div style={{ marginBottom: "1.5rem" }}>
          <input
            type="text"
            placeholder="Resource title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: "100%", marginBottom: "0.5rem" }}
          />

          <select
            value={type}
            onChange={(e) =>
              setType(e.target.value as Resource["type"])
            }
            style={{ width: "100%", marginBottom: "0.5rem" }}
          >
            <option value="link">Link</option>
            <option value="video">Video</option>
            <option value="file">File URL</option>
            <option value="note">Note</option>
          </select>

          <textarea
            placeholder={
              type === "note"
                ? "Write instructions or notes..."
                : "Paste URL here..."
            }
            value={value}
            onChange={(e) => setValue(e.target.value)}
            style={{ width: "100%", marginBottom: "0.75rem" }}
          />

          <Button onClick={addResource}>
            Add Resource
          </Button>
        </div>
      )}

      {/* RESOURCE LIST */}
      {resources.length === 0 ? (
        <p style={{ color: "#64748b" }}>
          No resources shared yet.
        </p>
      ) : (
        resources.map((r) => (
          <div
            key={r.id}
            style={{
              padding: "0.75rem",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              marginBottom: "0.75rem",
            }}
          >
            <strong>{r.title}</strong>
            <div style={{ marginTop: "0.25rem" }}>
              {r.type === "note" ? (
                <p>{r.value}</p>
              ) : (
                <a
                  href={r.value}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open {r.type}
                </a>
              )}
            </div>
          </div>
        ))
      )}
    </section>
  );
}
