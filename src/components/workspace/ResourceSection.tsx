"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/Button";
// AJOUTÉ [Étape 2] : client Supabase pour remplacer localStorage
import { supabase } from "@/lib/supabaseClient";

/* ========================
   TYPES
======================== */
// MODIFIÉ [Étape 2] : champs renommés pour correspondre aux colonnes Supabase
type Resource = {
  id: string;
  workspace_id: string;
  title: string;
  type: "file" | "link" | "video" | "note";
  value: string;
  uploaded_by: string;
  created_at: string;
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
  // MODIFIÉ [Étape 2] : lecture depuis Supabase (remplace localStorage)
  useEffect(() => {
    if (!workspaceId) return;

    const fetchResources = async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("[ResourceSection] fetch error:", error.message);
        return;
      }

      setResources(data || []);
    };

    fetchResources();
  }, [workspaceId]);

  /* ========================
     ADD RESOURCE (ORG ONLY)
  ======================== */
  // MODIFIÉ [Étape 2] : INSERT dans Supabase (remplace localStorage)
  // uploaded_by utilise user.id (UUID) et non user.email — requis par la FK profiles
  const addResource = async () => {
    if (!isOrganization) return;
    if (!title.trim() || !value.trim()) return;

    const { data, error } = await supabase
      .from("resources")
      .insert({
        workspace_id: workspaceId,
        title: title.trim(),
        type,
        value: value.trim(),
        uploaded_by: user!.id,
      })
      .select()
      .single();

    if (error) {
      console.error("[ResourceSection] insert error:", error.message);
      return;
    }

    setResources((prev) => [...prev, data]);
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
