"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

export default function MyApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    const stored = JSON.parse(
      localStorage.getItem("vidzel_applications") || "[]"
    );
    setApplications(stored);
  }, []);

  if (!user) {
    return <div style={{ padding: "3rem" }}>Please log in.</div>;
  }

  const myApps = applications.filter(
    (app) => app.userEmail === user.email
  );

  return (
    <div style={{ padding: "3rem", maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ marginBottom: "2rem" }}>My Applications</h1>

      {myApps.length === 0 && (
        <p>You haven’t applied to any projects yet.</p>
      )}

      {myApps.map((app) => (
        <div
          key={app.id}
          style={{
            padding: "1.5rem",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            marginBottom: "1rem",
            background: "white",
          }}
        >
          <h3>{app.projectTitle}</h3>
          <p>Status: {app.status || "Pending"}</p>
        </div>
      ))}
    </div>
  );
}