"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import styles from "./student.module.css";

export default function StudentDashboard() {
  const { user } = useAuth();

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
              View & Edit Profile
            </button>
          </Link>
        </div>
      </div>

      {/* ================= STATS ================= */}
      <div className={styles.statsBar}>
        <Stat icon="📄" title="Applications" value="6" />
        <Stat icon="📚" title="Active Projects" value="2" />
        <Stat icon="⏳" title="Pending Reviews" value="1" />
        <Stat icon="🎓" title="Certificates Earned" value="4" />
        <Stat icon="⏱️" title="Impact Hours" value="36h" />
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
          <h3>Quick Actions</h3>

          <Quick text="Browse Projects" link="/dashboard/explore" />
          <Quick text="View Applications" link="/dashboard/my-applications" />
          <Quick text="My Workspaces" link="/dashboard/workspaces" />
          <Quick text="Certificates" link="/dashboard/certificates" />
        </div>

        {/* Contribution Status */}
        <div className={styles.card}>
          <h3>Contribution Status</h3>

          <div className={styles.statusRow}>
            <span className={styles.active}>Active 2</span>
            <span className={styles.completed}>Completed 4</span>
            <span className={styles.pending}>Pending 1</span>
          </div>

          <div className={styles.chartMock}></div>
        </div>
      </div>

      {/* ================= BOTTOM GRID ================= */}
      <div className={styles.bottomGrid}>
        <ActionCard
          title="Explore Projects"
          text="Find new impact opportunities aligned with your interests."
          link="/dashboard/explore"
          buttonText="Browse Projects"
        />

        <ActionCard
          title="My Applications"
          text="Track your project applications and status updates."
          link="/dashboard/my-applications"
          buttonText="View Applications"
        />

        <ActionCard
          title="My Workspaces"
          text="Access active collaborations and team discussions."
          link="/dashboard/workspaces"
          buttonText="View Workspaces"
        />

        <ActionCard
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

/* 🔥 ONLY CHANGE IS HERE */
function Quick({
  text,
  link,
}: {
  text: string;
  link: string;
}) {
  return (
    <Link href={link} className={styles.quickItem}>
      <span className={styles.quickText}>{text}</span>
    </Link>
  );
}

function ActionCard({
  title,
  text,
  link,
  buttonText,
}: {
  title: string;
  text: string;
  link: string;
  buttonText: string;
}) {
  return (
    <div className={styles.card}>
      <div>
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