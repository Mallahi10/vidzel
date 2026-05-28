"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Button from "@/components/Button";
import styles from "./applications.module.css";
import { ClipboardList, Clock, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type Application = {
  id: string;
  project_id: string;
  applicant_id: string;
  applicant_email: string | null;
  applicant_role: string | null;
  status: "pending" | "accepted" | "rejected" | null;
  created_at: string;
  projects: { title: string | null; organization_id: string } | null;
  profiles: { email: string | null; role: string | null } | null;
};

export default function ApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "organization") return;

    supabase
      .from("applications")
      .select(`
        id, project_id, applicant_id, applicant_email, applicant_role, status, created_at,
        projects!project_id(title, organization_id),
        profiles!applicant_id(email, role)
      `)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setApplications((data as unknown as Application[]) || []);
        setLoading(false);
      });
  }, [user?.id]);

  if (!user) return <div className={styles.page}>Please log in.</div>;
  if (user.role !== "organization") return <div className={styles.page}>Only organizations can view applications.</div>;

  // Only show applications to this org's projects
  const myApplications = useMemo(
    () => applications.filter((a) => a.projects?.organization_id === user.id),
    [applications, user.id]
  );

  return (
    <div className={styles.page}>
      <div className={styles.pageHero}>
        <div>
          <h1 className={styles.heroTitle}>Applications</h1>
          <p className={styles.heroSubtitle}>Review and manage applications to your organization's projects.</p>
          <span className={styles.heroBadge}>Organization</span>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8", fontSize: 14 }}>
          Loading…
        </div>
      )}

      {!loading && myApplications.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><ClipboardList size={40} /></div>
          <p className={styles.emptyTitle}>No applications yet</p>
          <p className={styles.emptyText}>Applications to your projects will appear here.</p>
        </div>
      )}

      {!loading && myApplications.map((app) => {
        const displayName = app.profiles?.email || app.applicant_email || "Unknown Applicant";
        const role = app.profiles?.role || app.applicant_role || "";
        const appStatus = app.status || "pending";

        return (
          <div key={app.id} className={styles.appCard}>
            <div className={styles.appRow}>
              <div className={styles.appInfo}>
                <div className={styles.appNameRow}>
                  <span className={styles.appName}>{displayName}</span>
                  {role && <span className={styles.appRole}>{role}</span>}
                </div>
                <span className={`${styles.statusBadge} ${
                  appStatus === "accepted" ? styles.statusAccepted :
                  appStatus === "rejected" ? styles.statusRejected : styles.statusPending
                }`}>
                  {appStatus === "accepted" ? <CheckCircle size={11} /> : appStatus === "rejected" ? <XCircle size={11} /> : <Clock size={11} />}
                  {appStatus}
                </span>
                {app.projects?.title && (
                  <p className={styles.appEmail}>Project: {app.projects.title}</p>
                )}
              </div>

              {app.applicant_id ? (
                <Link href={`/dashboard/profiles/${app.applicant_id}`}>
                  <Button variant="secondary">View Profile</Button>
                </Link>
              ) : (
                <Button variant="secondary" disabled>View Profile</Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
