"use client";

import { useAuth } from "@/context/AuthContext";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Button from "@/components/Button";

/* ================= TYPES ================= */

type Application = {
  id: string;
  projectId: string;

  applicantId?: string;
  applicantName?: string;
  applicantEmail?: string;
  applicantRole?: string;

  status?: "pending" | "accepted" | "rejected";
  createdAt?: string;
};

type Account = {
  id: string;
  email: string;
  name?: string;
  role?: string;
};

/* ================= STORAGE KEYS ================= */

const LS = {
  applications: "vidzel_applications",
  accounts: "vidzel_accounts",
};

function readLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/* ================= PAGE ================= */

export default function ProjectApplicantsPage() {
  const { user } = useAuth();
  const params = useParams();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [applications, setApplications] = useState<Application[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    if (!user || !projectId) return;

    setApplications(readLS<Application[]>(LS.applications, []));
    setAccounts(readLS<Account[]>(LS.accounts, []));
  }, [user, projectId]);

  if (!user) {
    return <div style={{ padding: "3rem" }}>Please log in.</div>;
  }

  if (user.role !== "organization") {
    return (
      <div style={{ padding: "3rem" }}>
        Only organizations can view applicants.
      </div>
    );
  }

  /* ================= FILTER ================= */

  const projectApplications = useMemo(() => {
    return applications.filter(
      (a) => String(a.projectId) === String(projectId)
    );
  }, [applications, projectId]);

  const accountById = useMemo(() => {
    const map = new Map<string, Account>();
    accounts.forEach((a) => map.set(String(a.id), a));
    return map;
  }, [accounts]);

  const resolveAccount = (app: Application): Account | null => {
    if (app.applicantId && accountById.has(String(app.applicantId))) {
      return accountById.get(String(app.applicantId)) || null;
    }
    return null;
  };

  /* ================= UI ================= */

  return (
    <div style={{ padding: "3rem", maxWidth: "1000px" }}>
      <h1>Project Applicants</h1>

      {projectApplications.length === 0 && (
        <p style={{ color: "#64748b" }}>No applicants yet.</p>
      )}

      {projectApplications.map((app) => {
        const account = resolveAccount(app);

        const displayName =
          app.applicantName ||
          account?.name ||
          "Unnamed Applicant";

        return (
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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <div>
                <p style={{ margin: 0 }}>
                  <strong>{displayName}</strong>{" "}
                  <span style={{ color: "#64748b" }}>
                    ({app.applicantRole || account?.role || "—"})
                  </span>
                </p>

                {(app.applicantEmail || account?.email) && (
                  <p style={{ margin: "0.25rem 0 0", color: "#64748b" }}>
                    {app.applicantEmail || account?.email}
                  </p>
                )}

                <p style={{ margin: "0.5rem 0 0" }}>
                  Status: {app.status || "pending"}
                </p>
              </div>

              {app.applicantId && (
                <Link href={`/dashboard/profiles/${app.applicantId}`}>
                  <Button variant="secondary">
                    View Profile
                  </Button>
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}