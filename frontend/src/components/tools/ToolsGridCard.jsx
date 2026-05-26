import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import ToolThumb from "../ToolThumb";
import { toolCatalogueCost } from "../../lib/pricingRegions";

const cardEase = [0.16, 1, 0.3, 1];

export default function ToolsGridCard({ tool, index, region, t }) {
  const cost = toolCatalogueCost(tool.id, region);
  const isFree = tool.cost <= 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: Math.min(index * 0.05, 0.4),
        ease: cardEase,
      }}
      className="h-full"
    >
      <Link
        to={tool.to}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_24px_48px_-32px_rgba(0,0,0,0.85)] backdrop-blur-xl transition-[transform,box-shadow,border-color] duration-500 ease-out hover:scale-[1.02] hover:border-violet-400/35 hover:shadow-[0_0_0_1px_rgba(168,85,247,0.12),0_28px_60px_-24px_rgba(124,58,237,0.55),0_0_80px_-20px_rgba(59,130,246,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080c]"
        data-testid={`tool-${tool.id}`}
      >
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          aria-hidden
          style={{
            background:
              "linear-gradient(135deg, rgba(168,85,247,0.22) 0%, transparent 42%, rgba(59,130,246,0.12) 100%)",
          }}
        />

        <div className="relative aspect-[16/10] overflow-hidden bg-[#0a0a0f]">
          <motion.div
            className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          >
            <ToolThumb id={tool.id} name={tool.name} variant="premium" />
          </motion.div>

          <div
            className="absolute inset-0 bg-gradient-to-t from-[#08080c] via-[#08080c]/40 to-transparent opacity-90 z-[1]"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-blue-600/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100 z-[1]"
            aria-hidden
          />

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
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tabular-nums text-violet-100 bg-violet-500/20 border border-violet-400/30 backdrop-blur-md shadow-[0_0_24px_-8px_rgba(168,85,247,0.5)]">
                <Sparkles className="w-3 h-3 text-violet-300" strokeWidth={2} />
                {cost}
                <span className="text-violet-300/80 font-medium">{t("label_credits_short")}</span>
              </span>
            )}
          </div>

          <span className="absolute bottom-3 right-3 z-[2] flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white border border-white/15 backdrop-blur-md opacity-0 translate-y-1 scale-90 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 group-hover:bg-violet-500/25 group-hover:border-violet-400/40">
            <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
          </span>
        </div>

        <div className="relative flex flex-1 flex-col gap-2 p-4 sm:p-5 border-t border-white/[0.05]">
          <h3 className="text-[17px] sm:text-[18px] font-semibold text-white leading-snug tracking-[-0.02em] font-['Inter_Tight'] group-hover:text-violet-50 transition-colors duration-300 line-clamp-2">
            {tool.name}
          </h3>
          {tool.desc && (
            <p className="text-[13px] sm:text-[14px] text-zinc-400 leading-relaxed line-clamp-2 flex-1">
              {tool.desc}
            </p>
          )}
          <div className="pt-2 flex items-center justify-between gap-3 mt-auto">
            <span
              className={`text-[11px] font-mono uppercase tracking-[0.14em] ${
                isFree ? "text-emerald-400/90" : "text-violet-400/90"
              }`}
            >
              {isFree ? t("label_free") : `${cost} ${t("label_credits")}`}
            </span>
            <span className="text-[11px] font-medium text-zinc-500 group-hover:text-violet-300/90 transition-colors duration-300">
              {t("tools_grid.open_tool")}
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
