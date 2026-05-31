/**
 * Marca Remake Pixel — canto em degrau (pixel removido = “remake”).
 * Usar no logo, favicon context, loading states.
 */
export default function BrandMark({ size = 24, className = "" }) {
  const s = size;
  return (
    <span className={`rp-brand-mark ${className}`.trim()} aria-hidden>
      <svg
        className="rp-brand-mark__svg"
        width={s}
        height={s}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="4" y="4" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="2" />
        <path
          d="M20 4h8v8h-8V4Z"
          fill="var(--rp-accent-bright, #a855f7)"
          stroke="var(--rp-accent-bright, #a855f7)"
          strokeWidth="1"
        />
        <rect x="10" y="14" width="4" height="4" fill="currentColor" opacity="0.35" />
        <rect x="16" y="14" width="4" height="4" fill="currentColor" opacity="0.55" />
        <rect x="10" y="20" width="4" height="4" fill="currentColor" opacity="0.55" />
        <rect x="16" y="20" width="4" height="4" fill="currentColor" opacity="0.85" />
      </svg>
    </span>
  );
}
