"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePreviewPage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const stored = JSON.parse(
      localStorage.getItem("vidzel_profiles") || "[]"
    );

    const found = stored.find(
      (p: any) => p.userId === userId
    );

    setProfile(found);
  }, [userId]);

  if (!user) {
    return <div style={{ padding: "3rem" }}>Please log in first.</div>;
  }

  if (!profile) {
    return <div style={{ padding: "3rem" }}>Profile not found.</div>;
  }

  const box = {
    background: "#f8fafc",
    padding: "1rem",
    borderRadius: "6px",
    marginBottom: "1rem",
  };

  return (
    <div style={{ padding: "3rem", maxWidth: "800px" }}>
      <button onClick={() => router.back()}>← Back</button>

      <h1 style={{ marginTop: "1rem" }}>
        {profile.fullName}
      </h1>

      <p style={{ color: "#555" }}>
        Role: {profile.role}
      </p>

      <div style={box}>
        <strong>Location</strong><br />
        {profile.location || "—"}
      </div>

      <div style={box}>
        <strong>Bio</strong><br />
        {profile.bio || "—"}
      </div>

      <div style={box}>
        <strong>Skills</strong><br />
        {profile.skills || "—"}
      </div>

      {profile.education && (
        <div style={box}>
          <strong>Education</strong><br />
          {profile.education}
        </div>
      )}

      <div style={box}>
        <strong>Experience</strong><br />
        {profile.experience || "—"}
      </div>

      {profile.resumeFileName && (
        <div style={box}>
          <strong>Resume</strong><br />
          {profile.resumeFileName}
        </div>
      )}

      <p style={{ fontSize: "0.85rem", color: "#777" }}>
        Last updated:{" "}
        {new Date(profile.updatedAt).toLocaleString()}
      </p>
    </div>
  );
}
