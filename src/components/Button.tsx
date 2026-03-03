"use client";

import React, { useState } from "react";

type Variant = "primary" | "outline" | "secondary";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export default function Button({
  children,
  variant = "primary",
  disabled = false,
  ...props
}: Props) {
  const [hover, setHover] = useState(false);

  /* ================= BASE STYLE ================= */

  const base: React.CSSProperties = {
    padding: "12px 28px",
    borderRadius: "999px",
    fontFamily: "var(--font-body)",
    fontWeight: 600,
    fontSize: "14px",
    letterSpacing: "0.3px",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.25s ease",
    transform: hover && !disabled ? "translateY(-3px)" : "translateY(0px)",
    opacity: disabled ? 0.6 : 1,
    outline: "none",
  };

  /* ================= PRIMARY ================= */

  const primary: React.CSSProperties = {
    background: hover && !disabled
      ? "linear-gradient(135deg, #275fd1, #1898b5)"
      : "linear-gradient(135deg, #2F6FE4, #1CA7C8)",
    color: "#ffffff",
    border: "none",
    boxShadow: hover && !disabled
      ? "0 10px 25px rgba(47, 111, 228, 0.35)"
      : "0 4px 12px rgba(47, 111, 228, 0.18)",
  };

  /* ================= OUTLINE ================= */

  const outline: React.CSSProperties = {
    background: hover && !disabled
      ? "linear-gradient(135deg, #2F6FE4, #1CA7C8)"
      : "rgba(47, 111, 228, 0.05)",
    color: hover && !disabled ? "#ffffff" : "#2F6FE4",
    border: "1.5px solid rgba(47, 111, 228, 0.6)",
    boxShadow: hover && !disabled
      ? "0 8px 20px rgba(47, 111, 228, 0.25)"
      : "none",
  };

  /* ================= SECONDARY ================= */

  const secondary: React.CSSProperties = {
    background: hover && !disabled ? "#f3f4f6" : "#ffffff",
    color: "#1f2937",
    border: "1px solid #e5e7eb",
    boxShadow: hover && !disabled
      ? "0 6px 18px rgba(0,0,0,0.08)"
      : "0 2px 6px rgba(0,0,0,0.05)",
  };

  const style: React.CSSProperties = {
    ...base,
    ...(variant === "outline"
      ? outline
      : variant === "secondary"
      ? secondary
      : primary),
  };

  return (
    <button
      {...props}
      disabled={disabled}
      style={style}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </button>
  );
}