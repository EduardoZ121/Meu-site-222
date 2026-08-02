import { Link } from "react-router-dom";

/** Single source of truth for the Remake Pixel logo.
 * Used everywhere — landing navbar, dashboard sidebar, login, etc.
 * Two sizes: "default" (24px height) and "lg" (40px).
 */
export default function Logo({ to = "/", size = "default", variant = "default", className = "" }) {
  const wordmark =
    variant === "header" ? (
      <span
        className="rp-logo-wordmark leading-none tracking-tight"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: size === "lg" ? "16px" : "14px",
          letterSpacing: "-0.02em",
        }}
      >
        <span className="font-bold">Remake </span>
        <span className="font-normal">Pixel</span>
      </span>
    ) : (
      <span
        className="rp-logo-wordmark leading-none"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: size === "lg" ? "16px" : "13px",
          fontWeight: 500,
          letterSpacing: "-0.01em",
        }}
      >
        Remake Pixel
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
