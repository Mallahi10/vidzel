"use client";

// NEW ANNOUNCEMENT SYSTEM — Organization announcements page
// Supports 4 announcement types:
//   organization        → workspace members only
//   opportunity_public  → ALL authenticated users
//   opportunity_targeted → filtered by role (platform-wide)
//   opportunity_private  → invitation only (no fan-out)
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getOrgAnnouncements, type Announcement, type AnnouncementType } from "@/lib/announcementService";
import {
  Megaphone, Plus, Trash2, Edit2, Send, X,
  Users, ChevronDown, ExternalLink, Clock, CheckCircle2,
  Globe, Target, Lock, Building2,
} from "lucide-react";

/* ═══════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════ */
const ANNOUNCEMENT_TYPES: {
  value: AnnouncementType;
  icon: React.ReactNode;
  label: string;
  desc: string;
}[] = [
  { value: "organization",         icon: <Building2 size={13} />, label: "Organization",      desc: "Update for your workspace members" },
  { value: "opportunity_public",   icon: <Globe size={13} />,     label: "Public Opportunity", desc: "Visible to all users on Vidzel" },
  { value: "opportunity_targeted", icon: <Target size={13} />,    label: "Targeted",           desc: "Filtered by role" },
  { value: "opportunity_private",  icon: <Lock size={13} />,      label: "Private",            desc: "Invitation only — no notifications sent" },
];

const TYPE_META: Record<string, { label: string; bg: string; color: string; border: string }> = {
  organization:         { label: "Organization",      bg: "#ede9fe", color: "#5b21b6", border: "#ddd6fe" },
  opportunity_public:   { label: "Public Opp.",       bg: "#dcfce7", color: "#166534", border: "#bbf7d0" },
  opportunity_targeted: { label: "Targeted Opp.",     bg: "#fef9c3", color: "#854d0e", border: "#fde68a" },
  opportunity_private:  { label: "Private Opp.",      bg: "#fee2e2", color: "#991b1b", border: "#fecaca" },
};

const AUDIENCE_OPTIONS = [
  { value: "all_members",    label: "All members",        desc: "Everyone in your workspaces" },
  { value: "role:student",   label: "Students only",      desc: "Only student accounts" },
  { value: "role:volunteer", label: "Volunteers only",    desc: "Only volunteer accounts" },
  { value: "role:mentor",    label: "Mentors only",       desc: "Only mentor accounts" },
  { value: "collaborators",  label: "Past collaborators", desc: "Active + former members" },
];

