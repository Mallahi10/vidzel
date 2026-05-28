"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import dynamic from "next/dynamic";
import { getWorkspacesByOrg, type Workspace } from "@/lib/workspaceService";
import { sendInvitation, getOrgInvitations, type Invitation, type MemberRole } from "@/lib/invitationService";
// NEW MODERN UI UPDATE — CSS module replaces inline styles
import styles from "./invite.module.css";
import { ArrowLeft, CheckCircle, XCircle, Clock, Send } from "lucide-react";

/* ============================================================
   COMPONENT — business logic entirely unchanged
============================================================ */
function InvitePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [workspaces, setWorkspaces]                   = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [email, setEmail]                             = useState("");
  const [role, setRole]                               = useState<MemberRole>("member");
  const [invitations, setInvitations]                 = useState<Invitation[]>([]);
  const [loading, setLoading]                         = useState(true);
  const [sending, setSending]                         = useState(false);
  const [message, setMessage]                         = useState<{ type: "success" | "error"; text: string } | null>(null);

  /* Guard: org uniquement (inchangé) */
  useEffect(() => {
    if (!user) return;
    if (user.role !== "organization") { router.replace("/dashboard"); return; }
    setLoading(false);
  }, [user, router]);

  /* Load workspaces (inchangé) */
  useEffect(() => {
    if (!user || user.role !== "organization") return;
    getWorkspacesByOrg(user.id).then(setWorkspaces);
  }, [user?.id]);

  /* Load invitations on workspace change (inchangé) */
  useEffect(() => {
    if (!selectedWorkspaceId) { setInvitations([]); return; }
    getOrgInvitations(selectedWorkspaceId).then(setInvitations);
  }, [selectedWorkspaceId]);

  if (!user || loading) {
    return <div className={styles.page}>Loading…</div>;
  }

  /* Send invitation (inchangé) */
  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspaceId || !email.trim()) return;

    setSending(true);
    setMessage(null);

    const result = await sendInvitation(selectedWorkspaceId, email, role, user.id);

    if (result) {
      setInvitations((prev) => [result, ...prev]);
      setEmail("");
      setMessage({ type: "success", text: `Invitation sent to ${email}` });
    } else {
      setMessage({ type: "error", text: "Failed to send invitation. Check the email and try again." });
    }

    setSending(false);
  };

  /* ============================================================
     UI
  ============================================================ */
  return (
    // OLD STYLE BACKUP: <div style={{ padding:"3rem", maxWidth:"800px", margin:"0 auto" }}>
    <div className={styles.page}>

      {/* HERO BANNER */}
      <div className={styles.pageHero}>
        <div>
          <h1 className={styles.heroTitle}>Invite a Team Member</h1>
          <p className={styles.heroSubtitle}>
            Send workspace invitations to volunteers, students, and mentors.
          </p>
          <span className={styles.heroBadge}>Organization</span>
        </div>
        <button onClick={() => router.push("/dashboard")} className={styles.backLink}>
          <ArrowLeft size={15} />
          Dashboard
        </button>
      </div>

      {/* FORM CARD — OLD STYLE BACKUP: <div style={cardStyle}> */}
      <div className={styles.formCard}>
        <form onSubmit={handleSendInvitation}>

          {/* OLD STYLE BACKUP: <label style={labelStyle}>Select Workspace</label><select style={inputStyle}> */}
          <label className={styles.formLabel}>Select Workspace</label>
          <select value={selectedWorkspaceId} onChange={(e) => setSelectedWorkspaceId(e.target.value)} className={styles.formSelect} required>
            <option value="">— Choose a workspace —</option>
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>{w.title}</option>
            ))}
          </select>

          <label className={styles.formLabel}>Email Address</label>
          <input type="email" placeholder="member@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={styles.formInput} required />

          <label className={styles.formLabel}>Internal Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as MemberRole)} className={styles.formSelect}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
            <option value="reviewer">Reviewer</option>
          </select>

          {/* Feedback message — OLD STYLE BACKUP: <p style={{ background: conditional, color: conditional }}>{emoji}{text}</p> */}
          {message && (
            <div className={`${styles.feedbackMsg} ${message.type === "success" ? styles.feedbackSuccess : styles.feedbackError}`}>
              {message.type === "success" ? <CheckCircle size={16} /> : <XCircle size={16} />}
              {message.text}
            </div>
          )}

          <Button type="submit" disabled={sending}>
            <Send size={15} />
            {sending ? "Sending…" : "Send Invitation"}
          </Button>

        </form>
      </div>

      {/* INVITATIONS LIST */}
      {selectedWorkspaceId && (
        <div>
          {/* OLD STYLE BACKUP: <h2 style={{ color:"#1F3A5F", marginBottom:"1rem" }}>Invitations Sent</h2> */}
          <h2 className={styles.sectionTitle}>Invitations Sent</h2>

          {invitations.length === 0 ? (
            // OLD STYLE BACKUP: <p style={{ color:"#64748b" }}>No invitations sent for this workspace yet.</p>
            <div className={styles.emptyText}>No invitations sent for this workspace yet.</div>
          ) : (
            invitations.map((inv) => (
              // OLD STYLE BACKUP: <div key={inv.id} style={invCardStyle}>
              <div key={inv.id} className={styles.invCard}>
                {/* OLD STYLE BACKUP: <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}> */}
                <div className={styles.invCardRow}>
                  <div>
                    {/* OLD STYLE BACKUP: <p style={{ fontWeight:600, margin:0 }}>{inv.invited_email}</p> */}
                    <p className={styles.invEmail}>{inv.invited_email}</p>
                    <p className={styles.invMeta}>Role: {inv.internal_role} · Sent: {new Date(inv.created_at).toLocaleDateString()}</p>
                  </div>

                  {/* OLD STYLE BACKUP: <span style={{ background: conditional, color: conditional }}>✅ Accepted / ❌ Declined / ⏳ Pending</span> */}
                  <span className={`${styles.statusBadge} ${
                    inv.status === "accepted" ? styles.statusAccepted :
                    inv.status === "declined"  ? styles.statusDeclined : styles.statusPending
                  }`}>
                    {inv.status === "accepted" ? <CheckCircle size={11} /> : inv.status === "declined" ? <XCircle size={11} /> : <Clock size={11} />}
                    {inv.status === "accepted" ? "Accepted" : inv.status === "declined" ? "Declined" : "Pending"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}

/* ============================================================
   EXPORT — dynamic kept to avoid SSR issues (inchangé)
============================================================ */
export default dynamic(() => Promise.resolve(InvitePage), { ssr: false });
