"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Button from "@/components/Button";
import styles from "./mentor.module.css";
// AJOUTÉ : Supabase pour stats dynamiques
import { supabase } from "@/lib/supabaseClient";
// NEW MODERN UI UPDATE — Lucide icons replace emoji icons
import {
  GraduationCap,
  FolderOpen,
  ClipboardList,
  CheckSquare,
  Timer,
  Search,
  LayoutGrid,
  BarChart3,
  Clock,
} from "lucide-react";

export default function MentorDashboard() {
  const { user, loading } = useAuth();

  // AJOUTÉ : vraies stats depuis Supabase
  const [stats, setStats] = useState({
    activeMentorships:  0,
    projectsSupported:  0,
    pendingReviews:     0,
    completedProjects:  0,
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Step 1 — récupérer les workspaces du mentor
      const { data: memberships } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id);

      const wsIds = (memberships || []).map((m: any) => m.workspace_id);

      const [activeRes, totalRes, completedRes, pendingRes] = await Promise.all([
        supabase.from("workspace_members").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "active"),
        supabase.from("workspace_members").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("workspace_members").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "completed"),
        wsIds.length > 0
          ? supabase.from("submissions").select("id", { count: "exact", head: true }).in("workspace_id", wsIds).eq("feedback_status", "pending")
          : Promise.resolve({ count: 0 }),
      ]);

      setStats({
        activeMentorships: activeRes.count   ?? 0,
        projectsSupported: totalRes.count    ?? 0,
        pendingReviews:    pendingRes.count  ?? 0,
        completedProjects: completedRes.count ?? 0,
      });
    })();
  }, [user?.id]);

  if (loading) return null;
  if (!user) return <div className={styles.wrapper}>Please log in.</div>;
  if (user.role !== "mentor")
    return <div className={styles.wrapper}>Access denied.</div>;

  return (
    <div className={styles.wrapper}>
      {/* HERO */}
      <div className={styles.hero}>
        <div>
          <h1>Welcome back</h1>
          <p>Support projects, guide participants, and track your impact.</p>
          <span className={styles.roleBadge}>Mentor Dashboard</span>
        </div>

        <div className={styles.heroButtons}>
          <Link href="/dashboard/explore">
            <Button>Explore Projects</Button>
          </Link>

          {/* FIX : variant="secondary" (fond blanc) pour être visible sur le hero sombre */}
          <Link href="/dashboard/mentor/profile">
            <Button variant="secondary">View &amp; Edit Profile</Button>
          </Link>
        </div>
      </div>

      {/* STATS — MODIFIÉ : valeurs dynamiques depuis Supabase */}
      <div className={styles.statsBar}>
        <Stat icon={<GraduationCap size={20} />} title="Active Mentorships"  value={String(stats.activeMentorships)} />
        <Stat icon={<FolderOpen size={20} />}    title="Projects Supported"  value={String(stats.projectsSupported)} />
        <Stat icon={<Clock size={20} />}          title="Pending Reviews"     value={String(stats.pendingReviews)} />
        <Stat icon={<CheckSquare size={20} />}   title="Completed Projects"  value={String(stats.completedProjects)} />
        <Stat icon={<Timer size={20} />}          title="Impact Hours"        value="—" />
      </div>

      {/* MAIN GRID */}
      <div className={styles.mainGrid}>
        {/* Recent Activity */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Recent Activity</h3>
            <span className={styles.viewLink}>View All →</span>
          </div>

          <Activity text="Provided feedback on Youth Leadership Project" />
          <Activity text="Joined Climate Action Initiative" />
          <Activity text="Reviewed Student Submission" />
          <Activity text="Completed Mentorship Session" />
        </div>

        {/* Quick Actions */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Quick Actions</h3>
          </div>

          <Quick icon={<Search size={18} />}       text="Browse Projects"      link="/dashboard/explore" />
          {/* MODIFIÉ : lien vers la vraie page Review Submissions du mentor */}
          <Quick icon={<ClipboardList size={18} />} text="Review Submissions"  link="/dashboard/mentor/submissions" />
          <Quick icon={<LayoutGrid size={18} />}    text="My Workspaces"       link="/dashboard/workspaces" />
          <Quick icon={<BarChart3 size={18} />}     text="Impact Overview"     link="/dashboard/mentor/impact" />
        </div>

        {/* Mentorship Status — MODIFIÉ : affiche les vraies stats */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Mentorship Status</h3>
          </div>

          <div className={styles.statusRow}>
            <span className={`${styles.statusBadge} ${styles.active}`}>Active · {stats.activeMentorships}</span>
            <span className={`${styles.statusBadge} ${styles.completed}`}>Completed · {stats.completedProjects}</span>
            <span className={`${styles.statusBadge} ${styles.pending}`}>Pending Reviews · {stats.pendingReviews}</span>
          </div>

          <div className={styles.chartMock}></div>
        </div>
      </div>

      {/* BOTTOM GRID */}
      <div className={styles.bottomGrid}>
        <ActionCard
          icon={<Search size={22} />}
          title="Browse Projects"
          text="Discover new projects to mentor."
          link="/dashboard/explore"
          buttonText="View Projects"
        />

        {/* MODIFIÉ : lien vers la page Review Submissions du mentor */}
        <ActionCard
          icon={<ClipboardList size={22} />}
          title="Review Submissions"
          text="View and provide feedback on workspace submissions."
          link="/dashboard/mentor/submissions"
          buttonText="Review Work"
        />

        <ActionCard
          icon={<LayoutGrid size={22} />}
          title="My Workspaces"
          text="Access active mentorship spaces."
          link="/dashboard/workspaces"
          buttonText="View Workspaces"
        />

        {/* MODIFIÉ : pointe vers la vraie page Impact Overview, non plus le profil */}
        <ActionCard
          icon={<BarChart3 size={22} />}
          title="Impact Overview"
          text="Track your mentoring contributions and profile score."
          link="/dashboard/mentor/impact"
          buttonText="View Impact"
        />
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

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

function Activity({ text }: { text: string }) {
  return (
    <div className={styles.activityItem}>
      <div className={styles.avatar}></div>
      <p>{text}</p>
    </div>
  );
}

function Quick({ icon, text, link }: { icon: React.ReactNode; text: string; link: string }) {
  return (
    <Link href={link} className={styles.quickItem}>
      <div className={styles.quickIcon}>{icon}</div>
      <span>{text}</span>
    </Link>
  );
}

function ActionCard({
  icon, title, text, link, buttonText,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  link: string;
  buttonText: string;
}) {
  return (
    <div className={styles.card}>
      <div>
        <div className={styles.actionIcon}>{icon}</div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>

      <div className={styles.cardButton}>
        <Link href={link}>
          <Button variant="outline">{buttonText} →</Button>
        </Link>
      </div>
    </div>
  );
}
