import { useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { getArtisticEffectHelp } from "../../lib/artisticEffectHelp";
import { useI18n } from "../../lib/i18n";

/**
 * Linha de efeito com botão ! — explicação visível enquanto mantém o clique.
 */
export default function ArtisticEffectOption({
  section,
  opt,
  active,
  onToggle,
}) {
  const { lang } = useI18n();
  const [showHelp, setShowHelp] = useState(false);
  const helpRef = useRef(null);
  const helpText = getArtisticEffectHelp(lang, section.id, opt.id);

  useEffect(() => {
    if (!showHelp) return undefined;
    const end = () => setShowHelp(false);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [showHelp]);

  return (
    <div className="relative">
      <label
        className={`art-effect-row ${active ? "art-effect-row--active" : ""}`}
      >
        <input
          type={section.type === "radio" ? "radio" : "checkbox"}
          name={section.type === "radio" ? section.id : undefined}
          checked={active}
          onChange={onToggle}
          className="accent-[#9333EA] w-3.5 h-3.5 shrink-0"
        />
        <span className="text-[11px] leading-tight flex-1 min-w-0">{opt.label}</span>
        {helpText && (
          <button
            type="button"
            ref={helpRef}
            aria-label={`Explicação: ${opt.label}`}
            className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
              showHelp
                ? "bg-[#9333EA] text-white"
                : "text-[#6B7280] hover:text-[#A855F7] hover:bg-[#9333EA]/20"
            }`}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowHelp(true);
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            data-testid={`effect-help-${section.id}-${opt.id}`}
          >
            <AlertCircle className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        )}
      </label>
      {showHelp && helpText && (
        <div
          role="tooltip"
          className="absolute left-0 right-0 z-20 mt-1 px-3 py-2.5 rounded-lg border border-[rgba(147,51,234,0.45)] bg-[#0A0A0F] shadow-[0_8px_24px_rgba(0,0,0,0.5)] text-[#D1D5DB] text-[11px] leading-snug"
          data-testid={`effect-help-popover-${section.id}-${opt.id}`}
        >
          {helpText}
        </div>
      )}
    </div>
  );
}
