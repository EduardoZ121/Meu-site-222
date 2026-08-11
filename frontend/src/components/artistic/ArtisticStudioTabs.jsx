import { Palette, Sparkles, Brain } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "../../lib/i18n";

const TABS = [
  { id: "generate", icon: Brain, labelKey: "art_tab_prompt" },
  { id: "style", icon: Palette, labelKey: "art_tab_style" },
  { id: "effects", icon: Sparkles, labelKey: "art_tab_effects" },
];

export default function ArtisticStudioTabs({ value, onChange, className = "" }) {
  const { t } = useI18n();

  return (
    <div
      className={`art-studio-tabs lg:hidden ${className}`}
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
