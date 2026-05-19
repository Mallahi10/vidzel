"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Button from "@/components/Button";
import styles from "./organization.module.css";
// AJOUTÉ [Étape 5] : client Supabase pour les vraies stats
import { supabase } from "@/lib/supabaseClient";

export default function OrganizationDashboard() {
  const { user, loading } = useAuth();

  // AJOUTÉ [Étape 5] : états pour les vraies stats
  const [stats, setStats] = useState({ activeProjects: 0, activeContributors: 0, completedTasks: 0 });
  const [projectCounts, setProjectCounts] = useState({ active: 0, completed: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // AJOUTÉ [Étape 5] : chargement des vraies données depuis Supabase
  useEffect(() => {
    if (!user || user.role !== "organization") return;

    const fetchStats = async () => {
      // Projets actifs
      const { count: activeCount } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", user.id)
        .eq("status", "open");

      // Projets complétés
      const { count: completedCount } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", user.id)
        .eq("status", "completed");

      // Workspaces de l'org (nécessaire pour les 2 requêtes suivantes)
      const { data: workspaces } = await supabase
        .from("workspaces")
        .select("id")
        .eq("organization_id", user.id);

      let activeContributors = 0;
      let completedTasks = 0;

      if (workspaces && workspaces.length > 0) {
        const wsIds = workspaces.map((w: any) => w.id);

        // Membres actifs dans les workspaces de l'org
        const { count: membersCount } = await supabase
          .from("workspace_members")
          .select("*", { count: "exact", head: true })
          .in("workspace_id", wsIds)
          .eq("status", "active");

        // Tâches complétées dans les workspaces de l'org
        const { count: tasksCount } = await supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .in("workspace_id", wsIds)
          .eq("completed", true);

        activeContributors = membersCount || 0;
        completedTasks = tasksCount || 0;
      }

      // 5 dernières acceptations d'invitation
      const { data: activity } = await supabase
        .from("invitations")
        .select("invited_email, responded_at, workspaces(title)")
        .eq("invited_by", user.id)
        .eq("status", "accepted")
        .order("responded_at", { ascending: false })
        .limit(5);

      setStats({ activeProjects: activeCount || 0, activeContributors, completedTasks });
      setProjectCounts({ active: activeCount || 0, completed: completedCount || 0 });
      setRecentActivity(activity || []);
      setLoadingStats(false);
    };

    fetchStats();
  }, [user?.id]);

  // FIX : attendre la fin de l'initialisation avant d'afficher "Please log in."
  if (loading) return null;
  if (!user) return <div className={styles.wrapper}>Please log in.</div>;
  if (user.role !== "organization")
    return <div className={styles.wrapper}>Access denied.</div>;

  return (
    <div className={styles.wrapper}>
      {/* HERO */}
      <div className={styles.hero}>
        <div>
          <h1>Welcome back</h1>
          <p>Manage your activity and track your work in one place.</p>
          <span className={styles.roleBadge}>Organization Dashboard</span>
        </div>

        <Link href="/dashboard/projects/create">
          <Button>+ Create Project</Button>
        </Link>
      </div>

      {/* STATS BAR */}
      {/* MODIFIÉ [Étape 5] : vraies stats depuis Supabase */}
      <div className={styles.statsBar}>
        <Stat icon="📁" title="Active Projects" value={loadingStats ? "—" : String(stats.activeProjects)} />
        <Stat icon="🧑‍🤝‍🧑" title="Active Contributors" value={loadingStats ? "—" : String(stats.activeContributors)} />
        <Stat icon="✅" title="Completed Tasks" value={loadingStats ? "—" : String(stats.completedTasks)} />
      </div>

      {/* MAIN GRID */}
      <div className={styles.mainGrid}>
        {/* Recent Activity */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Recent Activity</h3>
            <span className={styles.viewLink}>View All →</span>
          </div>

          {/* MODIFIÉ [Étape 5] : vraie activité depuis invitations acceptées */}
          {loadingStats ? (
            <p style={{ color: "#94a3b8", fontSize: "14px" }}>Loading…</p>
          ) : recentActivity.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: "14px" }}>No recent activity yet.</p>
          ) : (
            recentActivity.map((item: any, index: number) => (
              <Activity
                key={index}
                name={item.invited_email}
                action={`joined ${item.workspaces?.title ?? "a workspace"}`}
              />
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Quick Actions</h3>
          </div>

          <Quick
            icon="➕"
            text="Create Project"
            link="/dashboard/projects/create"
          />
          {/* MODIFIÉ [Étape 3] : lien mis à jour vers la page d'invitation */}
          <Quick
            icon="👤"
            text="Invite Contributor"
            link="/dashboard/invite"
          />
          <Quick
            icon="📄"
            text="Review Applications"
            link="/dashboard/applications"
          />
          {/* MODIFIÉ [Étape 5] : lien corrigé — /workspaces/create n'existe pas */}
          <Quick
            icon="🗂️"
            text="My Workspaces"
            link="/dashboard/workspaces"
          />
        </div>

        {/* Project Status */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Project Status</h3>
          </div>

          {/* MODIFIÉ [Étape 5] : vrais comptes depuis Supabase */}
          <div className={styles.statusRow}>
            <span className={styles.active}>Active {loadingStats ? "—" : projectCounts.active}</span>
            <span className={styles.planning}>Completed {loadingStats ? "—" : projectCounts.completed}</span>
          </div>

          <div className={styles.chartMock}></div>
        </div>
      </div>

      {/* BOTTOM GRID */}
      <div className={styles.bottomGrid}>
        <ActionCard
          icon="📁"
          title="Manage Projects"
          text="View, edit, and track projects created by your organization."
          link="/dashboard/projects"
          buttonText="View My Projects"
        />

        <ActionCard
          icon="🔎"
          title="Browse Profiles"
          text="Invite volunteers, students, and mentors to collaborate."
          link="/dashboard/profiles"
          buttonText="Browse Profiles"
        />

        <ActionCard
          icon="🗂️"
          title="My Workspaces"
          text="Access active collaborations and stay engaged in ongoing projects."
          link="/dashboard/workspaces"
          buttonText="View Workspaces"
        />

        <ActionCard
          icon="🛡️"
          title="Organization Profile"
          text="Your profile score"
          progress={80}
          link="/dashboard/organization/profile"
          buttonText="Complete Your Profile"
        />
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function Stat({ icon, title, value }: any) {
  return (
    <div className={styles.statItem}>
      <div className={styles.statIcon}>{icon}</div>
      <div>
        <p>{title}</p>
        <h4>{value}</h4>
      </div>
    </div>
  );
}

function Activity({ name, action }: any) {
  return (
    <div className={styles.activityItem}>
      <div className={styles.avatar}></div>
      <p>
        <strong>{name}</strong> {action}
      </p>
    </div>
  );
}

/* 🔥 UPDATED QUICK COMPONENT (NOW CLICKABLE) */
function Quick({ icon, text, link }: any) {
  return (
    <Link href={link} className={styles.quickItem}>
      <div className={styles.quickIcon}>{icon}</div>
      <span>{text}</span>
    </Link>
  );
}

function ActionCard({
  icon,
  title,
  text,
  progress,
  link,
  buttonText,
}: any) {
  return (
    <div className={styles.card}>
      <div className={styles.cardContent}>
        <div className={styles.actionIcon}>{icon}</div>
        <h3>{title}</h3>
        <p>{text}</p>

        {progress && (
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
      </div>

      <div className={styles.cardButton}>
        <Link href={link}>
          <Button variant="outline">{buttonText} →</Button>
        </Link>
      </div>
    </div>
  );
}