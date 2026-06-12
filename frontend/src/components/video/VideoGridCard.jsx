import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Briefcase,
  Clapperboard,
  Film,
  ImageIcon,
  Layers,
  Megaphone,
  Mountain,
  Palette,
  PartyPopper,
  Shirt,
  Sparkles,
  Type,
  Zap,
} from "lucide-react";
import { usePricing } from "../../lib/PricingContext";

const cardEase = [0.16, 1, 0.3, 1];

const ICONS = {
  type: Type,
  image: ImageIcon,
  clapperboard: Clapperboard,
  film: Film,
  megaphone: Megaphone,
  zap: Zap,
  sparkles: Sparkles,
  layers: Layers,
  briefcase: Briefcase,
  party: PartyPopper,
  mountain: Mountain,
  shirt: Shirt,
  palette: Palette,
};

const ICON_STYLES = {
  type: "from-violet-600/40 to-indigo-900/60 text-violet-200",
  image: "from-cyan-600/35 to-violet-900/55 text-cyan-100",
  clapperboard: "from-fuchsia-600/35 to-violet-900/55 text-fuchsia-100",
  film: "from-teal-600/35 to-emerald-900/55 text-teal-100",
  megaphone: "from-amber-600/30 to-orange-900/50 text-amber-100",
  zap: "from-emerald-600/30 to-teal-900/50 text-emerald-100",
  sparkles: "from-violet-600/35 to-fuchsia-900/50 text-violet-100",
  layers: "from-blue-600/30 to-indigo-900/50 text-blue-100",
  briefcase: "from-stone-600/30 to-zinc-900/50 text-stone-100",
  party: "from-pink-600/30 to-rose-900/50 text-pink-100",
  mountain: "from-sky-600/30 to-blue-900/50 text-sky-100",
  shirt: "from-purple-600/30 to-violet-900/50 text-purple-100",
  palette: "from-rose-600/30 to-orange-900/50 text-rose-100",
};

export default function VideoGridCard({ category, index, t }) {
  const { costs } = usePricing();
  const cost = costs[category.costKey] ?? costs.video ?? 50;
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
        className="rp-glass-card rp-glass-card--roomy group relative flex h-full flex-col hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
        data-testid={`video-card-${category.id}`}
      >
        <div className={`rp-glass-card__media aspect-[16/10] bg-gradient-to-br ${iconStyle}`}>
          <div className="absolute inset-0 flex items-center justify-center z-[3]">
            <div className="w-16 h-16 rounded-2xl border border-white/20 bg-white/[0.08] backdrop-blur-md flex items-center justify-center shadow-[0_0_40px_-8px_rgba(124,58,237,0.5)]">
              <Icon className="w-8 h-8" strokeWidth={1.5} />
            </div>
          </div>
          <div className="rp-glass-card__media-shade" aria-hidden />

          <div className="absolute top-3 left-3 z-[2] flex flex-col gap-1.5">
            {category.badgeKey && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium text-violet-100 bg-violet-500/15 border border-violet-400/25 backdrop-blur-md">
                {t(category.badgeKey)}
              </span>
            )}
            {category.id === "image" && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium text-cyan-100 bg-cyan-500/10 border border-cyan-400/25 backdrop-blur-md">
                {t("vid_image_price_hint", { n: costs.videoImage ?? 150 })}
              </span>
            )}
          </div>

          <div className="absolute top-3 right-3 z-[2]">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tabular-nums text-[#f4e8d4] bg-[#c7a77a]/15 border border-[#c7a77a]/35 backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-[#c7a77a]" strokeWidth={2} />
              {cost}
              <span className="text-[#c7a77a]/90 font-medium">{t("label_credits_short")}</span>
            </span>
          </div>

          <span className="absolute bottom-3 right-3 z-[2] flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white border border-white/15 backdrop-blur-md opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 group-hover:bg-violet-500/25">
            <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
          </span>
        </div>

        <div className="rp-glass-card__body gap-2 p-4 sm:p-5">
          <h3 className="text-[17px] sm:text-[18px] font-semibold text-white leading-snug tracking-[-0.02em] font-['Inter_Tight'] group-hover:text-violet-50 transition-colors line-clamp-2">
            {t(category.nameKey)}
          </h3>
          <p className="text-[13px] sm:text-[14px] text-zinc-400 leading-relaxed line-clamp-3 flex-1">
            {t(category.descKey)}
          </p>
          <div className="pt-2 flex items-center justify-between gap-3 mt-auto">
            <span className="text-[11px] font-semibold tracking-wide rp-type-value">
              {cost} {t("label_credits")}
            </span>
            <span className="text-[11px] font-medium text-zinc-500 group-hover:text-[#d4bc94] transition-colors">
              {t("vid_grid_open")}
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
