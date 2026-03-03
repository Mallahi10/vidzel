"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const PAGE_SIZE = 6;

export default function BrowseProfilesPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [sortBy, setSortBy] = useState("relevant");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const stored = JSON.parse(
      localStorage.getItem("vidzel_profiles") || "[]"
    );
    setProfiles(stored);
  }, []);

  const allRoles = ["student", "volunteer", "mentor"];

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  };

  /* ================= FILTERING ================= */

  const filteredProfiles = useMemo(() => {
    let result = profiles.filter((p) => {
      const role = String(p.role || "").toLowerCase();
      const name = String(p.fullName || p.name || "").toLowerCase();
      const skills = String(p.skills || "").toLowerCase();
      const location = String(p.location || "").toLowerCase();
      const query = search.toLowerCase();

      const roleMatch =
        selectedRoles.length === 0 ||
        selectedRoles.includes(role);

      const searchMatch =
        !query ||
        name.includes(query) ||
        skills.includes(query) ||
        role.includes(query);

      const skillMatch =
        !selectedSkill ||
        skills.includes(selectedSkill.toLowerCase());

      const locationMatch =
        !selectedLocation ||
        location.includes(selectedLocation.toLowerCase());

      const experienceMatch =
        !experience ||
        String(p.experienceLevel || "").toLowerCase() ===
          experience.toLowerCase();

      return (
        roleMatch &&
        searchMatch &&
        skillMatch &&
        locationMatch &&
        experienceMatch
      );
    });

    if (sortBy === "recent") {
      result = [...result].reverse();
    }

    return result;
  }, [
    profiles,
    selectedRoles,
    search,
    selectedSkill,
    selectedLocation,
    experience,
    sortBy,
  ]);

  const totalPages = Math.ceil(filteredProfiles.length / PAGE_SIZE);

  const paginatedProfiles = filteredProfiles.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  if (!user) return null;

  return (
    <div style={{ padding: "4rem 3rem", maxWidth: 1300, margin: "0 auto" }}>
      <button
        onClick={() => router.push("/dashboard")}
        style={backButton}
      >
        ← Back to Dashboard
      </button>

      <h1 style={{ fontSize: "2.2rem", marginBottom: 8 }}>
        Browse Profiles
      </h1>

      <p style={{ color: "#475569", marginBottom: 24 }}>
        Discover and invite the right contributors to your projects.
      </p>

      {/* SEARCH */}
      <input
        placeholder="Search by name, skill, or role..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={searchInput}
      />

      {/* SMART FILTERS */}
      <div style={filterRow}>
        {allRoles.map((r) => (
          <label key={r}>
            <input
              type="checkbox"
              checked={selectedRoles.includes(r)}
              onChange={() => toggleRole(r)}
            />{" "}
            {r}
          </label>
        ))}

        <select
          value={selectedSkill}
          onChange={(e) => setSelectedSkill(e.target.value)}
        >
          <option value="">All Skills</option>
          <option value="design">Design</option>
          <option value="analysis">Data Analysis</option>
          <option value="writing">Writing</option>
        </select>

        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
        >
          <option value="">All Locations</option>
          <option value="remote">Remote</option>
          <option value="usa">USA</option>
        </select>

        <select
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
        >
          <option value="">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="relevant">Most Relevant</option>
          <option value="recent">Recently Added</option>
        </select>
      </div>

      {/* GRID */}
      <div style={grid}>
        {paginatedProfiles.map((profile) => {
          const skillsArray =
            String(profile.skills || "")
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean);

          return (
            <div key={profile.userId} style={card}>
              <h3>{profile.fullName || profile.name}</h3>
              <p style={{ color: "#64748b", fontSize: 14 }}>
                {profile.role}
              </p>

              {/* SKILL TAGS */}
              <div style={tagsContainer}>
                {skillsArray.map((skill: string, i: number) => (
                  <span key={i} style={tag}>
                    {skill}
                  </span>
                ))}
              </div>

              {/* ACTION BUTTONS */}
              <div style={actionsRow}>
                <Link href={`/dashboard/profiles/${profile.userId}`}>
                  <button style={outlineBtn}>View</button>
                </Link>

                <button style={primaryBtn}>Invite</button>

                <button style={ghostBtn}>Message</button>

                <button style={saveBtn}>⭐</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* PAGINATION */}
      <div style={{ marginTop: 30 }}>
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            style={{
              marginRight: 8,
              padding: "6px 12px",
              borderRadius: 8,
              border:
                currentPage === i + 1
                  ? "none"
                  : "1px solid #cbd5e1",
              background:
                currentPage === i + 1
                  ? "linear-gradient(135deg,#2F6FE4,#1CA7C8)"
                  : "white",
              color: currentPage === i + 1 ? "white" : "#1f2937",
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
  gap: "1.5rem",
};

const card = {
  background: "white",
  borderRadius: 18,
  padding: "1.8rem",
  boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
};

const tagsContainer = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: 8,
  marginTop: 12,
};

const tag = {
  padding: "4px 10px",
  borderRadius: 10,
  background: "rgba(47,111,228,0.1)",
  color: "#2F6FE4",
  fontSize: 12,
  fontWeight: 500,
};

const actionsRow = {
  display: "flex",
  gap: 8,
  marginTop: 18,
  flexWrap: "wrap" as const,
};

const primaryBtn = {
  padding: "6px 14px",
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(135deg,#2F6FE4,#1CA7C8)",
  color: "white",
  cursor: "pointer",
};

const outlineBtn = {
  padding: "6px 14px",
  borderRadius: 12,
  border: "1px solid #2F6FE4",
  background: "white",
  color: "#2F6FE4",
  cursor: "pointer",
};

const ghostBtn = {
  padding: "6px 14px",
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  background: "white",
  color: "#334155",
};

const saveBtn = {
  padding: "6px 10px",
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  background: "white",
  cursor: "pointer",
};

const filterRow = {
  display: "flex",
  gap: 16,
  marginBottom: 24,
  flexWrap: "wrap" as const,
};

const searchInput = {
  width: "100%",
  padding: "10px 18px",
  borderRadius: 999,
  border: "1px solid #cbd5e1",
  marginBottom: 20,
};

const backButton = {
  position: "absolute" as const,
  top: "1.5rem",
  right: "3rem",
  padding: "8px 18px",
  borderRadius: 999,
  border: "1.5px solid #2F6FE4",
  background: "white",
  color: "#2F6FE4",
  cursor: "pointer",
};