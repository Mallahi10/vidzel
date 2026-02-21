"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
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

type Project = {
  id: string;
  title?: string;
  createdBy?: string;
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
  projects: "vidzel_projects",
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

export default function ApplicationsPage() {
  const { user } = useAuth();

  const [applications, setApplications] = useState<Application[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    if (!user) return;

    setApplications(readLS<Application[]>(LS.applications, []));
    setProjects(readLS<Project[]>(LS.projects, []));
    setAccounts(readLS<Account[]>(LS.accounts, []));
  }, [user]);

  if (!user) {
    return <div style={{ padding: "3rem" }}>Please log in.</div>;
  }

  if (user.role !== "organization") {
    return (
      <div style={{ padding: "3rem" }}>
        Only organizations can view applications.
      </div>
    );
  }

  /* ================= FILTER ONLY MY PROJECTS ================= */

  const myProjectIds = useMemo(() => {
    return projects
      .filter((p) => p.createdBy === user.email)
      .map((p) => String(p.id));
  }, [projects, user.email]);

  const myApplications = useMemo(() => {
    return applications.filter((a) =>
      myProjectIds.includes(String(a.projectId))
    );
  }, [applications, myProjectIds]);

  /* ================= ACCOUNT MAPS ================= */

  const accountById = useMemo(() => {
    const map = new Map<string, Account>();
    accounts.forEach((a) => map.set(String(a.id), a));
    return map;
  }, [accounts]);

  const accountByEmail = useMemo(() => {
    const map = new Map<string, Account>();
    accounts.forEach((a) =>
      map.set((a.email || "").toLowerCase(), a)
    );
    return map;
  }, [accounts]);

  const resolveAccount = (app: Application): Account | null => {
    if (app.applicantId && accountById.has(String(app.applicantId))) {
      return accountById.get(String(app.applicantId)) || null;
    }

    const email = (app.applicantEmail || "").toLowerCase();
    if (!email) return null;

    return accountByEmail.get(email) || null;
  };

  /* ================= UI ================= */

  return (
    <div style={{ padding: "3rem", maxWidth: "1000px" }}>
      <h1>Applications</h1>

      {myApplications.length === 0 && (
        <p style={{ color: "#64748b" }}>No applications yet.</p>
      )}

      {myApplications.map((app) => {
        const account = resolveAccount(app);

        const displayName =
          app.applicantName ||
          account?.name ||
          "Unnamed Applicant";

        const applicantAccountId =
          account?.id || app.applicantId || null;

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

              {applicantAccountId ? (
                <Link href={`/dashboard/profiles/${applicantAccountId}`}>
                  <Button variant="outline">
                    View Profile
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" disabled>
                  View Profile
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}