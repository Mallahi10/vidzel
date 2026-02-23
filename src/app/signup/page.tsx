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

  // Normalize role from URL
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

    // Redirect by role
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
    /* FULL PAGE CENTER WRAPPER */
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.25rem",
      }}
    >
      {/* GLASS CARD (same size as Login) */}
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "480px",
          padding: "2.75rem",
        }}
      >
        <h1 className="card-title">Create account</h1>

        <p className="card-text">
          Creating an account as <strong>{role}</strong>
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div>
            <p
              style={{
                marginBottom: "0.5rem",
                fontSize: "0.9rem",
                color: "var(--text-muted)",
              }}
            >
              Select your role:
            </p>

            {roles.map(({ value, label }) => (
              <label
                key={value}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: "0.9rem",
                }}
              >
                <input
                  type="radio"
                  value={value}
                  checked={role === value}
                  onChange={() => setRole(value)}
                />
                {label}
              </label>
            ))}
          </div>

          <Button onClick={handleSignup} type="button">
            Create account
          </Button>
        </div>

        <p
          className="card-text"
          style={{ marginTop: "1.75rem", textAlign: "center" }}
        >
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--primary-color)" }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
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