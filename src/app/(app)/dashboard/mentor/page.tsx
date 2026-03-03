"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Button from "@/components/Button";
import styles from "./mentor.module.css";

export default function MentorDashboard() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user)
    return <div className={styles.wrapper}>Please log in.</div>;

  if (user.role !== "mentor")
    return <div className={styles.wrapper}>Access denied.</div>;

  return (
    <div className={styles.wrapper}>
      {/* HERO */}
      <div className={styles.hero}>
        <div>
          <h1>Welcome back</h1>
          <p>
            Support projects, guide participants, and track your impact.
          </p>
          <span className={styles.roleBadge}>
            Mentor Dashboard
          </span>
        </div>

        <div className={styles.heroButtons}>
          <Link href="/dashboard/explore">
            <Button>Explore Projects</Button>
          </Link>

          <Link href="/dashboard/mentor/profile">
            <Button variant="outline">
              View & Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* STATS */}
      <div className={styles.statsBar}>
        <Stat
          icon="🧑‍🏫"
          title="Active Mentorships"
          value="4"
        />
        <Stat
          icon="📂"
          title="Projects Supported"
          value="6"
        />
        <Stat
          icon="📝"
          title="Reviews Submitted"
          value="12"
        />
        <Stat
          icon="✅"
          title="Completed Projects"
          value="3"
        />
        <Stat
          icon="⏱️"
          title="Impact Hours"
          value="84h"
        />
      </div>

      {/* MAIN GRID */}
      <div className={styles.mainGrid}>
        {/* Recent Activity */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Recent Activity</h3>
            <span className={styles.viewLink}>
              View All →
            </span>
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

          <Quick icon="🔎" text="Browse Projects" />
          <Quick icon="📝" text="Review Submissions" />
          <Quick icon="🗂️" text="My Workspaces" />
          <Quick icon="📊" text="Impact Overview" />
        </div>

        {/* Mentorship Status */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Mentorship Status</h3>
          </div>

          <div className={styles.statusRow}>
            <span className={styles.active}>
              Active 4
            </span>
            <span className={styles.completed}>
              Completed 3
            </span>
            <span className={styles.pending}>
              Pending 2
            </span>
          </div>

          <div className={styles.chartMock}></div>
        </div>
      </div>

      {/* BOTTOM GRID */}
      <div className={styles.bottomGrid}>
        <ActionCard
          icon="🔎"
          title="Browse Projects"
          text="Discover new projects to mentor."
          link="/dashboard/explore"
          buttonText="View Projects"
        />

        <ActionCard
          icon="📝"
          title="Review Submissions"
          text="Provide feedback to participants."
          link="/dashboard/applications"
          buttonText="Review Work"
        />

        <ActionCard
          icon="🗂️"
          title="My Workspaces"
          text="Access active mentorship spaces."
          link="/dashboard/workspaces"
          buttonText="View Workspaces"
        />

        {/* FIXED ROUTE HERE */}
        <ActionCard
          icon="📊"
          title="Impact Overview"
          text="Track your mentoring contributions."
          link="/dashboard/mentor/profile"
          buttonText="View Impact"
        />
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function Stat({
  icon,
  title,
  value,
}: {
  icon: string;
  title: string;
  value: string;
}) {
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

function Quick({
  icon,
  text,
}: {
  icon: string;
  text: string;
}) {
  return (
    <div className={styles.quickItem}>
      <div className={styles.quickIcon}>{icon}</div>
      <span>{text}</span>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  text,
  link,
  buttonText,
}: {
  icon: string;
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
          <Button variant="outline">
            {buttonText} →
          </Button>
        </Link>
      </div>
    </div>
  );
}