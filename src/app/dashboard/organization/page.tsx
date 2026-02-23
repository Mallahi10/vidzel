"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function OrganizationDashboard() {
  const { user } = useAuth();

  if (!user) {
    return <div className="page">Please log in first.</div>;
  }

  if (user.role !== "organization") {
    return (
      <div className="page">
        Only organizations can access this page.
      </div>
    );
  }

  return (
    <div className="page">
      {/* HEADER */}
      <h1 className="page-title">
        Welcome back, {user.name}
      </h1>

      <p className="page-subtitle">
        Manage your projects and connect with volunteers, students, and mentors.
      </p>

      {/* DASHBOARD BOXES */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "2rem",
        }}
      >
        {/* Manage Projects */}
        <div className="card">
          <h2 className="card-title">Manage Projects</h2>
          <p className="card-text">
            View, edit, and track projects created by your organization.
          </p>

          <Link href="/dashboard/projects">
            <button className="btn-primary">
              View My Projects →
            </button>
          </Link>
        </div>

        {/* Browse Profiles */}
        <div className="card">
          <h2 className="card-title">Browse Profiles</h2>
          <p className="card-text">
            Find volunteers, students, and mentors and invite them to your projects.
          </p>

          <Link href="/dashboard/profiles">
            <button className="btn-primary">
              Browse Profiles →
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}