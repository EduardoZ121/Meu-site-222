import { Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Unified generate CTA — sticky bar or inline button with ready/locked states.
 */
export default function StudioGenerateBar({
  ready = false,
  busy = false,
  onClick,
  label,
  busyLabel,
  hint,
  variant = "default",
  layout = "sticky",
  costMeta = null,
  testId = "studio-generate",
  className = "",
  buttonClassName = "",
  alignHint = "end",
}) {
  const disabled = busy || !ready;

  const btnClass = [
    "rp-action-primary",
    variant === "pro" ? "rp-action-primary--pro" : "",
    ready && !busy ? "rp-action-primary--ready" : "",
    !ready && !busy ? "rp-action-primary--locked" : "",
    layout === "sticky" ? "flex-1 sm:flex-initial sm:min-w-[240px] sm:ml-auto !w-auto sm:!w-auto" : "",
    buttonClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const showHint = Boolean(hint) && !ready && !busy;
  const hintAlign =
    alignHint === "center" ? "text-center" : alignHint === "start" ? "text-left" : "text-right";

  const action = (
    <div
      className={
        layout === "inline"
          ? "flex flex-col gap-1.5 w-full"
          : "flex flex-col items-end gap-1.5 flex-1 sm:flex-none min-w-0"
      }
    >
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={btnClass}
        data-testid={testId}
        aria-disabled={disabled}
      >
        {busy ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
            {busyLabel || label}
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" strokeWidth={1.5} />
            {label}
          </>
        )}
      </button>
      {showHint ? (
        <p className={`rp-studio-gen-hint ${hintAlign} w-full`} data-testid={`${testId}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );

  if (layout === "inline") {
    return <div className={className}>{action}</div>;
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0.96 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`rp-sticky-cta rp-sticky-cta--sidebar ${className}`.trim()}
      data-testid={`${testId}-bar`}
    >
      <div className="rp-studio-shell max-w-[1400px] mx-auto flex items-center justify-between gap-4 px-2 sm:px-4">
        {costMeta}
        {action}
      </div>
    </motion.div>
  );
}
