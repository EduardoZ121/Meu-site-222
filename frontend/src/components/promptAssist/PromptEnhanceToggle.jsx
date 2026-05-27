import { Sparkles, Lock } from "lucide-react";
import { useI18n } from "../../lib/i18n";

export default function PromptEnhanceToggle({
  checked,
  onChange,
  locked = false,
  onLockedClick,
  testId = "prompt-enhance",
}) {
  const { t } = useI18n();
  return (
    <label
      className={`inline-flex items-center gap-2.5 cursor-pointer group ${locked ? "opacity-80" : ""}`}
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
        className="accent-[#7C3AED] w-3.5 h-3.5 rounded border-[#2E2E30]"
      />
      <span className="text-[#8A8A8E] text-[12px] font-['Inter_Tight'] group-hover:text-[#b5b5ba] transition-colors inline-flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-[#A855F7]" strokeWidth={1.75} />
        {t("studio_improve")}
        {locked ? (
          <span className="text-[#FACC15] text-[10px] font-mono uppercase tracking-wider inline-flex items-center gap-0.5">
            <Lock className="w-3 h-3" /> Studio Plus
          </span>
        ) : (
          <span className="text-[#5A5A5E]">{t("studio_plus_active")}</span>
        )}
      </span>
    </label>
  );
}
