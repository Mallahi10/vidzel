"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/Button";

type Role = "organization" | "student" | "volunteer" | "mentor";

function normalizeRole(v: string | null): Role {
  if (!v) return "volunteer";
  const r = v.trim().toLowerCase();
  if (
    r === "organization" ||
    r === "student" ||
    r === "volunteer" ||
    r === "mentor"
  ) {
    return r as Role;
  }
  return "volunteer";
}

/* =====================
   INNER CLIENT CONTENT
===================== */
function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signup } = useAuth();

  const roleFromUrl = useMemo(
    () => normalizeRole(searchParams.get("role")),
    [searchParams]
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("volunteer");

  useEffect(() => {
    setRole(roleFromUrl);
  }, [roleFromUrl]);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      alert("Please fill in all fields");
      return;
    }

    const success = await signup(email, password, role);
    if (!success) return;

    router.push(
      role === "organization"
        ? "/dashboard/projects"
        : "/dashboard/profile"
    );
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
          maxWidth: "520px",
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
          Create your account
        </h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSignup();
          }}
        >
          <input
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />

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

          <select
            value={role}
            onChange={(e) => setRole(normalizeRole(e.target.value))}
            style={inputStyle}
          >
            <option value="organization">Organization</option>
            <option value="student">Student</option>
            <option value="volunteer">Volunteer</option>
            <option value="mentor">Mentor</option>
          </select>

          <Button type="submit" style={{ width: "100%", marginTop: "0.9rem" }}>
            Create My Account
          </Button>
        </form>

        <Link
          href={`/login?role=${role}`}
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
          Already have an account? Log in
        </Link>
      </div>
    </div>
  );
}

/* =====================
   PAGE EXPORT
===================== */
export default function SignupPage() {
  return (
    <Suspense fallback={<div style={{ padding: "3rem" }}>Loading…</div>}>
      <SignupContent />
    </Suspense>
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