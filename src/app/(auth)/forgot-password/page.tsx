"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

/* ── Palette ─────────────────────────────────────────────────────────────── */
const C = {
  bg:      "#F4F7FA",
  deep:    "#395886",
  navy:    "#1e3a5f",
  primary: "#638ECB",
  border:  "#D5DEEF",
  text:    "#1e293b",
  muted:   "#94A3B8",
  error:   "#ef4444",
};

/* ── Shared sub-components ───────────────────────────────────────────────── */

function Field({
  label, type, placeholder, value, onChange, required = false, suffix,
}: {
  label: string; type: string; placeholder: string;
  value: string; onChange: (v: string) => void;
  required?: boolean; suffix?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{
        display: "block", fontSize: "11px", fontWeight: 600,
        letterSpacing: "0.07em", textTransform: "uppercase" as const,
        color: focused ? C.primary : C.muted, marginBottom: "6px",
        transition: "color 0.18s",
      }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={type} placeholder={placeholder} value={value}
          onChange={(e) => onChange(e.target.value)} required={required}
          style={{
            width: "100%", padding: suffix ? "11px 44px 11px 14px" : "11px 14px",
            borderRadius: "10px",
            border: `1.5px solid ${focused ? C.primary : C.border}`,
            fontSize: "14px", color: C.text, background: "#fff",
            outline: "none", boxSizing: "border-box" as const,
            boxShadow: focused ? "0 0 0 3px rgba(99,142,203,0.12)" : "none",
            transition: "border-color 0.18s, box-shadow 0.18s",
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {suffix && (
          <div style={{
            position: "absolute", right: "13px", top: "50%",
            transform: "translateY(-50%)", display: "flex",
          }}>
            {suffix}
          </div>
        )}
      </div>
    </div>
  );
}

function PrimaryBtn({
  children, loading, type = "submit", onClick,
}: {
  children: React.ReactNode; loading?: boolean;
  type?: "submit" | "button"; onClick?: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type={type} onClick={onClick} disabled={loading}
      style={{
        width: "100%", padding: "12px", marginTop: "6px",
        borderRadius: "10px", border: "none",
        background: loading ? C.border : C.primary,
        color: "#fff", fontSize: "14px", fontWeight: 600,
        cursor: loading ? "wait" : "pointer",
        opacity: hov && !loading ? 0.86 : 1,
        letterSpacing: "0.02em",
        transition: "opacity 0.18s",
        display: "flex", alignItems: "center",
        justifyContent: "center", gap: "8px",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      width="15" height="15" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: "fp-spin 0.8s linear infinite" }}
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div style={{
      fontSize: "13px", color: C.error, marginBottom: "16px",
      background: "rgba(239,68,68,0.05)", padding: "10px 13px",
      borderRadius: "8px", border: "1px solid rgba(239,68,68,0.12)",
    }}>
      {msg}
    </div>
  );
}

/* ── Blue decorative panel ───────────────────────────────────────────────── */

function BluePanel({ icon, title, subtitle }: {
  icon: React.ReactNode; title: string; subtitle: string;
}) {
  return (
    <div className="fp-blue" style={{
      width: "45%", flexShrink: 0,
      background: `linear-gradient(150deg, ${C.navy} 0%, ${C.deep} 55%, ${C.primary} 100%)`,
      position: "relative", overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "48px 44px",
    }}>
      {/* Decorative rings */}
      <div style={{ position:"absolute", width:"440px", height:"440px", borderRadius:"50%", border:"1px solid rgba(255,255,255,0.06)", top:"-180px", right:"-150px", pointerEvents:"none" }} />
      <div style={{ position:"absolute", width:"280px", height:"280px", borderRadius:"50%", border:"1px solid rgba(255,255,255,0.05)", top:"-80px", right:"-60px", pointerEvents:"none" }} />
      <div style={{ position:"absolute", width:"340px", height:"340px", borderRadius:"50%", border:"1px solid rgba(255,255,255,0.04)", bottom:"-140px", left:"-110px", pointerEvents:"none" }} />
      <div style={{ position:"absolute", width:"160px", height:"160px", borderRadius:"50%", border:"1px solid rgba(255,255,255,0.07)", bottom:"-20px", left:"30px", pointerEvents:"none" }} />
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", background:"radial-gradient(ellipse at 35% 38%, rgba(138,174,224,0.15) 0%, transparent 65%)" }} />

      <div style={{ position:"relative", textAlign:"center", zIndex:1 }}>
        <div style={{
          width:"52px", height:"52px", borderRadius:"12px",
          border:"1px solid rgba(255,255,255,0.20)",
          background:"rgba(255,255,255,0.07)",
          display:"flex", alignItems:"center", justifyContent:"center",
          margin:"0 auto 24px",
        }}>
          {icon}
        </div>
        <h2 style={{
          fontSize:"22px", fontWeight:700, color:"#fff",
          marginBottom:"12px", letterSpacing:"-0.02em", lineHeight:1.35,
        }}>
          {title}
        </h2>
        <p style={{
          fontSize:"13px", color:"rgba(255,255,255,0.58)",
          lineHeight:1.75, maxWidth:"210px", margin:"0 auto",
        }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}

/* ── Step progress dots ──────────────────────────────────────────────────── */

function StepDots({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div style={{ display:"flex", gap:"6px", marginBottom:"28px" }}>
      {([1, 2, 3] as const).map((n) => (
        <div key={n} style={{
          height: "5px",
          width: n === step ? "22px" : "5px",
          borderRadius: "3px",
          background: n < step ? C.primary : n === step ? C.primary : C.border,
          opacity: n < step ? 0.4 : 1,
          transition: "all 0.3s ease",
        }} />
      ))}
    </div>
  );
}

/* ── OTP — 6 individual boxes ────────────────────────────────────────────── */

function OtpBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const getDigit = (i: number) => value[i] ?? "";

  const setAt = (idx: number, digit: string) => {
    const chars = Array.from({ length: 6 }, (_, i) => value[i] ?? "");
    chars[idx] = digit;
    onChange(chars.join(""));
    if (digit && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleKey = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const chars = Array.from({ length: 6 }, (_, i) => value[i] ?? "");
      if (chars[idx]) {
        chars[idx] = "";
        onChange(chars.join(""));
      } else if (idx > 0) {
        chars[idx - 1] = "";
        onChange(chars.join(""));
        refs.current[idx - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft"  && idx > 0) refs.current[idx - 1]?.focus();
    else if  (e.key === "ArrowRight" && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(digits.padEnd(6, "").slice(0, 6));
    refs.current[Math.min(digits.length, 5)]?.focus();
  };

  return (
    <div style={{ display:"flex", gap:"9px", justifyContent:"center", margin:"22px 0" }}>
      {Array.from({ length: 6 }).map((_, i) => {
        const d = getDigit(i);
        return (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            placeholder="·"
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "");
              if (v) setAt(i, v.slice(-1));
            }}
            onKeyDown={(e) => handleKey(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            style={{
              width: "44px", height: "54px",
              borderRadius: "10px",
              border: `1.5px solid ${d ? C.primary : C.border}`,
              background: d ? "rgba(99,142,203,0.05)" : "#fafbfd",
              fontSize: "22px", fontWeight: 700,
              color: C.deep, textAlign: "center" as const,
              outline: "none", caretColor: "transparent",
              boxShadow: d ? "0 0 0 3px rgba(99,142,203,0.10)" : "none",
              transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s",
            }}
          />
        );
      })}
    </div>
  );
}

/* ── Resend countdown ────────────────────────────────────────────────────── */

function ResendTimer({ onResend }: { onResend: () => Promise<void> }) {
  const [secs, setSecs] = useState(60);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (secs <= 0) return;
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs]);

  const handle = async () => {
    setBusy(true);
    await onResend();
    setBusy(false);
    setSecs(60);
  };

  return (
    <p style={{ textAlign:"center", marginTop:"18px", fontSize:"13px", color: C.muted }}>
      Didn&apos;t receive a code?{" "}
      {secs > 0 ? (
        <span style={{ fontWeight: 500 }}>Resend in {secs}s</span>
      ) : (
        <button
          type="button" onClick={handle} disabled={busy}
          style={{
            background:"none", border:"none", color: C.primary,
            fontWeight:600, cursor:"pointer", fontSize:"13px", padding:0,
          }}
        >
          {busy ? "Sending…" : "Resend Code"}
        </button>
      )}
    </p>
  );
}

/* ── Eye toggle icon ─────────────────────────────────────────────────────── */

function EyeToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <button
      type="button" onClick={onToggle}
      style={{ background:"none", border:"none", cursor:"pointer", padding:0, color: C.muted, display:"flex" }}
      aria-label={visible ? "Hide password" : "Show password"}
    >
      {visible ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      )}
    </button>
  );
}

/* ── SVG icons for blue panel ────────────────────────────────────────────── */

const MailIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const ShieldIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const LockIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

/* ── Panel config per step ───────────────────────────────────────────────── */

const PANEL = {
  1: { icon: <MailIcon />,   title: "Reset your password.",  subtitle: "We will send a 6-digit verification code to your inbox." },
  2: { icon: <ShieldIcon />, title: "Verify your identity.", subtitle: "Enter the 6-digit code sent to your email address." },
  3: { icon: <LockIcon />,   title: "Secure your account.",  subtitle: "Choose a strong and memorable new password." },
} as const;

/* ── Role → dashboard route ──────────────────────────────────────────────── */

const ROLE_ROUTE: Record<string, string> = {
  organization: "/dashboard/organization",
  student:      "/dashboard/student",
  volunteer:    "/dashboard/volunteer",
  mentor:       "/dashboard/mentor",
  trainee:      "/dashboard/trainee",
};

/* ══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════ */

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step,        setStep]        = useState<1 | 2 | 3>(1);
  const [email,       setEmail]       = useState("");
  const [otp,         setOtp]         = useState("");
  const [newPass,     setNewPass]     = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  /* ── Step 1: send OTP ── */
  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    /* redirectTo omitted → Supabase sends a 6-digit OTP code (no magic link) */
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (err) setError(err.message);
    else     setStep(2);
  };

  /* ── Step 2: verify OTP ── */
  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.replace(/\s/g, "");
    if (code.length < 6) { setError("Please enter the complete 6-digit code."); return; }
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code,
      type:  "recovery",
    });
    setLoading(false);
    if (err) setError("Invalid or expired code. Please try again.");
    else     setStep(3);
  };

  /* ── Step 3: update password then redirect to role dashboard ── */
  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPass.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPass !== confirmPass) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password: newPass });
    if (err) {
      setLoading(false);
      setError(err.message);
      return;
    }
    /* Session is already active after verifyOtp — read the user's role and go directly to their dashboard */
    const { data: { user } } = await supabase.auth.getUser();
    const role  = (user?.user_metadata?.role as string) || "student";
    const route = ROLE_ROUTE[role] ?? "/dashboard";
    router.push(route);
  };

  const panel = PANEL[step];

  return (
    <>
      <style>{`
        @keyframes fp-spin {
          to { transform: rotate(360deg); }
        }
        * { box-sizing: border-box; }
        @media (max-width: 680px) {
          .fp-shell { flex-direction: column !important; height: auto !important; max-width: 420px !important; }
          .fp-panel { width: 100% !important; padding: 40px 28px !important; }
          .fp-blue  { display: none !important; }
        }
      `}</style>

      <div style={{
        minHeight: "100vh", background: C.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px 20px 32px",
        fontFamily: "system-ui, -apple-system, 'Inter', sans-serif",
      }}>
        <div className="fp-shell" style={{
          width: "100%", maxWidth: "860px", minHeight: "500px",
          background: "#fff", borderRadius: "20px", overflow: "hidden",
          display: "flex",
          boxShadow: "0 16px 48px rgba(57,88,134,0.12), 0 0 0 1px rgba(57,88,134,0.07)",
        }}>

          {/* ══ LEFT — Blue panel (updates per step) ══ */}
          <BluePanel
            key={step}
            icon={panel.icon}
            title={panel.title}
            subtitle={panel.subtitle}
          />

          {/* ══ RIGHT — White form ══ */}
          <div className="fp-panel" style={{
            flex: 1, display: "flex", alignItems: "center",
            justifyContent: "center", padding: "48px 52px",
          }}>
            <div style={{ width: "100%" }}>

              <StepDots step={step} />

              {/* ─────────────── STEP 1 — Email ─────────────── */}
              {step === 1 && (
                <>
                  <p style={eyebrow}>Password Recovery</p>
                  <h1 style={heading}>Forgot your password?</h1>
                  <p style={sub}>
                    Enter your email and we&apos;ll send you a 6-digit code to verify your identity.
                  </p>
                  <ErrorBox msg={error} />
                  <form onSubmit={sendCode}>
                    <Field
                      label="Email Address" type="email"
                      placeholder="you@example.com"
                      value={email} onChange={setEmail} required
                    />
                    <PrimaryBtn loading={loading}>
                      {loading ? "Sending Code…" : "Send Code"}
                    </PrimaryBtn>
                  </form>
                  <div style={{ marginTop:"24px", textAlign:"center" }}>
                    <Link href="/login" style={backLink}>← Back to Sign In</Link>
                  </div>
                </>
              )}

              {/* ─────────────── STEP 2 — OTP ─────────────── */}
              {step === 2 && (
                <>
                  <p style={eyebrow}>Verification</p>
                  <h1 style={heading}>Check your inbox</h1>
                  <p style={sub}>
                    We sent a 6-digit code to{" "}
                    <strong style={{ color: C.deep }}>{email}</strong>.
                    Enter it below.
                  </p>
                  <ErrorBox msg={error} />
                  <form onSubmit={verifyCode}>
                    <OtpBoxes value={otp} onChange={(v) => { setOtp(v); setError(""); }} />
                    <PrimaryBtn loading={loading}>
                      {loading ? "Verifying…" : "Verify Code"}
                    </PrimaryBtn>
                  </form>
                  <ResendTimer onResend={async () => {
                    setOtp("");
                    setError("");
                    await sendCode();
                  }} />
                  <div style={{ marginTop:"14px", textAlign:"center" }}>
                    <button
                      type="button"
                      onClick={() => { setStep(1); setOtp(""); setError(""); }}
                      style={{ background:"none", border:"none", color: C.muted, fontSize:"12px", cursor:"pointer", padding:0 }}
                    >
                      ← Change email address
                    </button>
                  </div>
                </>
              )}

              {/* ─────────────── STEP 3 — New password ─────────────── */}
              {step === 3 && (
                <>
                  <p style={eyebrow}>New Password</p>
                  <h1 style={heading}>Set a new password</h1>
                  <p style={sub}>
                    Choose a strong password. You&apos;ll be redirected to your dashboard right after.
                  </p>
                  <ErrorBox msg={error} />
                  <form onSubmit={updatePassword}>
                    <Field
                      label="New Password"
                      type={showPass ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      value={newPass} onChange={setNewPass} required
                      suffix={<EyeToggle visible={showPass} onToggle={() => setShowPass((v) => !v)} />}
                    />
                    <Field
                      label="Confirm New Password"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Repeat your password"
                      value={confirmPass} onChange={setConfirmPass} required
                      suffix={<EyeToggle visible={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />}
                    />
                    <PrimaryBtn loading={loading}>
                      {loading ? "Updating…" : "Update & Enter Dashboard"}
                    </PrimaryBtn>
                  </form>
                </>
              )}

            </div>
          </div>

        </div>
      </div>
    </>
  );
}

/* ── Shared text styles ──────────────────────────────────────────────────── */

const eyebrow: React.CSSProperties = {
  fontSize: "11px", fontWeight: 700, color: C.primary,
  letterSpacing: "0.10em", textTransform: "uppercase",
  marginBottom: "10px",
};

const heading: React.CSSProperties = {
  fontSize: "24px", fontWeight: 700, color: C.deep,
  letterSpacing: "-0.025em", marginBottom: "6px",
};

const sub: React.CSSProperties = {
  fontSize: "13px", color: C.muted, marginBottom: "24px", lineHeight: 1.65,
};

const backLink: React.CSSProperties = {
  fontSize: "12px", color: C.primary, fontWeight: 500,
  textDecoration: "none", opacity: 0.85,
};
