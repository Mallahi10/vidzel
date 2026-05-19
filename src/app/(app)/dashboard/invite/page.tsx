"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import dynamic from "next/dynamic";
import { getWorkspacesByOrg, type Workspace } from "@/lib/workspaceService";
import {
  sendInvitation,
  getOrgInvitations,
  type Invitation,
  type MemberRole,
} from "@/lib/invitationService";

/* ============================================================
   COMPONENT
============================================================ */
function InvitePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [workspaces, setWorkspaces]               = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [email, setEmail]                         = useState("");
  const [role, setRole]                           = useState<MemberRole>("member");
  const [invitations, setInvitations]             = useState<Invitation[]>([]);
  const [loading, setLoading]                     = useState(true);
  const [sending, setSending]                     = useState(false);
  const [message, setMessage]                     = useState<{ type: "success" | "error"; text: string } | null>(null);

  /* ── Guard : org uniquement ── */
  useEffect(() => {
    if (!user) return;
    if (user.role !== "organization") {
      router.replace("/dashboard");
      return;
    }
    setLoading(false);
  }, [user, router]);

  /* ── Charger les workspaces de l'org ── */
  useEffect(() => {
    if (!user || user.role !== "organization") return;
    getWorkspacesByOrg(user.id).then(setWorkspaces);
  }, [user?.id]);

  /* ── Charger les invitations quand le workspace change ── */
  useEffect(() => {
    if (!selectedWorkspaceId) {
      setInvitations([]);
      return;
    }
    getOrgInvitations(selectedWorkspaceId).then(setInvitations);
  }, [selectedWorkspaceId]);

  if (!user || loading) {
    return <div style={{ padding: "3rem" }}>Loading…</div>;
  }

  /* ── Envoyer une invitation ── */
  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspaceId || !email.trim()) return;

    setSending(true);
    setMessage(null);

    const result = await sendInvitation(
      selectedWorkspaceId,
      email,
      role,
      user.id
    );

    if (result) {
      setInvitations((prev) => [result, ...prev]);
      setEmail("");
      setMessage({ type: "success", text: `Invitation sent to ${email}` });
    } else {
      setMessage({
        type: "error",
        text: "Failed to send invitation. Check the email and try again.",
      });
    }

    setSending(false);
  };

  /* ============================================================
     UI
  ============================================================ */
  return (
    <div style={{ padding: "3rem", maxWidth: "800px", margin: "0 auto" }}>

      {/* BACK */}
      <button onClick={() => router.push("/dashboard")} style={backButtonStyle}>
        ← Back to Dashboard
      </button>

      <h1 style={{ marginBottom: "2rem", color: "#1F3A5F" }}>
        Invite a Team Member
      </h1>

      {/* FORMULAIRE */}
      <div style={cardStyle}>
        <form onSubmit={handleSendInvitation}>

          <label style={labelStyle}>Select Workspace</label>
          <select
            value={selectedWorkspaceId}
            onChange={(e) => setSelectedWorkspaceId(e.target.value)}
            style={inputStyle}
            required
          >
            <option value="">— Choose a workspace —</option>
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.title}
              </option>
            ))}
          </select>

          <label style={labelStyle}>Email Address</label>
          <input
            type="email"
            placeholder="member@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            required
          />

          <label style={labelStyle}>Internal Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as MemberRole)}
            style={inputStyle}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
            <option value="reviewer">Reviewer</option>
          </select>

          {/* Feedback message */}
          {message && (
            <p style={{
              padding: "0.75rem 1rem",
              borderRadius: "10px",
              marginBottom: "1rem",
              background: message.type === "success" ? "#F0FDF4" : "#FEF2F2",
              color: message.type === "success" ? "#166534" : "#991B1B",
              fontWeight: 500,
            }}>
              {message.type === "success" ? "✅ " : "❌ "}
              {message.text}
            </p>
          )}

          <Button type="submit" disabled={sending}>
            {sending ? "Sending…" : "Send Invitation"}
          </Button>

        </form>
      </div>

      {/* LISTE DES INVITATIONS ENVOYÉES */}
      {selectedWorkspaceId && (
        <div style={{ marginTop: "2rem" }}>
          <h2 style={{ color: "#1F3A5F", marginBottom: "1rem" }}>
            Invitations Sent
          </h2>

          {invitations.length === 0 ? (
            <p style={{ color: "#64748b" }}>
              No invitations sent for this workspace yet.
            </p>
          ) : (
            invitations.map((inv) => (
              <div key={inv.id} style={invCardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontWeight: 600, margin: 0 }}>
                      {inv.invited_email}
                    </p>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>
                      Role: {inv.internal_role} · Sent:{" "}
                      {new Date(inv.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <span style={{
                    padding: "3px 10px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 600,
                    background:
                      inv.status === "accepted" ? "#F0FDF4" :
                      inv.status === "declined"  ? "#FEF2F2" : "#FFF7ED",
                    color:
                      inv.status === "accepted" ? "#166534" :
                      inv.status === "declined"  ? "#991B1B" : "#92400E",
                  }}>
                    {inv.status === "accepted" ? "✅ Accepted" :
                     inv.status === "declined"  ? "❌ Declined" : "⏳ Pending"}
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
   STYLES
============================================================ */
const backButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.5rem",
  padding: "0.55rem 1.4rem",
  borderRadius: "999px",
  border: "2px solid #2563eb",
  background: "white",
  color: "#2563eb",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.95rem",
  marginBottom: "2rem",
};

const cardStyle = {
  background: "white",
  borderRadius: "16px",
  padding: "2rem",
  boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
  border: "1px solid #e5e7eb",
};

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  fontWeight: 500,
  color: "#1F3A5F",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "12px",
  border: "1px solid rgba(31, 58, 95, 0.15)",
  marginBottom: "16px",
  fontSize: "14px",
};

const invCardStyle = {
  padding: "1rem 1.25rem",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  marginBottom: "0.75rem",
  background: "white",
};

/* ============================================================
   EXPORT — dynamic pour éviter les erreurs SSR
============================================================ */
export default dynamic(() => Promise.resolve(InvitePage), { ssr: false });
