"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/* ─── Palette — même que le reste du site ─── */
const C = {
  bg:       "#0a1628",
  deep:     "#395886",
  navy:     "#1e3a5f",
  primary:  "#638ECB",
  soft:     "#8AAEE0",
  border:   "#D5DEEF",
  text:     "#1e293b",
  muted:    "#94A3B8",
  error:    "#ef4444",
};

/* ─── Field avec label flottant ─── */
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

/* ─── Role selector ─── */
function RoleSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{
        display: "block", fontSize: "11px", fontWeight: 600,
        letterSpacing: "0.07em", textTransform: "uppercase" as const,
        color: focused ? C.primary : C.muted, marginBottom: "6px",
        transition: "color 0.18s",
      }}>
        Role
      </label>
      <select
        value={value} onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", padding: "11px 36px 11px 14px",
          borderRadius: "10px",
          border: `1.5px solid ${focused ? C.primary : C.border}`,
          fontSize: "14px", color: C.text, background: "#fff",
          outline: "none", boxSizing: "border-box" as const,
          cursor: "pointer", appearance: "none" as const,
          WebkitAppearance: "none" as const,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center",
          boxShadow: focused ? "0 0 0 3px rgba(99,142,203,0.12)" : "none",
          transition: "border-color 0.18s, box-shadow 0.18s",
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        <option value="student">Student</option>
        <option value="volunteer">Volunteer</option>
        <option value="mentor">Mentor</option>
        <option value="organization">Organization</option>
      </select>
    </div>
  );
}

