"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function BrowseProfilesPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    const stored = JSON.parse(
      localStorage.getItem("vidzel_profiles") || "[]"
    );
    setProfiles(stored);
  }, []);

  if (!user) {
    return <div style={{ padding: "3rem" }}>Please log in first.</div>;
  }

  if (user.role !== "organization") {
    return (
      <div style={{ padding: "3rem" }}>
        Only organizations can browse profiles.
      </div>
    );
  }

  return (
    <div style={{ padding: "3rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
        Browse Profiles
      </h1>

      <p style={{ color: "#475569", marginBottom: "2rem" }}>
        Browse volunteers, students, and mentors and invite them to your projects.
      </p>

      {profiles.length === 0 && (
        <p style={{ color: "#64748b" }}>
          No profiles available yet.
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {profiles.map((profile) => (
          <div
            key={profile.userId}
            style={{
              background: "white",
              borderRadius: "14px",
              padding: "1.5rem",
              boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
            }}
          >
            <h3 style={{ marginBottom: "0.25rem" }}>
              {profile.fullName || profile.name}
            </h3>

            <p style={{ color: "#475569", fontSize: "0.9rem" }}>
              Role: {profile.role}
            </p>

            {profile.skills && (
              <p style={{ marginTop: "0.75rem" }}>
                <strong>Skills:</strong> {profile.skills}
              </p>
            )}

            <Link href={`/dashboard/profiles/${profile.userId}`}>
              <button style={buttonOutline}>
                View Profile →
              </button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

const buttonOutline = {
  marginTop: "1rem",
  padding: "0.5rem 1.2rem",
  borderRadius: "999px",
  border: "1px solid #2563eb",
  background: "white",
  color: "#2563eb",
  cursor: "pointer",
  fontWeight: 600,
};