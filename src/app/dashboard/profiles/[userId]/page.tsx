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
  const userId = Array.isArray(params.userId)
    ? params.userId[0]
    : params.userId;

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
      (i: any) =>
        i.invitedUserId === userId &&
        i.invitedByOrgEmail === user.email
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
    const projects = JSON.parse(
      localStorage.getItem("vidzel_projects") || "[]"
    );

    const myProjects = projects.filter(
      (p: any) => p.createdBy === user.email
    );

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
      (i: any) =>
        i.projectId === projectId &&
        i.invitedUserId === profile.userId
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

    localStorage.setItem(
      "vidzel_invitations",
      JSON.stringify(invitations)
    );

    setInviteStatus("pending");
    alert("Invitation sent successfully.");
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

      <h1 style={{ marginBottom: "1.5rem" }}>
        {profile.fullName} ({profile.role})
      </h1>

      <p><strong>Location:</strong> {profile.location || "—"}</p>
      <p><strong>Bio:</strong> {profile.bio || "—"}</p>
      <p><strong>Skills:</strong> {profile.skills || "—"}</p>

      {profile.education && (
        <p><strong>Education:</strong> {profile.education}</p>
      )}

      {profile.availability && (
        <p><strong>Availability:</strong> {profile.availability}</p>
      )}

      <p><strong>Experience:</strong> {profile.experience || "—"}</p>

      {profile.resumeFileName && (
        <p><strong>Resume:</strong> {profile.resumeFileName}</p>
      )}

      <p style={{ marginTop: "2rem", fontSize: "0.9rem", color: "#666" }}>
        Last updated: {new Date(profile.updatedAt).toLocaleString()}
      </p>

      {/* Invite Section */}
      <hr style={{ margin: "2.5rem 0" }} />

      {inviteStatus === "none" && (
        <Button onClick={inviteToProject}>
          Invite to Project
        </Button>
      )}

      {inviteStatus === "pending" && (
        <div
          style={{
            padding: "0.75rem 1.25rem",
            borderRadius: "999px",
            background: "#fef3c7",
            color: "#92400e",
            fontWeight: 600,
            display: "inline-block",
          }}
        >
          ⏳ Invitation Pending
        </div>
      )}

      {inviteStatus === "accepted" && (
        <div
          style={{
            padding: "0.75rem 1.25rem",
            borderRadius: "999px",
            background: "#dcfce7",
            color: "#166534",
            fontWeight: 600,
            display: "inline-block",
          }}
        >
          ✅ Invitation Accepted
        </div>
      )}

      {inviteStatus === "declined" && (
        <div
          style={{
            padding: "0.75rem 1.25rem",
            borderRadius: "999px",
            background: "#fee2e2",
            color: "#991b1b",
            fontWeight: 600,
            display: "inline-block",
          }}
        >
          ❌ Invitation Declined
        </div>
      )}
    </div>
  );
}
