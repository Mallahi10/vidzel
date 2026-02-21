"use client";

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  type?: "button" | "submit";
  disabled?: boolean;
};

const PRIMARY_BLUE = "#2563eb";

export default function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled = false,
}: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    padding: "0.75rem 2.5rem",
    borderRadius: "999px",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    transition: "all 0.2s ease",

    /* ✅ CRITICAL FIX */
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    whiteSpace: "nowrap",
    gap: "0.25rem",
  };

  const style: React.CSSProperties =
    variant === "secondary"
      ? {
          ...baseStyle,
          background: "white",
          color: PRIMARY_BLUE,
          border: `2px solid ${PRIMARY_BLUE}`,
        }
      : {
          ...baseStyle,
          background: PRIMARY_BLUE,
          color: "white",
          border: "none",
        };

  return (
    <button
      type={type}
      onClick={onClick}
      style={style}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
