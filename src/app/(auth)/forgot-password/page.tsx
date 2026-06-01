"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const C = {
  bg:      "#F4F7FA",
  deep:    "#395886",
  navy:    "#1e3a5f",
  primary: "#638ECB",
  soft:    "#8AAEE0",
  border:  "#D5DEEF",
  text:    "#1e293b",
  muted:   "#94A3B8",
  error:   "#ef4444",
};

function Field({
  label, type, placeholder, value, onChange, required = false,
}: {
  label: string; type: string; placeholder: string;
  value: string; onChange: (v: string) => void; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{
        display: "block", fontSize: "11px", fontWeight: 600,
        letterSpacing: "0.07em", textTransform: "uppercase" as const,
        color: focused ? C.primary : C.muted,
        marginBottom: "6px", transition: "color 0.18s",
      }}>
        {label}
      </label>
      <input
        type={type} placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={{
          width: "100%", padding: "11px 14px", borderRadius: "10px",
          border: `1.5px solid ${focused ? C.primary : C.border}`,
          fontSize: "14px", color: C.text, background: "#fff",
          outline: "none", boxSizing: "border-box" as const,
          boxShadow: focused ? "0 0 0 3px rgba(99,142,203,0.12)" : "none",
          transition: "border-color 0.18s, box-shadow 0.18s",
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");
  const [hov, setHov]         = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/reset-password` }
    );
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
    } else {
      setSent(true);
    }
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        @media (max-width: 680px) {
          .fp-shell { flex-direction: column !important; height: auto !important; max-width: 420px !important; }
          .fp-panel { width: 100% !important; padding: 40px 28px !important; }
          .fp-blue  { display: none !important; }
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: C.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 20px 32px",
        fontFamily: "system-ui, -apple-system, 'Inter', sans-serif",
      }}>
        <div className="fp-shell" style={{
          width: "100%",
          maxWidth: "860px",
          minHeight: "480px",
          background: "#fff",
          borderRadius: "20px",
          overflow: "hidden",
          display: "flex",
          boxShadow: "0 16px 48px rgba(57,88,134,0.12), 0 0 0 1px rgba(57,88,134,0.07)",
        }}>

          {/* ══ LEFT — Blue decorative panel ══ */}
          <div className="fp-panel fp-blue" style={{
            width: "45%",
            flexShrink: 0,
            background: `linear-gradient(150deg, ${C.navy} 0%, ${C.deep} 55%, ${C.primary} 100%)`,
            position: "relative",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 44px",
          }}>
            {/* Decorative rings — identical to login overlay */}
            <div style={{ position:"absolute", width:"440px", height:"440px", borderRadius:"50%", border:"1px solid rgba(255,255,255,0.06)", top:"-180px", right:"-150px", pointerEvents:"none" }} />
            <div style={{ position:"absolute", width:"280px", height:"280px", borderRadius:"50%", border:"1px solid rgba(255,255,255,0.05)", top:"-80px", right:"-60px", pointerEvents:"none" }} />
            <div style={{ position:"absolute", width:"340px", height:"340px", borderRadius:"50%", border:"1px solid rgba(255,255,255,0.04)", bottom:"-140px", left:"-110px", pointerEvents:"none" }} />
            <div style={{ position:"absolute", width:"160px", height:"160px", borderRadius:"50%", border:"1px solid rgba(255,255,255,0.07)", bottom:"-20px", left:"30px", pointerEvents:"none" }} />
            <div style={{ position:"absolute", inset:0, pointerEvents:"none", background:"radial-gradient(ellipse at 35% 38%, rgba(138,174,224,0.15) 0%, transparent 65%)" }} />

            {/* Content */}
            <div style={{ position:"relative", textAlign:"center", zIndex:1 }}>
              <div style={{
                width:"52px", height:"52px", borderRadius:"12px",
                border:"1px solid rgba(255,255,255,0.20)",
                background:"rgba(255,255,255,0.07)",
                display:"flex", alignItems:"center", justifyContent:"center",
                margin:"0 auto 24px",
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h2 style={{ fontSize:"22px", fontWeight:700, color:"#fff", marginBottom:"12px", letterSpacing:"-0.02em", lineHeight:1.3 }}>
                Don&apos;t worry,<br />we&apos;ve got you covered!
              </h2>
              <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.58)", lineHeight:1.75, maxWidth:"200px", margin:"0 auto" }}>
                We&apos;ll send a secure reset link directly to your inbox.
              </p>
            </div>
          </div>

          {/* ══ RIGHT — White form ══ */}
          <div className="fp-panel" style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 52px",
          }}>
            <div style={{ width: "100%" }}>
              {sent ? (
                /* ── Success state ── */
                <div style={{ textAlign:"center" }}>
                  <div style={{
                    width:"48px", height:"48px", borderRadius:"12px",
                    background:"rgba(99,142,203,0.09)", border:`1px solid ${C.border}`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    margin:"0 auto 18px",
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                  </div>
                  <h2 style={{ fontSize:"22px", fontWeight:700, color: C.deep, marginBottom:"8px", letterSpacing:"-0.02em" }}>
                    Check your inbox
                  </h2>
                  <p style={{ fontSize:"13px", color: C.muted, lineHeight:1.7, marginBottom:"22px" }}>
                    We sent a reset link to{" "}
                    <span style={{ color: C.deep, fontWeight:600 }}>{email}</span>
                  </p>
                  <Link href="/login" style={{
                    display:"inline-block", padding:"10px 26px", borderRadius:"10px",
                    background: C.primary, color:"#fff", fontSize:"13px",
                    fontWeight:600, textDecoration:"none",
                  }}>
                    Back to Sign In
                  </Link>
                </div>
              ) : (
                /* ── Form ── */
                <>
                  <p style={{ fontSize:"11px", fontWeight:700, color: C.primary, letterSpacing:"0.10em", textTransform:"uppercase" as const, marginBottom:"10px" }}>
                    Password Recovery
                  </p>
                  <h1 style={{ fontSize:"24px", fontWeight:700, color: C.deep, letterSpacing:"-0.025em", marginBottom:"6px" }}>
                    Forgot your password?
                  </h1>
                  <p style={{ fontSize:"13px", color: C.muted, marginBottom:"30px", lineHeight:1.6 }}>
                    Enter your email and we&apos;ll send you a link to reset your password.
                  </p>

                  {error && (
                    <div style={{
                      fontSize:"13px", color: C.error, marginBottom:"16px",
                      background:"rgba(239,68,68,0.05)", padding:"10px 13px",
                      borderRadius:"8px", border:"1px solid rgba(239,68,68,0.12)",
                    }}>
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <Field
                      label="Email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={setEmail}
                      required
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        width:"100%", padding:"12px", marginTop:"6px",
                        borderRadius:"10px", border:"none",
                        background: loading ? C.border : C.primary,
                        color:"#fff", fontSize:"14px", fontWeight:600,
                        cursor: loading ? "wait" : "pointer",
                        opacity: hov && !loading ? 0.86 : 1,
                        letterSpacing:"0.02em",
                        transition:"opacity 0.18s",
                      }}
                      onMouseEnter={() => setHov(true)}
                      onMouseLeave={() => setHov(false)}
                    >
                      {loading ? "Sending…" : "Send Reset Link"}
                    </button>
                  </form>

                  <div style={{ marginTop:"24px", textAlign:"center" }}>
                    <Link href="/login" style={{ fontSize:"12px", color: C.primary, fontWeight:500, textDecoration:"none", opacity:0.85 }}>
                      ← Back to Sign In
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
