"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function OrganizationDashboard() {
  const { user } = useAuth();

  if (!user) {
    return <div style={{ padding: "3rem" }}>Please log in first.</div>;
  }

  if (user.role !== "organization") {
    return (
      <div style={{ padding: "3rem" }}>
        Only organizations can access this page.
      </div>
    );
  }

  return (
    <div style={{ padding: "3rem", maxWidth: "1100px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
        Welcome back, {user.name}
      </h1>

      <p style={{ color: "#475569", marginBottom: "2.5rem" }}>
        Manage your projects and connect with volunteers, students, and mentors.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "2rem",
        }}
      >
        {/* Manage Projects */}
        <div
          style={{
            background: "white",
            padding: "2rem",
            borderRadius: "16px",
            boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
          }}
        >
          <h2 style={{ marginBottom: "0.5rem" }}>Manage Projects</h2>
          <p style={{ color: "#475569", marginBottom: "1.5rem" }}>
            View, edit, and track projects created by your organization.
          </p>

          <Link href="/dashboard/projects">
            <button style={buttonPrimary}>
              View My Projects →
            </button>
          </Link>
        </div>

        {/* Browse Profiles */}
        <div
          style={{
            background: "white",
            padding: "2rem",
            borderRadius: "16px",
            boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
          }}
        >
          <h2 style={{ marginBottom: "0.5rem" }}>Browse Profiles</h2>
          <p style={{ color: "#475569", marginBottom: "1.5rem" }}>
            Find volunteers, students, and mentors and invite them to your projects.
          </p>

          <Link href="/dashboard/profiles">
            <button style={buttonPrimary}>
              Browse Profiles →
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

const buttonPrimary = {
  padding: "0.7rem 1.4rem",
  borderRadius: "999px",
  border: "none",
  background: "#2563eb",
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
};