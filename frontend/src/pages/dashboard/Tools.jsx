import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles, Play, LayoutGrid, Wrench, Lightbulb, Film, Scissors,
} from "lucide-react";
import ToolsHubCard from "../../components/tools/ToolsHubCard";
import useTitle from "../../lib/useTitle";
import { usePricing } from "../../lib/PricingContext";
import { useI18n } from "../../lib/i18n";
import { useAuth } from "../../lib/auth";
import { useLocalizedTools } from "../../lib/useLocalizedTools";
import { usePinnedTools } from "../../hooks/usePinnedTools";
import { toolCatalogueCost, videoCatalogueCost } from "../../lib/pricingRegions";
import { getVideoCategoriesForUser } from "../../lib/videoCatalogue";
import { cn } from "../../lib/utils";
import StudioHelpTip from "../../components/studio/StudioHelpTip";
import { scrollStudioToTop } from "../../lib/scrollToStudioResult";
import { CLIENT_BUILD_ID } from "../../lib/buildInfo";

const pageEase = [0.16, 1, 0.3, 1];

const GRID_CLASS =
  "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-2.5 md:gap-3";

const IMAGE_CATEGORIES = [
  { id: "all", labelKey: "tools_grid.filter_all", icon: LayoutGrid },
  { id: "generation", labelKey: "tools_grid.cat_generation", icon: Sparkles },
  { id: "utility", labelKey: "tools_grid.cat_utility", icon: Wrench },
  { id: "creative", labelKey: "tools_grid.cat_creative", icon: Lightbulb },
];

const VIDEO_CATEGORIES_FILTER = [
  { id: "all", labelKey: "tools_grid.filter_all", icon: LayoutGrid },
  { id: "create", labelKey: "vid_section_create", icon: Film },
  { id: "edit", labelKey: "vid_section_edit", icon: Scissors },
];

const APP_VERSION = "2.0";

