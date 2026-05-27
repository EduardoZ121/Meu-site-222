import { Check, Palette, Sparkles, Wand2 } from "lucide-react";
import { useI18n } from "../../lib/i18n";

const STEPS = [
  { id: "style", icon: Palette, labelKey: "art_flow_step_style", hintKey: "art_flow_step_style_hint" },
  { id: "effects", icon: Sparkles, labelKey: "art_flow_step_effects", hintKey: "art_flow_step_effects_hint" },
  { id: "generate", icon: Wand2, labelKey: "art_flow_step_generate", hintKey: "art_flow_step_generate_hint" },
];

export default function ArtisticFlowSteps({ activeStep = "generate", styleSelected = false }) {
  const { t } = useI18n();
  const activeIndex = STEPS.findIndex((s) => s.id === activeStep);

  return (
    <nav
      className="art-studio-flow mb-5 md:mb-6 rounded-xl border border-[rgba(147,51,234,0.22)] bg-[rgba(12,12,18,0.85)] p-3 md:p-4"
      aria-label={t("art_flow_title")}
      data-testid="artistic-flow-steps"
    >
      <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#A855F7] mb-3">
        {t("art_flow_title")}
      </p>
      <ol className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const done = step.id === "style" ? styleSelected : index < activeIndex;
          const active = step.id === activeStep;
          return (
            <li
              key={step.id}
              className={`art-studio-flow__step ${active ? "art-studio-flow__step--active" : ""} ${done ? "art-studio-flow__step--done" : ""}`}
            >
              <span className="art-studio-flow__num">
                {done ? <Check className="w-3 h-3" strokeWidth={2.5} /> : index + 1}
              </span>
              <div className="min-w-0">
                <p className="art-studio-flow__label flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" strokeWidth={1.75} />
                  {t(step.labelKey)}
                </p>
                <p className="art-studio-flow__hint">{t(step.hintKey)}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
