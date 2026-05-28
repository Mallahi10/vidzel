"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Button from "@/components/Button";
import { supabase } from "@/lib/supabaseClient";
import {
  GraduationCap,
  FolderOpen,
  CheckSquare,
  Clock,
  BarChart3,
  Users,
  TrendingUp,
  Award,
  ExternalLink,
} from "lucide-react";
import {
  loadMentorProfile,
  getEmptyMentorProfile,
} from "@/lib/localMentorProfiles";
import {
  calculateMentorProfileScore,
  getMentorProfileLevel,
} from "@/lib/mentorProfileScore";

/* ================= TYPES ================= */
type Workspace = {
  id: string;
  title: string;
  status: string;
};

/* ================= PAGE ================= */
export default function MentorImpactPage() {
  const { user, loading } = useAuth();

  const [stats, setStats] = useState({
    activeMentorships: 0,
    totalProjects:     0,
    completedProjects: 0,
    pendingReviews:    0,
  });
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [profileScore, setProfileScore] = useState(0);
  const [profileLevel, setProfileLevel] = useState("");
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Profile score — from Supabase
    loadMentorProfile(user.id).then((p) => {
      const profile = p || getEmptyMentorProfile();
      const s = calculateMentorProfileScore(profile);
      setProfileScore(s);
      setProfileLevel(getMentorProfileLevel(s));
    });

    // Supabase stats
    (async () => {
      const { data: memberships } = await supabase
        .from("workspace_members")
        .select("workspace_id, status, workspaces(id, title, status)")
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
        activeMentorships: activeRes.count    ?? 0,
        totalProjects:     totalRes.count     ?? 0,
        completedProjects: completedRes.count ?? 0,
        pendingReviews:    pendingRes.count   ?? 0,
      });

      // Recent workspaces
      const ws: Workspace[] = (memberships || []).map((m: any) => ({
        id:     m.workspace_id,
        title:  m.workspaces?.title  || "Workspace",
        status: m.workspaces?.status || m.status || "active",
      })).slice(0, 6);
      setWorkspaces(ws);

      setLoadingData(false);
    })();
  }, [user?.id]);

  if (loading) return null;
  if (!user) return <div style={{ padding: "3rem" }}>Please log in.</div>;
  if (user.role !== "mentor") return <div style={{ padding: "3rem" }}>Access denied.</div>;

  const completionRate = stats.totalProjects > 0
    ? Math.round((stats.completedProjects / stats.totalProjects) * 100)
    : 0;

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100, margin: "0 auto" }}>

      {/* ===== HERO ===== */}
      <div style={{
        background: "radial-gradient(circle,rgba(255,255,255,0.09) 1px,transparent 1px),linear-gradient(135deg,#1e3a5f 0%,#395886 40%,#638ECB 80%,#8AAEE0 100%)",
        backgroundSize: "22px 22px,100% 100%",
        borderRadius: 24, padding: "32px 36px", marginBottom: 28,
        boxShadow: "0 8px 32px rgba(57,88,134,0.28)",
        position: "relative", overflow: "hidden",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 18,
      }}>
        <div style={{ position: "absolute", top: -50, right: -50, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "white", margin: "0 0 6px" }}>Impact Overview</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.82)", margin: "0 0 12px", lineHeight: 1.5 }}>
            Your mentoring contributions and activity across Vidzel.
          </p>
          <span style={{
            display: "inline-block", background: "rgba(255,255,255,0.18)", color: "white",
            padding: "5px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700,
            border: "1px solid rgba(255,255,255,0.30)", backdropFilter: "blur(4px)",
          }}>
            Mentor Dashboard
          </span>
        </div>
        <Link href="/dashboard/mentor/profile" style={{ position: "relative", zIndex: 1 }}>
          <Button variant="secondary">Edit Profile →</Button>
        </Link>
      </div>

      {/* ===== STAT CARDS ===== */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 24 }}>
        <StatCard icon={<GraduationCap size={22} />} label="Active Mentorships" value={loadingData ? "—" : String(stats.activeMentorships)} color="#638ECB" gradFrom="#395886" gradTo="#638ECB" shadow="rgba(99,142,203,0.38)" />
        <StatCard icon={<FolderOpen size={22} />}    label="Projects Supported"  value={loadingData ? "—" : String(stats.totalProjects)}     color="#7C3AED" gradFrom="#6D28D9" gradTo="#7C3AED" shadow="rgba(124,58,237,0.35)" />
        <StatCard icon={<CheckSquare size={22} />}   label="Completed Projects"  value={loadingData ? "—" : String(stats.completedProjects)} color="#059669" gradFrom="#047857" gradTo="#059669" shadow="rgba(5,150,105,0.35)" />
        <StatCard icon={<Clock size={22} />}          label="Pending Reviews"     value={loadingData ? "—" : String(stats.pendingReviews)}    color="#D97706" gradFrom="#B45309" gradTo="#D97706" shadow="rgba(180,83,9,0.35)" />
      </div>

      {/* ===== TWO-COLUMN ROW ===== */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

        {/* Profile Strength */}
        <div style={{
          background: "linear-gradient(160deg,#F0F3FA 0%,white 50%)",
          borderRadius: 22, padding: 24,
          boxShadow: "0 4px 18px rgba(99,142,203,0.08)",
          border: "1.5px solid rgba(99,142,203,0.14)", borderTop: "3px solid #638ECB",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#395886,#638ECB)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", boxShadow: "0 3px 10px rgba(99,142,203,0.35)" }}>
              <Award size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>Profile Strength</h3>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{profileLevel || "Incomplete"}</p>
            </div>
          </div>

          {/* Score display */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <span style={{
              fontSize: 40, fontWeight: 800, lineHeight: 1,
              background: "linear-gradient(135deg,#638ECB,#8AAEE0)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              {profileScore}%
            </span>
            <Link href="/dashboard/mentor/profile" style={{ fontSize: 13, color: "#638ECB", fontWeight: 600, textDecoration: "none" }}>
              Complete Profile →
            </Link>
          </div>

          {/* Progress bar */}
          <div style={{ height: 10, borderRadius: 999, background: "rgba(99,142,203,0.10)", overflow: "hidden", marginBottom: 14 }}>
            <div style={{
              height: "100%", borderRadius: 999,
              background: "linear-gradient(90deg,#395886,#638ECB,#8AAEE0)",
              width: `${profileScore}%`, transition: "width 0.8s ease",
              boxShadow: "0 0 10px rgba(138,174,224,0.35)",
            }} />
          </div>

          <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
            A stronger profile improves your visibility and project matching quality.
          </p>
        </div>

        {/* Completion Rate */}
        <div style={{
          background: "linear-gradient(160deg,rgba(5,150,105,0.06) 0%,white 55%)",
          borderRadius: 22, padding: 24,
          boxShadow: "0 4px 18px rgba(99,142,203,0.08)",
          border: "1.5px solid rgba(99,142,203,0.14)", borderTop: "3px solid #059669",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#047857,#059669)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", boxShadow: "0 3px 10px rgba(5,150,105,0.35)" }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>Project Completion</h3>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{stats.completedProjects} of {stats.totalProjects} projects</p>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <span style={{ fontSize: 40, fontWeight: 800, lineHeight: 1, color: "#059669" }}>
              {loadingData ? "—" : `${completionRate}%`}
            </span>
            <Link href="/dashboard/workspaces" style={{ fontSize: 13, color: "#638ECB", fontWeight: 600, textDecoration: "none" }}>
              View Workspaces →
            </Link>
          </div>

          <div style={{ height: 10, borderRadius: 999, background: "rgba(5,150,105,0.10)", overflow: "hidden", marginBottom: 14 }}>
            <div style={{
              height: "100%", borderRadius: 999,
              background: "linear-gradient(90deg,#047857,#059669,#34D399)",
              width: `${completionRate}%`, transition: "width 0.8s ease",
              boxShadow: "0 0 10px rgba(52,211,153,0.30)",
            }} />
          </div>

          <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
            Completion rate across all mentorship projects you have participated in.
          </p>
        </div>
      </div>

      {/* ===== ACTIVE WORKSPACES ===== */}
      {workspaces.length > 0 && (
        <div style={{
          background: "linear-gradient(160deg,#F0F3FA 0%,white 50%)",
          borderRadius: 22, padding: 24,
          boxShadow: "0 4px 18px rgba(99,142,203,0.08)",
          border: "1.5px solid rgba(99,142,203,0.14)", borderTop: "3px solid #7C3AED",
          marginBottom: 24,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#6D28D9,#7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", boxShadow: "0 3px 10px rgba(124,58,237,0.35)" }}>
                <Users size={20} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>My Workspaces</h3>
            </div>
            <Link href="/dashboard/workspaces" style={{ fontSize: 13, color: "#638ECB", fontWeight: 600, textDecoration: "none" }}>
              View All →
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {workspaces.map((ws) => (
              <Link key={ws.id} href={`/dashboard/workspaces/${ws.id}`} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 16px", borderRadius: 14,
                background: "rgba(99,142,203,0.03)", border: "1px solid rgba(99,142,203,0.10)",
                textDecoration: "none", transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(99,142,203,0.08)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(99,142,203,0.03)"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#6D28D9,#7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
                    <BarChart3 size={16} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{ws.title}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 999,
                    background: ws.status === "completed" ? "rgba(5,150,105,0.10)" : "rgba(99,142,203,0.10)",
                    color: ws.status === "completed" ? "#059669" : "#395886",
                    border: ws.status === "completed" ? "1px solid rgba(5,150,105,0.22)" : "1px solid rgba(99,142,203,0.20)",
                  }}>
                    {ws.status === "completed" ? "Completed" : "Active"}
                  </span>
                  <ExternalLink size={14} color="#94a3b8" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ===== QUICK ACTIONS ===== */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>
        <Link href="/dashboard/mentor/submissions" style={{ textDecoration: "none" }}>
          <div style={{
            padding: "16px 20px", borderRadius: 16,
            background: "rgba(245,158,11,0.05)", border: "1.5px solid rgba(245,158,11,0.18)",
            display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
            transition: "background 0.2s ease",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(245,158,11,0.10)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(245,158,11,0.05)"; }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#B45309,#D97706)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
              <Clock size={20} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0 }}>Review Submissions</p>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{stats.pendingReviews} pending review{stats.pendingReviews !== 1 ? "s" : ""}</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/explore" style={{ textDecoration: "none" }}>
          <div style={{
            padding: "16px 20px", borderRadius: 16,
            background: "rgba(99,142,203,0.05)", border: "1.5px solid rgba(99,142,203,0.18)",
            display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
            transition: "background 0.2s ease",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(99,142,203,0.10)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(99,142,203,0.05)"; }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#395886,#638ECB)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
              <FolderOpen size={20} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0 }}>Explore Projects</p>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Discover new projects to mentor</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Back link */}
      <Link href="/dashboard/mentor" style={{ color: "#638ECB", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
        ← Back to Dashboard
      </Link>
    </div>
  );
}

/* ================= STAT CARD COMPONENT ================= */
function StatCard({ icon, label, value, color, gradFrom, gradTo, shadow }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  gradFrom: string;
  gradTo: string;
  shadow: string;
}) {
  return (
    <div style={{
      background: "linear-gradient(160deg,#F0F3FA 0%,white 55%)",
      borderRadius: 20, padding: "20px 22px",
      boxShadow: "0 4px 16px rgba(99,142,203,0.08)",
      border: "1.5px solid rgba(99,142,203,0.14)",
      borderTop: `3px solid ${color}`,
      display: "flex", alignItems: "center", gap: 16,
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14, flexShrink: 0,
        background: `linear-gradient(135deg,${gradFrom},${gradTo})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "white", boxShadow: `0 4px 14px ${shadow}`,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 4px", fontWeight: 500 }}>{label}</p>
        <h4 style={{ fontSize: 28, fontWeight: 800, margin: 0, color, lineHeight: 1 }}>{value}</h4>
      </div>
    </div>
  );
}
