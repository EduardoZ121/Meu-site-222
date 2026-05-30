import { getPremiumArtisticEffects } from "../../lib/creditPricing";
import { usePricing } from "../../lib/PricingContext";
import { useI18n } from "../../lib/i18n";

function isPremiumEffect(region, sectionId, optionId) {
  return getPremiumArtisticEffects(region).includes(`${sectionId}:${optionId}`);
}

export default function ArtisticEffectsPanel({
  sections,
  effects,
  onRadioChange,
  onToggleChange,
}) {
  const { t } = useI18n();
  const { region } = usePricing();

  return (
    <div className="space-y-6" data-testid="artistic-effects-panel">
      {sections.map((section) => (
        <div key={section.id} className="as-v2-effect-section">
          <p className="rp-editor-section-cap !mb-3">{section.title}</p>
          <div className="flex flex-wrap gap-2">
            {section.options.map((opt) => {
              const premium = isPremiumEffect(region, section.id, opt.id);
              if (section.type === "radio") {
                const active = effects[section.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onRadioChange(section.id, active ? null : opt.id)}
                    className={`as-v2-effect-chip ${active ? "as-v2-effect-chip--active" : ""}`}
                    data-testid={`artistic-effect-${section.id}-${opt.id}`}
                  >
                    {opt.label}
                    {premium ? <span className="as-v2-effect-premium">+</span> : null}
                  </button>
                );
              }
              const active = Boolean(effects[section.id]?.[opt.id]);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onToggleChange(section.id, opt.id)}
                  className={`as-v2-effect-chip ${active ? "as-v2-effect-chip--active" : ""}`}
                  data-testid={`artistic-effect-${section.id}-${opt.id}`}
                >
                  {opt.label}
                  {premium ? <span className="as-v2-effect-premium">+</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <p className="as-v2-soon-note">{t("art_module_style_hint")}</p>
    </div>
  );
}
