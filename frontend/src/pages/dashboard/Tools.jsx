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
        className="relative -mx-4 sm:-mx-6 md:-mx-10 px-4 sm:px-6 md:px-10 py-10 md:py-12 mb-6 md:mb-8 border-b border-white/5 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45, ease: pageEase }}
        aria-labelledby="tools-hero-title"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 to-black" aria-hidden />
        <div className="absolute inset-0 bg-[#6b21a8]/[0.06]" aria-hidden />
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(107,33,168,0.12), transparent 55%)",
          }}
        />

        <div className="relative mx-auto flex w-full max-w-xl flex-col items-center text-center">
          <p className="mb-2 text-[10px] sm:text-[11px] font-mono font-semibold uppercase tracking-[0.18em] text-violet-400/90">
            {t("tools_grid.page_eyebrow")}
          </p>

          <h1
            id="tools-hero-title"
            className="mb-3 text-5xl font-bold leading-[1.05] tracking-tighter text-white md:text-6xl"
          >
            {t("tools_grid.page_title")}
          </h1>

          <p className="max-w-[280px] text-[17px] leading-relaxed text-zinc-400">
            {t("tools_grid.page_desc_short", { n: filtered.length })}
          </p>

          <div
            className="mt-4 flex flex-wrap items-center justify-center gap-3"
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
                      ? "inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg shadow-purple-500/30 hover:scale-105 transition-all duration-300"
                      : "inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-400 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 hover:text-zinc-200 transition-all duration-300"
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  {label}
                </button>
              );
            })}
          </div>

          <p className="mt-2 text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-600">
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
