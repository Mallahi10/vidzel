"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Award, CheckCircle, Download, ArrowLeft, Inbox } from "lucide-react";

/* ── Palette ── */
const C = {
  navy:    "#1e3a5f",
  deep:    "#395886",
  primary: "#638ECB",
  soft:    "#8AAEE0",
  border:  "#D5DEEF",
  bg:      "#F0F3FA",
  muted:   "#64748b",
  text:    "#0f172a",
};

type CertData = {
  id:                 string;
  user_name:          string | null;
  role:               string | null;
  organization_email: string | null;
  issued_at:          string;
  projects:           { title: string | null } | null;
};

export default function CertificatePage() {
  const { projectId } = useParams() as { projectId: string };
  const { user }      = useAuth();
  const printRef      = useRef<HTMLDivElement>(null);

  const [cert,     setCert]     = useState<CertData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!user || !projectId) return;
    supabase
      .from("certificates")
      .select("id, user_name, role, organization_email, issued_at, projects(title)")
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

  /* ── Guards ── */
  if (!user)   return <Wrap><p style={{ color: C.muted }}>Please log in.</p></Wrap>;
  if (loading) return <Wrap><p style={{ color: C.muted, textAlign: "center" }}>Loading…</p></Wrap>;

  if (notFound || !cert) {
    return (
      <Wrap>
        <div style={{ textAlign: "center", padding: "48px 24px", background: "linear-gradient(160deg,#F0F3FA 0%,white 50%)", borderRadius: 22, border: `1.5px solid ${C.border}`, maxWidth: 480, margin: "0 auto" }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg,rgba(99,142,203,0.10),rgba(138,174,224,0.08))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: C.primary }}>
            <Inbox size={30} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: "0 0 8px" }}>Certificate not available yet</h3>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.65, margin: "0 0 24px", maxWidth: 340, marginLeft: "auto", marginRight: "auto" }}>
            This certificate will appear once the organization marks the project as completed.
          </p>
          <Link href="/dashboard/certificates" style={{ display: "inline-block", background: `linear-gradient(135deg,${C.deep},${C.primary})`, color: "white", padding: "10px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            ← Back to Certificates
          </Link>
        </div>
      </Wrap>
    );
  }

  const issuedDate = cert.issued_at
    ? new Date(cert.issued_at).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });

  const participantName = cert.user_name || user.email;
  const projectTitle    = cert.projects?.title || "Project";
  const orgEmail        = cert.organization_email || "Vidzel Organization";
  const role            = cert.role ? cert.role.charAt(0).toUpperCase() + cert.role.slice(1) : "Member";

  return (
    <>
      {/* Print-only hide nav */}
      <style>{`
        @media print {
          body > *:not(#cert-print-root) { display: none !important; }
          #cert-print-root { position: fixed; inset: 0; z-index: 9999; background: white; }
          .no-print { display: none !important; }
          .cert-card { box-shadow: none !important; }
        }
        @keyframes certFadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div id="cert-print-root" style={{ minHeight: "100vh", background: C.bg, padding: "32px 20px", fontFamily: "system-ui,-apple-system,'Inter',sans-serif" }}>

        {/* Action bar */}
        <div className="no-print" style={{ maxWidth: 860, margin: "0 auto 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <Link href="/dashboard/certificates" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: C.primary, fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
            <ArrowLeft size={15} /> My Certificates
          </Link>
          <div style={{ display: "flex", gap: 10 }}>
            {/* Download PDF (server-generated) */}
            <a
              href={`/api/certificates/pdf?projectId=${projectId}&userId=${user.id}`}
              download
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: `linear-gradient(135deg,${C.deep},${C.primary})`, color: "white", textDecoration: "none", padding: "10px 22px", borderRadius: 10, fontWeight: 600, fontSize: 14, boxShadow: "0 4px 14px rgba(99,142,203,0.35)" }}
            >
              <Download size={15} /> Download PDF
            </a>
            {/* Print browser version */}
            <button
              onClick={handlePrint}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "white", color: C.deep, border: `1.5px solid ${C.border}`, padding: "10px 18px", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer" }}
            >
              Print
            </button>
          </div>
        </div>

        {/* ══ CERTIFICATE CARD ══ */}
        <div
          ref={printRef}
          className="cert-card"
          style={{
            maxWidth: 860,
            margin: "0 auto",
            background: "white",
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(57,88,134,0.14), 0 0 0 1px rgba(57,88,134,0.07)",
            animation: "certFadeIn 0.5s ease both",
          }}
        >
          {/* Top gradient banner */}
          <div style={{
            background: `radial-gradient(circle,rgba(255,255,255,0.09) 1px,transparent 1px), linear-gradient(135deg,${C.navy} 0%,${C.deep} 45%,${C.primary} 80%,${C.soft} 100%)`,
            backgroundSize: "22px 22px, 100% 100%",
            padding: "40px 56px 36px",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Decorative circles */}
            <div style={{ position: "absolute", top: -60, right: -60, width: 260, height: 260, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -40, left: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

            <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              <div>
                <p style={{ margin: "0 0 4px", fontSize: 13, color: "rgba(255,255,255,0.60)", letterSpacing: "0.10em", textTransform: "uppercase", fontWeight: 600 }}>Certificate of Participation</p>
                <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>Vidzel</h1>
              </div>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", backdropFilter: "blur(4px)" }}>
                <Award size={26} />
              </div>
            </div>
          </div>

          {/* Certificate body */}
          <div style={{ padding: "52px 56px 48px" }}>

            {/* This certifies that */}
            <p style={{ fontSize: 13, color: C.muted, textTransform: "uppercase", letterSpacing: "0.10em", fontWeight: 600, margin: "0 0 10px", textAlign: "center" }}>
              This certifies that
            </p>

            {/* Participant name */}
            <h2 style={{
              fontSize: 40, fontWeight: 800, color: C.deep,
              letterSpacing: "-0.025em", textAlign: "center",
              margin: "0 0 8px",
              borderBottom: `2px solid ${C.border}`,
              paddingBottom: 20,
            }}>
              {participantName}
            </h2>

            <p style={{ fontSize: 15, color: C.muted, textAlign: "center", margin: "20px 0 6px" }}>
              has successfully participated in
            </p>

            {/* Project title */}
            <h3 style={{ fontSize: 24, fontWeight: 700, color: C.text, textAlign: "center", margin: "0 0 36px", letterSpacing: "-0.02em" }}>
              "{projectTitle}"
            </h3>

            {/* Metadata grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 40 }}>
              <MetaBox label="Role" value={role} color={C.primary} />
              <MetaBox label="Organization" value={orgEmail} color="#0891B2" />
              <MetaBox label="Date Issued" value={issuedDate} color="#059669" />
            </div>

            {/* Validation message */}
            <div style={{
              background: `linear-gradient(135deg,rgba(57,88,134,0.04),rgba(99,142,203,0.03))`,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: "20px 28px",
              textAlign: "center",
              marginBottom: 40,
            }}>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.75, margin: 0, fontStyle: "italic" }}>
                "This certificate is awarded in recognition of active contribution, commitment, and successful completion of all project requirements on the Vidzel Collaborative Impact Platform."
              </p>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, paddingTop: 24, borderTop: `1px solid ${C.border}` }}>
              <div>
                <p style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px", fontWeight: 600 }}>Issued by</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.deep, margin: 0 }}>Vidzel Platform</p>
                <p style={{ fontSize: 12, color: C.muted, margin: "2px 0 0" }}>Virtual Impact &amp; Development Zone</p>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.20)", borderRadius: 999, padding: "7px 16px" }}>
                <CheckCircle size={14} color="#059669" />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#059669", letterSpacing: "0.04em" }}>VERIFIED · VIDZEL</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}

/* ── MetaBox sub-component ── */
function MetaBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      background: C.bg,
      border: `1.5px solid ${C.border}`,
      borderTop: `3px solid ${color}`,
      borderRadius: 14,
      padding: "16px 18px",
      textAlign: "center",
    }}>
      <p style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, margin: "0 0 6px" }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0, wordBreak: "break-word" }}>{value}</p>
    </div>
  );
}

/* ── Page wrapper ── */
function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "48px 24px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui,-apple-system,'Inter',sans-serif" }}>
      {children}
    </div>
  );
}
