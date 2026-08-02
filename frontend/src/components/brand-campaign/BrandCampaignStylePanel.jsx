import CollapsibleSection from "../CollapsibleSection";
import { useI18n } from "../../lib/i18n";
import { BrandStyleIcon } from "../../lib/brandCampaignStyleIcons";
import { cn } from "../../lib/utils";

const STYLE_CATEGORY_COLORS = {
  fashion: { active: "bg-pink-500/25 text-pink-100", idle: "bg-pink-500/10 text-pink-300" },
  cars: { active: "bg-sky-500/25 text-sky-100", idle: "bg-sky-500/10 text-sky-300" },
  cosmetics: { active: "bg-fuchsia-500/25 text-fuchsia-100", idle: "bg-fuchsia-500/10 text-fuchsia-300" },
  food: { active: "bg-orange-500/25 text-orange-100", idle: "bg-orange-500/10 text-orange-300" },
  drinks: { active: "bg-rose-500/25 text-rose-100", idle: "bg-rose-500/10 text-rose-300" },
  websites: { active: "bg-indigo-500/25 text-indigo-100", idle: "bg-indigo-500/10 text-indigo-300" },
  people: { active: "bg-teal-500/25 text-teal-100", idle: "bg-teal-500/10 text-teal-300" },
  tech: { active: "bg-cyan-500/25 text-cyan-100", idle: "bg-cyan-500/10 text-cyan-300" },
  jewelry: { active: "bg-amber-500/25 text-amber-100", idle: "bg-amber-500/10 text-amber-300" },
  fitness: { active: "bg-emerald-500/25 text-emerald-100", idle: "bg-emerald-500/10 text-emerald-300" },
  realEstate: { active: "bg-lime-500/25 text-lime-100", idle: "bg-lime-500/10 text-lime-300" },
  random: { active: "bg-purple-500/25 text-purple-100", idle: "bg-purple-500/10 text-purple-300" },
  general: { active: "bg-violet-500/25 text-violet-100", idle: "bg-white/[0.04] text-[#9CA3AF]" },
};

function categoryColor(id, active) {
  const c = STYLE_CATEGORY_COLORS[id] || STYLE_CATEGORY_COLORS.general;
  return active ? c.active : c.idle;
}

function StylePanelBody({
  categories,
  category,
  onCategoryChange,
  presetMode,
  onPresetModeChange,
  disabled,
  t,
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-mono uppercase tracking-wider text-[#6b6b70] mb-2">
          {t("bc_style_category_label")}
        </p>
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[40vh] overflow-y-auto overscroll-contain pr-0.5"
          data-testid="bc-style-categories"
        >
          {categories.map((cat) => {
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                disabled={disabled}
                onClick={() => onCategoryChange(cat.id)}
                data-testid={`bc-style-cat-${cat.id}`}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-all",
                  active
                    ? "border-violet-500/60 bg-violet-600/20 text-violet-100 shadow-[0_0_16px_-6px_rgba(139,92,246,0.7)]"
                    : "border-white/[0.08] bg-[#0B0B0C]/50 text-[#8A8A8E] hover:border-white/20 hover:text-white",
                )}
              >
                <span className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  categoryColor(cat.id, active),
                )}
                >
                  <BrandStyleIcon name={cat.icon} className="w-4 h-4" />
                </span>
                <span className="text-[11px] font-medium leading-tight line-clamp-2">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-mono uppercase tracking-wider text-[#6b6b70] mb-2">
          {t("bc_style_mode_label")}
        </p>
        <div className="flex flex-wrap gap-2" data-testid="bc-style-mode">
          {[
            { id: "auto", label: t("bc_style_mode_auto") },
            { id: "random", label: t("bc_style_mode_random") },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              disabled={disabled}
              onClick={() => onPresetModeChange(mode.id)}
              data-testid={`bc-style-mode-${mode.id}`}
              className={cn(
                "px-3 py-2 rounded-lg text-[12px] font-medium border transition-all",
                presetMode === mode.id
                  ? "bg-violet-600/25 border-violet-500/50 text-violet-200"
                  : "border-white/[0.08] text-[#8A8A8E] hover:text-white",
              )}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-[#6b6b70] leading-relaxed">
          {presetMode === "random" ? t("bc_style_mode_random_hint") : t("bc_style_mode_auto_hint")}
        </p>
      </div>
    </div>
  );
}

export default function BrandCampaignStylePanel({
  categories = [],
  category,
  onCategoryChange,
  presetMode,
  onPresetModeChange,
  disabled = false,
  presetCount = 0,
  /** When true (inside SettingModal), skip outer CollapsibleSection. */
  embedded = false,
}) {
  const { t } = useI18n();
  const body = (
    <StylePanelBody
      categories={categories}
      category={category}
      onCategoryChange={onCategoryChange}
      presetMode={presetMode}
      onPresetModeChange={onPresetModeChange}
      disabled={disabled}
      t={t}
    />
  );

  if (embedded) {
    return (
      <div data-testid="bc-style-panel">
        <p className="text-[11px] text-[#6b6b70] mb-3 leading-relaxed">
          {t("bc_style_hint", { n: presetCount || 60 })}
        </p>
        {body}
      </div>
    );
  }

  return (
    <CollapsibleSection
      title={t("bc_style_title")}
      hint={t("bc_style_hint", { n: presetCount || 60 })}
      defaultOpen={false}
      optional
      testId="bc-style-panel"
    >
      {body}
    </CollapsibleSection>
  );
}
