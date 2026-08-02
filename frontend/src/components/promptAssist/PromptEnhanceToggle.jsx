import { Sparkles, Lock } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import StudioHelpTip from "../studio/StudioHelpTip";

export default function PromptEnhanceToggle({
  checked,
  onChange,
  locked = false,
  onLockedClick,
  testId = "prompt-enhance",
  cost = 5,
  helpKey = "help_ctrl_improve_prompt",
  compact = false,
}) {
  const { t } = useI18n();
  const hint = t("studio_improve_hint");

  return (
    <div className={`rp-gen-refine${compact ? " rp-gen-refine--compact" : ""}`}>
      <label
        className={`rp-gen-refine__label${locked ? " rp-gen-refine__label--locked" : ""}`}
        data-testid={testId}
      >
        <input
          type="checkbox"
          checked={checked}
          disabled={locked}
          onChange={(e) => {
            if (locked) {
              onLockedClick?.();
              return;
            }
            onChange(e.target.checked);
          }}
          className="rp-gen-refine__check accent-[#7C3AED]"
        />
        <span className="rp-gen-refine__ico" aria-hidden>
          <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
        </span>
        <span className="rp-gen-refine__copy">
          <span className="rp-gen-refine__title">
            {t("studio_improve")}
            {locked ? (
              <span className="rp-gen-refine__lock">
                <Lock className="w-3 h-3" /> Studio Plus
              </span>
            ) : (
              <span className="rp-gen-refine__cost">
                +{cost} {t("credits")}
              </span>
            )}
          </span>
          {hint && hint !== "studio_improve_hint" ? (
            <span className="rp-gen-refine__hint">{hint}</span>
          ) : null}
        </span>
      </label>
      {helpKey ? <StudioHelpTip helpKey={helpKey} testId={`${testId}-help`} /> : null}
    </div>
  );
}
