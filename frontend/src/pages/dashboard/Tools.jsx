import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, Film } from "lucide-react";
import ToolsGridCard from "../../components/tools/ToolsGridCard";
import VideoGridCard from "../../components/video/VideoGridCard";
import useTitle from "../../lib/useTitle";
import { usePricing } from "../../lib/PricingContext";
import { useI18n } from "../../lib/i18n";
import { useLocalizedTools } from "../../lib/useLocalizedTools";
import { IMAGE_TOOL_SECTIONS } from "../../lib/toolsCatalogue";
import { VIDEO_CATEGORIES } from "../../lib/videoCatalogue";

const pageEase = [0.16, 1, 0.3, 1];

const TOOL_GRID_CLASS =
  "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 sm:gap-3";

function ToolsCategorySection({ title, description, children, testId }) {
  return (
    <section className="mb-10 md:mb-12 last:mb-0" data-testid={testId}>
      <header className="mb-4 md:mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h2 className="text-[#F4F1EA] text-lg sm:text-xl font-semibold tracking-[-0.02em] font-['Inter_Tight']">
            {title}
          </h2>
          {description && (
            <p className="text-[#8A8A8E] text-[13px] mt-1 max-w-xl leading-relaxed">{description}</p>
          )}
        </div>
      </header>
      {children}
    </section>
  );
}

const TOOLS_TAB_KEY = "rp_tools_tab";

export default function Tools() {
  const { t } = useI18n();
  const tools = useLocalizedTools();
  useTitle(t("tools_grid.page_eyebrow"));
  const { region } = usePricing();
  const [tab, setTab] = useState(() => {
    try {
      const saved = sessionStorage.getItem(TOOLS_TAB_KEY);
      return saved === "video" ? "video" : "image";
    } catch {
      return "image";
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(TOOLS_TAB_KEY, tab);
    } catch {
      /* ignore */
    }
  }, [tab]);

  const imageTools = useMemo(
    () => tools.filter((tool) => tool.tier === "image"),
    [tools],
  );

  const sections = useMemo(() => {
    return IMAGE_TOOL_SECTIONS.map((section) => ({
      ...section,
      tools: imageTools.filter((tool) => tool.category === section.id),
    })).filter((section) => section.tools.length > 0);
  }, [imageTools]);

  const tabCount = tab === "image" ? imageTools.length : VIDEO_CATEGORIES.length;

  const tabs = [
    { id: "image", label: t("tools_grid.tab_image"), testId: "tab-image", icon: ImageIcon },
    { id: "video", label: t("tools_grid.tab_video"), testId: "tab-video", icon: Film },
  ];

  return (
    <div
      className="relative w-full max-w-[1400px] mx-auto -mt-8 md:-mt-12 pb-20 md:pb-24"
      data-testid="tools-page"
    >
      <motion.section
        className="relative -mx-4 sm:-mx-6 md:-mx-10 px-4 sm:px-6 md:px-10 pt-8 pb-10 md:pt-10 md:pb-12 mb-6 md:mb-8 border-b border-white/5 overflow-hidden"
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
            className="mb-3 text-4xl sm:text-5xl font-bold leading-[1.05] tracking-tighter text-white md:text-6xl"
          >
            {t("tools_grid.page_title")}
          </h1>

          <p className="max-w-[420px] text-[15px] leading-relaxed text-zinc-400">
            {t("tools_grid.page_desc", { n: tabCount })}
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

          <p className="mt-3 text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-600">
            {t("tools_grid.count_label", { n: tabCount })}
          </p>
        </div>
      </motion.section>

      <AnimatePresence mode="wait">
        {tab === "image" ? (
          <motion.div
            key="image"
            role="tabpanel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: pageEase }}
            data-testid="tools-grid-sections"
          >
            {sections.map((section, sectionIdx) => {
              const indexOffset = sections
                .slice(0, sectionIdx)
                .reduce((n, s) => n + s.tools.length, 0);
              return (
                <ToolsCategorySection
                  key={section.id}
                  title={t(section.labelKey)}
                  description={t(`tools_grid.cat_${section.id}_desc`)}
                  testId={`tools-section-${section.id}`}
                >
                  <div className={TOOL_GRID_CLASS} data-testid={`tools-grid-${section.id}`}>
                    {section.tools.map((tool, i) => (
                      <ToolsGridCard
                        key={tool.id}
                        tool={tool}
                        index={indexOffset + i}
                        region={region}
                        t={t}
                        compact
                      />
                    ))}
                  </div>
                </ToolsCategorySection>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="video"
            role="tabpanel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: pageEase }}
            data-testid="tools-video-sections"
          >
            <ToolsCategorySection
              title={t("tools_grid.cat_video")}
              description={t("tools_grid.cat_video_desc")}
              testId="tools-section-video"
            >
              <div className={TOOL_GRID_CLASS} data-testid="tools-grid-video">
                {VIDEO_CATEGORIES.map((category, index) => (
                  <VideoGridCard
                    key={category.id}
                    category={category}
                    index={index}
                    t={t}
                    compact
                  />
                ))}
              </div>
            </ToolsCategorySection>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
