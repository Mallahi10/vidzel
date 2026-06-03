"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Download, ArrowLeft, Inbox, CheckCircle } from "lucide-react";

const C = {
  navy:    "#1e3a5f",
  deep:    "#395886",
  primary: "#638ECB",
  soft:    "#8AAEE0",
  light:   "#B1C9EF",
  pale:    "#D5DEEF",
  bg:      "#F0F3FA",
  muted:   "#64748b",
  text:    "#0f172a",
};

type CertData = {
  id:                 string;
  user_name:          string | null;
  project_title:      string | null;
  role:               string | null;
  organization_email: string | null;
  issued_at:          string;
};

export default function CertificatePage() {
  const { projectId } = useParams() as { projectId: string };
  const { user } = useAuth();

  const [cert,        setCert]        = useState<CertData | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [notFound,    setNotFound]    = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);

  /* Fetch full name from the role-specific profile table */
  useEffect(() => {
    if (!user) return;
    const tableMap: Record<string, { table: string; col: string }> = {
      student:      { table: "student_profiles",     col: "full_name" },
      trainee:      { table: "trainee_profiles",      col: "full_name" },
      mentor:       { table: "mentor_profiles",       col: "full_name" },
      volunteer:    { table: "volunteer_profiles",    col: "full_name" },
      organization: { table: "organization_profiles", col: "organization_name" },
    };
    const mapping = tableMap[user.role as string];
    if (!mapping) return;
    supabase
      .from(mapping.table)
      .select(mapping.col)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const row = data as Record<string, string> | null;
        if (row?.[mapping.col]) setProfileName(row[mapping.col]);
      });
  }, [user?.id]);

  useEffect(() => {
    if (!user || !projectId) return;
    supabase
      .from("certificates")
      .select("id, user_name, project_title, role, organization_email, issued_at")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) setNotFound(true);
        else       setCert(data as unknown as CertData);
        setLoading(false);
      });
  }, [user?.id, projectId]);

  const handlePrint = () => window.print();

  if (!user)   return <Wrap><p style={{ color: C.muted }}>Please log in.</p></Wrap>;
  if (loading) return <Wrap><p style={{ color: C.muted, textAlign: "center" }}>Loading…</p></Wrap>;

  if (notFound || !cert) {
    return (
      <Wrap>
        <div style={{ textAlign: "center", padding: "48px 24px", background: "white", borderRadius: 20, border: `1px solid ${C.pale}`, maxWidth: 460, boxShadow: "0 4px 20px rgba(57,88,134,0.08)" }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: C.primary }}>
            <Inbox size={28} />
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: "0 0 8px" }}>Certificate not available yet</h3>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.65, margin: "0 0 22px" }}>
            This certificate will appear once the organization marks the project as completed.
          </p>
          <Link href="/dashboard/certificates" style={{ display: "inline-block", background: `linear-gradient(135deg,${C.deep},${C.primary})`, color: "white", padding: "10px 22px", borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            ← Back to Certificates
          </Link>
        </div>
      </Wrap>
    );
  }

  const issuedDate      = cert.issued_at
    ? new Date(cert.issued_at).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
  const participantName = profileName || cert.user_name || user.email || "Participant";
  const projectTitle    = cert.project_title || "Project";
  const orgName         = cert.organization_email || "Vidzel Organization";
  const role            = cert.role ? cert.role.charAt(0).toUpperCase() + cert.role.slice(1) : "Member";

  return (
    <>
      <style>{`
        @page {
          size: A4 landscape;
          margin: 0;
        }
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * { visibility: hidden !important; }
          .cert-card, .cert-card * { visibility: visible !important; }
          .cert-card {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            max-width: unset !important;
            margin: 0 !important;
            padding: 32px 48px !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            animation: none !important;
            overflow: visible !important;
            box-sizing: border-box !important;
          }
          .no-print { display: none !important; }
        }
        @keyframes certIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: C.bg, padding: "28px 20px", fontFamily: "system-ui,-apple-system,'Inter',sans-serif" }}>

        {/* Action bar */}
        <div className="no-print" style={{ maxWidth: 900, margin: "0 auto 22px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <Link href="/dashboard/certificates" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.primary, fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
            <ArrowLeft size={14} /> My Certificates
          </Link>
          {/* Single Download PDF button — uses browser print → save as PDF */}
          <button
            onClick={handlePrint}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: `linear-gradient(135deg,${C.deep},${C.primary})`, color: "white", border: "none", padding: "10px 22px", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 14px rgba(99,142,203,0.35)" }}
          >
            <Download size={15} /> Download PDF
          </button>
        </div>

        {/* ══ CERTIFICATE CARD ══ */}
        <div
          className="cert-card"
          style={{
            maxWidth: 900,
            margin: "0 auto",
            background: "white",
            borderRadius: 20,
            overflow: "hidden",
            position: "relative",
            boxShadow: "0 16px 50px rgba(57,88,134,0.13), 0 0 0 1px rgba(57,88,134,0.06)",
            animation: "certIn 0.45s ease both",
            minHeight: 480,
          }}
        >
          {/* ── Geometric shapes — top right ── */}
          <div style={{ position: "absolute", top: 0, right: 0, width: 280, height: 260, pointerEvents: "none", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -55, right: -55, width: 230, height: 230, borderRadius: 44, background: `linear-gradient(135deg, ${C.pale}, #eef2fa)`, transform: "rotate(20deg)" }} />
            <div style={{ position: "absolute", top: -22, right: -22, width: 178, height: 178, borderRadius: 32, background: `linear-gradient(135deg, ${C.light}, ${C.pale})`, transform: "rotate(12deg)" }} />
            <div style={{ position: "absolute", top: 22, right: 22, width: 116, height: 116, borderRadius: 22, background: `linear-gradient(135deg, ${C.soft}, ${C.light})`, transform: "rotate(5deg)" }} />
          </div>

          {/* ── Geometric shapes — bottom left ── */}
          <div style={{ position: "absolute", bottom: 0, left: 0, width: 230, height: 200, pointerEvents: "none", overflow: "hidden" }}>
            <div style={{ position: "absolute", bottom: -55, left: -55, width: 210, height: 210, borderRadius: 44, background: `linear-gradient(135deg, ${C.pale}, #eef2fa)`, transform: "rotate(-22deg)" }} />
            <div style={{ position: "absolute", bottom: -15, left: -15, width: 150, height: 150, borderRadius: 28, background: `linear-gradient(135deg, ${C.soft}, ${C.light})`, transform: "rotate(-10deg)" }} />
          </div>

          {/* ── Main content ── */}
          <div style={{ position: "relative", zIndex: 1, padding: "44px 64px 40px" }}>

            {/* Logo row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
              {/* Diamond icon */}
              <svg width="20" height="20" viewBox="0 0 20 20">
                <polygon points="10,1 19,10 10,19 1,10" fill={C.deep} />
                <polygon points="10,4 16,10 10,16 4,10" fill="white" />
              </svg>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.deep, letterSpacing: "0.06em" }}>VIDZEL</p>
                <p style={{ margin: 0, fontSize: 9, color: C.muted, letterSpacing: "0.04em" }}>Virtual Impact & Development Zone</p>
              </div>
            </div>

            {/* Certificate title */}
            <h1 style={{ margin: "0 0 4px", fontSize: 58, fontWeight: 800, color: C.deep, letterSpacing: "-0.03em", lineHeight: 1 }}>
              Certificate
            </h1>
            <p style={{ margin: "0 0 24px", fontSize: 12, fontWeight: 700, color: C.primary, letterSpacing: "0.22em", textTransform: "uppercase" }}>
              Of Participation
            </p>

            {/* Divider */}
            <div style={{ height: 1, background: `linear-gradient(90deg, ${C.pale}, transparent)`, marginBottom: 22, width: "70%" }} />

            {/* Presented to */}
            <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.18em", textTransform: "uppercase" }}>
              This certificate is presented to
            </p>

            {/* Participant name */}
            <h2 style={{ margin: "0 0 14px", fontSize: 36, fontWeight: 800, color: C.deep, letterSpacing: "-0.02em" }}>
              {participantName}
            </h2>

            {/* Description */}
            <p style={{ margin: "0 0 6px", fontSize: 13.5, color: C.muted, lineHeight: 1.7, maxWidth: 520 }}>
              For successfully completing the project{" "}
              <strong style={{ color: C.text }}>&ldquo;{projectTitle}&rdquo;</strong>
              {" "}on the Vidzel Collaborative Impact Platform.
              This achievement demonstrates commitment, collaboration, and excellence.
            </p>

            {/* Role + org */}
            <p style={{ margin: "0 0 30px", fontSize: 12, color: C.light, letterSpacing: "0.04em" }}>
              {role} &nbsp;·&nbsp; {orgName}
            </p>

            {/* Divider */}
            <div style={{ height: 1, background: C.pale, marginBottom: 24, width: "100%" }} />

            {/* Footer row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>

              {/* Date */}
              <div>
                <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: "0.01em" }}>
                  {issuedDate.toUpperCase()}
                </p>
                <p style={{ margin: 0, fontSize: 9.5, fontWeight: 700, color: C.muted, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                  Date
                </p>
              </div>

              {/* Signature */}
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: C.text, fontStyle: "italic" }}>
                  Vidzel Platform
                </p>
                <p style={{ margin: 0, fontSize: 9.5, fontWeight: 700, color: C.muted, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                  Signature
                </p>
              </div>
            </div>
          </div>

          {/* ── Verified badge — absolute right center ── */}
          <div style={{
            position: "absolute",
            right: 52,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}>
            {/* Outer ring */}
            <div style={{
              width: 88, height: 88,
              borderRadius: "50%",
              border: `2.5px solid ${C.deep}`,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              background: "white",
              boxShadow: `0 6px 20px rgba(57,88,134,0.16), 0 0 0 5px rgba(57,88,134,0.06)`,
              padding: 8,
            }}>
              {/* Inner ring */}
              <div style={{
                width: "100%", height: "100%",
                borderRadius: "50%",
                border: `1px solid ${C.soft}`,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 3,
              }}>
                <CheckCircle size={18} color={C.deep} strokeWidth={2.5} />
                <p style={{ margin: 0, fontSize: 6.5, fontWeight: 800, color: C.deep, letterSpacing: "0.1em", textAlign: "center", lineHeight: 1.4 }}>
                  VERIFIED<br />VIDZEL
                </p>
              </div>
            </div>
            {/* Stars row */}
            <div style={{ display: "flex", gap: 3 }}>
              {[0,1,2,3,4].map(i => (
                <svg key={i} width="8" height="8" viewBox="0 0 10 10">
                  <polygon points="5,1 6.2,4 9.5,4 7,6.2 8,9.5 5,7.5 2,9.5 3,6.2 0.5,4 3.8,4" fill={C.primary} />
                </svg>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#F0F3FA", padding: "48px 20px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui,-apple-system,'Inter',sans-serif" }}>
      {children}
    </div>
  );
}
