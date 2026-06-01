"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Button from "@/components/Button";
import styles from "./trainee.module.css";
import { supabase } from "@/lib/supabaseClient";
import {
  getTraineeDashboardStats,
  getTraineeProfile,
  calculateProfileScore,
  type TraineeDashboardStats,
} from "@/lib/traineeService";
import {
  Briefcase,
  FileText,
  CalendarCheck,
  ListTodo,
  Search,
  ClipboardList,
  User,
  LayoutGrid,
  Rocket,
  ChevronRight,
  X,
  FolderOpen,
  CheckSquare,
} from "lucide-react";

/* ============================================================
   ONBOARDING STEPS — shown until profile is complete
============================================================ */
type OnboardingStep = {
  label: string;
  done: boolean;
  href: string;
};

export default function TraineeDashboard() {
  const { user, loading } = useAuth();

  const [stats, setStats] = useState<TraineeDashboardStats>({
    offersAvailable: 0,
    applicationsSent: 0,
    interviewsPending: 0,
    tasksAssigned: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [profileScore, setProfileScore] = useState(0);
  const [cvUploaded, setCvUploaded] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [recentApps, setRecentApps] = useState<
    { org_name: string; title: string; status: string; created_at: string }[]
  >([]);

  useEffect(() => {
    if (!user || user.role !== "trainee") return;

    const load = async () => {
      const [statsData, profileData] = await Promise.all([
        getTraineeDashboardStats(user.id),
        getTraineeProfile(user.id),
      ]);

      setStats(statsData);
      if (profileData) {
        setProfileScore(calculateProfileScore(profileData));
        setCvUploaded(Boolean(profileData.cv_url));
      }

      // Recent applications — 2-step fetch (no join, avoids PostgREST schema cache issues)
      const { data: appRows } = await supabase
        .from("trainee_applications")
        .select("created_at, status, offer_id")
        .eq("trainee_id", user.id)
        .order("created_at", { ascending: false })
        .limit(4);

      if (appRows && appRows.length > 0) {
        const offerIds = appRows.map((a: { offer_id: string }) => a.offer_id);
        const { data: offerRows } = await supabase
          .from("internship_offers")
          .select("id, title, org_name")
          .in("id", offerIds);

        const offerMap: Record<string, { title: string; org_name: string }> =
          Object.fromEntries(
            (offerRows ?? []).map((o: { id: string; title: string; org_name: string }) => [o.id, o])
          );

        setRecentApps(
          appRows.map((a: { offer_id: string; status: string; created_at: string }) => ({
            org_name: offerMap[a.offer_id]?.org_name ?? "—",
            title:    offerMap[a.offer_id]?.title    ?? "—",
            status:   a.status,
            created_at: a.created_at,
          }))
        );
      }

      setLoadingStats(false);
    };

    load();
  }, [user?.id]);

  if (loading) return null;
  if (!user) return <div className={styles.wrapper}>Please log in.</div>;
  if (user.role !== "trainee")
    return <div className={styles.wrapper}>Access denied.</div>;

  const onboardingSteps: OnboardingStep[] = [
    {
      label: "Complete your profile",
      done: profileScore >= 80,
      href: "/dashboard/trainee/profile",
    },
    {
      label: "Upload your CV",
      done: cvUploaded,
      href: "/dashboard/trainee/profile",
    },
    {
      label: "Explore your first offer",
      done: stats.applicationsSent > 0,
      href: "/dashboard/trainee/offers",
    },
  ];

  const allOnboardingDone = onboardingSteps.every((s) => s.done);
  const showOnboarding = !allOnboardingDone && !onboardingDismissed;

  const val = (n: number) => (loadingStats ? "—" : String(n));

  return (
    <div className={styles.wrapper}>

      {/* ── ONBOARDING BANNER ── */}
      {showOnboarding && (
        <div className={styles.onboarding}>
          <div className={styles.onboardingLeft}>
            <Rocket size={20} className={styles.onboardingIcon} />
            <div>
              <p className={styles.onboardingTitle}>Welcome to Vidzel Trainee! 🎉</p>
              <p className={styles.onboardingSubtitle}>
                Complete these steps to start applying.
              </p>
            </div>
          </div>
          <div className={styles.onboardingSteps}>
            {onboardingSteps.map((step) => (
              <Link
                key={step.label}
                href={step.href}
                className={`${styles.onboardingStep} ${step.done ? styles.onboardingStepDone : ""}`}
              >
                <span className={styles.onboardingCheck}>
                  {step.done ? "✓" : "○"}
                </span>
                {step.label}
              </Link>
            ))}
          </div>
          <button
            className={styles.onboardingClose}
            onClick={() => setOnboardingDismissed(true)}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── HERO ── */}
      <div className={styles.hero}>
        <div>
          <h1>Welcome back</h1>
          <p>Manage your applications, explore internship offers and track your missions.</p>
          <span className={styles.roleBadge}>Trainee Dashboard</span>
        </div>
        <div className={styles.heroButtons}>
          <Link href="/dashboard/trainee/offers">
            <Button>Explore Offers</Button>
          </Link>
          <Link href="/dashboard/trainee/profile">
            <Button variant="outline">My Profile</Button>
          </Link>
        </div>
      </div>

      {/* ── STATS BAR ── */}
      <div className={styles.statsBar}>
        <Stat
          icon={<Briefcase size={20} />}
          title="Available Offers"
          value={val(stats.offersAvailable)}
        />
        <Stat
          icon={<FileText size={20} />}
          title="Applications Sent"
          value={val(stats.applicationsSent)}
        />
        <Stat
          icon={<CalendarCheck size={20} />}
          title="Pending Interviews"
          value={val(stats.interviewsPending)}
        />
        <Stat
          icon={<ListTodo size={20} />}
          title="Assigned Tasks"
          value={val(stats.tasksAssigned)}
        />
        <Stat
          icon={<User size={20} />}
          title="Profile Completion"
          value={loadingStats ? "—" : `${profileScore}%`}
        />
      </div>

      {/* ── MAIN GRID ── */}
      <div className={styles.mainGrid}>

        {/* Recent Activity */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Recent Activity</h3>
            <Link href="/dashboard/trainee/applications" className={styles.viewLink}>
              View all →
            </Link>
          </div>
          {loadingStats ? (
            <p style={{ color: "#94a3b8", fontSize: 14 }}>Loading…</p>
          ) : recentApps.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 14 }}>
              No applications yet.
            </p>
          ) : (
            recentApps.map((app, i) => (
              <div key={i} className={styles.activityItem}>
                <div className={styles.avatar} />
                <p className={styles.activityText}>
                  <strong>{app.org_name}</strong> — {app.title}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Quick Access</h3>
          </div>
          <Quick icon={<Search size={18} />} text="Explore Offers" link="/dashboard/trainee/offers" />
          <Quick icon={<ClipboardList size={18} />} text="My Applications" link="/dashboard/trainee/applications" />
          <Quick icon={<User size={18} />} text="My Profile" link="/dashboard/trainee/profile" />
          <Quick icon={<LayoutGrid size={18} />} text="My Workspaces" link="/dashboard/workspaces" />
          <Quick icon={<ListTodo size={18} />} text="Notifications" link="/notifications" />
        </div>

        {/* Applications Chart */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>My Applications</h3>
          </div>
          <ApplicationChart
            sent={loadingStats ? 0 : stats.applicationsSent}
            interviews={loadingStats ? 0 : stats.interviewsPending}
            loading={loadingStats}
          />
        </div>
      </div>

      {/* ── BOTTOM GRID ── */}
      <div className={styles.bottomGrid}>
        <ActionCard
          icon={<Search size={22} />}
          title="Explore Offers"
          text="Discover all available internship offers and apply in just a few clicks."
          link="/dashboard/trainee/offers"
          buttonText="View Offers"
        />
        <ActionCard
          icon={<ClipboardList size={22} />}
          title="My Applications"
          text="Track the progress of all your applications and their status in real time."
          link="/dashboard/trainee/applications"
          buttonText="View Applications"
        />
        <ActionCard
          icon={<LayoutGrid size={22} />}
          title="My Workspaces"
          text="Access the collaborative spaces for your ongoing internships."
          link="/dashboard/workspaces"
          buttonText="View Workspaces"
        />
        <ActionCard
          icon={<User size={22} />}
          title="My Profile"
          text="Profile completed at"
          progress={profileScore}
          link="/dashboard/trainee/profile"
          buttonText="Complete Profile"
        />
      </div>
    </div>
  );
}

/* ============================================================
   SUB-COMPONENTS
============================================================ */

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

function Quick({ icon, text, link }: { icon: React.ReactNode; text: string; link: string }) {
  return (
    <Link href={link} className={styles.quickItem}>
      <div className={styles.quickIcon}>{icon}</div>
      <span className={styles.quickText}>{text}</span>
    </Link>
  );
}

function ApplicationChart({
  sent,
  interviews,
  loading,
}: {
  sent: number;
  interviews: number;
  loading: boolean;
}) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{
          position: "relative",
          background: "linear-gradient(135deg, rgba(14,165,233,0.10), rgba(14,165,233,0.03))",
          border: "1.5px solid rgba(14,165,233,0.22)",
          borderRadius: 14,
          padding: "12px 12px 10px",
        }}>
          <div style={{ position: "absolute", top: 10, right: 10, color: "rgba(14,165,233,0.35)" }}>
            <FolderOpen size={15} />
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#0284C7", lineHeight: 1, marginBottom: 4 }}>
            {loading ? "—" : sent}
          </div>
          <div style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.06em" }}>
            Sent
          </div>
        </div>
        <div style={{
          position: "relative",
          background: "linear-gradient(135deg, rgba(16,185,129,0.10), rgba(16,185,129,0.03))",
          border: "1.5px solid rgba(16,185,129,0.22)",
          borderRadius: 14,
          padding: "12px 12px 10px",
        }}>
          <div style={{ position: "absolute", top: 10, right: 10, color: "rgba(16,185,129,0.35)" }}>
            <CheckSquare size={15} />
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#059669", lineHeight: 1, marginBottom: 4 }}>
            {loading ? "—" : interviews}
          </div>
          <div style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.06em" }}>
            Interviews
          </div>
        </div>
      </div>

      <div style={{
        flex: 1, minHeight: 70, borderRadius: 12, overflow: "hidden",
        position: "relative", background: "rgba(14,165,233,0.03)",
      }}>
        <svg viewBox="0 0 300 70" preserveAspectRatio="none"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="traineeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          <path
            d="M0 55 C30 52, 50 38, 80 40 C110 42, 130 28, 160 25 C190 22, 210 32, 240 20 C265 12, 285 15, 300 10 L300 70 L0 70 Z"
            fill="url(#traineeGrad)"
          />
          <path
            d="M0 55 C30 52, 50 38, 80 40 C110 42, 130 28, 160 25 C190 22, 210 32, 240 20 C265 12, 285 15, 300 10"
            fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round"
          />
          <circle cx="300" cy="10" r="3.5" fill="#0EA5E9" />
        </svg>
      </div>
    </div>
  );
}

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
        <p>{text}{typeof progress === "number" ? ` ${progress}%` : ""}</p>
        {typeof progress === "number" && (
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
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
