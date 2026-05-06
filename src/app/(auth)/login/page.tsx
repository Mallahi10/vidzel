"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/Button";

// On sépare le formulaire pour utiliser useSearchParams avec Suspense
function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  const [isLoggingIn, setIsLoggingIn] = useState(false); 

  const { login, user, loading } = useAuth();
  const router = useRouter();

  const searchParams = useSearchParams();
  const expectedRole = searchParams.get("role") || undefined;

  const handleLogin = async () => {
    setErrorMsg(""); 
    setIsLoggingIn(true); 
    
    const result = await login(email, password, expectedRole); 
    
    if (!result.success) {
      setErrorMsg(result.error || "Invalid email or password"); 
      setIsLoggingIn(false); // 
    } else {
    
      router.replace("/dashboard");
    }
  };

  /* ✅ FIXED REDIRECT WITH isLoggingIn LOCK */
  useEffect(() => {
    if (loading) return;
    
    if (isLoggingIn) return; 

    // Cette condition s'exécute uniquement si l'utilisateur accède à la page /login 
    // alors qu'il est DÉJÀ connecté (ex: rafraîchissement de page)
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, loading, isLoggingIn, router]);

  return (
    <>
      <h1
        style={{
          fontSize: "1.75rem",
          fontWeight: 800,
          background: "linear-gradient(90deg, #1e3a8a, #2563eb, #38bdf8)",
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
        {expectedRole 
          ? `Log in as ${expectedRole} to continue.` 
          : "Log in to continue collaborating on Vidzel."}
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}
      >
        {errorMsg && (
          <div style={{ color: "#ef4444", marginBottom: "1rem", textAlign: "center", fontWeight: "bold" }}>
            {errorMsg}
          </div>
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
          required
        />

        <Button
          type="submit"
          disabled={isLoggingIn} 
          style={{
            width: "100%",
            marginTop: "0.9rem",
            borderRadius: "9999px",
            background: "linear-gradient(90deg, #1e3a8a, #2563eb, #38bdf8)",
            boxShadow: "0 18px 40px rgba(37,99,235,0.45)",
            opacity: isLoggingIn ? 0.7 : 1, // Feedback visuel
            cursor: isLoggingIn ? "wait" : "pointer"
          }}
        >
          {isLoggingIn ? "Logging in..." : "Log In"}
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
    </>
  );
}

export default function LoginPage() {
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
        <Suspense fallback={<div style={{ textAlign: "center" }}>Loading...</div>}>
          <LoginForm />
        </Suspense>
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