"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import styles from "./student.module.css";
import { supabase } from "@/lib/supabaseClient";
// NEW MODERN UI UPDATE — Lucide icons replace emoji icons
import {
  FileText,
  BookOpen,
  Clock,
  GraduationCap,
  Timer,
  Search,
  ClipboardList,
  LayoutGrid,
  Mail,
  Award,
  FolderOpen,
  CheckSquare,
} from "lucide-react";

export default function StudentDashboard() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState({ applications: 0, activeProjects: 0, pendingReviews: 0, completedProjects: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [appsRes, activeProjRes, pendingRes, completedRes] = await Promise.all([
        supabase.from("applications").select("id", { count: "exact", head: true }).eq("applicant_id", user.id),
        supabase.from("workspace_members").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "active"),
        supabase.from("submissions").select("id", { count: "exact", head: true }).eq("submitted_by", user.id).eq("status", "pending"),
        supabase.from("workspace_members").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "completed"),
      ]);
      setStats({
        applications:      appsRes.count      ?? 0,
        activeProjects:    activeProjRes.count ?? 0,
        pendingReviews:    pendingRes.count    ?? 0,
        completedProjects: completedRes.count  ?? 0,
      });
    })();
  }, [user?.id]);

  if (loading) return null;
  if (!user) return <div className={styles.wrapper}>Please log in.</div>;
  if (user.role !== "student")
    return <div className={styles.wrapper}>Access denied.</div>;

  return (
    <div className={styles.wrapper}>
      {/* ================= HERO ================= */}
      <div className={styles.hero}>
        <div>
          <h1>Welcome back</h1>
          <p>
            Track your learning journey, project contributions, and skill
            development.
          </p>
          <span className={styles.roleBadge}>Student Dashboard</span>
        </div>

        <div className={styles.heroButtons}>
          <Link href="/dashboard/explore">
            <button className={styles.primaryBtn}>Explore Projects</button>
          </Link>

          <Link href="/dashboard/student/profile">
            <button className={styles.secondaryBtn}>
              View &amp; Edit Profile
            </button>
          </Link>
        </div>
      </div>

      {/* ================= STATS ================= */}
      {/* NEW MODERN UI UPDATE — Lucide icons replace emojis: 📄→FileText, 📚→BookOpen, ⏳→Clock, 🎓→GraduationCap, ⏱️→Timer */}
      <div className={styles.statsBar}>
        <Stat icon={<FileText size={20} />}      title="Applications"   value={String(stats.applications)}   />
        <Stat icon={<BookOpen size={20} />}      title="Active Projects" value={String(stats.activeProjects)}  />
        <Stat icon={<Clock size={20} />}         title="Pending Reviews" value={String(stats.pendingReviews)} />
        <Stat icon={<GraduationCap size={20} />} title="Certificates"   value="–" />
        <Stat icon={<Timer size={20} />}         title="Impact Hours"   value="–" />
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
          <Activity text="Completed Research Task" />
          <Activity text="Received Mentor Feedback" />
        </div>

        {/* Quick Actions */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Quick Actions</h3>
          </div>

          {/* NEW MODERN UI UPDATE — added Lucide icons to Quick items */}
          <Quick icon={<Search size={18} />} text="Browse Projects" link="/dashboard/explore" />
          <Quick icon={<ClipboardList size={18} />} text="View Applications" link="/dashboard/my-applications" />
          <Quick icon={<LayoutGrid size={18} />} text="My Workspaces" link="/dashboard/workspaces" />
          {/* AJOUTÉ [Étape 3] : lien vers la page des invitations reçues */}
          <Quick icon={<Mail size={18} />} text="My Invitations" link="/dashboard/invitations" />
          <Quick icon={<Award size={18} />} text="Certificates" link="/dashboard/certificates" />
        </div>

        {/* Contribution Status */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Contribution Status</h3>
          </div>
          <ContributionChart active={stats.activeProjects} completed={stats.completedProjects} />
        </div>
      </div>

      {/* ================= BOTTOM GRID ================= */}
      {/* NEW MODERN UI UPDATE — added Lucide icons to ActionCards */}
      <div className={styles.bottomGrid}>
        <ActionCard
          icon={<Search size={22} />}
          title="Explore Projects"
          text="Find new impact opportunities aligned with your interests."
          link="/dashboard/explore"
          buttonText="Browse Projects"
        />

        <ActionCard
          icon={<ClipboardList size={22} />}
          title="My Applications"
          text="Track your project applications and status updates."
          link="/dashboard/my-applications"
          buttonText="View Applications"
        />

        <ActionCard
          icon={<LayoutGrid size={22} />}
          title="My Workspaces"
          text="Access active collaborations and team discussions."
          link="/dashboard/workspaces"
          buttonText="View Workspaces"
        />

        <ActionCard
          icon={<Award size={22} />}
          title="Certificates"
          text="View your earned certificates and achievements."
          link="/dashboard/certificates"
          buttonText="View Certificates"
        />
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

// NEW MODERN UI UPDATE — icon prop accepts ReactNode (Lucide icon)
function Stat({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className={styles.statItem}>
      <div className={styles.statIcon}>{icon}</div>
      <div>
        <p className={styles.statTitle}>{title}</p>
        <h4 className={styles.statValue}>{value}</h4>
      </div>
    </div>
  );
}

function Activity({ text }: { text: string }) {
  return (
    <div className={styles.activityItem}>
      <div className={styles.avatar}></div>
      <p className={styles.activityText}>{text}</p>
    </div>
  );
}

// NEW MODERN UI UPDATE — icon prop added (was text-only before)
function Quick({ icon, text, link }: { icon: React.ReactNode; text: string; link: string }) {
  return (
    <Link href={link} className={styles.quickItem}>
      <div className={styles.quickIcon}>{icon}</div>
      <span className={styles.quickText}>{text}</span>
    </Link>
  );
}

function ContributionChart({ active, completed }: { active: number; completed: number }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Mini KPI grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {/* Active */}
        <div style={{
          position: "relative",
          background: "linear-gradient(135deg, rgba(16,185,129,0.10), rgba(16,185,129,0.03))",
          border: "1.5px solid rgba(16,185,129,0.22)",
          borderRadius: 14,
          padding: "12px 12px 10px",
        }}>
          <div style={{ position: "absolute", top: 10, right: 10, color: "rgba(16,185,129,0.35)" }}>
            <FolderOpen size={15} />
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#059669", lineHeight: 1, marginBottom: 4 }}>
            {active}
          </div>
          <div style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.06em" }}>
            Active
          </div>
        </div>
        {/* Completed */}
        <div style={{
          position: "relative",
          background: "linear-gradient(135deg, rgba(99,142,203,0.10), rgba(99,142,203,0.03))",
          border: "1.5px solid rgba(99,142,203,0.22)",
          borderRadius: 14,
          padding: "12px 12px 10px",
        }}>
          <div style={{ position: "absolute", top: 10, right: 10, color: "rgba(99,142,203,0.35)" }}>
            <CheckSquare size={15} />
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#395886", lineHeight: 1, marginBottom: 4 }}>
            {completed}
          </div>
          <div style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.06em" }}>
            Completed
          </div>
        </div>
      </div>

      {/* Area chart */}
      <div style={{ flex: 1, minHeight: 70, borderRadius: 12, overflow: "hidden", position: "relative", background: "rgba(99,142,203,0.03)" }}>
        <svg viewBox="0 0 300 70" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="stuAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#638ECB" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#638ECB" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          <path
            d="M0 55 C30 52, 50 38, 80 40 C110 42, 130 28, 160 25 C190 22, 210 32, 240 20 C265 12, 285 15, 300 10 L300 70 L0 70 Z"
            fill="url(#stuAreaGrad)"
          />
          <path
            d="M0 55 C30 52, 50 38, 80 40 C110 42, 130 28, 160 25 C190 22, 210 32, 240 20 C265 12, 285 15, 300 10"
            fill="none" stroke="#638ECB" strokeWidth="2" strokeLinecap="round"
          />
          <circle cx="300" cy="10" r="3.5" fill="#638ECB" />
        </svg>
      </div>
    </div>
  );
}

// NEW MODERN UI UPDATE — icon prop added (ActionCard had no icon before)
function ActionCard({
  icon,
  title,
  text,
  link,
  buttonText,
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
          <button className={styles.secondaryBtn}>
            {buttonText} →
          </button>
        </Link>
      </div>
    </div>
  );
}
