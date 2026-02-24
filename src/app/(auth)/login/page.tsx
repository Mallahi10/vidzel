"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login, user, loading } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    const success = await login(email, password);
    if (!success) {
      alert("Invalid email or password");
    }
  };

  /* ✅ FIXED REDIRECT */
  useEffect(() => {
    if (loading) return;
    if (!user) return;

    router.replace("/dashboard");
  }, [user, loading, router]);

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
          background: `
            linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.18) 0%,
              rgba(255, 255, 255, 0.92) 85%
            )
          `,
          borderRadius: "30px",
          padding: "2.9rem",
          border: "1px solid rgba(255,255,255,0.35)",
          boxShadow: `
            0 30px 70px rgba(15, 23, 42, 0.55),
            inset 0 1px 0 rgba(255,255,255,0.6)
          `,
          backdropFilter: "blur(14px)",
        }}
      >
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 800,
            background:
              "linear-gradient(90deg, #1e3a8a, #2563eb, #38bdf8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "0.5rem",
          }}
        >
          Welcome back
        </h1>

        <p
          style={{
            color: "#334155",
            fontSize: "0.95rem",
            marginBottom: "2.2rem",
            lineHeight: 1.65,
          }}
        >
          Log in to continue collaborating on Vidzel.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />

          <Button
            type="submit"
            style={{
              width: "100%",
              marginTop: "0.9rem",
              borderRadius: "9999px",
              background:
                "linear-gradient(90deg, #1e3a8a, #2563eb, #38bdf8)",
              boxShadow: "0 18px 40px rgba(37,99,235,0.45)",
            }}
          >
            Log In
          </Button>
        </form>

        <Link
          href="/signup"
          style={{
            display: "block",
            textAlign: "center",
            marginTop: "1.8rem",
            fontSize: "0.9rem",
            color: "#2563eb",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          New here? Create an account
        </Link>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem 0.9rem",
  marginBottom: "1.1rem",
  borderRadius: "12px",
  border: "1px solid rgba(37, 99, 235, 0.35)",
  fontSize: "0.95rem",
  color: "#0f172a",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))",
  outline: "none",
  boxShadow: "inset 0 1px 2px rgba(15,23,42,0.08)",
};