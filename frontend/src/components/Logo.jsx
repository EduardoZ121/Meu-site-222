import { Link } from "react-router-dom";

/** Single source of truth for the Remake logo.
 * Used everywhere — landing navbar, dashboard sidebar, login, etc.
 * Two sizes: "default" (24px height) and "lg" (40px).
 */
export default function Logo({ to = "/", size = "default", variant = "default", className = "" }) {
  const wordmark = (
    <span
      className="rp-logo-wordmark leading-none tracking-tight"
      style={{
        fontFamily: "var(--font-display)",
        fontSize: size === "lg" ? "16px" : variant === "header" ? "14px" : "13px",
        fontWeight: variant === "header" ? 700 : 500,
        letterSpacing: "-0.02em",
      }}
    >
      Remake
    </span>
  );

  const inner = (
    <span className={`inline-flex items-center gap-2 ${className}`} data-testid="logo">
      <span
        className="rp-logo-mark font-bold tracking-tight leading-none"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: size === "lg" ? "26px" : "18px",
        }}
      >
        R<span className="rp-logo-dot">.</span>
      </span>
      {wordmark}
    </span>
  );

  if (!to) return inner;
  return (
    <Link to={to} className="inline-flex items-center" data-testid="logo-link">
      {inner}
    </Link>
  );
}
