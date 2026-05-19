"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Button from "@/components/Button";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `
          radial-gradient(circle at 15% 15%, rgba(37,99,235,0.28), transparent 45%),
          radial-gradient(circle at 85% 20%, rgba(56,189,248,0.30), transparent 50%),
          radial-gradient(circle at 50% 100%, rgba(30,58,138,0.35), transparent 60%),
          linear-gradient(180deg, #0f172a 0%, #1e3a8a 40%, #2563eb 100%)
        `,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: `linear-gradient(180deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.92) 85%)`,
          borderRadius: "30px",
          padding: "2.9rem",
          border: "1px solid rgba(255,255,255,0.35)",
          boxShadow: `0 30px 70px rgba(15, 23, 42, 0.55), inset 0 1px 0 rgba(255,255,255,0.6)`,
          backdropFilter: "blur(14px)",
        }}
      >
        {success ? (
          /* ── SUCCESS ── */
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
            <h1 style={titleStyle}>Password updated!</h1>
            <p style={{ color: "#334155", fontSize: "0.95rem", lineHeight: 1.65 }}>
              Your password has been reset successfully. Redirecting to login…
            </p>
          </div>
        ) : (
          /* ── FORM ── */
          <>
            <h1 style={titleStyle}>Set new password</h1>
            <p style={{ color: "#334155", fontSize: "0.95rem", marginBottom: "2.2rem", lineHeight: 1.65 }}>
              Choose a strong password for your account.
            </p>

            <form onSubmit={handleReset}>
              {error && (
                <div style={{ color: "#ef4444", marginBottom: "1rem", textAlign: "center", fontWeight: "bold" }}>
                  {error}
                </div>
              )}

              <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                required
              />

              <input
                type="password"
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                style={inputStyle}
                required
              />

              <Button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  marginTop: "0.5rem",
                  borderRadius: "9999px",
                  background: "linear-gradient(90deg, #1e3a8a, #2563eb, #38bdf8)",
                  boxShadow: "0 18px 40px rgba(37,99,235,0.45)",
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? "wait" : "pointer",
                }}
              >
                {loading ? "Updating…" : "Update Password"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

const titleStyle: React.CSSProperties = {
  fontSize: "1.75rem",
  fontWeight: 800,
  background: "linear-gradient(90deg, #1e3a8a, #2563eb, #38bdf8)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  marginBottom: "0.5rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem 0.9rem",
  marginBottom: "1.1rem",
  borderRadius: "12px",
  border: "1px solid rgba(37, 99, 235, 0.35)",
  fontSize: "0.95rem",
  color: "#0f172a",
  background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))",
  outline: "none",
  boxShadow: "inset 0 1px 2px rgba(15,23,42,0.08)",
};