function FilterPills({ items, value, onChange, testIdPrefix }) {
  return (
    <div
      className="rp-tools-hub-filters flex gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5 scrollbar-none"
      role="tablist"
      data-testid={testIdPrefix}
    >
      {items.map(({ id, label, icon: Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            data-testid={`${testIdPrefix}-${id}`}
            className={active ? "rp-tools-hub-pill rp-tools-hub-pill--active" : "rp-tools-hub-pill"}
          >
            {Icon && <Icon className="rp-tools-hub-pill__ico" strokeWidth={1.75} aria-hidden />}
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default function Tools() {
  const { t } = useI18n();
  const { user } = useAuth();
  const tools = useLocalizedTools();
  const { region, costs } = usePricing();
  const { isPinned, togglePin, pinnedIds } = usePinnedTools();
  useTitle(t("tools_grid.page_eyebrow"));

  const [view, setView] = useState("all");
  const [tier, setTier] = useState("image");
  const [imageCategory, setImageCategory] = useState("all");
  const [videoCategory, setVideoCategory] = useState("all");
  const [showNewOnly, setShowNewOnly] = useState(false);

  const videoFlowCategories = useMemo(() => getVideoCategoriesForUser(user), [user]);

  const videoHubTools = useMemo(
    () => tools.filter((tool) => tool.tier === "video"),
    [tools],
  );

  const videoCategories = useMemo(() => {
    const flowTos = new Set(videoFlowCategories.map((c) => c.to));
    const hubs = videoHubTools
      .filter((tool) => !flowTos.has(tool.to))
      .map((tool) => ({
        id: tool.id,
        section: "create",
        to: tool.to,
        nameKey: `tool_${tool.id}_name`,
        descKey: `tool_${tool.id}_desc`,
        catalogueTool: tool,
      }));
    return [...hubs, ...videoFlowCategories];
  }, [videoFlowCategories, videoHubTools]);

  const imageTools = useMemo(
    () => tools.filter((tool) => tool.tier === "image"),
    [tools],
  );

  const imageCategoryFilters = useMemo(
    () => IMAGE_CATEGORIES.map((c) => ({ ...c, label: t(c.labelKey) })),
    [t],
  );

  const videoCategoryFilters = useMemo(
    () => VIDEO_CATEGORIES_FILTER.map((c) => ({ ...c, label: t(c.labelKey) })),
    [t],
  );

  const tierTabs = useMemo(() => [
    { id: "image", label: t("tools_grid.tab_image"), icon: Sparkles },
    { id: "video", label: t("tools_grid.tab_video"), icon: Play },
  ], [t]);

  const filteredImageTools = useMemo(() => {
    let list = imageTools;
    if (imageCategory !== "all") {
      list = list.filter((tool) => tool.category === imageCategory);
    }
    if (view === "pinned") {
      list = list.filter((tool) => isPinned(tool.id));
    }
    if (showNewOnly) {
      list = list.filter((tool) => tool.isNew);
    }
    return list;
  }, [imageTools, imageCategory, view, isPinned, showNewOnly]);

  const filteredVideoTools = useMemo(() => {
    let list = videoCategories;
    if (videoCategory !== "all") {
      list = list.filter((cat) => cat.section === videoCategory);
    }
    if (view === "pinned") {
      list = list.filter((cat) => isPinned(cat.id));
    }
    if (showNewOnly) {
      list = list.filter((cat) => cat.catalogueTool?.isNew);
    }
    return list;
  }, [videoCategories, videoCategory, view, isPinned, showNewOnly]);

  const activeList = tier === "image" ? filteredImageTools : filteredVideoTools;
  const tabCount = tier === "image" ? imageTools.length : videoCategories.length;

  const versionLabel = useMemo(() => {
    const build = (CLIENT_BUILD_ID || "").trim();
    const display = build && build !== APP_VERSION ? `${APP_VERSION} · ${build}` : APP_VERSION;
    return t("tools_grid.end_footer_version", { v: display });
  }, [t]);

  const clearNewFilter = useCallback(() => {
    if (showNewOnly) setShowNewOnly(false);
  }, [showNewOnly]);

  const handleExploreNew = useCallback(() => {
    setView("all");
    setImageCategory("all");
    setVideoCategory("all");
    setShowNewOnly(true);

    const hasNewVideo = tools.some((tool) => tool.tier === "video" && tool.isNew);
    const hasNewImage = tools.some((tool) => tool.tier === "image" && tool.isNew);
    if (hasNewVideo) setTier("video");
    else if (hasNewImage) setTier("image");

    scrollStudioToTop("smooth");
  }, [tools]);

  return (
    <div className="rp-tools-hub w-full max-w-[1200px] mx-auto pb-8" data-testid="tools-page">
      <header className="mb-4 md:mb-6">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="sr-only">{t("tools_grid.page_title")}</h1>
            <p className="hidden md:block text-[11px] uppercase tracking-[0.18em] text-[#8A8A8E] mb-2">
              {t("tools_grid.page_eyebrow")}
            </p>
            <p className="hidden md:block text-[15px] text-[#8A8A8E] max-w-lg leading-snug">
              {t("tools_grid.page_desc", { n: tabCount })}
            </p>
          </div>
          <StudioHelpTip helpKey="help_page_tools" size="lg" testId="tools-page-help" className="hidden md:flex mt-1 shrink-0" />
        </div>
      </header>

      <div className="rp-tools-hub-view-tabs mb-3 flex items-center gap-5 border-b border-white/[0.06]">
        {[
          { id: "all", label: t("tools_grid.tab_all") },
          { id: "pinned", label: t("tools_grid.tab_pinned") },
        ].map(({ id, label }) => {
          const active = view === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                clearNewFilter();
                setView(id);
              }}
              data-testid={`tools-view-${id}`}
              className={cn(
                "rp-tools-hub-view-tab relative pb-2.5 text-[14px] font-medium transition-colors",
                active && "rp-tools-hub-view-tab--active",
              )}
            >
              {label}
              {id === "pinned" && pinnedIds.length > 0 && (
                <span className="ml-1.5 text-[11px] text-[#7c3aed] tabular-nums opacity-80">
                  {pinnedIds.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div
        className="rp-tools-hub-tier-tabs mb-3 grid grid-cols-2 gap-2"
        role="tablist"
        aria-label={t("tools_grid.page_eyebrow")}
        data-testid="tools-tier-tabs"
      >
        {tierTabs.map(({ id, label, icon: Icon }) => {
          const active = tier === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                clearNewFilter();
                setTier(id);
              }}
              data-testid={id === "image" ? "tab-image" : "tab-video"}
              className={active ? "rp-tools-hub-tier-tab rp-tools-hub-tier-tab--active" : "rp-tools-hub-tier-tab"}
            >
              <Icon className="rp-tools-hub-tier-tab__ico" strokeWidth={1.75} aria-hidden />
              <span className="rp-tools-hub-tier-tab__label">{label}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-4">
        {tier === "image" ? (
          <FilterPills
            items={imageCategoryFilters}
            value={imageCategory}
            onChange={(id) => {
              clearNewFilter();
              setImageCategory(id);
            }}
            testIdPrefix="tools-image-filter"
          />
        ) : (
          <FilterPills
            items={videoCategoryFilters}
            value={videoCategory}
            onChange={(id) => {
              clearNewFilter();
              setVideoCategory(id);
            }}
            testIdPrefix="tools-video-filter"
          />
        )}
      </div>

      <p className="text-[11px] text-[#5A5A5E] mb-3 font-mono uppercase tracking-[0.12em]">
        {t("tools_grid.count_label", { n: activeList.length })}
      </p>

      <AnimatePresence mode="sync">
        <motion.div
          key={`${tier}-${view}-${tier === "image" ? imageCategory : videoCategory}-${showNewOnly ? "new" : "all"}`}
          role="tabpanel"
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          data-testid={tier === "image" ? "tools-grid-sections" : "tools-video-sections"}
        >
          {activeList.length === 0 ? (
            <div
              className="rounded-2xl bg-[#141418]/80 px-6 py-12 text-center shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
              data-testid="tools-empty"
            >
              <p className="text-[#8A8A8E] text-[14px]">
                {view === "pinned" ? t("tools_grid.pinned_empty") : t("tools_grid.empty_filter")}
              </p>
            </div>
          ) : (
            <div className={GRID_CLASS} data-testid={`tools-grid-${tier}`}>
              {tier === "image"
                ? filteredImageTools.map((tool, index) => (
                    <ToolsHubCard
                      key={tool.id}
                      id={tool.id}
                      name={tool.name}
                      to={tool.to}
                      tier="image"
                      cost={toolCatalogueCost(tool.id, region)}
                      isFree={tool.cost <= 0}
                      isNew={tool.isNew}
                      isBeta={tool.isBeta}
                      index={index}
                      pinned={isPinned(tool.id)}
                      onTogglePin={togglePin}
                      t={t}
                    />
                  ))
                : filteredVideoTools.map((category, index) => (
                    <ToolsHubCard
                      key={category.id}
                      id={category.id}
                      name={category.catalogueTool?.name || t(category.nameKey)}
                      to={category.to}
                      tier="video"
                      cost={
                        category.catalogueTool
                          ? toolCatalogueCost(category.id, region)
                          : videoCatalogueCost(costs, category)
                      }
                      isNew={category.catalogueTool?.isNew}
                      index={index}
                      pinned={isPinned(category.id)}
                      onTogglePin={togglePin}
                      t={t}
                      testId={`video-card-${category.id}`}
                    />
                  ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <motion.section
        className="rp-tools-end"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.45, ease: pageEase }}
        data-testid="tools-end"
      >
        <div className="rp-tools-cta">
          <h2 className="rp-tools-cta__title">{t("tools_grid.end_cta_title")}</h2>
          <p className="rp-tools-cta__body">{t("tools_grid.end_cta_body")}</p>
          <button
            type="button"
            className="rp-tools-cta__btn"
            onClick={handleExploreNew}
            data-testid="tools-end-cta"
          >
            <Sparkles className="rp-tools-cta__btn-ico" strokeWidth={1.75} aria-hidden />
            {t("tools_grid.end_cta_button")}
          </button>
        </div>
        <footer className="rp-tools-end__footer">
          <p className="rp-tools-end__copy">{t("tools_grid.end_footer_copy")}</p>
          <p className="rp-tools-end__version">{versionLabel}</p>
        </footer>
      </motion.section>
    </div>
  );
}
