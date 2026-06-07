import { Check } from "lucide-react";
import { cn } from "../lib/utils";
import { useI18n } from "../lib/i18n";
import { AspectRatioShape } from "./AspectRatioShape";

const DEFAULT_OPTIONS = ["1:1", "4:5", "3:4", "9:16", "16:9", "21:9"];

/**
 * Seletor de formato / proporção partilhado entre estúdios.
 *
 * Props:
 *   value, onChange, hasPhoto, testIdPrefix, options (string[])
 *   items — [{ key, label?, hint? }] (substitui options quando definido)
 *   compact — barra horizontal mais baixa (ex.: Manga)
 *   columns — classes grid opcionais
 */
export default function AspectPicker({
  value,
  onChange,
  hasPhoto = false,
  testIdPrefix = "aspect",
  options = DEFAULT_OPTIONS,
  items: customItems,
  compact = false,
  premium = false,
  columns,
}) {
  const { t } = useI18n();
  const items = customItems?.length
    ? customItems
    : hasPhoto
      ? [
          { key: "match", label: t("aspect_original"), hint: t("aspect_original_hint") },
          ...options.map((k) => ({ key: k, label: k })),
        ]
      : options.map((k) => ({ key: k, label: k }));

  const gridClass =
    columns ||
    (compact
      ? "grid grid-flow-col auto-cols-fr gap-1.5"
      : "grid grid-cols-3 sm:grid-cols-4 gap-2.5");

  return (
    <div className={gridClass} data-testid={`${testIdPrefix}-row`}>
      {items.map(({ key, label, hint }) => {
        const active = value === key;
        return (
          <button
            type="button"
            key={key}
            onClick={() => onChange(key)}
            data-testid={`${testIdPrefix}-${key}`}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 transition-all overflow-hidden border font-['Inter_Tight']",
              compact ? "py-2 px-2 rounded-lg text-[10px]" : premium ? "py-3.5 rounded-xl text-[12px] font-medium" : "py-3 rounded-xl text-[11px] font-medium",
              active
                ? premium
                  ? "border-purple-500 bg-zinc-900/90 text-white shadow-[0_0_32px_-8px_rgba(168,85,247,0.55),inset_0_0_0_1px_rgba(168,85,247,0.2)]"
                  : "border-[#7C3AED] bg-[rgba(124,58,237,0.1)] text-[#E9E4DC] shadow-[inset_0_0_0_1px_rgba(124,58,237,0.12)]"
                : premium
                  ? "border-zinc-800 bg-zinc-950/60 text-zinc-500 hover:border-purple-500/40 hover:text-zinc-200 hover:bg-zinc-900/50"
                  : "border-[rgba(244,241,234,0.08)] text-[#8A8A8E] hover:border-[rgba(124,58,237,0.35)] hover:text-[#F4F1EA]",
            )}
          >
            <span className={cn("flex items-center justify-center", compact ? "h-5" : "h-6")}>
              <AspectRatioShape ratio={key} active={active} maxSize={compact ? 18 : 22} />
            </span>
            <span>{label ?? key}</span>
            {hint && <span className="text-[9px] text-[#5A5A5E] leading-none">{hint}</span>}
            {active && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#7C3AED] flex items-center justify-center border border-white/15 shadow-sm">
                <Check className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
