import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { VIDEO_SECTIONS, categoriesForSection } from "../../lib/videoCatalogue";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { usePricing } from "../../lib/PricingContext";
import { videoCatalogueCost } from "../../lib/pricingRegions";
import useTitle from "../../lib/useTitle";
import ToolsHubCard from "../../components/tools/ToolsHubCard";
import StudioHelpTip from "../../components/studio/StudioHelpTip";

const pageEase = [0.16, 1, 0.3, 1];
const GRID_CLASS = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5 md:gap-3";

const SECTION_FILTERS = [
  { id: "all", labelKey: "tools_grid.filter_all" },
  { id: "create", labelKey: "vid_section_create" },
  { id: "edit", labelKey: "vid_section_edit" },
];

export default function Video() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { costs } = usePricing();
  useTitle(t("sidebar_video"));
  const [sectionFilter, setSectionFilter] = useState("all");

  const sections = useMemo(
    () => VIDEO_SECTIONS.map((section) => ({
      ...section,
      categories: categoriesForSection(section.id, user),
    })).filter((section) => section.categories.length > 0),
    [user],
  );

  const filteredSections = useMemo(() => {
    if (sectionFilter === "all") return sections;
    return sections.filter((s) => s.id === sectionFilter);
  }, [sections, sectionFilter]);

  const totalCards = useMemo(
    () => filteredSections.reduce((n, s) => n + s.categories.length, 0),
    [filteredSections],
  );

  const featured = [
    { id: "marketing-video", to: "/app/marketing-video", titleKey: "vid_cat_marketing_video_ai", descKey: "mktvid_subtitle", linkKey: "sidebar_marketing_video", border: "border-violet-500/30 bg-violet-500/10", linkClass: "text-violet-300" },
    { id: "motion-flyer", to: "/app/motion-flyer", titleKey: "vid_cat_motion_flyer", descKey: "mfly_subtitle", linkKey: "sidebar_motion_flyer", border: "border-fuchsia-500/30 bg-fuchsia-500/10", linkClass: "text-fuchsia-300" },
  ];

  return (
    <div className="rp-tools-hub w-full max-w-[1200px] mx-auto pb-20" data-testid="video-page">
      <header className="mb-4 md:mb-6">
        <div className="flex items-start gap-2 mb-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#8A8A8E]">{t("vid_cap")}</p>
          <StudioHelpTip helpKey="help_page_video" size="lg" testId="video-page-help" />
        </div>
        <p className="text-[15px] text-[#8A8A8E] max-w-lg leading-snug">{t("vid_grid_desc")}</p>
      </header>

      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        {featured.map((item) => (
          <div
            key={item.id}
            className={`rounded-xl border ${item.border} px-3 py-2.5 md:px-4 md:py-3`}
            data-testid={`${item.id}-feature-cta`}
          >
            <p className="text-[11px] md:text-[12px] text-[#C4B5FD] leading-relaxed line-clamp-2 md:line-clamp-none">
              <strong className="text-[#E9E4DC]">{t(item.titleKey)}</strong>
              {" — "}
              {t(item.descKey)}
            </p>
            <Link
              to={item.to}
              className={`inline-flex mt-2 text-[12px] font-medium hover:text-white underline underline-offset-2 ${item.linkClass}`}
              data-testid={`${item.id}-feature-link`}
            >
              {t(item.linkKey)} →
            </Link>
          </div>
        ))}
      </div>

      <div
        className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none"
        role="tablist"
        data-testid="video-section-filter"
      >
        {SECTION_FILTERS.map(({ id, labelKey }) => {
          const active = sectionFilter === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSectionFilter(id)}
              data-testid={`video-filter-${id}`}
              className={active ? "rp-tools-hub-pill rp-tools-hub-pill--active" : "rp-tools-hub-pill"}
            >
              {t(labelKey)}
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-[#5A5A5E] mb-3 font-mono uppercase tracking-[0.12em]">
        {t("tools_grid.count_label", { n: totalCards })}
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={sectionFilter}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: pageEase }}
          className="space-y-6 md:space-y-8"
        >
          {filteredSections.map((section) => (
            <section key={section.id} data-testid={`video-section-${section.id}`}>
              <h2 className="text-[12px] font-medium text-[#8A8A8E] mb-3 font-display">
                {t(section.titleKey)}
              </h2>
              <div className={GRID_CLASS} data-testid={`video-cards-${section.id}`}>
                {section.categories.map((category, index) => (
                  <ToolsHubCard
                    key={category.id}
                    id={category.id}
                    name={t(category.nameKey)}
                    to={category.to}
                    tier="video"
                    cost={videoCatalogueCost(costs, category)}
                    index={index}
                    t={t}
                    testId={`video-card-${category.id}`}
                  />
                ))}
              </div>
            </section>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
