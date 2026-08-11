import { useState } from "react";
import { Check, ChevronDown, Palette, Sparkles, Wand2 } from "lucide-react";
import { useI18n } from "../../lib/i18n";

const STEPS = [
  { id: "style", icon: Palette, labelKey: "art_flow_step_style", hintKey: "art_flow_step_style_hint" },
  { id: "effects", icon: Sparkles, labelKey: "art_flow_step_effects", hintKey: "art_flow_step_effects_hint" },
  { id: "prompt", icon: Wand2, labelKey: "art_flow_step_generate", hintKey: "art_flow_step_generate_hint" },
];

export default function ArtisticFlowSteps({ activeStep = "style", styleSelected = false }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const activeIndex = STEPS.findIndex((s) => s.id === activeStep);
  const progressText = styleSelected
    ? `${Math.max(1, activeIndex + 1)}/${STEPS.length}`
    : `0/${STEPS.length}`;

  return (
    <nav
      className="as-v2-flow mb-4 xl:mb-5"
      aria-label={t("art_flow_title")}
      data-testid="artistic-flow-steps"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="as-v2-flow-toggle"
        data-testid="artistic-flow-toggle"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#A855F7]">
            {t("art_flow_title")}
          </span>
          <span className="hidden sm:inline text-[11px] text-[#6B7280] font-mono">·</span>
          <span className="text-[11px] text-[#9CA3AF] font-mono truncate">{progressText}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[#A855F7] shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>

      {open && (
        <ol className="as-v2-flow-list">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const done = step.id === "style" ? styleSelected : index < activeIndex;
            const active = step.id === activeStep;
            return (
              <li
                key={step.id}
                className={`as-v2-flow-step ${active ? "as-v2-flow-step--active" : ""} ${done ? "as-v2-flow-step--done" : ""}`}
              >
                <span className="as-v2-flow-step-num">
                  {done ? <Check className="w-3 h-3" strokeWidth={2.5} /> : index + 1}
                </span>
                <div className="min-w-0">
                  <p className="as-v2-flow-step-label">
                    <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" strokeWidth={1.75} />
                    {t(step.labelKey)}
                  </p>
                  <p className="as-v2-flow-step-hint">{t(step.hintKey)}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </nav>
  );
}
