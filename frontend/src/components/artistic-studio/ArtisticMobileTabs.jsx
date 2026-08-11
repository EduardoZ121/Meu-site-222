import { Palette, Sparkles, Wand2 } from "lucide-react";
import { useI18n } from "../../lib/i18n";

const MOBILE_TABS = [
  { id: "style", icon: Palette, labelKey: "art_tab_style" },
  { id: "effects", icon: Sparkles, labelKey: "art_tab_effects" },
  { id: "prompt", icon: Wand2, labelKey: "art_tab_prompt" },
];

export default function ArtisticMobileTabs({ value, onChange }) {
  const { t } = useI18n();

  return (
    <div
      className="as-v2-mobile-tabs xl:hidden"
      role="tablist"
      aria-label={t("art_page_title")}
      data-testid="artistic-mobile-tabs"
    >
      {MOBILE_TABS.map((tab) => {
        const active = value === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`as-v2-mobile-tab ${active ? "as-v2-mobile-tab--active" : ""}`}
            data-testid={`artistic-mobile-tab-${tab.id}`}
          >
            <Icon className="w-3.5 h-3.5" strokeWidth={active ? 2 : 1.75} />
            <span>{t(tab.labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
}
