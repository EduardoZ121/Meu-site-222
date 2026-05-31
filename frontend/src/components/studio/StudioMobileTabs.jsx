import { Image as ImageIcon, Sparkles } from "lucide-react";
import { useI18n } from "../../lib/i18n";

const TABS = [
  { id: "create", labelKey: "studio_tab_create", icon: Sparkles },
  { id: "result", labelKey: "studio_tab_result", icon: ImageIcon },
];

/** Create / Result tabs — visible below wide breakpoint. */
export default function StudioMobileTabs({ active, onChange, testIdPrefix = "studio", breakpoint = "xl" }) {
  const { t } = useI18n();
  const hideClass = breakpoint === "lg" ? "lg:hidden" : "xl:hidden";

  return (
    <div
      className={`${hideClass} flex gap-2 mb-5 p-1 rounded-xl border border-white/[0.08] bg-white/[0.03]`}
      role="tablist"
      data-testid={`${testIdPrefix}-mobile-tabs`}
    >
      {TABS.map(({ id, labelKey, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(id)}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? "bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(167,139,250,0.35)]"
                : "text-rp-mute2 hover:text-rp-mute"
            }`}
            data-testid={`${testIdPrefix}-tab-${id}`}
          >
            <Icon className="w-3.5 h-3.5" strokeWidth={isActive ? 2 : 1.75} />
            {t(labelKey)}
          </button>
        );
      })}
    </div>
  );
}
