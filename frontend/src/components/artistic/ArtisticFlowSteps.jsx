import { useState } from "react";
import { Check, ChevronDown, Palette, Sparkles, Wand2 } from "lucide-react";
import { useI18n } from "../../lib/i18n";

const STEPS = [
  { id: "style", icon: Palette, labelKey: "art_flow_step_style", hintKey: "art_flow_step_style_hint" },
  { id: "effects", icon: Sparkles, labelKey: "art_flow_step_effects", hintKey: "art_flow_step_effects_hint" },
  { id: "generate", icon: Wand2, labelKey: "art_flow_step_generate", hintKey: "art_flow_step_generate_hint" },
];

export default function ArtisticFlowSteps({ activeStep = "generate", styleSelected = false }) {
  const { t } = useI18n();
  // Collapsed by default — the steps are nice to have but consume too much
  // vertical real estate on mobile. Users can expand on demand.
  const [open, setOpen] = useState(false);
  const activeIndex = STEPS.findIndex((s) => s.id === activeStep);
  const progressText = styleSelected
    ? `${Math.max(1, activeIndex)}/${STEPS.length}`
    : `0/${STEPS.length}`;

  return (
    <nav
      className="art-studio-flow mb-4 md:mb-5 rounded-xl border border-[rgba(147,51,234,0.18)] bg-[rgba(12,12,18,0.6)]"
      aria-label={t("art_flow_title")}
      data-testid="artistic-flow-steps"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-3 md:px-4 py-2.5 md:py-3 text-left"
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
        <ol className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3 px-3 md:px-4 pb-3 md:pb-4">
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
      )}
    </nav>
  );
}
