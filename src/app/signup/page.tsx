"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/Button";

/* ======================
   TYPES
====================== */

type Role = "organization" | "student" | "volunteer" | "mentor";

/* ======================
   SIGNUP CONTENT
====================== */

function SignupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { signup } = useAuth();

  // ✅ Normalize role from URL (always lowercase)
  const roleFromUrl = searchParams
    .get("role")
    ?.toLowerCase() as Role | undefined;

  const [role, setRole] = useState<Role>(roleFromUrl || "student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = () => {
    if (!name || !email || !password) {
      alert("Please fill in all fields");
      return;
    }

    const success = signup(name, email, password, role);

    if (!success) {
      alert("Email already exists");
      return;
    }

    // ✅ Organization never goes to profile creation
    if (role === "organization") {
      router.push("/dashboard/projects");
    } else {
      router.push("/dashboard/profile");
    }
  };

  const roles: { value: Role; label: string }[] = [
    { value: "organization", label: "Organization" },
    { value: "student", label: "Student" },
    { value: "volunteer", label: "Volunteer" },
    { value: "mentor", label: "Mentor" },
  ];

  return (
    <main style={container}>
      <div style={card}>
        <h1 style={{ marginBottom: "0.75rem" }}>Create account</h1>

        <div style={roleBadge}>
          Creating an account as <strong>{role}</strong>
        </div>

        <input
          type="text"
          placeholder="Full name"
          style={input}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          style={input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          style={input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div style={{ marginBottom: "1.25rem" }}>
          <p>Select your role:</p>
          {roles.map(({ value, label }) => (
            <label key={value} style={{ display: "block" }}>
              <input
                type="radio"
                value={value}
                checked={role === value}
                onChange={() => setRole(value)}
                style={{ marginRight: "0.4rem" }}
              />
              {label}
            </label>
          ))}
        </div>

        <Button onClick={handleSignup} type="button">
          Create account
        </Button>

        <p style={{ marginTop: "1.5rem", textAlign: "center" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#2563eb" }}>
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}

/* ======================
   PAGE WRAPPER
====================== */

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupContent />
    </Suspense>
  );
}

/* ======================
   STYLES
====================== */

const container = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "radial-gradient(circle at top, rgba(37,99,235,0.18), transparent 60%)",
};

const card = {
  width: "100%",
  maxWidth: "420px",
  padding: "2.5rem",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.85), rgba(255,255,255,0.65))",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  borderRadius: "18px",
  border: "1px solid rgba(255,255,255,0.5)",
  boxShadow: "0 25px 50px rgba(15, 23, 42, 0.2)",
};

const roleBadge = {
  marginBottom: "1.5rem",
  padding: "0.6rem 0.75rem",
  background: "rgba(37,99,235,0.1)",
  color: "#1f3a5f",
  borderRadius: "8px",
  fontSize: "0.9rem",
  textAlign: "center" as const,
};

const input = {
  width: "100%",
  padding: "0.75rem",
  marginBottom: "1rem",
};