/* ─── Primary button ─── */
function PrimaryBtn({ loading, children }: { loading?: boolean; children: React.ReactNode }) {
  const [hov, setHov] = useState(false);
  return (
    <button type="submit" disabled={loading} style={{
      width: "100%", padding: "12px", marginTop: "6px",
      borderRadius: "10px", border: "none",
      background: loading ? C.border : C.primary,
      color: "#fff", fontSize: "14px", fontWeight: 600,
      cursor: loading ? "wait" : "pointer",
      opacity: hov && !loading ? 0.86 : 1,
      transition: "opacity 0.18s",
      letterSpacing: "0.02em",
    }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {children}
    </button>
  );
}

/* ─── Overlay ghost button ─── */
function GhostBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  const [hov, setHov] = useState(false);
  return (
    <button type="button" onClick={onClick} style={{
      padding: "10px 32px", borderRadius: "8px",
      border: `1px solid rgba(255,255,255,${hov ? 0.50 : 0.25})`,
      background: `rgba(255,255,255,${hov ? 0.12 : 0.06})`,
      color: "#fff", fontSize: "13px", fontWeight: 600,
      cursor: "pointer", letterSpacing: "0.04em",
      transition: "background 0.18s, border-color 0.18s",
    }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {children}
    </button>
  );
}

/* ════════════════════════════════════
   CORE COMPONENT
════════════════════════════════════ */
function SlidingAuth() {
  const [isSignUp, setIsSignUp] = useState(false);

  const [lEmail, setLEmail]     = useState("");
  const [lPass,  setLPass]      = useState("");
  const [lError, setLError]     = useState("");
  const [lLoad,  setLLoad]      = useState(false);

  const [sEmail, setSEmail]     = useState("");
  const [sPass,  setSPass]      = useState("");
  const [sRole,  setSRole]      = useState("student");
  const [sLoad,  setSLoad]      = useState(false);
  const [sDone,  setSDone]      = useState(false);

  const { login, signup, user, loading } = useAuth();
  const router       = useRouter();
  const params       = useSearchParams();
  const urlRole      = params.get("role") ?? undefined;

  useEffect(() => { if (urlRole) setSRole(urlRole); }, [urlRole]);
  useEffect(() => {
    if (!loading && !lLoad && user) router.replace("/dashboard");
  }, [user, loading, lLoad, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLError(""); setLLoad(true);
    const r = await login(lEmail, lPass, urlRole);
    if (!r.success) { setLError(r.error ?? "Invalid credentials"); setLLoad(false); }
    else router.replace("/dashboard");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault(); setSLoad(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ok = await signup(sEmail, sPass, sRole as any);
    setSLoad(false);
    if (ok) setSDone(true);
  };

  /* thin divider */
  const HR = () => (
    <div style={{ display:"flex", alignItems:"center", gap:"10px", margin:"16px 0" }}>
      <div style={{ flex:1, height:"1px", background: C.border }} />
      <span style={{ fontSize:"11px", color: C.muted, letterSpacing:"0.06em" }}>OR</span>
      <div style={{ flex:1, height:"1px", background: C.border }} />
    </div>
  );

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        @media (max-width: 680px) {
          .auth-shell { flex-direction: column !important; height: auto !important; max-width: 400px !important; }
          .auth-panel { width: 100% !important; }
          .auth-overlay { display: none !important; }
        }
      `}</style>

      {/* ── Page wrapper — même fond dark que le hero ── */}
      <div style={{
        minHeight: "100vh",
        background: "#F4F7FA",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 20px 32px",
        fontFamily: "system-ui, -apple-system, 'Inter', sans-serif",
      }}>

        {/* ── Card principale ── */}
        <div className="auth-shell" style={{
          width: "100%",
          maxWidth: "860px",
          height: "560px",
          background: "#fff",
          borderRadius: "20px",
          overflow: "hidden",
          position: "relative",
          display: "flex",
          /* ombre douce sur fond sombre = parfait contraste */
          boxShadow: "0 16px 48px rgba(57,88,134,0.12), 0 0 0 1px rgba(57,88,134,0.07)",
        }}>

          {/* ══ PANNEAU GAUCHE — Sign In ══ */}
          <div className="auth-panel" style={{
            width: "50%", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "48px 52px",
          }}>
            <div style={{ width: "100%" }}>

              <p style={{ fontSize:"11px", fontWeight:700, color: C.primary, letterSpacing:"0.10em", textTransform:"uppercase", marginBottom:"10px" }}>
                Welcome back
              </p>
              <h1 style={{ fontSize:"24px", fontWeight:700, color: C.deep, letterSpacing:"-0.025em", marginBottom:"6px" }}>
                Sign In
              </h1>
              <p style={{ fontSize:"13px", color: C.muted, marginBottom:"30px", lineHeight:1.6 }}>
                {urlRole ? `Continuing as ${urlRole}` : "Access your Vidzel workspace"}
              </p>

              {lError && (
                <div style={{
                  fontSize:"13px", color: C.error, marginBottom:"16px",
                  background:"rgba(239,68,68,0.05)", padding:"10px 13px",
                  borderRadius:"8px", border:"1px solid rgba(239,68,68,0.12)",
                }}>
                  {lError}
                </div>
              )}

              <form onSubmit={handleLogin}>
                <Field label="Email" type="email" placeholder="you@example.com" value={lEmail} onChange={setLEmail} required />
                <Field label="Password" type="password" placeholder="••••••••" value={lPass} onChange={setLPass} required />

                <div style={{ textAlign:"right", marginTop:"-4px", marginBottom:"20px" }}>
                  <Link href="/forgot-password" style={{ fontSize:"12px", color: C.primary, fontWeight:500, textDecoration:"none", opacity:0.85 }}>
                    Forgot password?
                  </Link>
                </div>

                <PrimaryBtn loading={lLoad}>{lLoad ? "Signing in…" : "Sign In"}</PrimaryBtn>
              </form>

              <HR />
              <p style={{ textAlign:"center", fontSize:"13px", color: C.muted }}>
                No account?{" "}
                <button type="button" onClick={() => setIsSignUp(true)} style={{
                  background:"none", border:"none", color: C.primary,
                  fontWeight:600, cursor:"pointer", fontSize:"13px", padding:0,
                }}>
                  Create one
                </button>
              </p>
            </div>
          </div>

          {/* ══ PANNEAU DROIT — Sign Up ══ */}
          <div className="auth-panel" style={{
            width: "50%", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "48px 52px",
          }}>
            {sDone ? (
              /* ── Confirmation email ── */
              <div style={{ textAlign:"center", maxWidth:"280px" }}>
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
                <h2 style={{ fontSize:"19px", fontWeight:700, color: C.deep, marginBottom:"8px" }}>
                  Check your inbox
                </h2>
                <p style={{ fontSize:"13px", color: C.muted, lineHeight:1.7, marginBottom:"22px" }}>
                  Confirmation sent to{" "}
                  <span style={{ color: C.deep, fontWeight:600 }}>{sEmail}</span>
                </p>
                <button type="button" onClick={() => { setSDone(false); setIsSignUp(false); }} style={{
                  padding:"10px 26px", borderRadius:"10px", border:"none",
                  background: C.primary, color:"#fff", fontSize:"13px",
                  fontWeight:600, cursor:"pointer",
                }}>
                  Back to Sign In
                </button>
              </div>
            ) : (
              <div style={{ width:"100%" }}>
                <p style={{ fontSize:"11px", fontWeight:700, color: C.primary, letterSpacing:"0.10em", textTransform:"uppercase", marginBottom:"10px" }}>
                  Get started
                </p>
                <h1 style={{ fontSize:"24px", fontWeight:700, color: C.deep, letterSpacing:"-0.025em", marginBottom:"6px" }}>
                  Create Account
                </h1>
                <p style={{ fontSize:"13px", color: C.muted, marginBottom:"30px", lineHeight:1.6 }}>
                  Join Vidzel and start making an impact
                </p>

                <form onSubmit={handleSignup}>
                  <Field label="Email" type="email" placeholder="you@example.com" value={sEmail} onChange={setSEmail} required />
                  <Field label="Password" type="password" placeholder="Min. 8 characters" value={sPass} onChange={setSPass} required />
                  <RoleSelect value={sRole} onChange={setSRole} />
                  <PrimaryBtn loading={sLoad}>{sLoad ? "Creating account…" : "Create Account"}</PrimaryBtn>
                </form>

                <HR />
                <p style={{ textAlign:"center", fontSize:"13px", color: C.muted }}>
                  Already have an account?{" "}
                  <button type="button" onClick={() => setIsSignUp(false)} style={{
                    background:"none", border:"none", color: C.primary,
                    fontWeight:600, cursor:"pointer", fontSize:"13px", padding:0,
                  }}>
                    Sign in
                  </button>
                </p>
              </div>
            )}
          </div>

          {/* ══ OVERLAY COULISSANT ══ */}
          <div className="auth-overlay" style={{
            position: "absolute",
            top: 0,
            left: isSignUp ? 0 : "50%",
            width: "50%",
            height: "100%",
            background: `linear-gradient(150deg, ${C.navy} 0%, ${C.deep} 55%, ${C.primary} 100%)`,
            zIndex: 10,
            overflow: "hidden",
            transition: "left 0.52s cubic-bezier(0.25, 1, 0.5, 1)",
          }}>

            {/* Anneaux décoratifs minimalistes */}
            <div style={{ position:"absolute", width:"440px", height:"440px", borderRadius:"50%", border:"1px solid rgba(255,255,255,0.06)", top:"-180px", right:"-150px", pointerEvents:"none" }} />
            <div style={{ position:"absolute", width:"280px", height:"280px", borderRadius:"50%", border:"1px solid rgba(255,255,255,0.05)", top:"-80px", right:"-60px", pointerEvents:"none" }} />
            <div style={{ position:"absolute", width:"340px", height:"340px", borderRadius:"50%", border:"1px solid rgba(255,255,255,0.04)", bottom:"-140px", left:"-110px", pointerEvents:"none" }} />
            <div style={{ position:"absolute", width:"160px", height:"160px", borderRadius:"50%", border:"1px solid rgba(255,255,255,0.07)", bottom:"-20px", left:"30px", pointerEvents:"none" }} />
            {/* Lueur intérieure subtile */}
            <div style={{ position:"absolute", inset:0, pointerEvents:"none", background:"radial-gradient(ellipse at 35% 38%, rgba(138,174,224,0.15) 0%, transparent 65%)" }} />

            {/* Zone de contenu centrée */}
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", padding:"48px 44px" }}>

              {/* "Hello, Friend!" — overlay sur la droite (mode login) */}
              <div style={{
                position:"absolute", width:"calc(100% - 88px)", textAlign:"center",
                opacity: isSignUp ? 0 : 1,
                transform: isSignUp ? "translateX(-14px)" : "translateX(0)",
                transition: "opacity 0.20s ease 0.14s, transform 0.20s ease 0.14s",
                pointerEvents: isSignUp ? "none" : "auto",
              }}>
                <div style={{
                  width:"42px", height:"42px", borderRadius:"10px",
                  border:"1px solid rgba(255,255,255,0.20)",
                  background:"rgba(255,255,255,0.07)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  margin:"0 auto 24px",
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.80)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <h2 style={{ fontSize:"22px", fontWeight:700, color:"#fff", marginBottom:"10px", letterSpacing:"-0.02em" }}>
                  Hello, Friend!
                </h2>
                <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.58)", lineHeight:1.75, marginBottom:"28px", maxWidth:"200px", margin:"0 auto 28px" }}>
                  New to Vidzel? Create an account and join our impact community.
                </p>
                <GhostBtn onClick={() => setIsSignUp(true)}>Sign Up</GhostBtn>
              </div>

              {/* "Welcome Back!" — overlay sur la gauche (mode signup) */}
              <div style={{
                position:"absolute", width:"calc(100% - 88px)", textAlign:"center",
                opacity: isSignUp ? 1 : 0,
                transform: isSignUp ? "translateX(0)" : "translateX(14px)",
                transition: "opacity 0.20s ease 0.14s, transform 0.20s ease 0.14s",
                pointerEvents: isSignUp ? "auto" : "none",
              }}>
                <div style={{
                  width:"42px", height:"42px", borderRadius:"10px",
                  border:"1px solid rgba(255,255,255,0.20)",
                  background:"rgba(255,255,255,0.07)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  margin:"0 auto 24px",
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.80)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                </div>
                <h2 style={{ fontSize:"22px", fontWeight:700, color:"#fff", marginBottom:"10px", letterSpacing:"-0.02em" }}>
                  Welcome Back!
                </h2>
                <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.58)", lineHeight:1.75, marginBottom:"28px", maxWidth:"200px", margin:"0 auto 28px" }}>
                  Already part of Vidzel? Sign in and continue your work.
                </p>
                <GhostBtn onClick={() => setIsSignUp(false)}>Sign In</GhostBtn>
              </div>

            </div>
          </div>
          {/* ══════════════════════════════ */}

        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:"100vh", background:"#F4F7FA", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <span style={{ fontSize:"14px", color: "#8AAEE0", fontWeight:500 }}>Loading…</span>
      </div>
    }>
      <SlidingAuth />
    </Suspense>
  );
}
