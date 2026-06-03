"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Button from "@/components/Button";
import styles from "./organization.module.css";
// AJOUTÉ [Étape 5] : client Supabase pour les vraies stats
import { supabase } from "@/lib/supabaseClient";
// NEW MODERN UI UPDATE — Lucide icons replace emoji icons
import {
  FolderOpen,
  Users,
  CheckSquare,
  Plus,
  UserPlus,
  FileText,
  LayoutGrid,
  Search,
  Shield,
  Megaphone, // NEW ANNOUNCEMENT SYSTEM
} from "lucide-react";

export default function OrganizationDashboard() {
  const { user, loading } = useAuth();

  // AJOUTÉ [Étape 5] : états pour les vraies stats
  const [stats, setStats] = useState({ activeProjects: 0, activeContributors: 0, completedTasks: 0 });
  const [projectCounts, setProjectCounts] = useState({ active: 0, completed: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [orgName, setOrgName] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("organization_profiles")
      .select("organization_name, contact_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.organization_name) setOrgName(data.organization_name);
      });
  }, [user?.id]);

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
          <h1>Welcome back{orgName ? `, ${orgName}` : ""}!</h1>
          <p>Manage your activity and track your work in one place.</p>
          <span className={styles.roleBadge}>Organization Dashboard</span>
        </div>

        <Link href="/dashboard/projects/create">
          <Button>+ Create Project</Button>
        </Link>
      </div>

      {/* STATS BAR */}
      {/* MODIFIÉ [Étape 5] : vraies stats depuis Supabase */}
      {/* NEW MODERN UI UPDATE — Lucide icons replace emojis: 📁→FolderOpen, 🧑‍🤝‍🧑→Users, ✅→CheckSquare */}
      <div className={styles.statsBar}>
        <Stat icon={<FolderOpen size={22} />} title="Active Projects" value={loadingStats ? "—" : String(stats.activeProjects)} />
        <Stat icon={<Users size={22} />} title="Active Contributors" value={loadingStats ? "—" : String(stats.activeContributors)} />
        <Stat icon={<CheckSquare size={22} />} title="Completed Tasks" value={loadingStats ? "—" : String(stats.completedTasks)} />
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

          {/* NEW MODERN UI UPDATE — Lucide icons replace emojis: ➕→Plus, 👤→UserPlus, 📄→FileText, 🗂️→LayoutGrid */}
          <Quick
            icon={<Plus size={18} />}
            text="Create Project"
            link="/dashboard/projects/create"
          />
          {/* MODIFIÉ [Étape 3] : lien mis à jour vers la page d'invitation */}
          <Quick
            icon={<UserPlus size={18} />}
            text="Invite Contributor"
            link="/dashboard/invite"
          />
          <Quick
            icon={<FileText size={18} />}
            text="Review Applications"
            link="/dashboard/applications"
          />
          {/* MODIFIÉ [Étape 5] : lien corrigé — /workspaces/create n'existe pas */}
          <Quick
            icon={<LayoutGrid size={18} />}
            text="My Workspaces"
            link="/dashboard/workspaces"
          />
          {/* NEW ANNOUNCEMENT SYSTEM */}
          <Quick
            icon={<Megaphone size={18} />}
            text="Announcements"
            link="/dashboard/announcements"
          />
        </div>

        {/* Project Status */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Project Status</h3>
          </div>

          <ProjectStatusChart
            active={loadingStats ? 0 : projectCounts.active}
            completed={loadingStats ? 0 : projectCounts.completed}
            loading={loadingStats}
          />
        </div>
      </div>

      {/* BOTTOM GRID */}
      {/* NEW MODERN UI UPDATE — Lucide icons replace emojis: 📁→FolderOpen, 🔎→Search, 🗂️→LayoutGrid, 🛡️→Shield */}
      <div className={styles.bottomGrid}>
        <ActionCard
          icon={<FolderOpen size={22} />}
          title="Manage Projects"
          text="View, edit, and track projects created by your organization."
          link="/dashboard/projects"
          buttonText="View My Projects"
        />

        <ActionCard
          icon={<Search size={22} />}
          title="Browse Profiles"
          text="Invite volunteers, students, and mentors to collaborate."
          link="/dashboard/profiles"
          buttonText="Browse Profiles"
        />

        <ActionCard
          icon={<LayoutGrid size={22} />}
          title="My Workspaces"
          text="Access active collaborations and stay engaged in ongoing projects."
          link="/dashboard/workspaces"
          buttonText="View Workspaces"
        />

        <ActionCard
          icon={<Shield size={22} />}
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

// NEW MODERN UI UPDATE — icon prop now accepts ReactNode (Lucide icon) instead of emoji string
function Stat({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
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
// NEW MODERN UI UPDATE — icon prop now accepts ReactNode (Lucide icon) instead of emoji string
function Quick({ icon, text, link }: { icon: React.ReactNode; text: string; link: string }) {
  return (
    <Link href={link} className={styles.quickItem}>
      <div className={styles.quickIcon}>{icon}</div>
      <span>{text}</span>
    </Link>
  );
}

function ProjectStatusChart({
  active,
  completed,
  loading,
}: {
  active: number;
  completed: number;
  loading: boolean;
}) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Mini KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>

        {/* Active */}
        <div style={{
          position: "relative", overflow: "hidden",
          background: "linear-gradient(135deg, rgba(16,185,129,0.10), rgba(16,185,129,0.03))",
          border: "1.5px solid rgba(16,185,129,0.22)",
          borderRadius: 14, padding: "14px 14px 12px",
        }}>
          <div style={{ position: "absolute", top: 10, right: 10, color: "rgba(16,185,129,0.28)" }}>
            <FolderOpen size={18} />
          </div>
          <div style={{ fontSize: 34, fontWeight: 800, color: "#059669", lineHeight: 1, marginBottom: 6 }}>
            {loading ? "—" : active}
          </div>
          <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Active Projects
          </div>
        </div>

        {/* Completed */}
        <div style={{
          position: "relative", overflow: "hidden",
          background: "linear-gradient(135deg, rgba(99,142,203,0.10), rgba(99,142,203,0.03))",
          border: "1.5px solid rgba(99,142,203,0.22)",
          borderRadius: 14, padding: "14px 14px 12px",
        }}>
          <div style={{ position: "absolute", top: 10, right: 10, color: "rgba(99,142,203,0.28)" }}>
            <CheckSquare size={18} />
          </div>
          <div style={{ fontSize: 34, fontWeight: 800, color: "#395886", lineHeight: 1, marginBottom: 6 }}>
            {loading ? "—" : completed}
          </div>
          <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Completed
          </div>
        </div>
      </div>

      {/* Area Chart */}
      <div style={{
        flex: 1, minHeight: 90, borderRadius: 14, overflow: "hidden",
        position: "relative", background: "rgba(99,142,203,0.03)",
        border: "1px solid rgba(99,142,203,0.09)",
      }}>
        <svg
          viewBox="0 0 300 90"
          preserveAspectRatio="none"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
        >
          <defs>
            <linearGradient id="orgAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#638ECB" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#638ECB" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          <path
            d="M0 72 C25 68, 45 52, 70 54 C95 56, 110 36, 140 28 C165 21, 185 38, 210 26 C232 15, 258 30, 300 20 L300 90 L0 90 Z"
            fill="url(#orgAreaGrad)"
          />
          <path
            d="M0 72 C25 68, 45 52, 70 54 C95 56, 110 36, 140 28 C165 21, 185 38, 210 26 C232 15, 258 30, 300 20"
            fill="none"
            stroke="#638ECB"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="300" cy="20" r="3.5" fill="#638ECB" />
          <circle cx="300" cy="20" r="6" fill="rgba(99,142,203,0.22)" />
        </svg>
      </div>

    </div>
  );
}

// NEW MODERN UI UPDATE — icon prop now accepts ReactNode (Lucide icon) instead of emoji string
function ActionCard({
  icon,
  title,
  text,
  progress,
  link,
  buttonText,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  progress?: number;
  link: string;
  buttonText: string;
}) {
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