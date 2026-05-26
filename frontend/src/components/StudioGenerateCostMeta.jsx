import { useI18n } from "../lib/i18n";

/** Custo + saldo na barra fixa do Gerar. */
export default function StudioGenerateCostMeta({
  cost,
  user,
  extra = null,
  className = "",
}) {
  const { t } = useI18n();
  const balance = user?.is_unlimited ? "∞" : (user?.credits ?? 0);

  return (
    <div className={`hidden sm:flex items-center gap-3 text-[12px] font-['Inter_Tight'] flex-wrap ${className}`.trim()}>
      <span className="text-[#8A8A8E]">{t("tool_cost_label")}</span>
      <span className="text-[#C4B5FD] font-semibold tabular-nums text-[15px]">{cost}</span>
      <span className="text-[#5A5A5E] font-mono text-[10px] uppercase tracking-wider">{t("label_credits")}</span>
      {extra ? (
        <>
          <span className="w-px h-4 bg-[#2E2E30]" />
          <span className="text-[#8A8A8E]">{extra}</span>
        </>
      ) : null}
      <span className="w-px h-4 bg-[#2E2E30]" />
      <span className="text-[#8A8A8E]">{t("tool_balance_label")}</span>
      <span className="text-[#F4F1EA] font-medium tabular-nums">{balance}</span>
    </div>
  );
}