const ROLES = [
  { value: "student",   label: "Students" },
  { value: "volunteer", label: "Volunteers" },
  { value: "mentor",    label: "Mentors" },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/* ═══════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════ */
type Workspace = { id: string; title: string; type: string };
type Project   = { id: string; title: string };

type FormState = {
  title:             string;
  message:           string;
  announcement_type: AnnouncementType;
  // organization-type fields
  audience:          string;
  workspace_id:      string;
  // opportunity fields
  project_id:        string;
  target_roles:      string[];
  // optional
  cta_label:         string;
  cta_url:           string;
  send_email:        boolean;
};

const EMPTY_FORM: FormState = {
  title: "", message: "",
  announcement_type: "organization",
  audience: "all_members", workspace_id: "",
  project_id: "", target_roles: [],
  cta_label: "", cta_url: "",
  send_email: false,
};

/* ═══════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════ */
export default function AnnouncementsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [workspaces, setWorkspaces]       = useState<Workspace[]>([]);
  const [projects, setProjects]           = useState<Project[]>([]);
  const [showForm, setShowForm]           = useState(false);
  const [form, setForm]                   = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [successMsg, setSuccessMsg]       = useState<string | null>(null);
  const [deletingId, setDeletingId]       = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user && user.role !== "organization") router.replace("/dashboard");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || user.role !== "organization") return;

    getOrgAnnouncements(user.id).then(setAnnouncements);

    supabase
      .from("workspaces")
      .select("id, title, type")
      .eq("organization_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setWorkspaces(data ?? []));

    supabase
      .from("projects")
      .select("id, title")
      .eq("organization_id", user.id)
      .neq("status", "completed")
      .order("created_at", { ascending: false })
      .then(({ data }) => setProjects(data ?? []));
  }, [user?.id]);

  if (loading || !user) return null;
  if (user.role !== "organization") return null;

  const setField = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const startEdit = (a: Announcement) => {
    setEditingId(a.id);
    setForm({
      title:             a.title,
      message:           a.message,
      announcement_type: a.announcement_type ?? "organization",
      audience:          a.audience,
      workspace_id:      a.workspace_id ?? "",
      project_id:        a.project_id   ?? "",
      target_roles:      a.target_roles ?? [],
      cta_label:         a.cta_label    ?? "",
      cta_url:           a.cta_url      ?? "",
      send_email:        false,
    });
    setShowForm(true);
    setError(null);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  };

  const linkedWsIsPrivate = workspaces.find(w => w.id === form.workspace_id)?.type === "private";
  const isOppType = form.announcement_type !== "organization";

  const handleSubmit = async () => {
    setError(null);
    if (!form.title.trim())   { setError("Please enter a title.");   return; }
    if (!form.message.trim()) { setError("Please enter a message."); return; }
    if (form.announcement_type === "opportunity_targeted" && form.target_roles.length === 0) {
      setError("Select at least one target role."); return;
    }

    setSubmitting(true);

    if (editingId) {
      const res = await fetch(`/api/announcements/${editingId}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: user.id,
          title:          form.title,
          message:        form.message,
          cta_label:      form.cta_label || null,
          cta_url:        form.cta_url   || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setError(body.error ?? "Failed to update."); setSubmitting(false); return; }
      setAnnouncements(prev => prev.map(a => a.id === editingId ? body.announcement : a));
      setSuccessMsg("Announcement updated.");

    } else {
      // Determine audience value to send
      let audienceVal: string;
      if (form.announcement_type === "opportunity_public") {
        audienceVal = "all_users";
      } else if (form.announcement_type === "opportunity_targeted") {
        audienceVal = form.target_roles.join(",");
      } else if (form.announcement_type === "opportunity_private") {
        audienceVal = "private";
      } else if (linkedWsIsPrivate) {
        audienceVal = `workspace:${form.workspace_id}`;
      } else {
        audienceVal = form.audience;
      }

      const res = await fetch("/api/announcements", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId:    user.id,
          title:             form.title,
          message:           form.message,
          audience:          audienceVal,
          announcement_type: form.announcement_type,
          target_roles:      form.announcement_type === "opportunity_targeted" ? form.target_roles : null,
          workspace_id:      !isOppType ? (form.workspace_id || null) : null,
          project_id:        isOppType  ? (form.project_id   || null) : null,
          cta_label:         form.cta_label || null,
          cta_url:           form.cta_url   || null,
          send_email:        form.send_email,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setError(body.error ?? "Failed to send."); setSubmitting(false); return; }

      setAnnouncements(prev => [body.announcement, ...prev]);
      const notified = body.notified ?? 0;
      if (form.announcement_type === "opportunity_private") {
        setSuccessMsg("Saved. Use invitations to add people to this project.");
      } else {
        setSuccessMsg(`Sent to ${notified} user${notified !== 1 ? "s" : ""}.`);
      }
    }

    setSubmitting(false);
    cancelForm();
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    setDeletingId(id);
    const res = await fetch(`/api/announcements/${id}?org_id=${user.id}`, { method: "DELETE" });
    if (res.ok) setAnnouncements(prev => prev.filter(a => a.id !== id));
    setDeletingId(null);
  };

  const audienceLabel = (a: Announcement) => {
    const t = a.announcement_type ?? "organization";
    if (t === "opportunity_public")   return "All users on Vidzel";
    if (t === "opportunity_private")  return "Invitation only";
    if (t === "opportunity_targeted") {
      const roles = a.target_roles?.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(", ");
      return roles ? `Targeted: ${roles}` : "Targeted";
    }
    if (a.audience.startsWith("workspace:")) {
      const ws = workspaces.find(w => w.id === a.audience.replace("workspace:", ""));
      return ws ? `Workspace: ${ws.title}` : "Specific workspace";
    }
    return AUDIENCE_OPTIONS.find(o => o.value === a.audience)?.label ?? a.audience;
  };

  /* ═══ RENDER ═══ */
  return (
    <div style={{ padding: "2.5rem", maxWidth: 780, margin: "0 auto" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.3rem" }}>
            Announcements
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}>
            Send updates and opportunities to your members or the whole platform.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); }}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              padding: "0.6rem 1.2rem", borderRadius: 12,
              background: "linear-gradient(135deg, #395886, #638ECB)",
              color: "white", border: "none", fontWeight: 700,
              fontSize: "0.9rem", cursor: "pointer",
              boxShadow: "0 4px 14px rgba(57,88,134,0.3)",
            }}
          >
            <Plus size={16} /> New Announcement
          </button>
        )}
      </div>

      {/* ── Success banner ── */}
      {successMsg && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          padding: "0.75rem 1rem", borderRadius: 12, marginBottom: "1.25rem",
          background: "#f0fdf4", border: "1px solid #86efac", color: "#166534",
          fontWeight: 600, fontSize: "0.875rem",
        }}>
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* ── Create / Edit form ── */}
      {showForm && (
        <div style={{
          background: "white", borderRadius: 20,
          border: "1.5px solid #e2e8f0",
          boxShadow: "0 4px 24px rgba(15,23,42,0.08)",
          padding: "1.75rem", marginBottom: "1.75rem",
        }}>
          {/* Form header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
              {editingId ? "Edit Announcement" : "New Announcement"}
            </h2>
            <button onClick={cancelForm} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}>
              <X size={18} />
            </button>
          </div>

          {/* ── Type selector (create only) ── */}
          {!editingId && (
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={labelStyle}>Type</label>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {ANNOUNCEMENT_TYPES.map(t => {
                  const active = form.announcement_type === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setField("announcement_type", t.value)}
                      title={t.desc}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "0.35rem",
                        padding: "0.45rem 1rem", borderRadius: 10, fontSize: "0.8rem", fontWeight: 600,
                        border: active ? "2px solid #395886" : "1.5px solid #e2e8f0",
                        background: active ? "#eff6ff" : "#f8fafc",
                        color: active ? "#395886" : "#64748b",
                        cursor: "pointer", transition: "all 0.12s",
                      }}
                    >
                      {t.icon} {t.label}
                    </button>
                  );
                })}
              </div>
              <p style={{ margin: "0.4rem 0 0", fontSize: "0.78rem", color: "#94a3b8" }}>
                {ANNOUNCEMENT_TYPES.find(t => t.value === form.announcement_type)?.desc}
              </p>
            </div>
          )}

          {/* ── Title ── */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={labelStyle}>Title *</label>
            <input
              type="text"
              placeholder="e.g. New mentorship project available"
              value={form.title}
              onChange={e => setField("title", e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* ── Message ── */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={labelStyle}>Message *</label>
            <textarea
              placeholder="Write your announcement here..."
              value={form.message}
              onChange={e => setField("message", e.target.value)}
              rows={4}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
            />
          </div>

          {/* ── ORGANIZATION TYPE: audience + workspace ── */}
          {!editingId && form.announcement_type === "organization" && (
            <>
              <div style={{ marginBottom: "1rem" }}>
                <label style={labelStyle}>Audience</label>
                {linkedWsIsPrivate ? (
                  <div style={{ padding: "0.6rem 0.9rem", borderRadius: 10, background: "#fef9c3", border: "1px solid #fde047", color: "#854d0e", fontSize: "0.83rem", fontWeight: 600 }}>
                    🔒 Private workspace — notification will be sent only to its members.
                  </div>
                ) : (
                  <div style={{ position: "relative" }}>
                    <select
                      value={form.audience}
                      onChange={e => setField("audience", e.target.value)}
                      style={{ ...inputStyle, appearance: "none", paddingRight: "2.5rem" }}
                    >
                      {AUDIENCE_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label} — {o.desc}</option>
                      ))}
                      {workspaces.filter(w => w.type === "open").map(w => (
                        <option key={w.id} value={`workspace:${w.id}`}>Workspace: {w.title}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }} />
                  </div>
                )}
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={labelStyle}>Link to workspace (optional)</label>
                <div style={{ position: "relative" }}>
                  <select
                    value={form.workspace_id}
                    onChange={e => setField("workspace_id", e.target.value)}
                    style={{ ...inputStyle, appearance: "none", paddingRight: "2.5rem" }}
                  >
                    <option value="">None</option>
                    {workspaces.map(w => (
                      <option key={w.id} value={w.id}>{w.title}{w.type === "private" ? " 🔒" : ""}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }} />
                </div>
              </div>
            </>
          )}

          {/* ── OPPORTUNITY_PUBLIC: info banner ── */}
          {!editingId && form.announcement_type === "opportunity_public" && (
            <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", borderRadius: 10, background: "#f0fdf4", border: "1px solid #86efac", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
              <Globe size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: "0.83rem", color: "#166534", fontWeight: 600 }}>
                This announcement will be sent to ALL authenticated users on Vidzel (students, volunteers, mentors).
              </p>
            </div>
          )}

          {/* ── OPPORTUNITY_TARGETED: role checkboxes ── */}
          {!editingId && form.announcement_type === "opportunity_targeted" && (
            <div style={{ marginBottom: "1rem" }}>
              <label style={labelStyle}>Target roles *</label>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                {ROLES.map(role => (
                  <label key={role.value} style={{ display: "flex", alignItems: "center", gap: "0.45rem", cursor: "pointer", fontSize: "0.875rem", color: "#334155", fontWeight: 500 }}>
                    <input
                      type="checkbox"
                      checked={form.target_roles.includes(role.value)}
                      onChange={e =>
                        setField("target_roles",
                          e.target.checked
                            ? [...form.target_roles, role.value]
                            : form.target_roles.filter(r => r !== role.value)
                        )
                      }
                      style={{ width: 15, height: 15, accentColor: "#395886" }}
                    />
                    {role.label}
                  </label>
                ))}
              </div>
              <p style={{ margin: "0.4rem 0 0", fontSize: "0.78rem", color: "#94a3b8" }}>
                Only users with the selected roles will receive this notification.
              </p>
            </div>
          )}

          {/* ── OPPORTUNITY_PRIVATE: info banner ── */}
          {!editingId && form.announcement_type === "opportunity_private" && (
            <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", borderRadius: 10, background: "#fff7ed", border: "1px solid #fed7aa", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
              <Lock size={16} color="#c2410c" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: "0.83rem", color: "#92400e", fontWeight: 600 }}>
                Private opportunity — no notifications will be sent. Use the <strong>Invite</strong> page to add people directly to the project workspace.
              </p>
            </div>
          )}

          {/* ── OPPORTUNITY TYPES: project selector ── */}
          {!editingId && isOppType && (
            <div style={{ marginBottom: "1rem" }}>
              <label style={labelStyle}>Link to project (optional)</label>
              <div style={{ position: "relative" }}>
                <select
                  value={form.project_id}
                  onChange={e => setField("project_id", e.target.value)}
                  style={{ ...inputStyle, appearance: "none", paddingRight: "2.5rem" }}
                >
                  <option value="">None</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
                <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }} />
              </div>
              <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: "#94a3b8" }}>
                Linking a project lets users apply directly from the notification.
              </p>
            </div>
          )}

          {/* ── CTA button (optional) ── */}
          <div style={{ marginBottom: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={labelStyle}>CTA button label (optional)</label>
              <input
                type="text"
                placeholder='e.g. "View Project"'
                value={form.cta_label}
                onChange={e => setField("cta_label", e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>CTA link URL (optional)</label>
              <input
                type="url"
                placeholder="https://..."
                value={form.cta_url}
                onChange={e => setField("cta_url", e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* ── Email toggle (not for private) ── */}
          {!editingId && form.announcement_type !== "opportunity_private" && (
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", marginBottom: "1.25rem", fontSize: "0.875rem", color: "#475569", fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={form.send_email}
                onChange={e => setField("send_email", e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "#395886" }}
              />
              Also send by email
            </label>
          )}

          {/* ── Error ── */}
          {error && (
            <p style={{ margin: "0 0 1rem", fontSize: "0.83rem", color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "6px 10px" }}>
              ⚠ {error}
            </p>
          )}

          {/* ── Actions ── */}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button onClick={cancelForm} style={secondaryBtnStyle}>Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                padding: "0.6rem 1.4rem", borderRadius: 10,
                background: submitting ? "#94a3b8" : "linear-gradient(135deg, #395886, #638ECB)",
                color: "white", border: "none", fontWeight: 700,
                fontSize: "0.875rem", cursor: submitting ? "wait" : "pointer",
              }}
            >
              {editingId ? <><Edit2 size={14} /> Save changes</> : <><Send size={14} /> {form.announcement_type === "opportunity_private" ? "Save" : "Send"}</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {announcements.length === 0 && !showForm && (
        <div style={{
          textAlign: "center", padding: "4rem 2rem",
          background: "white", borderRadius: 20, border: "1px dashed #e2e8f0",
        }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            <Megaphone size={26} color="#94a3b8" />
          </div>
          <p style={{ color: "#334155", fontWeight: 600, margin: "0 0 0.25rem" }}>No announcements yet</p>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0 }}>
            Create your first announcement to notify your members.
          </p>
        </div>
      )}

      {/* ── Announcement list ── */}
      {announcements.map((a) => {
        const typeMeta = TYPE_META[a.announcement_type ?? "organization"] ?? TYPE_META.organization;
        return (
          <div
            key={a.id}
            style={{
              background: "white", borderRadius: 16,
              border: "1px solid #f1f5f9",
              boxShadow: "0 2px 8px rgba(15,23,42,0.05)",
              padding: "1.25rem 1.5rem", marginBottom: "0.75rem",
              borderLeft: "4px solid #638ECB",
            }}
          >
            {/* Top row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "#0f172a", margin: 0 }}>
                  {a.title}
                </h3>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "0.3rem",
                  padding: "0.15rem 0.6rem", borderRadius: 6, fontSize: "0.72rem", fontWeight: 700,
                  background: typeMeta.bg, color: typeMeta.color, border: `1px solid ${typeMeta.border}`,
                }}>
                  {typeMeta.label}
                </span>
              </div>
              <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                <button onClick={() => startEdit(a)} title="Edit" style={{ ...iconBtnStyle, color: "#395886" }}>
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  disabled={deletingId === a.id}
                  title="Delete"
                  style={{ ...iconBtnStyle, color: "#dc2626" }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Message */}
            <p style={{ color: "#475569", fontSize: "0.875rem", margin: "0 0 0.75rem", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {a.message}
            </p>

            {/* CTA */}
            {a.cta_label && a.cta_url && (
              <a
                href={a.cta_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.35rem",
                  padding: "0.4rem 1rem", borderRadius: 8, marginBottom: "0.75rem",
                  background: "#f0f7ff", color: "#395886", fontWeight: 600,
                  fontSize: "0.8rem", textDecoration: "none", border: "1px solid #bfdbfe",
                }}
              >
                <ExternalLink size={12} /> {a.cta_label}
              </a>
            )}

            {/* Meta row */}
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
              <span style={metaTagStyle}>
                <Users size={11} /> {audienceLabel(a)}
              </span>
              <span style={{ ...metaTagStyle, background: "transparent", border: "none", padding: 0, color: "#94a3b8" }}>
                <Clock size={11} /> {timeAgo(a.created_at)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SHARED STYLES
═══════════════════════════════════════════════ */
const labelStyle: React.CSSProperties = {
  display: "block", marginBottom: 6,
  fontSize: "0.8rem", fontWeight: 600, color: "#475569",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.6rem 0.9rem",
  border: "1.5px solid #e2e8f0", borderRadius: 10,
  fontSize: "0.875rem", color: "#0f172a",
  background: "#f8fafc", outline: "none",
  boxSizing: "border-box",
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: "0.6rem 1.2rem", borderRadius: 10,
  border: "1.5px solid #e2e8f0", background: "white",
  color: "#475569", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer",
};

const iconBtnStyle: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer",
  padding: "0.35rem", borderRadius: 8, display: "flex",
  alignItems: "center", justifyContent: "center",
};

const metaTagStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "0.3rem",
  padding: "0.2rem 0.6rem", borderRadius: 6,
  background: "#f0f7ff", color: "#395886",
  fontSize: "0.75rem", fontWeight: 600,
  border: "1px solid #bfdbfe",
};
