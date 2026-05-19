"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
// MODIFIÉ [Étape 3] : import depuis invitationService (remplace localStorage + addNotification)
import {
  getMyInvitations,
  acceptInvitation,
  declineInvitation,
  type Invitation,
} from "@/lib/invitationService";

/* ================= COMPONENT ================= */

function InvitationsPage() {
  const { user } = useAuth();
  const router = useRouter();

  // MODIFIÉ [Étape 3] : type Invitation depuis invitationService
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [responding, setResponding]   = useState<string | null>(null);

  // MODIFIÉ [Étape 3] : lecture depuis Supabase (remplace localStorage)
  useEffect(() => {
    if (!user) return;
    getMyInvitations(user.email).then(setInvitations);
  }, [user?.id]);

  if (!user) return <div style={{ padding: "3rem" }}>Please log in.</div>;

  if (user.role === "organization") {
    return <div style={{ padding: "3rem" }}>Organizations do not receive invitations.</div>;
  }

  /* ================= UPDATE STATUS — logique inchangée ================= */
  const updateStatus = async (invite: Invitation, status: "accepted" | "declined") => {
    if (!user) return;
    setResponding(invite.id);

    let success = false;
    if (status === "accepted") {
      success = await acceptInvitation(invite.id, invite.workspace_id, invite.internal_role, user.id);
    } else {
      success = await declineInvitation(invite.id);
    }

    setResponding(null);
    if (success) {
      setInvitations((prev) => prev.map((i) => (i.id === invite.id ? { ...i, status } : i)));
    }
  };

  /* ================= HELPERS ================= */

  const roleMeta: Record<string, { label: string; color: string; bg: string }> = {
    admin:    { label: "Admin",    color: "#5b21b6", bg: "#ede9fe" },
    member:   { label: "Member",   color: "#0369a1", bg: "#e0f2fe" },
    reviewer: { label: "Reviewer", color: "#166534", bg: "#dcfce7" },
  };

  const statusMeta: Record<string, { label: string; icon: string; color: string; bg: string; border: string }> = {
    pending:  { label: "Pending",  icon: "⏳", color: "#92400e", bg: "#fffbeb", border: "#fde68a" },
    accepted: { label: "Accepted", icon: "✅", color: "#166534", bg: "#f0fdf4", border: "#bbf7d0" },
    declined: { label: "Declined", icon: "✕",  color: "#991b1b", bg: "#fef2f2", border: "#fecaca" },
  };

  const pending   = invitations.filter((i) => i.status === "pending");
  const responded = invitations.filter((i) => i.status !== "pending");

  /* ================= UI ================= */

  return (
    <div style={{ padding: "2.5rem", maxWidth: "720px", margin: "0 auto" }}>

      {/* HEADER */}
      <button onClick={() => router.push("/dashboard")} style={backBtn}>
        ← Back to Dashboard
      </button>

      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.35rem" }}>
          My Invitations
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.95rem", margin: 0 }}>
          Workspace invitations sent to your account.
        </p>
      </div>

      {/* EMPTY STATE */}
      {invitations.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem 1rem", background: "white", borderRadius: "16px", border: "1px dashed #e2e8f0" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📭</div>
          <p style={{ color: "#64748b", fontWeight: 500 }}>No invitations yet.</p>
        </div>
      )}

      {/* PENDING INVITATIONS */}
      {pending.length > 0 && (
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "1rem" }}>
            Pending ({pending.length})
          </h2>

          {pending.map((invite) => {
            const role   = roleMeta[invite.internal_role]   ?? roleMeta.member;
            const status = statusMeta[invite.status]        ?? statusMeta.pending;
            const isResponding = responding === invite.id;

            return (
              <div key={invite.id} style={{
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "1.5rem",
                marginBottom: "1rem",
                boxShadow: "0 2px 12px rgba(15,23,42,0.06)",
              }}>

                {/* TOP ROW */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg, #1e3a8a, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                      🗂️
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: "1rem", color: "#0f172a", margin: 0 }}>
                        {invite.workspaces?.title ?? "Workspace invitation"}
                      </p>
                      <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "2px 0 0" }}>
                        You've been invited to join this workspace
                      </p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 600, background: status.bg, color: status.color, border: `1px solid ${status.border}`, whiteSpace: "nowrap" }}>
                    {status.icon} {status.label}
                  </span>
                </div>

                {/* META ROW */}
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
                  <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 600, background: role.bg, color: role.color }}>
                    {role.label}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}>
                    📅 {new Date(invite.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>

                {/* ACTION BUTTONS */}
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    onClick={() => updateStatus(invite, "accepted")}
                    disabled={isResponding}
                    style={{
                      flex: 1,
                      padding: "0.65rem",
                      borderRadius: "10px",
                      border: "none",
                      background: "linear-gradient(135deg, #166534, #16a34a)",
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      cursor: isResponding ? "wait" : "pointer",
                      opacity: isResponding ? 0.7 : 1,
                    }}
                  >
                    ✅ Accept
                  </button>
                  <button
                    onClick={() => updateStatus(invite, "declined")}
                    disabled={isResponding}
                    style={{
                      flex: 1,
                      padding: "0.65rem",
                      borderRadius: "10px",
                      border: "1.5px solid #e2e8f0",
                      background: "white",
                      color: "#64748b",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      cursor: isResponding ? "wait" : "pointer",
                      opacity: isResponding ? 0.7 : 1,
                    }}
                  >
                    ✕ Decline
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* RESPONDED INVITATIONS */}
      {responded.length > 0 && (
        <section>
          <h2 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "1rem" }}>
            Previous ({responded.length})
          </h2>

          {responded.map((invite) => {
            const role   = roleMeta[invite.internal_role] ?? roleMeta.member;
            const status = statusMeta[invite.status]      ?? statusMeta.declined;

            return (
              <div key={invite.id} style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "1.25rem 1.5rem",
                marginBottom: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>
                  🗂️
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: "0.95rem", color: "#334155", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {invite.workspaces?.title ?? "Workspace invitation"}
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <span style={{ padding: "2px 8px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 600, background: role.bg, color: role.color }}>
                      {role.label}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                      {new Date(invite.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>

                <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 600, background: status.bg, color: status.color, border: `1px solid ${status.border}`, whiteSpace: "nowrap" }}>
                  {status.icon} {status.label}
                </span>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}

/* ================= STYLES ================= */

const backBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.4rem",
  padding: "0.45rem 1.1rem",
  borderRadius: "999px",
  border: "2px solid #2563eb",
  background: "white",
  color: "#2563eb",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.875rem",
  marginBottom: "1.75rem",
};

/* ================= EXPORT ================= */

export default dynamic(() => Promise.resolve(InvitationsPage), { ssr: false });
