"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Button from "@/components/Button";

import styles from "./dashboard.module.css";

/* ================= TYPES ================= */

type Role = "organization" | "volunteer" | "student" | "mentor";

function normalizeRole(role: unknown): Role | "unknown" {
  if (typeof role !== "string") return "unknown";
  const r = role.trim().toLowerCase();
  if (r === "organization" || r === "volunteer" || r === "student" || r === "mentor") {
    return r as Role;
  }
  return "unknown";
}

/* ================= DASHBOARD ================= */

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [hasProfile, setHasProfile] = useState(false);

  const role = useMemo(() => normalizeRole(user?.role), [user?.role]);
  const isOrg = role === "organization";

  const roleLabel =
    role === "unknown"
      ? "Dashboard"
      : `${role.charAt(0).toUpperCase() + role.slice(1)} Dashboard`;

  /* ✅ IMPORTANT: Only redirect AFTER loading is done */
  useEffect(() => {
    if (loading) return;         // <-- prevents redirect loop
    if (!user) router.replace("/login");
  }, [user, loading, router]);

  /* TEMP profile state */
  useEffect(() => {
    if (!user) return;
    setHasProfile(false);
  }, [user]);

  /* While restoring session, render nothing (or a loader) */
  if (loading) return null;
  if (!user) return null;

  return (
    <div className={styles.dashboard}>
      {/* ===== HEADER ===== */}
      <header className={styles.header} style={{ position: "relative" }}>
        <div>
          <h1 className={styles.pageTitle}>Welcome back</h1>

          <p className={styles.pageSubtitle}>
            Manage your activity and track your work in one place.
          </p>

          <span className={styles.roleBadge}>{roleLabel}</span>
        </div>

        {/* ORG CREATE PROJECT BUTTON */}
        {isOrg && (
          <Link
            href="/dashboard/projects/create"
            style={{ position: "absolute", top: "0", right: "0" }}
          >
            <Button>+ Create Project</Button>
          </Link>
        )}
      </header>

      {/* ================= ORGANIZATION VIEW ================= */}
      {isOrg && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionTitle}>Your Projects</div>
              <div className={styles.sectionSubtitle}>
                Create and manage projects for volunteers, students, and mentors.
              </div>
            </div>
          </div>

          <div className={styles.cardGrid}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Manage Projects</div>
              <div className={styles.cardMeta}>
                View, edit, and track all projects created by your organization.
              </div>

              <Link href="/dashboard/projects">
                <Button variant="secondary">View My Projects →</Button>
              </Link>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}>Browse Profiles</div>
              <div className={styles.cardMeta}>
                Invite volunteers, students, and mentors to your projects.
              </div>

              <Link href="/dashboard/profiles">
                <Button variant="secondary">Browse Profiles →</Button>
              </Link>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}>My Workspaces</div>
              <div className={styles.cardMeta}>
                Access active collaborations with your contributors.
              </div>

              <Link href="/dashboard/workspaces">
                <Button variant="secondary">View Workspaces →</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ================= MEMBER VIEW ================= */}
      {!isOrg && (
        <>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <div className={styles.sectionTitle}>My Activity</div>
                <div className={styles.sectionSubtitle}>
                  Manage your profile, invitations, and workspaces.
                </div>
              </div>
            </div>

            <div className={styles.cardGrid}>
              <div className={styles.card}>
                <div className={styles.cardTitle}>My Profile</div>

                {hasProfile ? (
                  <>
                    <div className={styles.cardMeta}>
                      Your profile is complete and visible to organizations.
                    </div>

                    <Link href="/dashboard/profile">
                      <Button>View / Edit Profile</Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <div className={styles.cardMeta}>
                      You haven’t created your profile yet. Create your profile to get started.
                    </div>

                    <Link href="/dashboard/profile">
                      <Button>Create My Profile</Button>
                    </Link>
                  </>
                )}
              </div>

              <div className={styles.card}>
                <div className={styles.cardTitle}>My Invitations</div>
                <div className={styles.cardMeta}>
                  View and respond to invitations from organizations.
                </div>

                <Link href="/dashboard/invitations">
                  <Button variant="secondary">View Invitations →</Button>
                </Link>
              </div>

              <div className={styles.card}>
                <div className={styles.cardTitle}>My Workspaces</div>
                <div className={styles.cardMeta}>
                  Access projects you are actively collaborating on.
                </div>

                <Link href="/dashboard/workspaces">
                  <Button variant="secondary">View Workspaces →</Button>
                </Link>
              </div>

              <div className={styles.card}>
                <div className={styles.cardTitle}>Completed Projects</div>
                <div className={styles.cardMeta}>
                  Track projects you’ve completed and keep a record of your work.
                </div>

                <Link href="/dashboard/completed-projects">
                  <Button variant="secondary">Completed Projects →</Button>
                </Link>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <div className={styles.sectionTitle}>Explore Projects</div>
                <div className={styles.sectionSubtitle}>
                  Discover projects you can contribute to.
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <Link href="/dashboard/explore">
                <Button variant="secondary">Browse Projects →</Button>
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}