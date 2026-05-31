import { Link } from "react-router-dom";
import BrandMark from "./brand/BrandMark";

/** Single source of truth for the Remake Pixel logo. */
export default function Logo({ to = "/", size = "default", variant = "default", className = "" }) {
  const markSize = size === "lg" ? 28 : 22;
  const wordSize = size === "lg" ? "16px" : variant === "header" ? "14px" : "13px";

  const wordmark =
    variant === "header" ? (
      <span
        className="leading-none tracking-tight"
        style={{
          fontFamily: "'Inter Tight', system-ui, sans-serif",
          fontSize: wordSize,
          letterSpacing: "-0.02em",
          color: "var(--rp-cream)",
        }}
      >
        <span className="font-semibold">Remake </span>
        <span className="font-normal opacity-90">Pixel</span>
      </span>
    ) : (
      <span
        className="leading-none"
        style={{
          fontFamily: "'Inter Tight', system-ui, sans-serif",
          fontSize: wordSize,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: "var(--rp-cream)",
        }}
      >
        Remake Pixel
      </span>
    );

  const inner = (
    <span className={`inline-flex items-center gap-2.5 ${className}`} data-testid="logo">
      <BrandMark size={markSize} />
      {wordmark}
    </span>
  );

  if (!to) return inner;
  return (
    <Link to={to} className="inline-flex items-center hover:opacity-90 transition-opacity" data-testid="logo-link">
      {inner}
    </Link>
  );
}
