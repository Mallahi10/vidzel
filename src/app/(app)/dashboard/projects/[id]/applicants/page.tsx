"use client";

import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Button from "@/components/Button";
import styles from "./applicants.module.css";
import { ArrowLeft, Clock, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type Application = {
  id: string;
  project_id: string;
  applicant_id: string;
  applicant_email: string | null;
  applicant_role: string | null;
  status: "pending" | "accepted" | "rejected" | null;
  profiles: { email: string | null; role: string | null } | null;
};

export default function ProjectApplicantsPage() {
  const { user } = useAuth();
  const router   = useRouter();
  const params   = useParams();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps]   = useState(true);
  const [search,   setSearch]   = useState("");
  const [roles,    setRoles]    = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);

  useEffect(() => {
    if (!user || !projectId) return;
    supabase
      .from("applications")
      .select("id, project_id, applicant_id, applicant_email, applicant_role, status, profiles!applicant_id(email, role)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setApplications((data as unknown as Application[]) || []);
        setLoadingApps(false);
      });
  }, [user?.id, projectId]);

  if (!user)                    return <div className={styles.page}>Please log in.</div>;
  if (user.role !== "organization") return <div className={styles.page}>Only organizations can view applicants.</div>;

  const filtered = useMemo(() => {
    return applications.filter((a) => {
      const role   = (a.profiles?.role   || a.applicant_role || "").toLowerCase();
      const status = (a.status || "pending").toLowerCase();
      const email  = (a.profiles?.email  || a.applicant_email || "").toLowerCase();
      const query  = search.toLowerCase();

      return (
        (roles.length   === 0 || roles.includes(role))   &&
        (statuses.length === 0 || statuses.includes(status)) &&
        (!query || email.includes(query))
      );
    });
  }, [applications, roles, statuses, search]);

  return (
    <div className={styles.page}>
      {/* HERO */}
      <div className={styles.pageHero}>
        <div>
          <h1 className={styles.heroTitle}>Project Applicants</h1>
          <p className={styles.heroSubtitle}>Review and manage applications for this project.</p>
          <span className={styles.heroBadge}>Organization</span>
        </div>
        <button type="button" onClick={() => router.push("/dashboard/projects")} className={styles.heroBackBtn}>
          <ArrowLeft size={15} /> My Projects
        </button>
      </div>

      {/* FILTERS */}
      <div className={styles.filterBar}>
        <input
          type="text"
          placeholder="Search by email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
        <div className={styles.filterGroup}>
          <span className={styles.filterGroupLabel}>Role</span>
          <div className={styles.checkboxRow}>
            {["student", "volunteer", "mentor"].map((r) => (
              <label key={r} className={styles.checkboxLabel}>
                <input type="checkbox" checked={roles.includes(r)} onChange={() => setRoles((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r])} />
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </label>
            ))}
          </div>
        </div>
        <div className={styles.filterGroup}>
          <span className={styles.filterGroupLabel}>Status</span>
          <div className={styles.checkboxRow}>
            {["pending", "accepted", "rejected"].map((s) => (
              <label key={s} className={styles.checkboxLabel}>
                <input type="checkbox" checked={statuses.includes(s)} onChange={() => setStatuses((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])} />
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* LOADING */}
      {loadingApps && (
        <p style={{ color: "#94a3b8", textAlign: "center", padding: "40px 0" }}>Loading…</p>
      )}

      {/* LIST */}
      {!loadingApps && filtered.length === 0 && (
        <p className={styles.emptyText}>No applicants match the selected filters.</p>
      )}

      {!loadingApps && filtered.map((app) => {
        const displayEmail = app.profiles?.email || app.applicant_email || "Unknown";
        const role         = app.profiles?.role  || app.applicant_role  || "";
        const appStatus    = app.status || "pending";

        return (
          <div key={app.id} className={styles.appCard}>
            <div className={styles.appRow}>
              <div className={styles.appInfo}>
                <div className={styles.appNameRow}>
                  <span className={styles.appName}>{displayEmail}</span>
                  {role && <span className={styles.appRole}>{role}</span>}
                </div>
                <span className={`${styles.statusBadge} ${
                  appStatus === "accepted" ? styles.statusAccepted :
                  appStatus === "rejected" ? styles.statusRejected : styles.statusPending
                }`}>
                  {appStatus === "accepted" ? <CheckCircle size={11} /> : appStatus === "rejected" ? <XCircle size={11} /> : <Clock size={11} />}
                  {appStatus}
                </span>
              </div>
              {app.applicant_id && (
                <Link href={`/dashboard/profiles/${app.applicant_id}`}>
                  <Button variant="secondary">View Profile</Button>
                </Link>
              )}
            </div>
          </div>
        );
      })}

      <div className={styles.backRow}>
        <Button variant="secondary" onClick={() => router.push("/dashboard")}>
          <ArrowLeft size={15} /> Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
