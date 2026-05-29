import { Palette, Sparkles, Wand2 } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "../../lib/i18n";

const TABS = [
  { id: "generate", icon: Wand2, labelKey: "art_tab_generate" },
  { id: "style", icon: Palette, labelKey: "art_tab_style" },
  { id: "effects", icon: Sparkles, labelKey: "art_tab_effects" },
];

export default function ArtisticStudioTabs({ value, onChange, className = "" }) {
  const { t } = useI18n();

  return (
    <div
      className={`art-studio-tabs lg:hidden sticky top-[64px] z-[20] mx-[-4px] px-1 py-1 backdrop-blur-md bg-[#0B0B0C]/85 border-y border-white/[0.06] ${className}`}
      role="tablist"
      data-testid="artistic-mobile-tabs"
    >
      {TABS.map((tab) => {
        const active = value === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`art-studio-tab ${active ? "art-studio-tab--active" : ""}`}
            data-testid={`artistic-tab-${tab.id}`}
          >
            {active && (
              <motion.span
                layoutId="art-studio-tab-pill"
                className="art-studio-tab__pill"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-[1] flex items-center justify-center gap-1.5">
              <Icon className="w-3.5 h-3.5" strokeWidth={active ? 2 : 1.75} />
              <span>{t(tab.labelKey)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
