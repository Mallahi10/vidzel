"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Button from "@/components/Button";
import styles from "./volunteer.module.css";

export default function VolunteerDashboard() {
  const { user } = useAuth();

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
              View & Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* ================= STATS ================= */}
      <div className={styles.statsBar}>
        <Stat icon="📄" title="Applications" value="6" />
        <Stat icon="🗂️" title="Active Projects" value="2" />
        <Stat icon="⏳" title="Pending" value="1" />
        <Stat icon="✅" title="Completed" value="4" />
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
          <Activity text="Completed Workshop Task" />
          <Activity text="Workspace message posted" />
        </div>

        {/* Quick Actions */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Quick Actions</h3>
          </div>

          <Quick
            icon="🔎"
            text="Browse Projects"
            link="/dashboard/explore"
          />
          <Quick
            icon="📄"
            text="View Applications"
            link="/dashboard/my-applications"
          />
          <Quick
            icon="🗂️"
            text="My Workspaces"
            link="/dashboard/workspaces"
          />
          <Quick
            icon="📜"
            text="Certificates"
            link="/dashboard/certificates"
          />
        </div>

        {/* Contribution Status */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Contribution Status</h3>
          </div>

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
          icon="🔎"
          title="Explore Projects"
          text="Find new impact opportunities."
          link="/dashboard/explore"
          buttonText="Browse Projects"
        />

        <ActionCard
          icon="📄"
          title="My Applications"
          text="Track your project applications."
          link="/dashboard/my-applications"
          buttonText="View Applications"
        />

        <ActionCard
          icon="🗂️"
          title="My Workspaces"
          text="Access active collaborations."
          link="/dashboard/workspaces"
          buttonText="View Workspaces"
        />

        <ActionCard
          icon="📜"
          title="Certificates"
          text="View your earned certificates."
          link="/dashboard/certificates"
          buttonText="View Certificates"
        />

        <ActionCard
          icon="🧑"
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

function Activity({ text }: any) {
  return (
    <div className={styles.activityItem}>
      <div className={styles.avatar}></div>
      <p>{text}</p>
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

function ActionCard({ icon, title, text, link, buttonText }: any) {
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