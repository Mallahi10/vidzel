"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import { addNotification } from "@/lib/notifications";
import dynamic from "next/dynamic";

/* ================= COMPONENT ================= */

function InvitationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [invitations, setInvitations] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const storedInvites = JSON.parse(
      localStorage.getItem("vidzel_invitations") || "[]"
    );

    setInvitations(
      storedInvites.filter((i: any) => i.invitedUserId === user.id)
    );
  }, [user]);

  if (!user) {
    return <div style={{ padding: "3rem" }}>Please log in.</div>;
  }

  if (user.role === "organization") {
    return (
      <div style={{ padding: "3rem" }}>
        Organizations do not receive invitations.
      </div>
    );
  }

  /* ================= UPDATE STATUS ================= */

  const updateStatus = (inviteId: string, status: "accepted" | "declined") => {
    const invites = JSON.parse(
      localStorage.getItem("vidzel_invitations") || "[]"
    );

    const invite = invites.find((i: any) => i.id === inviteId);
    if (!invite) return;

    const updatedInvites = invites.map((i: any) =>
      i.id === inviteId
        ? { ...i, status, respondedAt: new Date().toISOString() }
        : i
    );

    localStorage.setItem(
      "vidzel_invitations",
      JSON.stringify(updatedInvites)
    );

    /* ================= ACCEPT LOGIC ================= */

    if (status === "accepted") {
      const projects = JSON.parse(
        localStorage.getItem("vidzel_projects") || "[]"
      );

      const project = projects.find(
        (p: any) => String(p.id) === String(invite.projectId)
      );

      if (!project) return;

      const workspaces = JSON.parse(
        localStorage.getItem("vidzel_workspaces") || "[]"
      );

      let workspace = workspaces.find(
        (w: any) => String(w.projectId) === String(project.id)
      );

      if (!workspace) {
        workspace = {
          id: "ws_" + Date.now(),
          projectId: project.id,
          projectTitle: project.title,
          organizationEmail: project.createdBy,
          createdAt: new Date().toISOString(),
          status: "active",
        };

        localStorage.setItem(
          "vidzel_workspaces",
          JSON.stringify([...workspaces, workspace])
        );
      }

      const members = JSON.parse(
        localStorage.getItem("vidzel_workspace_members") || "[]"
      );

      const alreadyMember = members.some(
        (m: any) =>
          m.workspaceId === workspace.id &&
          m.userId === invite.invitedUserId
      );

      if (!alreadyMember) {
        const newMember = {
          id: "mem_" + Date.now(),
          workspaceId: workspace.id,
          userId: invite.invitedUserId,
          name: invite.invitedUserName,
          role: invite.invitedUserRole || user.role,
          joinedAt: new Date().toISOString(),
        };

        members.push(newMember);

        localStorage.setItem(
          "vidzel_workspace_members",
          JSON.stringify(members)
        );

id: "notif_" + Date.now() + "_" + Math.random().toString(36).slice(2),
        addNotification({
          id: "notif_" + Date.now() + "_" + Math.random().toString(36).slice(2),
          userId: newMember.userId,
          type: "invitation",
          title: "Project Invitation Accepted",
          message: `You’ve joined the project "${project.title}"`,
          workspaceId: newMember.workspaceId,
          projectId: project.id,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    setInvitations(
      updatedInvites.filter((i: any) => i.invitedUserId === user.id)
    );
  };

  /* ================= UI ================= */

  return (
    <div style={{ padding: "3rem", maxWidth: "800px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <button
          onClick={() => router.push("/dashboard")}
          style={backButtonStyle}
        >
          ← Back to Dashboard
        </button>
      </div>

      <h1>My Invitations</h1>

      {invitations.length === 0 && (
        <p style={{ marginTop: "1.5rem", color: "#666" }}>
          You have no invitations.
        </p>
      )}

      {invitations.map((invite) => (
        <div
          key={invite.id}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "14px",
            padding: "1.5rem",
            marginTop: "1.5rem",
            background: "white",
          }}
        >
          <p>
            <strong>Project ID:</strong> {invite.projectId}
          </p>
          <p>
            <strong>Invited as:</strong> {invite.invitedUserName}
          </p>
          <p>
            <strong>Status:</strong> {invite.status}
          </p>

          {invite.status === "pending" && (
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <Button onClick={() => updateStatus(invite.id, "accepted")}>
                Accept
              </Button>
              <Button
                variant="secondary"
                onClick={() => updateStatus(invite.id, "declined")}
              >
                Decline
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ================= STYLES ================= */

const backButtonStyle = {
  padding: "0.5rem 1.2rem",
  borderRadius: "999px",
  border: "2px solid #2563eb",
  background: "white",
  color: "#2563eb",
  fontWeight: 600,
  cursor: "pointer",
};

/* ================= EXPORT ================= */

export default dynamic(() => Promise.resolve(InvitationsPage), {
  ssr: false,
});