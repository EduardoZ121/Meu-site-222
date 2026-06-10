import { Link } from "react-router-dom";

/** Single source of truth for the Remake Pixel logo.
 * Used everywhere — landing navbar, dashboard sidebar, login, etc.
 * Two sizes: "default" (24px height) and "lg" (40px).
 */
export default function Logo({ to = "/", size = "default", className = "" }) {
  const inner = (
    <span className={`inline-flex items-center gap-2 ${className}`} data-testid="logo">
      <span
        className="font-extrabold tracking-[-0.06em] text-[#F4F1EA] leading-none"
        style={{
          fontFamily: "'Inter Tight', system-ui, sans-serif",
          fontSize: size === "lg" ? "26px" : "18px",
          fontWeight: 800,
        }}
      >
        R<span className="text-[#7C3AED]">.</span>
      </span>
      <span
        className="text-[#F4F1EA] leading-none"
        style={{
          fontFamily: "'Inter Tight', system-ui, sans-serif",
          fontSize: size === "lg" ? "16px" : "13px",
          fontWeight: 500,
          letterSpacing: "-0.01em",
        }}
      >
        Remake Pixel
      </span>
    </span>
  );

  if (!to) return inner;
  return (
    <Link to={to} className="inline-flex items-center" data-testid="logo-link">
      {inner}
    </Link>
  );
}
