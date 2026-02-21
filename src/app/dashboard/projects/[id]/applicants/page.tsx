"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/Button";
import Link from "next/link";

export default function ApplicantsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const apps = JSON.parse(
      localStorage.getItem("vidzel_applications") || "[]"
    );

    setApplications(
      apps.filter(
        (a: any) => String(a.projectId) === String(id)
      )
    );
  }, [id, user]);

  /* 🔐 HARD ACCESS RULE */
  if (!user || user.role !== "organization") {
    return (
      <div style={{ padding: "3rem" }}>
        Access denied.
      </div>
    );
  }

  return (
    <div style={{ padding: "3rem", maxWidth: "900px" }}>
      <h1>Applicants</h1>

      {applications.length === 0 && (
        <p style={{ color: "#64748b" }}>
          No applications yet.
        </p>
      )}

      {applications.map((app) => (
        <div
          key={app.id}
          style={{
            marginTop: "1rem",
            padding: "1.25rem",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            background: "white",
          }}
        >
          <strong>
            {app.applicantName || "Unnamed Applicant"}
          </strong>{" "}
          <span style={{ color: "#64748b" }}>
            ({app.applicantRole})
          </span>

          {app.applicantEmail && (
            <p style={{ marginTop: "0.25rem", color: "#64748b" }}>
              {app.applicantEmail}
            </p>
          )}

          <p>Status: {app.status}</p>

          {app.applicantId && (
            <Link href={`/dashboard/profiles/${app.applicantId}`}>
              <Button variant="outline">
                View Profile
              </Button>
            </Link>
          )}
        </div>
      ))}

      <Button
        variant="secondary"
        onClick={() => router.back()}
        style={{ marginTop: "2rem" }}
      >
        ← Back
      </Button>
    </div>
  );
}