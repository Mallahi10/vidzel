"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Button from "@/components/Button";
import { supabase } from "@/lib/supabaseClient";
import { ClipboardList, Clock, CheckCircle, XCircle, ExternalLink, Inbox } from "lucide-react";

/* ================= TYPES ================= */
type Submission = {
  id: string;
  workspace_id: string;
  submitted_by: string;
  title: string;
  description: string | null;
  link: string | null;
  feedback_status: "pending" | "approved" | "rejected" | null;
  feedback: string | null;
  created_at: string;
  profiles?: { email?: string; role?: string } | null;
};

type WorkspaceInfo = {
  id: string;
  title: string;
};

/* ================= PAGE ================= */
export default function MentorSubmissionsPage() {
  const { user, loading } = useAuth();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [workspaces,  setWorkspaces]  = useState<WorkspaceInfo[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "mentor") return;

    (async () => {
      // Step 1 — workspaces where this mentor is an active member
      const { data: memberships } = await supabase
        .from("workspace_members")
        .select("workspace_id, workspaces(id, title)")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (!memberships || memberships.length === 0) {
        setLoadingSubs(false);
        return;
      }

      const wsIds = memberships.map((m: any) => m.workspace_id);
      const wsInfo: WorkspaceInfo[] = memberships.map((m: any) => ({
        id:    m.workspace_id,
        title: m.workspaces?.title || "Workspace",
      }));
      setWorkspaces(wsInfo);

      // Step 2 — all submissions in those workspaces, newest first
      const { data: subs } = await supabase
        .from("submissions")
        .select("*, profiles!submitted_by(email, role)")
        .in("workspace_id", wsIds)
        .order("created_at", { ascending: false });

      setSubmissions(subs || []);
      setLoadingSubs(false);
    })();
  }, [user?.id]);

  if (loading) return null;
  if (!user) return <div style={{ padding:"3rem" }}>Please log in.</div>;
  if (user.role !== "mentor") return <div style={{ padding:"3rem" }}>Access denied.</div>;

  const wsMap = new Map(workspaces.map((w) => [w.id, w.title]));

  const pending   = submissions.filter((s) => !s.feedback_status || s.feedback_status === "pending");
  const reviewed  = submissions.filter((s) => s.feedback_status === "approved" || s.feedback_status === "rejected");

  return (
    <div style={{ padding:"28px 32px", maxWidth:1100, margin:"0 auto" }}>

      {/* ===== HERO ===== */}
      <div style={{
        background:"radial-gradient(circle,rgba(255,255,255,0.09) 1px,transparent 1px),linear-gradient(135deg,#1e3a5f 0%,#395886 40%,#638ECB 80%,#8AAEE0 100%)",
        backgroundSize:"22px 22px,100% 100%",
        borderRadius:24, padding:"32px 36px", marginBottom:28,
        boxShadow:"0 8px 32px rgba(57,88,134,0.28)",
        position:"relative", overflow:"hidden",
      }}>
        <div style={{ position:"absolute", top:-50, right:-50, width:220, height:220, borderRadius:"50%", background:"rgba(255,255,255,0.07)", pointerEvents:"none" }} />
        <h1 style={{ fontSize:28, fontWeight:700, color:"white", margin:"0 0 6px" }}>Review Submissions</h1>
        <p style={{ fontSize:14, color:"rgba(255,255,255,0.82)", margin:"0 0 12px", lineHeight:1.5 }}>
          Submissions from participants in your active workspaces.
        </p>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <span style={{
            display:"inline-flex", alignItems:"center", gap:6,
            background:"rgba(255,255,255,0.18)", color:"white",
            padding:"5px 14px", borderRadius:999, fontSize:12, fontWeight:700,
            border:"1px solid rgba(255,255,255,0.30)", backdropFilter:"blur(4px)",
          }}>
            <Clock size={12} /> {pending.length} Pending
          </span>
          <span style={{
            display:"inline-flex", alignItems:"center", gap:6,
            background:"rgba(255,255,255,0.10)", color:"rgba(255,255,255,0.82)",
            padding:"5px 14px", borderRadius:999, fontSize:12, fontWeight:600,
            border:"1px solid rgba(255,255,255,0.20)",
          }}>
            {reviewed.length} Reviewed
          </span>
        </div>
      </div>

      {/* ===== LOADING ===== */}
      {loadingSubs && (
        <div style={{ textAlign:"center", padding:"60px 20px", color:"#94a3b8", fontSize:14 }}>
          Loading submissions…
        </div>
      )}

      {/* ===== EMPTY STATE ===== */}
      {!loadingSubs && submissions.length === 0 && (
        <div style={{
          textAlign:"center", padding:"60px 20px",
          background:"linear-gradient(160deg,#F0F3FA 0%,white 50%)",
          borderRadius:22, border:"1.5px solid rgba(99,142,203,0.14)",
          boxShadow:"0 4px 18px rgba(99,142,203,0.08)",
        }}>
          <div style={{
            width:72, height:72, borderRadius:20,
            background:"linear-gradient(135deg,rgba(99,142,203,0.10),rgba(138,174,224,0.08))",
            display:"flex", alignItems:"center", justifyContent:"center",
            margin:"0 auto 18px", color:"#638ECB",
          }}>
            <Inbox size={36} />
          </div>
          <h3 style={{ fontSize:18, fontWeight:700, color:"#0f172a", margin:"0 0 8px" }}>No submissions yet</h3>
          <p style={{ fontSize:14, color:"#64748b", margin:"0 0 24px", maxWidth:360, marginLeft:"auto", marginRight:"auto" }}>
            When participants submit their work in your workspaces, they&apos;ll appear here.
          </p>
          <Link href="/dashboard/workspaces">
            <Button variant="secondary">View My Workspaces</Button>
          </Link>
        </div>
      )}

      {/* ===== PENDING SECTION ===== */}
      {!loadingSubs && pending.length > 0 && (
        <section style={{ marginBottom:32 }}>
          <h2 style={{
            fontSize:16, fontWeight:700, color:"#0f172a",
            margin:"0 0 14px", display:"flex", alignItems:"center", gap:8,
          }}>
            <span style={{
              display:"inline-flex", alignItems:"center", gap:5,
              background:"rgba(249,115,22,0.10)", color:"#c2410c",
              border:"1px solid rgba(249,115,22,0.25)",
              borderRadius:999, padding:"3px 12px", fontSize:12, fontWeight:700,
            }}>
              <Clock size={12} /> Awaiting Review
            </span>
          </h2>

          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {pending.map((sub) => (
              <SubmissionCard key={sub.id} sub={sub} wsTitle={wsMap.get(sub.workspace_id) || "Workspace"} />
            ))}
          </div>
        </section>
      )}

      {/* ===== REVIEWED SECTION ===== */}
      {!loadingSubs && reviewed.length > 0 && (
        <section>
          <h2 style={{
            fontSize:16, fontWeight:700, color:"#0f172a",
            margin:"0 0 14px", display:"flex", alignItems:"center", gap:8,
          }}>
            <span style={{
              display:"inline-flex", alignItems:"center", gap:5,
              background:"rgba(16,185,129,0.10)", color:"#059669",
              border:"1px solid rgba(16,185,129,0.22)",
              borderRadius:999, padding:"3px 12px", fontSize:12, fontWeight:700,
            }}>
              <CheckCircle size={12} /> Reviewed
            </span>
          </h2>

          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {reviewed.map((sub) => (
              <SubmissionCard key={sub.id} sub={sub} wsTitle={wsMap.get(sub.workspace_id) || "Workspace"} />
            ))}
          </div>
        </section>
      )}

      {/* Back link */}
      <div style={{ marginTop:28 }}>
        <Link href="/dashboard/mentor" style={{ color:"#638ECB", fontWeight:600, fontSize:14, textDecoration:"none" }}>
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

/* ================= SUBMISSION CARD ================= */
function SubmissionCard({ sub, wsTitle }: { sub: Submission; wsTitle: string }) {
  const statusColor = {
    pending:  { bg:"rgba(249,115,22,0.08)",   text:"#c2410c",  border:"rgba(249,115,22,0.22)" },
    approved: { bg:"rgba(16,185,129,0.08)",   text:"#059669",  border:"rgba(16,185,129,0.22)" },
    rejected: { bg:"rgba(220,38,38,0.08)",    text:"#dc2626",  border:"rgba(220,38,38,0.22)"  },
  };

  const s = statusColor[sub.feedback_status || "pending"] || statusColor.pending;
  const submitterEmail = sub.profiles?.email || "Unknown";
  const submitterRole  = sub.profiles?.role  || "";
  const dateStr = sub.created_at
    ? new Date(sub.created_at).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })
    : "—";

  return (
    <div style={{
      background:"linear-gradient(160deg,#F0F3FA 0%,white 50%)",
      borderRadius:18, padding:"18px 22px",
      boxShadow:"0 4px 14px rgba(99,142,203,0.08)",
      border:"1.5px solid rgba(99,142,203,0.12)",
      display:"flex", gap:16, alignItems:"flex-start", flexWrap:"wrap",
    }}>
      {/* Icon */}
      <div style={{
        width:44, height:44, borderRadius:12, flexShrink:0,
        background:"linear-gradient(135deg,#395886,#638ECB)",
        display:"flex", alignItems:"center", justifyContent:"center",
        color:"white", boxShadow:"0 3px 10px rgba(99,142,203,0.32)",
      }}>
        <ClipboardList size={20} />
      </div>

      {/* Content */}
      <div style={{ flex:1, minWidth:200 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8, marginBottom:6 }}>
          <h3 style={{ fontSize:15, fontWeight:700, color:"#0f172a", margin:0 }}>
            {sub.title || "Untitled Submission"}
          </h3>
          <span style={{
            display:"inline-flex", alignItems:"center", gap:5,
            background:s.bg, color:s.text, border:`1px solid ${s.border}`,
            borderRadius:999, padding:"3px 12px", fontSize:12, fontWeight:700, flexShrink:0,
          }}>
            {sub.feedback_status === "approved" && <CheckCircle size={11} />}
            {sub.feedback_status === "rejected" && <XCircle size={11} />}
            {(!sub.feedback_status || sub.feedback_status === "pending") && <Clock size={11} />}
            {sub.feedback_status
              ? sub.feedback_status.charAt(0).toUpperCase() + sub.feedback_status.slice(1)
              : "Pending"}
          </span>
        </div>

        <div style={{ display:"flex", gap:14, flexWrap:"wrap", fontSize:13, color:"#64748b", marginBottom: sub.description ? 8 : 0 }}>
          <span>By <strong style={{ color:"#0f172a" }}>{submitterEmail}</strong>{submitterRole && ` · ${submitterRole}`}</span>
          <span>Workspace: <strong style={{ color:"#0f172a" }}>{wsTitle}</strong></span>
          <span>{dateStr}</span>
        </div>

        {sub.description && (
          <p style={{ fontSize:13, color:"#475569", margin:"8px 0 0", lineHeight:1.5, maxWidth:600 }}>
            {sub.description}
          </p>
        )}

        {sub.feedback && (
          <div style={{
            marginTop:10, padding:"10px 14px", borderRadius:10,
            background:"rgba(99,142,203,0.06)", border:"1px solid rgba(99,142,203,0.12)",
            fontSize:13, color:"#395886",
          }}>
            <strong>Feedback:</strong> {sub.feedback}
          </div>
        )}

        {/* External link */}
        {sub.link && (
          <a href={sub.link} target="_blank" rel="noopener noreferrer" style={{
            display:"inline-flex", alignItems:"center", gap:5, marginTop:10,
            color:"#638ECB", fontSize:13, fontWeight:600, textDecoration:"none",
          }}>
            <ExternalLink size={13} /> View Submission Link
          </a>
        )}
      </div>

      {/* Open workspace button */}
      <div style={{ flexShrink:0 }}>
        <Link href={`/dashboard/workspaces/${sub.workspace_id}`}>
          <Button variant="outline" style={{ fontSize:13 }}>Open Workspace →</Button>
        </Link>
      </div>
    </div>
  );
}
