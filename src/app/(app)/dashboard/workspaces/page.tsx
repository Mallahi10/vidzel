"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/Button";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  getWorkspacesByOrg,
  getWorkspacesForMember,
  type Workspace,
} from "@/lib/workspaceService";
// NEW MODERN UI UPDATE — CSS module + Lucide icons replace inline styles and emojis
import styles from "./workspaces.module.css";
import {
  ArrowLeft,
  LayoutGrid,
  Lock,
  Globe,
  Calendar,
  Loader2,
  FolderOpen,
  Award,
} from "lucide-react";

/* ============================================================
   Extend Workspace with the joined project title from Supabase
   (type inchangé)
============================================================ */
type WorkspaceWithProject = Workspace & {
  projects?: { title: string } | null;
};

/* ============================================================
   COMPONENT — logique métier entièrement inchangée
============================================================ */
function WorkspacesListPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [activeWorkspaces, setActiveWorkspaces]       = useState<WorkspaceWithProject[]>([]);
  const [completedWorkspaces, setCompletedWorkspaces] = useState<WorkspaceWithProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function loadWorkspaces() {
      setLoading(true);

      const workspaces: WorkspaceWithProject[] =
        user!.role === "organization"
          ? await getWorkspacesByOrg(user!.id)
          : await getWorkspacesForMember(user!.id);

      setActiveWorkspaces(workspaces.filter((w) => w.status === "active"));
      setCompletedWorkspaces(workspaces.filter((w) => w.status === "completed"));
      setLoading(false);
    }

    loadWorkspaces();
  }, [user?.id]);

  if (!user) {
    return <div className={styles.page}>Please log in.</div>;
  }

  if (loading) {
    return (
      // OLD STYLE BACKUP: <div style={{ padding: "3rem" }}>Loading workspaces…</div>
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
          Loading workspaces…
        </div>
      </div>
    );
  }

  const isOrg = user.role === "organization";

  return (
    // OLD STYLE BACKUP: <div style={{ padding: "3rem", maxWidth: "1000px" }}>
    <div className={styles.page}>

      {/* HERO BANNER */}
      <div className={styles.pageHero}>
        <div>
          <h1 className={styles.heroTitle}>My Workspaces</h1>
          <p className={styles.heroSubtitle}>
            Access active collaborations and stay engaged in ongoing projects.
          </p>
          <span className={styles.heroBadge}>Organization</span>
        </div>
        <button className={styles.backLink} onClick={() => router.push("/dashboard")}>
          <ArrowLeft size={15} />
          Dashboard
        </button>
      </div>

      {/* ── ACTIVE WORKSPACES ── */}
      {/* OLD STYLE BACKUP: <h2 style={{ marginTop: "2rem" }}>Active Projects</h2> */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Active Projects</h2>
        {activeWorkspaces.length > 0 && (
          <span className={styles.sectionCount}>{activeWorkspaces.length}</span>
        )}
      </div>

      {activeWorkspaces.length === 0 ? (
        // OLD STYLE BACKUP: <p style={{ color: "#666", marginTop: "1rem" }}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><FolderOpen size={36} /></div>
          {isOrg
            ? "No active workspaces yet. Create a project to get started."
            : "You haven't been added to any workspace yet."}
        </div>
      ) : (
        <div className={styles.workspaceGrid}>
          {activeWorkspaces.map((w) => (
            // OLD STYLE BACKUP: <div key={w.id} style={workspaceCardStyle}>
            <div key={w.id} className={styles.workspaceCard}>
              <div className={styles.cardIconRow}>
                <div className={styles.cardIcon}>
                  <LayoutGrid size={20} />
                </div>
                <h3 className={styles.cardTitle}>
                  {w.projects?.title ?? w.title}
                </h3>
              </div>

              {/* OLD STYLE BACKUP: <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "1rem" }}> */}
              {/* NEW MODERN UI UPDATE — Lucide icons replace emoji 🔒/🌐 */}
              <div className={styles.cardMeta}>
                <span className={`${styles.metaBadge} ${w.type === "private" ? styles.metaBadgePrivate : styles.metaBadgeOpen}`}>
                  {w.type === "private" ? <Lock size={10} /> : <Globe size={10} />}
                  {w.type === "private" ? "Private" : "Open"}
                </span>
                <span className={styles.metaItem}>
                  <Calendar size={12} />
                  {new Date(w.created_at).toLocaleDateString()}
                </span>
              </div>

              <Link href={`/dashboard/workspaces/${w.id}`}>
                <Button>
                  Open Workspace →
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* ── COMPLETED WORKSPACES (non-org only) ── */}
      {!isOrg && completedWorkspaces.length > 0 && (
        <>
          {/* OLD STYLE BACKUP: <h2 style={{ marginTop: "3rem" }}>Completed Projects</h2> */}
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Completed Projects</h2>
            <span className={styles.sectionCount}>{completedWorkspaces.length}</span>
          </div>

          <div className={styles.workspaceGrid}>
            {completedWorkspaces.map((w) => (
              // OLD STYLE BACKUP: <div key={w.id} style={{ ...workspaceCardStyle, background: "#f8fafc" }}>
              <div key={w.id} className={`${styles.workspaceCard} ${styles.workspaceCardCompleted}`}>
                <div className={styles.cardIconRow}>
                  <div className={styles.cardIcon}>
                    <Award size={20} />
                  </div>
                  <h3 className={styles.cardTitle}>
                    {w.projects?.title ?? w.title}
                  </h3>
                </div>

                <Link href={`/dashboard/certificates/${w.project_id}`}>
                  <Button variant="secondary">
                    View Certificate →
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================
   EXPORT — dynamic kept exactly as before to avoid SSR issues
============================================================ */
export default dynamic(() => Promise.resolve(WorkspacesListPage), {
  ssr: false,
});
