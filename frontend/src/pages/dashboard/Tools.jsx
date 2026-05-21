import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import ToolThumb from "../../components/ToolThumb";
import useTitle from "../../lib/useTitle";
import { usePricing } from "../../lib/PricingContext";
import { useI18n } from "../../lib/i18n";
import { useLocalizedTools } from "../../lib/useLocalizedTools";
import { toolCatalogueCost } from "../../lib/pricingRegions";

export default function Tools() {
  const { t } = useI18n();
  const tools = useLocalizedTools();
  useTitle(t("tools_grid.page_eyebrow"));
  const { region } = usePricing();
  const [tab, setTab] = useState("image");
  const filtered = tools.filter((tool) => tool.tier === tab);

  return (
    <motion.div
      className="max-w-[1400px] mx-auto"
      data-testid="tools-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <header className="mb-8">
        <p className="text-[#7C3AED] text-[10px] font-mono uppercase tracking-[0.22em] mb-3">
          {t("tools_grid.page_eyebrow")}
        </p>
        <h1 className="text-[#F4F1EA] text-[40px] md:text-[56px] font-light tracking-[-0.02em] leading-[1.05] mb-4 font-['Inter_Tight']">
          {t("tools_grid.page_title")}
        </h1>
        <p className="text-[#8A8A8E] text-[16px] max-w-[600px]">
          {t("tools_grid.page_desc", { n: filtered.length })}
        </p>
      </header>

      <motion.div
        className="inline-flex items-center gap-1 p-1 mb-8 rounded-full border border-[#9333EA]/20 bg-black/30 backdrop-blur-sm"
        data-testid="tools-tabs"
        layout
      >
        {[
          { id: "image", label: t("tools_grid.tab_image"), testId: "tab-image" },
          { id: "video", label: t("tools_grid.tab_video"), testId: "tab-video" },
        ].map(({ id, label, testId }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`relative px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
              tab === id ? "text-white" : "text-[#8A8A8E] hover:text-[#F4F1EA]"
            }`}
            data-testid={testId}
          >
            {tab === id && (
              <motion.span
                layoutId="tools-tab-pill"
                className="absolute inset-0 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#9333EA] shadow-[0_0_24px_-6px_rgba(168,85,247,0.55)]"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{label}</span>
          </button>
        ))}
      </motion.div>

      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 sm:gap-3"
        data-testid="tools-grid"
      >
        {filtered.map((tool, i) => (
          <motion.div
            key={tool.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.35,
              delay: Math.min(i * 0.04, 0.35),
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <Link
              to={tool.to}
              className="rp-tool-card group block relative rounded-xl overflow-hidden border border-[rgba(147,51,234,0.2)] bg-[#13131A] shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[#A855F7]/45 hover:shadow-[0_12px_32px_-14px_rgba(124,58,237,0.4)]"
              data-testid={`tool-${tool.id}`}
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-[#0B0B0C]">
                <motion.div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.03]">
                  <ToolThumb id={tool.id} name={tool.name} />
                </motion.div>
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none z-[1]"
                  aria-hidden
                />
                {tool.isNew && (
                  <span className="rp-badge-pulse absolute top-2 left-2 z-[2] px-2 py-0.5 rounded-full text-[8px] font-mono font-medium uppercase tracking-wider bg-[#7C3AED]/90 text-white">
                    {t("label_new")}
                  </span>
                )}
                {tool.isBeta && (
                  <span className="absolute top-2 left-2 z-[2] px-2 py-0.5 rounded-full text-[8px] font-mono font-medium uppercase tracking-wider bg-amber-500/25 text-amber-100 border border-amber-400/35">
                    {t("badge_beta")}
                  </span>
                )}
                <span
                  className={`absolute top-2 right-2 z-[2] px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider backdrop-blur-sm ${
                    tool.cost > 0
                      ? "bg-[#7C3AED]/15 text-[#A855F7]"
                      : "bg-white/10 text-[#C4B5FD]"
                  }`}
                >
                  {tool.cost > 0
                    ? `${toolCatalogueCost(tool.id, region)} ${t("label_credits_short")}`
                    : t("label_free")}
                </span>
                <span className="absolute bottom-2 right-2 z-[2] flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white opacity-0 scale-90 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 backdrop-blur-sm border border-white/15">
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                </span>
              </div>
              <div className="p-2.5 sm:p-3">
                <h3 className="text-sm font-semibold text-white leading-snug line-clamp-1">{tool.name}</h3>
                {tool.desc && (
                  <p className="text-xs text-gray-400 leading-snug mt-1 line-clamp-2">{tool.desc}</p>
                )}
                {tool.cost > 0 ? (
                  <p className="text-[10px] font-mono tracking-wider text-[#A855F7] mt-1.5">
                    {toolCatalogueCost(tool.id, region)} {t("label_credits")}
                  </p>
                ) : (
                  <p className="text-[10px] font-mono tracking-wider text-[#C4B5FD] mt-1.5">
                    {t("label_free")}
                  </p>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
