"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Button from "@/components/Button";
import styles from "./organization.module.css";

export default function OrganizationDashboard() {
  const { user } = useAuth();

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
      <div className={styles.statsBar}>
        <Stat icon="📁" title="Active Projects" value="3" />
        <Stat icon="👥" title="Open Roles" value="12" />
        <Stat icon="🧑‍🤝‍🧑" title="Active Contributors" value="47" />
        <Stat icon="✅" title="Completed Tasks" value="146" />
        <Stat icon="📈" title="Impact Hours" value="210h" />
      </div>

      {/* MAIN GRID */}
      <div className={styles.mainGrid}>
        {/* Recent Activity */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Recent Activity</h3>
            <span className={styles.viewLink}>View All →</span>
          </div>

          <Activity name="Emily" action="joined Community Wellness Project" />
          <Activity name="Milestone" action="Workshop Planning completed" />
          <Activity name="John" action="applied to Youth Mentorship Program" />
          <Activity name="Alex R." action="updated a workspace" />
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
          <Quick
            icon="👤"
            text="Invite Contributor"
            link="/dashboard/profiles"
          />
          <Quick
            icon="📄"
            text="Review Applications"
            link="/dashboard/applications"
          />
          <Quick
            icon="🗂️"
            text="Create Workspace"
            link="/dashboard/workspaces/create"
          />
        </div>

        {/* Project Status */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Project Status</h3>
          </div>

          <div className={styles.statusRow}>
            <span className={styles.active}>Active 3</span>
            <span className={styles.needs}>Needs Contributors 2</span>
            <span className={styles.planning}>In Planning 1</span>
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