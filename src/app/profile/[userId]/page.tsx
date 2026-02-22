"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

/* ==============================
   TYPES
============================== */

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

type PageProps = {
  params: {
    userId: string;
  };
};

/* ==============================
   PAGE
============================== */

export default function Page({ params }: PageProps) {
  const { user } = useAuth();
  const { userId } = params;

  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!user || user.role !== "organization") return;

    const storedProfiles: UserProfile[] = JSON.parse(
      localStorage.getItem("vidzel_profiles") || "[]"
    );

    const foundProfile =
      storedProfiles.find((p) => p.userId === userId) || null;

    setProfile(foundProfile);
  }, [user, userId]);

  /* ==============================
     ACCESS GUARDS
  ============================== */

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

  /* ==============================
     RENDER
  ============================== */

  return (
    <div style={{ padding: "3rem", maxWidth: "800px" }}>
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
    </div>
  );
}