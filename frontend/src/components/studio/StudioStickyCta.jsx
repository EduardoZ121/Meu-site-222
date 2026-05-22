import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

/**
 * Fixed bottom action bar. In workspace mode (no sidebar) left offset is 0 via CSS.
 */
export default function StudioStickyCta({
  children,
  testId,
  maxWidth = "1400px",
  className,
}) {
  return (
    <motion.div
      initial={{ y: 18, opacity: 0.92 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn("rp-sticky-cta rp-sticky-cta--sidebar", className)}
      data-testid={testId}
    >
      <div
        className="rp-studio-shell mx-auto flex items-center justify-between gap-3 sm:gap-4 px-2 sm:px-4"
        style={{ maxWidth }}
      >
        {children}
      </div>
    </motion.div>
  );
}

export function StudioStickyMeta({ cost, balanceLabel, costLabel, creditsLabel }) {
  return (
    <div className="hidden sm:flex items-center gap-3 sm:gap-4 text-[12px] font-['Inter_Tight'] shrink-0">
      <span className="text-[#8A8A8E]">{costLabel}</span>
      <span className="text-[#C4B5FD] font-semibold tabular-nums">{cost}</span>
      {creditsLabel && (
        <span className="text-[#5A5A5E] font-mono text-[10px] uppercase tracking-wider hidden md:inline">
          {creditsLabel}
        </span>
      )}
      <span className="w-px h-4 bg-[#2E2E30]" aria-hidden />
      <span className="text-[#8A8A8E]">{balanceLabel}</span>
      <span className="text-[#F4F1EA] font-medium tabular-nums">{balance}</span>
    </div>
  );
}
