"use client";

import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "@/components/Button";

type UserProfile = {
  userId: string;
  role: "volunteer" | "student" | "mentor";
  fullName: string;
  location: string;
  bio: string;
  skills: string;
  availability?: string;
  education?: string;
  experience: string;
  resumeFileName?: string;
  updatedAt: string;
};

export default function Page() {
  const { user } = useAuth();
  const router = useRouter();

  const params = useParams();
  const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [inviteStatus, setInviteStatus] = useState<
    "none" | "pending" | "accepted" | "declined"
  >("none");

  useEffect(() => {
    if (!user || user.role !== "organization") return;

    // Load profile
    const storedProfiles = JSON.parse(
      localStorage.getItem("vidzel_profiles") || "[]"
    );

    const foundProfile = storedProfiles.find(
      (p: UserProfile) => p.userId === userId
    );

    setProfile(foundProfile || null);

    // Check invite status
    const invitations = JSON.parse(
      localStorage.getItem("vidzel_invitations") || "[]"
    );

    const existingInvite = invitations.find(
      (i: any) => i.invitedUserId === userId && i.invitedByOrgEmail === user.email
    );

    if (existingInvite) {
      setInviteStatus(existingInvite.status);
    } else {
      setInviteStatus("none");
    }
  }, [user, userId]);

  // 🔒 Guards
  if (!user) {
    return <div style={{ padding: "3rem" }}>Please log in first.</div>;
  }

  if (user.role !== "organization") {
    return (
      <div style={{ padding: "3rem" }}>
        Only organizations can view profiles.
      </div>
    );
  }

  if (!profile) {
    return <div style={{ padding: "3rem" }}>Profile not found.</div>;
  }

  // 📨 Invite logic
  const inviteToProject = () => {
    const projects = JSON.parse(localStorage.getItem("vidzel_projects") || "[]");

    const myProjects = projects.filter((p: any) => p.createdBy === user.email);

    if (myProjects.length === 0) {
      alert("You have no projects to invite to.");
      return;
    }

    const projectId = prompt(
      "Select a project by ID:\n" +
        myProjects.map((p: any) => `${p.id} – ${p.title}`).join("\n")
    );

    if (!projectId) return;

    const invitations = JSON.parse(
      localStorage.getItem("vidzel_invitations") || "[]"
    );

    const alreadyInvited = invitations.find(
      (i: any) => i.projectId === projectId && i.invitedUserId === profile.userId
    );

    if (alreadyInvited) {
      alert("This user is already invited to this project.");
      return;
    }

    invitations.push({
      id: "inv_" + Date.now(),
      projectId,
      invitedUserId: profile.userId,
      invitedUserName: profile.fullName,
      invitedUserRole: profile.role,
      invitedByOrgEmail: user.email,
      status: "pending",
      createdAt: new Date().toISOString(),
      respondedAt: null,
    });

    localStorage.setItem("vidzel_invitations", JSON.stringify(invitations));

    setInviteStatus("pending");
    alert("Invitation sent successfully.");
  };

  const formatUpdatedAt = (iso: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  };

  return (
    <div style={{ padding: "3rem", maxWidth: "800px" }}>
      {/* 🔙 BACK BUTTON */}
      <div style={{ marginBottom: "1.5rem" }}>
        <Button
          variant="secondary"
          onClick={() => router.push("/dashboard/profiles")}
        >
          ← Back to Profiles
        </Button>
      </div>

      <h1 style={{ marginBottom: "1.75rem" }}>
        {profile.fullName} ({profile.role})
      </h1>

      {/* ✅ Sections with spacing */}
      <div style={section}>
        <div style={label}>Location</div>
        <div style={value}>{profile.location || "—"}</div>
      </div>

      <div style={section}>
        <div style={label}>Bio</div>
        <div style={value}>{profile.bio || "—"}</div>
      </div>

      <div style={section}>
        <div style={label}>Skills</div>
        <div style={value}>{profile.skills || "—"}</div>
      </div>

      {profile.education && (
        <div style={section}>
          <div style={label}>Education</div>
          <div style={value}>{profile.education}</div>
        </div>
      )}

      {profile.availability && (
        <div style={section}>
          <div style={label}>Availability</div>
          <div style={value}>{profile.availability}</div>
        </div>
      )}

      <div style={section}>
        <div style={label}>Experience</div>
        <div style={value}>{profile.experience || "—"}</div>
      </div>

      {profile.resumeFileName && (
        <div style={section}>
          <div style={label}>Resume</div>
          <div style={value}>{profile.resumeFileName}</div>
        </div>
      )}

      <p style={{ marginTop: "2rem", fontSize: "0.9rem", color: "#666" }}>
        Last updated: {formatUpdatedAt(profile.updatedAt)}
      </p>

      {/* Invite Section */}
      <hr style={{ margin: "2.5rem 0" }} />

      {inviteStatus === "none" && <Button onClick={inviteToProject}>Invite to Project</Button>}

      {inviteStatus === "pending" && (
        <div style={pill("#fef3c7", "#92400e")}>⏳ Invitation Pending</div>
      )}

      {inviteStatus === "accepted" && (
        <div style={pill("#dcfce7", "#166534")}>✅ Invitation Accepted</div>
      )}

      {inviteStatus === "declined" && (
        <div style={pill("#fee2e2", "#991b1b")}>❌ Invitation Declined</div>
      )}
    </div>
  );
}

/* ================= STYLES ================= */

const section = {
  marginBottom: "1.25rem",
};

const label = {
  fontWeight: 700,
  marginBottom: "0.25rem",
};

const value = {
  color: "#0f172a",
  lineHeight: 1.7,
  whiteSpace: "pre-wrap" as const, // ✅ keeps line breaks if user pasted multi-line text
};

const pill = (bg: string, color: string) => ({
  padding: "0.75rem 1.25rem",
  borderRadius: "999px",
  background: bg,
  color,
  fontWeight: 600,
  display: "inline-block",
});