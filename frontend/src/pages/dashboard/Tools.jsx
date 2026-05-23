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
      className="relative w-full max-w-[1280px] mx-auto px-0 sm:px-1 pb-20 md:pb-24"
      data-testid="tools-page"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 left-[5%] h-[min(520px,80vw)] w-[min(520px,80vw)] rounded-full bg-violet-600/[0.18] blur-[100px]" />
        <div className="absolute top-[30%] -right-24 h-[400px] w-[400px] rounded-full bg-blue-600/[0.12] blur-[90px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[280px] w-[90%] max-w-3xl rounded-full bg-violet-900/[0.08] blur-[80px]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,58,237,0.15), transparent 55%)",
          }}
        />
      </div>

      <motion.header
        className="mb-10 md:mb-14 lg:mb-16 max-w-3xl"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: pageEase }}
      >
        <p className="inline-flex items-center gap-2 mb-4 text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-violet-400/90">
          <span className="h-px w-8 bg-gradient-to-r from-violet-500/80 to-transparent" aria-hidden />
          {t("tools_grid.page_eyebrow")}
        </p>
        <h1 className="text-[2.5rem] sm:text-[3.25rem] md:text-[3.75rem] lg:text-[4rem] font-semibold text-white tracking-[-0.04em] leading-[1.02] mb-5 font-['Inter_Tight']">
          <span className="bg-gradient-to-br from-white via-white to-zinc-400 bg-clip-text text-transparent">
            {t("tools_grid.page_title")}
          </span>
        </h1>
        <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl">
          {t("tools_grid.page_desc", { n: filtered.length })}
        </p>
      </motion.header>

      <motion.div
        className="mb-10 md:mb-12"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08, ease: pageEase }}
      >
        <div
          className="inline-flex flex-wrap items-center gap-1 p-1.5 rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl shadow-[0_8px_32px_-16px_rgba(0,0,0,0.6)]"
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
                className={`relative flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm font-medium transition-colors duration-300 ${
                  active ? "text-white" : "text-zinc-500 hover:text-zinc-200"
                }`}
                data-testid={testId}
              >
                {active && (
                  <motion.span
                    layoutId="tools-tab-pill"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 shadow-[0_0_32px_-8px_rgba(168,85,247,0.7),inset_0_1px_0_rgba(255,255,255,0.15)]"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <Icon className="relative z-10 w-4 h-4 shrink-0 opacity-80" strokeWidth={1.75} />
                <span className="relative z-10">{label}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-[12px] font-mono uppercase tracking-[0.16em] text-zinc-600">
          {t("tools_grid.count_label", { n: filtered.length })}
        </p>
      </motion.div>

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
