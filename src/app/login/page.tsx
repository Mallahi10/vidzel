"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, user } = useAuth();
  const router = useRouter();

  const handleLogin = () => {
    const success = login(email, password);

    if (!success) {
      alert("Invalid email or password");
      return;
    }
    // ⛔ wait for auth state
  };

  useEffect(() => {
    if (!user) return;
    router.push("/dashboard");
  }, [user, router]);

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
      {/* GLASS CARD (slightly bigger) */}
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "480px",     // ⬆ was 420px
          padding: "2.75rem",    // ⬆ more breathing room
        }}
      >
        <h1 className="card-title">Log in</h1>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
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

          <Button onClick={handleLogin} type="button">
            Log in
          </Button>
        </div>

        <p
          className="card-text"
          style={{ marginTop: "1.75rem", textAlign: "center" }}
        >
          Don’t have an account?{" "}
          <Link href="/signup" style={{ color: "var(--primary-color)" }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}