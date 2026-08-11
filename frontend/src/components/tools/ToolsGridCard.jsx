import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import ToolThumb from "../ToolThumb";
import { toolCatalogueCost } from "../../lib/pricingRegions";

const cardEase = [0.16, 1, 0.3, 1];

export default function ToolsGridCard({ tool, index, region, t, compact = false }) {
  const cost = toolCatalogueCost(tool.id, region);
  const isFree = tool.cost <= 0;

  const linkClass = compact
    ? "rp-glass-card rp-glass-card--compact group relative flex h-full flex-col transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
    : "rp-glass-card rp-glass-card--roomy group relative flex h-full flex-col hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080c]";

  return (
    <motion.article
      initial={{ opacity: 0, y: compact ? 8 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: compact ? 0.35 : 0.45,
        delay: Math.min(index * (compact ? 0.04 : 0.05), 0.4),
        ease: cardEase,
      }}
      className="h-full"
    >
      <Link
        to={tool.to}
        className={linkClass}
        data-testid={`tool-${tool.id}`}
      >
        <div className={`rp-glass-card__media ${compact ? "aspect-[16/10]" : "aspect-[16/10]"}`}>
          <motion.div
            className={`absolute inset-0 transition-transform duration-700 ease-out ${compact ? "group-hover:scale-[1.03]" : "group-hover:scale-[1.06]"}`}
          >
            <ToolThumb id={tool.id} name={tool.name} variant={compact ? "default" : "premium"} />
          </motion.div>

          <div className="rp-glass-card__media-shade" aria-hidden />
          <div className="absolute top-3 left-3 z-[2] flex flex-wrap gap-1.5">
            {tool.isNew && (
              <span className="rp-badge-pulse inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider text-white bg-gradient-to-r from-violet-600 to-violet-500 border border-white/20 shadow-[0_0_20px_-4px_rgba(168,85,247,0.8)]">
                {t("label_new")}
              </span>
            )}
            {tool.isBeta && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider text-amber-100 bg-amber-500/20 border border-amber-400/30 backdrop-blur-md">
                {t("badge_beta")}
              </span>
            )}
          </div>

          <div className="absolute top-3 right-3 z-[2]">
            {isFree ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide text-emerald-200/95 bg-emerald-500/15 border border-emerald-400/25 backdrop-blur-md">
                {t("label_free")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tabular-nums text-[#f4e8d4] bg-[#c7a77a]/15 border border-[#c7a77a]/35 backdrop-blur-md">
                <Sparkles className="w-3 h-3 text-[#c7a77a]" strokeWidth={2} />
                {cost}
                <span className="text-[#c7a77a]/90 font-medium">{t("label_credits_short")}</span>
              </span>
            )}
          </div>

          <span className="absolute bottom-3 right-3 z-[2] flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white border border-white/15 backdrop-blur-md opacity-0 translate-y-1 scale-90 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 group-hover:bg-violet-500/25 group-hover:border-violet-400/40">
            <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
          </span>
        </div>

        <div className={`rp-glass-card__body ${compact ? "gap-1 p-2.5 sm:p-3" : "gap-2 p-4 sm:p-5"}`}>
          <h3 className={`font-semibold text-white leading-snug font-['Inter_Tight'] group-hover:text-violet-50 transition-colors duration-300 line-clamp-1 ${compact ? "text-sm" : "text-[17px] sm:text-[18px] tracking-[-0.02em] line-clamp-2"}`}>
            {tool.name}
          </h3>
          {tool.desc && (
            <p className={`text-zinc-400 leading-snug line-clamp-2 flex-1 ${compact ? "text-xs mt-1" : "text-[13px] sm:text-[14px] leading-relaxed"}`}>
              {tool.desc}
            </p>
          )}
          <div className={`flex items-center justify-between gap-3 mt-auto ${compact ? "pt-1.5" : "pt-2"}`}>
            <span
              className={`font-mono tracking-wider ${
                compact ? "text-[10px]" : "text-[11px] uppercase tracking-[0.14em]"
              } ${isFree ? "rp-type-value--free" : "rp-type-value"}`}
            >
              {isFree ? t("label_free") : `${cost} ${compact ? t("label_credits_short") : t("label_credits")}`}
            </span>
            {!compact && (
              <span className="text-[11px] font-medium text-zinc-500 group-hover:text-violet-300/90 transition-colors duration-300">
                →
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
