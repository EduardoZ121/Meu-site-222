import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Clapperboard, ImageIcon, Sparkles, Type } from "lucide-react";
import { usePricing } from "../../lib/PricingContext";

const cardEase = [0.16, 1, 0.3, 1];

const ICONS = {
  type: Type,
  image: ImageIcon,
  clapperboard: Clapperboard,
};

const ICON_STYLES = {
  type: "from-violet-600/40 to-indigo-900/60 text-violet-200",
  image: "from-cyan-600/35 to-violet-900/55 text-cyan-100",
  clapperboard: "from-fuchsia-600/35 to-violet-900/55 text-fuchsia-100",
};

export default function VideoGridCard({ category, index, t }) {
  const { costs } = usePricing();
  const cost = costs[category.costKey] ?? costs.video ?? 80;
  const Icon = ICONS[category.icon] || Type;
  const iconStyle = ICON_STYLES[category.icon] || ICON_STYLES.type;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: Math.min(index * 0.06, 0.35),
        ease: cardEase,
      }}
      className="h-full"
    >
      <Link
        to={category.to}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_24px_48px_-32px_rgba(0,0,0,0.85)] backdrop-blur-xl transition-[transform,box-shadow,border-color] duration-500 ease-out hover:scale-[1.02] hover:border-violet-400/35 hover:shadow-[0_0_0_1px_rgba(168,85,247,0.12),0_28px_60px_-24px_rgba(124,58,237,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
        data-testid={`video-card-${category.id}`}
      >
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          aria-hidden
          style={{
            background:
              "linear-gradient(135deg, rgba(168,85,247,0.22) 0%, transparent 42%, rgba(59,130,246,0.12) 100%)",
          }}
        />

        <div className={`relative aspect-[16/10] overflow-hidden bg-gradient-to-br ${iconStyle}`}>
          <div className="absolute inset-0 bg-[#0a0a0f]/50" aria-hidden />
          <div className="absolute inset-0 flex items-center justify-center z-[1]">
            <div className="w-16 h-16 rounded-2xl border border-white/15 bg-black/25 backdrop-blur-md flex items-center justify-center shadow-[0_0_40px_-8px_rgba(124,58,237,0.5)]">
              <Icon className="w-8 h-8" strokeWidth={1.5} />
            </div>
          </div>
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#08080c] via-transparent to-transparent z-[1]"
            aria-hidden
          />

          <div className="absolute top-3 right-3 z-[2]">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tabular-nums text-violet-100 bg-violet-500/20 border border-violet-400/30 backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-violet-300" strokeWidth={2} />
              {cost}
              <span className="text-violet-300/80 font-medium">{t("label_credits_short")}</span>
            </span>
          </div>

          <span className="absolute bottom-3 right-3 z-[2] flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white border border-white/15 backdrop-blur-md opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 group-hover:bg-violet-500/25">
            <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
          </span>
        </div>

        <div className="relative flex flex-1 flex-col gap-2 p-4 sm:p-5 border-t border-white/[0.05]">
          <h3 className="text-[17px] sm:text-[18px] font-semibold text-white leading-snug tracking-[-0.02em] font-['Inter_Tight'] group-hover:text-violet-50 transition-colors line-clamp-2">
            {t(category.nameKey)}
          </h3>
          <p className="text-[13px] sm:text-[14px] text-zinc-400 leading-relaxed line-clamp-3 flex-1">
            {t(category.descKey)}
          </p>
          <div className="pt-2 flex items-center justify-between gap-3 mt-auto">
            <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-violet-400/90">
              {cost} {t("label_credits")}
            </span>
            <span className="text-[11px] font-medium text-zinc-500 group-hover:text-violet-300/90 transition-colors">
              {t("vid_grid_open")}
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
