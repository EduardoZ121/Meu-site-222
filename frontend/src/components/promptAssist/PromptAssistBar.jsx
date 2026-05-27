import { Wand2, Lightbulb } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import PromptEnhanceToggle from "./PromptEnhanceToggle";

/**
 * Barra partilhada: refinar prompt + abrir assistente / sugestões (modais).
 */
export default function PromptAssistBar({
  improve,
  onImproveChange,
  onOpenWizard,
  onOpenSuggest,
  promptLength = 0,
  maxLength = 800,
  testIdPrefix = "prompt-assist",
  premiumSoon = false,
}) {
  const { t } = useI18n();

  return (
    <div className="mt-3 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <PromptEnhanceToggle
          checked={improve}
          onChange={onImproveChange}
          testId={`${testIdPrefix}-improve`}
          premiumSoon={premiumSoon}
        />
        {maxLength > 0 && (
          <span className="text-[#6B7280] text-[10px] font-mono tabular-nums">
            {promptLength}/{maxLength}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onOpenWizard}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[rgba(147,51,234,0.35)] bg-[#0A0A0F] text-[#C4B5FD] text-[11px] font-medium hover:bg-[#9333EA]/15 hover:text-white transition-colors"
          data-testid={`${testIdPrefix}-wizard`}
        >
          <Wand2 className="w-3.5 h-3.5" strokeWidth={1.5} />
          {t("studio_wizard")}
        </button>
        <button
          type="button"
          onClick={onOpenSuggest}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[rgba(147,51,234,0.35)] bg-[#0A0A0F] text-[#C4B5FD] text-[11px] font-medium hover:bg-[#9333EA]/15 hover:text-white transition-colors"
          data-testid={`${testIdPrefix}-suggest`}
        >
          <Lightbulb className="w-3.5 h-3.5" strokeWidth={1.5} />
          {t("studio_suggest")}
        </button>
      </div>
    </div>
  );
}
