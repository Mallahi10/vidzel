"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BrowseProfilesPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const stored = JSON.parse(
      localStorage.getItem("vidzel_profiles") || "[]"
    );
    setProfiles(stored);
  }, []);

  /* =========================
     ROLE FILTER LOGIC
  ========================= */

  const allRoles = ["student", "volunteer", "mentor"];

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  };

  const toggleAll = () => {
    if (selectedRoles.length === allRoles.length) {
      setSelectedRoles([]);
    } else {
      setSelectedRoles(allRoles);
    }
  };

  /* =========================
     FILTER + SEARCH
  ========================= */

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const role = String(p.role || "").toLowerCase();
      const name = String(p.fullName || p.name || "").toLowerCase();
      const skills = String(p.skills || "").toLowerCase();
      const query = search.toLowerCase();

      const roleMatch =
        selectedRoles.length === 0 ||
        selectedRoles.includes(role);

      const searchMatch =
        !query ||
        name.includes(query) ||
        skills.includes(query) ||
        role.includes(query);

      return roleMatch && searchMatch;
    });
  }, [profiles, selectedRoles, search]);

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
    <div
      style={{
        position: "relative",
        padding: "4.5rem 3rem 3rem", // ⬅ space for back button
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      {/* ✅ BACK BUTTON — NOW VISIBLE */}
      <button
        onClick={() => router.push("/dashboard")}
        style={backButtonStyle}
      >
        ← Back to Dashboard
      </button>

      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
        Browse Profiles
      </h1>

      <p style={{ color: "#475569", marginBottom: "1.5rem" }}>
        Browse volunteers, students, and mentors and invite them to your projects.
      </p>

      {/* 🔍 Search */}
      <input
        type="text"
        placeholder="Search by name, skill, or role..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={searchInput}
      />

      {/* 🔹 Role Filters */}
      <div style={{ marginBottom: "2rem", display: "flex", gap: "1.5rem" }}>
        <label>
          <input
            type="checkbox"
            checked={selectedRoles.length === allRoles.length}
            onChange={toggleAll}
          />{" "}
          All
        </label>

        <label>
          <input
            type="checkbox"
            checked={selectedRoles.includes("student")}
            onChange={() => toggleRole("student")}
          />{" "}
          Student
        </label>

        <label>
          <input
            type="checkbox"
            checked={selectedRoles.includes("volunteer")}
            onChange={() => toggleRole("volunteer")}
          />{" "}
          Volunteer
        </label>

        <label>
          <input
            type="checkbox"
            checked={selectedRoles.includes("mentor")}
            onChange={() => toggleRole("mentor")}
          />{" "}
          Mentor
        </label>
      </div>

      {filteredProfiles.length === 0 && (
        <p style={{ color: "#64748b" }}>
          No profiles match your search or selected roles.
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {filteredProfiles.map((profile) => (
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

/* =========================
   STYLES
========================= */

const backButtonStyle = {
  position: "absolute" as const,
  top: "1.5rem",          // ✅ INSIDE the page
  right: "3rem",          // aligned with content
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
};

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

const searchInput = {
  width: "100%",
  padding: "0.6rem 1rem",
  borderRadius: "999px",
  border: "1px solid #cbd5e1",
  marginBottom: "1.5rem",
};