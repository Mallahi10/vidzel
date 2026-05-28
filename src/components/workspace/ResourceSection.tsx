"use client";

import { useEffect, useRef, useState } from "react";
import * as tus from "tus-js-client";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/Button";
import { supabase } from "@/lib/supabaseClient";
import styles from "./workspace.module.css";
import {
  FolderOpen, Link2, Download, Plus, FileText,
  Video, StickyNote, Upload, Trash2,
} from "lucide-react";

type Resource = {
  id: string;
  workspace_id: string;
  title: string;
  type: "file" | "link" | "video" | "note";
  value: string;
  uploaded_by: string;
  created_at: string;
};

type PendingItem = {
  tempId: string;
  title: string;
  type: Resource["type"];
};

const TYPE_CONFIG: Record<Resource["type"], { icon: React.ReactNode; cls: string }> = {
  link:  { icon: <Link2 size={14} />,     cls: styles.typeLink  },
  file:  { icon: <FileText size={14} />,  cls: styles.typeFile  },
  video: { icon: <Video size={14} />,     cls: styles.typeVideo },
  note:  { icon: <StickyNote size={14} />, cls: styles.typeNote },
};

const MAX_FILE_MB = 100;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export default function ResourceSection({ workspaceId }: { workspaceId: string }) {
  const { user } = useAuth();
  const [resources, setResources]         = useState<Resource[]>([]);
  const [title, setTitle]                 = useState("");
  const [type, setType]                   = useState<Resource["type"]>("link");
  const [value, setValue]                 = useState("");
  const [selectedFile, setSelectedFile]   = useState<File | null>(null);
  const [uploadError, setUploadError]     = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [pendingItems, setPendingItems]   = useState<PendingItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOrganization = user?.role === "organization";

  /* ── Load resources + realtime sync ── */
  useEffect(() => {
    if (!workspaceId) return;

    supabase
      .from("resources")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) { console.error("[ResourceSection] fetch:", error.message); return; }
        setResources(data || []);
      });

    const channel = supabase
      .channel(`resources:${workspaceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "resources", filter: `workspace_id=eq.${workspaceId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setResources(prev =>
              prev.some(r => r.id === payload.new.id) ? prev : [...prev, payload.new as Resource]
            );
            setPendingItems(prev => prev.slice(1));
          } else if (payload.eventType === "DELETE") {
            setResources(prev => prev.filter(r => r.id !== (payload.old as Resource).id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [workspaceId]);

  /* ── Delete resource ── */
  const deleteResource = async (r: Resource) => {
    if (!isOrganization || !confirm(`Delete "${r.title}"?`)) return;

    if (r.type === "file" || r.type === "video") {
      try {
        const marker = "/workspace-resources/";
        const idx = r.value.indexOf(marker);
        if (idx !== -1) {
          const path = decodeURIComponent(r.value.substring(idx + marker.length));
          await supabase.storage.from("workspace-resources").remove([path]);
        }
      } catch { /* non-blocking */ }
    }

    const { error } = await supabase.from("resources").delete().eq("id", r.id);
    if (!error) setResources(prev => prev.filter(x => x.id !== r.id));
  };

  /* ── Add resource ── */
  const addResource = async () => {
    if (!isOrganization) return;
    setUploadError(null);

    if (!title.trim()) {
      setUploadError("Please enter a resource title.");
      return;
    }

    if (type === "file" || type === "video") {
      if (!selectedFile) {
        setUploadError("Please select a file.");
        return;
      }
      if (selectedFile.size > MAX_FILE_MB * 1024 * 1024) {
        setUploadError(`File too large. Maximum is ${MAX_FILE_MB} MB.`);
        return;
      }
    } else {
      if (!value.trim()) {
        setUploadError("Please enter a URL or note content.");
        return;
      }
    }

    const currentTitle = title.trim();
    const currentType  = type;
    const currentValue = value.trim();
    const currentFile  = selectedFile;
    const tempId       = `temp_${Date.now()}`;

    setPendingItems(prev => [...prev, { tempId, title: currentTitle, type: currentType }]);
    setTitle(""); setValue(""); setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    try {
      let resource: Resource;

      if (currentType === "file" || currentType === "video") {
        // ── Get session JWT (needed for TUS auth header)
        const { data: { session } } = await Promise.race([
          supabase.auth.getSession(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Session timed out. Please refresh the page.")), 5_000)
          ),
        ]);
        if (!session?.access_token) throw new Error("Session expired. Please log out and log back in.");

        // ── Build the storage path
        const safeName = currentFile!.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath = `${workspaceId}/${Date.now()}_${safeName}`;
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/workspace-resources/${filePath}`;

        // ── TUS resumable upload — chunked, no timeout, resumes on network drop
        setUploadProgress(0);
        await new Promise<void>((resolve, reject) => {
          const upload = new tus.Upload(currentFile!, {
            endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`,
            retryDelays: [0, 3_000, 5_000, 10_000, 20_000],
            headers: {
              authorization: `Bearer ${session.access_token}`,
              "x-upsert": "false",
            },
            uploadDataDuringCreation: true,
            removeFingerprintOnSuccess: true,
            metadata: {
              bucketName:  "workspace-resources",
              objectName:  filePath,
              contentType: currentFile!.type || "application/octet-stream",
              cacheControl: "3600",
            },
            chunkSize: 6 * 1024 * 1024, // 6 MB per chunk
            onError:    (err) => reject(new Error(err.message ?? "Upload failed")),
            onProgress: (uploaded, total) => {
              setUploadProgress(Math.round((uploaded / total) * 100));
            },
            onSuccess:  () => resolve(),
          });
          upload.start();
        });

        setUploadProgress(null);

        // ── Save DB record
        const saveRes = await fetch("/api/save-resource", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            workspaceId,
            title:  currentTitle,
            type:   currentType,
            value:  publicUrl,
            userId: user!.id,
          }),
        });
        const saveBody = await saveRes.json().catch(() => ({ error: "Invalid server response" }));
        if (!saveRes.ok) throw new Error(saveBody.error ?? `Error ${saveRes.status}`);
        resource = saveBody.resource as Resource;

      } else {
        // ── Link / note — server handles insert
        const res = await fetch("/api/upload-resource", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            workspaceId,
            title:  currentTitle,
            type:   currentType,
            userId: user!.id,
            value:  currentValue,
          }),
        });
        const body = await res.json().catch(() => ({ error: "Invalid server response" }));
        if (!res.ok) throw new Error(body.error ?? `Error ${res.status}`);
        resource = body.resource as Resource;
      }

      setResources(prev => prev.some(r => r.id === resource.id) ? prev : [...prev, resource]);

    } catch (err: any) {
      setUploadError(err.message ?? "Upload failed");
    } finally {
      setUploadProgress(null);
      setPendingItems(prev => prev.filter(p => p.tempId !== tempId));
    }
  };

  /* ── Render ── */
  const isEmpty = resources.length === 0 && pendingItems.length === 0;

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>
        <FolderOpen size={17} className={styles.sectionTitleIconGreen} />
        Resources
        {resources.length > 0 && (
          <span className={`${styles.countBadge} ${styles.countBadgeGreen}`}>{resources.length}</span>
        )}
      </h2>

      {/* Upload form — org only */}
      {isOrganization && (
        <div className={styles.form}>
          <div className={styles.formField}>
            <input
              type="text"
              placeholder="Resource title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.formInput}
            />
          </div>

          {/* Type pill tabs */}
          <div className={styles.typeTabs}>
            {(["link", "video", "file", "note"] as Resource["type"][]).map((t) => {
              const icons  = { link: <Link2 size={14} />, video: <Video size={14} />, file: <FileText size={14} />, note: <StickyNote size={14} /> };
              const labels = { link: "Link", video: "Video", file: "File", note: "Note" };
              return (
                <button
                  key={t}
                  type="button"
                  className={`${styles.typeTab} ${type === t ? styles.typeTabActive : ""}`}
                  onClick={() => { setType(t); setValue(""); setSelectedFile(null); }}
                >
                  {icons[t]} {labels[t]}
                </button>
              );
            })}
          </div>

          <div className={styles.formField}>
            {type === "note" ? (
              <textarea
                placeholder="Write instructions or notes..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className={styles.formTextarea}
              />
            ) : type === "file" || type === "video" ? (
              <div className={styles.fileInputWrapper} onClick={() => fileInputRef.current?.click()}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={type === "video" ? "video/*" : undefined}
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setSelectedFile(file);
                    if (file && !title.trim()) {
                      setTitle(
                        file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim()
                      );
                    }
                  }}
                  className={styles.fileInputHidden}
                />
                <button
                  type="button"
                  className={styles.fileInputBtn}
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                >
                  <Upload size={14} />
                  Choose {type === "video" ? "video" : "file"}
                </button>
                <span className={selectedFile ? styles.fileNameSelected : styles.fileName}>
                  {selectedFile ? selectedFile.name : "No file chosen"}
                </span>
              </div>
            ) : (
              <input
                type="text"
                placeholder="Paste URL here..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className={styles.formInput}
              />
            )}
          </div>

          <Button onClick={addResource}>
            <Plus size={15} />
            Add Resource
          </Button>

          {uploadError && (
            <p style={{ margin: "8px 0 0", fontSize: "0.82rem", color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "6px 10px" }}>
              ⚠ {uploadError}
            </p>
          )}
        </div>
      )}

      {/* Resource list */}
      {isEmpty ? (
        <p className={styles.emptyText}>No resources shared yet.</p>
      ) : (
        <div className={styles.resourceList}>

          {/* Real resources */}
          {resources.map((r) => {
            const cfg = TYPE_CONFIG[r.type] ?? TYPE_CONFIG.link;
            return (
              <div key={r.id} className={`${styles.resourceCard} ${cfg.cls}`}>
                <div className={styles.resourceTypeBar} />
                <div className={styles.resourceCardContent}>
                  <div className={styles.resourceCardHeader}>
                    <p className={styles.resourceTitle}>{r.title}</p>
                    {isOrganization && (
                      <button onClick={() => deleteResource(r)} className={styles.resourceDeleteBtn} title="Delete">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <div className={styles.resourceBody}>
                    {r.type === "note"  && <p className={styles.resourceNote}>{r.value}</p>}
                    {r.type === "video" && <video src={r.value} controls className={styles.resourceVideo} />}
                    {r.type === "file"  && (
                      <a href={r.value} download target="_blank" rel="noopener noreferrer" className={styles.resourceLink}>
                        <Download size={13} /> Download
                      </a>
                    )}
                    {r.type === "link"  && (
                      <a href={r.value} target="_blank" rel="noopener noreferrer" className={styles.resourceLink}>
                        {cfg.icon} Open link
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Optimistic / pending cards */}
          {pendingItems.map((p, idx) => {
            const cfg = TYPE_CONFIG[p.type] ?? TYPE_CONFIG.link;
            const isActive = idx === 0; // first pending = currently uploading
            return (
              <div key={p.tempId} className={`${styles.resourceCard} ${cfg.cls} ${styles.resourceCardPending}`}>
                <div className={styles.resourceTypeBar} />
                <div className={styles.resourceCardContent}>
                  <div className={styles.resourceCardHeader}>
                    <p className={styles.resourceTitle}>{p.title}</p>
                  </div>
                  <div className={styles.uploadingLabel}>
                    <span className={styles.uploadSpinner} />
                    {isActive && uploadProgress !== null
                      ? `Uploading… ${uploadProgress}%`
                      : "Uploading…"}
                  </div>
                  {/* Progress bar */}
                  {isActive && uploadProgress !== null && (
                    <div className={styles.progressBarTrack}>
                      <div
                        className={styles.progressBarFill}
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
