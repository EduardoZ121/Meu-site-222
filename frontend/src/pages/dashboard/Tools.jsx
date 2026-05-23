import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, Film } from "lucide-react";
import ToolsGridCard from "../../components/tools/ToolsGridCard";
import useTitle from "../../lib/useTitle";
import { usePricing } from "../../lib/PricingContext";
import { useI18n } from "../../lib/i18n";
import { useLocalizedTools } from "../../lib/useLocalizedTools";

const pageEase = [0.16, 1, 0.3, 1];

export default function Tools() {
  const { t } = useI18n();
  const tools = useLocalizedTools();
  useTitle(t("tools_grid.page_eyebrow"));
  const { region } = usePricing();
  const [tab, setTab] = useState("image");
  const filtered = tools.filter((tool) => tool.tier === tab);

  const tabs = [
    { id: "image", label: t("tools_grid.tab_image"), testId: "tab-image", icon: ImageIcon },
    { id: "video", label: t("tools_grid.tab_video"), testId: "tab-video", icon: Film },
  ];

  return (
    <div
      className="relative w-full max-w-[1280px] mx-auto pb-20 md:pb-24"
      data-testid="tools-page"
    >
      <motion.section
        className="relative -mx-4 sm:-mx-6 md:-mx-10 px-4 sm:px-6 md:px-10 py-20 md:py-24 mb-10 md:mb-12 border-b border-white/5 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45, ease: pageEase }}
        aria-labelledby="tools-hero-title"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 to-black" aria-hidden />
        <div className="absolute inset-0 bg-[#6b21a8]/[0.07]" aria-hidden />
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 20% 0%, rgba(107,33,168,0.14), transparent 50%), radial-gradient(ellipse 50% 40% at 80% 20%, rgba(124,58,237,0.08), transparent 45%)",
          }}
        />

        <div className="relative max-w-3xl">
          <p className="inline-flex items-center gap-2 mb-5 text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-violet-400/90">
            <span className="h-px w-8 bg-gradient-to-r from-violet-500/80 to-transparent" aria-hidden />
            {t("tools_grid.page_eyebrow")}
          </p>

          <h1
            id="tools-hero-title"
            className="text-6xl sm:text-7xl font-bold tracking-tighter leading-none text-white font-['Inter_Tight'] drop-shadow-[0_2px_24px_rgba(0,0,0,0.45)] [text-shadow:0_0_48px_rgba(168,85,247,0.22)]"
          >
            {t("tools_grid.page_title")}
          </h1>

          <p className="mt-5 text-lg text-zinc-400 leading-relaxed max-w-md">
            {t("tools_grid.page_desc_short", { n: filtered.length })}
          </p>

          <div
            className="mt-10 flex flex-wrap items-center gap-3"
            data-testid="tools-tabs"
            role="tablist"
            aria-label={t("tools_grid.page_eyebrow")}
          >
            {tabs.map(({ id, label, testId, icon: Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(id)}
                  data-testid={testId}
                  className={
                    active
                      ? "inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg shadow-purple-500/30 hover:scale-105 transition-all duration-300"
                      : "inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl text-sm font-medium text-zinc-400 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 hover:text-zinc-200 transition-all duration-300"
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  {label}
                </button>
              );
            })}
          </div>

          <p className="mt-5 text-[11px] font-mono uppercase tracking-[0.16em] text-zinc-600">
            {t("tools_grid.count_label", { n: filtered.length })}
          </p>
        </div>
      </motion.section>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          role="tabpanel"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: pageEase }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6"
          data-testid="tools-grid"
        >
          {filtered.map((tool, i) => (
            <ToolsGridCard
              key={tool.id}
              tool={tool}
              index={i}
              region={region}
              t={t}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
