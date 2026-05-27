import { useI18n } from "../../lib/i18n";

/**
 * Checkbox: refine user prompt with AI before generation (server-side, 0 credits).
 */
export default function PromptEnhanceToggle({
  checked,
  onChange,
  testId = "prompt-enhance",
  premiumSoon = false,
  className = "",
}) {
  const { t } = useI18n();

  return (
    <label className={`flex items-center gap-2.5 cursor-pointer group ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-[#9333EA] w-3.5 h-3.5 rounded border-[#2E2E30]"
        data-testid={testId}
      />
      <span className="text-[#9CA3AF] text-[11px] font-['Inter_Tight'] group-hover:text-[#D1D5DB] transition-colors">
        {t("studio_improve")}{" "}
        <span className="text-[#6B7280]">{t("studio_improve_free")}</span>
        {premiumSoon ? (
          <span className="ml-1.5 text-[9px] font-mono uppercase tracking-[0.12em] text-[#C4B5FD]/80">
            {t("studio_improve_premium_soon")}
          </span>
        ) : null}
      </span>
    </label>
  );
}
