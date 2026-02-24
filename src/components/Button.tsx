"use client";

import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

const PRIMARY_BLUE = "#2563eb";

export default function Button({
  children,
  variant = "primary",
  style,
  ...props
}: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    padding: "0.75rem 2.5rem",
    borderRadius: "999px",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: props.disabled ? "not-allowed" : "pointer",
    opacity: props.disabled ? 0.6 : 1,
    transition: "all 0.2s ease",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    whiteSpace: "nowrap",
    gap: "0.25rem",
  };

  const variantStyle: React.CSSProperties =
    variant === "secondary"
      ? {
          background: "white",
          color: PRIMARY_BLUE,
          border: `2px solid ${PRIMARY_BLUE}`,
        }
      : {
          background: PRIMARY_BLUE,
          color: "white",
          border: "none",
        };

  return (
    <button
      {...props}
      style={{ ...baseStyle, ...variantStyle, ...style }}
    >
      {children}
    </button>
  );
}