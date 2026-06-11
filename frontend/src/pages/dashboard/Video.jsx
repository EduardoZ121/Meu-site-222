import { useMemo } from "react";
import { VIDEO_SECTIONS, categoriesForSection } from "../../lib/videoCatalogue";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { usePricing } from "../../lib/PricingContext";
import useTitle from "../../lib/useTitle";
import ToolsHubCard from "../../components/tools/ToolsHubCard";

const GRID_CLASS = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5 md:gap-3";

export default function Video() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { costs } = usePricing();
  useTitle(t("sidebar_video"));

  const sections = useMemo(
    () => VIDEO_SECTIONS.map((section) => ({
      ...section,
      categories: categoriesForSection(section.id, user),
    })).filter((section) => section.categories.length > 0),
    [user],
  );

  return (
    <div
      className="relative w-full max-w-[1200px] mx-auto pb-20"
      data-testid="video-page"
    >
      <header className="mb-4 md:mb-6 hidden md:block">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#8A8A8E] mb-2">{t("vid_cap")}</p>
        <p className="text-[15px] text-[#8A8A8E] max-w-lg leading-snug">{t("vid_grid_desc")}</p>
      </header>

      <div className="space-y-6 md:space-y-8">
        {sections.map((section) => (
          <section key={section.id} data-testid={`video-section-${section.id}`}>
            <h2 className="text-[12px] font-medium text-[#8A8A8E] mb-3 font-['Inter_Tight']">
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
                  cost={costs[category.costKey] ?? costs.video ?? 50}
                  index={index}
                  t={t}
                  testId={`video-card-${category.id}`}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
