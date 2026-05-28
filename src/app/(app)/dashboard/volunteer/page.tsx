"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Button from "@/components/Button";
import styles from "./volunteer.module.css";
// AJOUTÉ : Supabase pour stats dynamiques (même pattern que student dashboard)
import { supabase } from "@/lib/supabaseClient";
// NEW MODERN UI UPDATE — Lucide icons replace emoji icons
import {
  FileText,
  LayoutGrid,
  Clock,
  CheckSquare,
  Timer,
  Search,
  Award,
  User,
} from "lucide-react";

export default function VolunteerDashboard() {
  const { user, loading } = useAuth();

  // AJOUTÉ : vraies stats depuis Supabase
  const [stats, setStats] = useState({ applications: 0, activeProjects: 0, pending: 0, completed: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [appsRes, activeRes, pendingRes, completedRes] = await Promise.all([
        supabase.from("applications").select("id", { count: "exact", head: true }).eq("applicant_id", user.id),
        supabase.from("workspace_members").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "active"),
        supabase.from("applications").select("id", { count: "exact", head: true }).eq("applicant_id", user.id).eq("status", "pending"),
        supabase.from("workspace_members").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "completed"),
      ]);
      setStats({
        applications:   appsRes.count    ?? 0,
        activeProjects: activeRes.count  ?? 0,
        pending:        pendingRes.count ?? 0,
        completed:      completedRes.count ?? 0,
      });
    })();
  }, [user?.id]);

  if (loading) return null;
  if (!user) return <div className={styles.wrapper}>Please log in.</div>;
  if (user.role !== "volunteer")
    return <div className={styles.wrapper}>Access denied.</div>;

  return (
    <div className={styles.wrapper}>
      {/* ================= HERO ================= */}
      <div className={styles.hero}>
        <div>
          <h1>Welcome back</h1>
          <p>Track your applications, projects, and contributions.</p>
          <span className={styles.roleBadge}>Volunteer Dashboard</span>
        </div>

        <div className={styles.heroButtons}>
          <Link href="/dashboard/explore">
            <Button>Explore Projects</Button>
          </Link>

          <Link href="/dashboard/volunteer/profile">
            <Button variant="secondary">
              View &amp; Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* ================= STATS ================= */}
      {/* MODIFIÉ : valeurs dynamiques depuis Supabase — plus de chiffres statiques */}
      <div className={styles.statsBar}>
        <Stat icon={<FileText size={20} />}    title="Applications"    value={String(stats.applications)} />
        <Stat icon={<LayoutGrid size={20} />}  title="Active Projects"  value={String(stats.activeProjects)} />
        <Stat icon={<Clock size={20} />}       title="Pending"          value={String(stats.pending)} />
        <Stat icon={<CheckSquare size={20} />} title="Completed"        value={String(stats.completed)} />
        <Stat icon={<Timer size={20} />}       title="Impact Hours"     value="—" />
      </div>

      {/* ================= MAIN GRID ================= */}
      <div className={styles.mainGrid}>
        {/* Recent Activity */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Recent Activity</h3>
            <span className={styles.viewLink}>View All →</span>
          </div>

          <Activity text="Applied to Youth Mentorship Program" />
          <Activity text="Joined Community Wellness Project" />
          <Activity text="Completed Workshop Task" />
          <Activity text="Workspace message posted" />
        </div>

        {/* Quick Actions */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Quick Actions</h3>
          </div>

          <Quick icon={<Search size={18} />}    text="Browse Projects"    link="/dashboard/explore" />
          <Quick icon={<FileText size={18} />}  text="View Applications"  link="/dashboard/my-applications" />
          <Quick icon={<LayoutGrid size={18} />} text="My Workspaces"     link="/dashboard/workspaces" />
          <Quick icon={<Award size={18} />}     text="Certificates"       link="/dashboard/certificates" />
        </div>

        {/* Contribution Status — MODIFIÉ : affiche les vraies stats dynamiques */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Contribution Status</h3>
          </div>

          <div className={styles.statusRow}>
            <span className={`${styles.statusBadge} ${styles.active}`}>Active · {stats.activeProjects}</span>
            <span className={`${styles.statusBadge} ${styles.completed}`}>Completed · {stats.completed}</span>
            <span className={`${styles.statusBadge} ${styles.pending}`}>Pending · {stats.pending}</span>
          </div>

          <div className={styles.chartMock}></div>
        </div>
      </div>

      {/* ================= BOTTOM GRID ================= */}
      <div className={styles.bottomGrid}>
        <ActionCard
          icon={<Search size={22} />}
          title="Explore Projects"
          text="Find new impact opportunities."
          link="/dashboard/explore"
          buttonText="Browse Projects"
        />

        <ActionCard
          icon={<FileText size={22} />}
          title="My Applications"
          text="Track your project applications."
          link="/dashboard/my-applications"
          buttonText="View Applications"
        />

        <ActionCard
          icon={<LayoutGrid size={22} />}
          title="My Workspaces"
          text="Access active collaborations."
          link="/dashboard/workspaces"
          buttonText="View Workspaces"
        />

        <ActionCard
          icon={<Award size={22} />}
          title="Certificates"
          text="View your earned certificates."
          link="/dashboard/certificates"
          buttonText="View Certificates"
        />

        <ActionCard
          icon={<User size={22} />}
          title="Volunteer Profile"
          text="Complete and manage your profile to improve matching."
          link="/dashboard/volunteer/profile"
          buttonText="Complete Your Profile"
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

function ActionCard({ icon, title, text, link, buttonText }: {
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
          <Button variant="secondary">
            {buttonText} →
          </Button>
        </Link>
      </div>
    </div>
  );
}
