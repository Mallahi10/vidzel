"use client";

import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
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
  const router = useRouter();
  const params = useParams();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [applications, setApplications] = useState<Application[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // 🔎 Filters
  const [search, setSearch] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);

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

  /* ================= HELPERS ================= */

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

  /* ================= FILTERED DATA ================= */

  const filteredApplications = useMemo(() => {
    return applications
      .filter((a) => String(a.projectId) === String(projectId))
      .filter((a) => {
        const account = resolveAccount(a);

        const role =
          (a.applicantRole || account?.role || "").toLowerCase();

        const status = (a.status || "pending").toLowerCase();

        const name =
          (a.applicantName || account?.name || "").toLowerCase();

        const email =
          (a.applicantEmail || account?.email || "").toLowerCase();

        const query = search.toLowerCase();

        // ✅ FIXED LOGIC
        const roleMatch =
          roles.length === 0 || roles.includes(role);

        const statusMatch =
          statuses.length === 0 || statuses.includes(status);

        const searchMatch =
          !query || name.includes(query) || email.includes(query);

        return roleMatch && statusMatch && searchMatch;
      });
  }, [applications, projectId, roles, statuses, search, accountById]);

  /* ================= UI ================= */

  return (
    <div style={{ padding: "3rem", maxWidth: "1100px" }}>
      <h1>Project Applicants</h1>

      {/* 🔎 FILTER BAR */}
      <div
        style={{
          marginTop: "1.5rem",
          padding: "1.25rem",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          background: "#f8fafc",
          display: "flex",
          flexWrap: "wrap",
          gap: "1.5rem",
        }}
      >
        {/* Search */}
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "0.5rem 0.75rem",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            minWidth: "220px",
          }}
        />

        {/* Role filters */}
        <div>
          <strong>Role:</strong>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
            {["student", "volunteer", "mentor"].map((r) => (
              <label key={r}>
                <input
                  type="checkbox"
                  checked={roles.includes(r)}
                  onChange={() =>
                    setRoles((prev) =>
                      prev.includes(r)
                        ? prev.filter((x) => x !== r)
                        : [...prev, r]
                    )
                  }
                />{" "}
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </label>
            ))}
          </div>
        </div>

        {/* Status filters */}
        <div>
          <strong>Status:</strong>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
            {["pending", "accepted", "rejected"].map((s) => (
              <label key={s}>
                <input
                  type="checkbox"
                  checked={statuses.includes(s)}
                  onChange={() =>
                    setStatuses((prev) =>
                      prev.includes(s)
                        ? prev.filter((x) => x !== s)
                        : [...prev, s]
                    )
                  }
                />{" "}
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* RESULTS */}
      {filteredApplications.length === 0 && (
        <p style={{ marginTop: "1.5rem", color: "#64748b" }}>
          No applicants match the selected filters.
        </p>
      )}

      {filteredApplications.map((app) => {
        const account = resolveAccount(app);
        const displayName =
          app.applicantName || account?.name || "Unnamed Applicant";

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
                  <Button variant="secondary">View Profile</Button>
                </Link>
              )}
            </div>
          </div>
        );
      })}

      {/* 🔙 BACK */}
      <div style={{ marginTop: "3rem" }}>
        <Button
          variant="secondary"
          onClick={() => router.push("/dashboard")}
        >
          ← Back to Dashboard
        </Button>
      </div>
    </div>
  );
}