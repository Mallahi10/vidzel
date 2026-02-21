"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = () => {
    const success = login(email, password);

    if (!success) {
      alert("Invalid email or password");
      return;
    }

    router.push("/dashboard");
  };

  return (
    <main style={container}>
      <div style={card}>
        <h1 style={{ marginBottom: "1rem" }}>Log in</h1>

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

        <Button onClick={handleLogin} type="button">
          Log in
        </Button>

        <p style={{ marginTop: "1.5rem", textAlign: "center" }}>
          Don’t have an account?{" "}
          <Link href="/signup" style={{ color: "#2563eb" }}>
            Create one
          </Link>
        </p>
      </div>
    </main>
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

  /* 🔥 Force visible background contrast */
  background:
    "radial-gradient(circle at top, rgba(37,99,235,0.18), transparent 60%)",
};

const card = {
  width: "100%",
  maxWidth: "420px",
  padding: "2.5rem",

  /* 🧊 GLASS — VISIBLE IN ALL BROWSERS */
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.85), rgba(255,255,255,0.65))",

  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",

  borderRadius: "18px",
  border: "1px solid rgba(255,255,255,0.5)",

  boxShadow:
    "0 25px 50px rgba(15, 23, 42, 0.2)",
};

const input = {
  width: "100%",
  padding: "0.75rem",
  marginBottom: "1rem",
};