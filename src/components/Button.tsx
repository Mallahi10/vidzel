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

  /* ================= OLD STYLE BACKUP =================
  const primary = { background: gradient #2F6FE4 → #1CA7C8 / updated: #2563eb → #3b82f6 }
  const outline = { border 1.5px solid #2563eb }
  const secondary = { background white, color #1e3a8a, border rgba(37,99,235,0.22) }
  ===================================================== */

  /* ================= NEW MODERN UI UPDATE — premium blue/navy palette ================= */

  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "10px 20px",
    borderRadius: "10px",
    fontFamily: "var(--font-body)",
    fontWeight: 600,
    fontSize: "14px",
    letterSpacing: "0.15px",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s ease",
    transform: hover && !disabled ? "translateY(-2px)" : "translateY(0px)",
    opacity: disabled ? 0.6 : 1,
    outline: "none",
    whiteSpace: "nowrap" as const,
    lineHeight: "1",
  };

  const primary: React.CSSProperties = {
    background:
      hover && !disabled
        ? "linear-gradient(135deg, #1e3a5f, #395886)"
        : "linear-gradient(135deg, #395886, #638ECB)",
    color: "#ffffff",
    border: "none",
    boxShadow:
      hover && !disabled
        ? "0 8px 24px rgba(99, 142, 203, 0.34)"
        : "0 3px 10px rgba(57, 88, 134, 0.20)",
  };

  const outline: React.CSSProperties = {
    background:
      hover && !disabled
        ? "linear-gradient(135deg, #395886, #638ECB)"
        : "transparent",
    color: hover && !disabled ? "#ffffff" : "#638ECB",
    border: "1.5px solid #638ECB",
    boxShadow:
      hover && !disabled
        ? "0 6px 18px rgba(99, 142, 203, 0.24)"
        : "none",
  };

  const secondary: React.CSSProperties = {
    background:
      hover && !disabled ? "rgba(99, 142, 203, 0.06)" : "#ffffff",
    color: "#395886",
    border: "1.5px solid rgba(99, 142, 203, 0.22)",
    boxShadow:
      hover && !disabled
        ? "0 4px 14px rgba(99, 142, 203, 0.12)"
        : "0 1px 4px rgba(0, 0, 0, 0.05)",
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
