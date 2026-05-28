"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  useEffect(() => {
    if (!email) return;
    setStatus("loading");

    fetch(`/api/newsletter?email=${encodeURIComponent(email)}`, { method: "DELETE" })
      .then((r) => r.json())
      .then((d) => setStatus(d.success ? "done" : "error"))
      .catch(() => setStatus("error"));
  }, [email]);

  return (
    <div style={{
      background: "white", borderRadius: 20, padding: "2.5rem 3rem",
      boxShadow: "0 8px 32px rgba(57,88,134,0.10)", maxWidth: 420, textAlign: "center",
    }}>
      {status === "loading" && <p style={{ color: "#64748b" }}>Processing…</p>}
      {status === "done" && (
        <>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>✅</div>
          <h2 style={{ color: "#0f172a", margin: "0 0 0.5rem" }}>Unsubscribed</h2>
          <p style={{ color: "#64748b", margin: 0 }}>
            <strong>{email}</strong> has been removed from the Vidzel newsletter.
          </p>
        </>
      )}
      {status === "error" && (
        <>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>⚠️</div>
          <h2 style={{ color: "#0f172a", margin: "0 0 0.5rem" }}>Something went wrong</h2>
          <p style={{ color: "#64748b", margin: 0 }}>Please try again or contact support.</p>
        </>
      )}
      {!email && status === "idle" && (
        <p style={{ color: "#94a3b8" }}>No email address provided.</p>
      )}
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#F4F7FA", fontFamily: "sans-serif",
    }}>
      <Suspense fallback={<p style={{ color: "#64748b" }}>Loading…</p>}>
        <UnsubscribeContent />
      </Suspense>
    </div>
  );
}
