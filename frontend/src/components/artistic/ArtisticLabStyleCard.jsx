import { useState } from "react";
import { Check, Sparkles, Zap } from "lucide-react";
import { ARTISTIC_STYLE_COVER_BY_ID } from "../../lib/artisticStyleCovers";
import { useI18n } from "../../lib/i18n";

/**
 * Card premium para presets Experimental (Admin) — inspiração AI image lab / edit rápido.
 */
export default function ArtisticLabStyleCard({ style, selected, onSelect }) {
  const { t } = useI18n();
  const [a, b, c] = style.gradient || ["#0f0a1a", "#7c3aed", "#22d3ee"];
  const coverSrc = ARTISTIC_STYLE_COVER_BY_ID[style.id];
  const [coverFailed, setCoverFailed] = useState(false);
  const showCover = coverSrc && !coverFailed;
  const badge = style.labBadge || "LAB";

  return (
    <button
      type="button"
      onClick={() => onSelect(style.id)}
      className={`art-lab-card group relative w-full min-w-[148px] sm:min-w-0 text-left rounded-2xl overflow-hidden border transition-all duration-300 ease-out ${
        selected
          ? "art-lab-card--active border-[#e879f9] shadow-[0_0_28px_rgba(232,121,249,0.45),0_0_60px_-12px_rgba(124,58,237,0.55)]"
          : "border-[rgba(236,72,153,0.25)] hover:border-[rgba(232,121,249,0.55)] hover:shadow-[0_12px_36px_-10px_rgba(168,85,247,0.5)]"
      }`}
      data-testid={`artistic-lab-style-${style.id}`}
    >
      <div className="art-lab-card__glow" aria-hidden />
      <div className="relative aspect-[4/5] overflow-hidden bg-[#050508]">
        {showCover ? (
          <img
            src={coverSrc}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-[center_22%] transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
            decoding="async"
            onError={() => setCoverFailed(true)}
          />
        ) : (
          <div
            className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${a} 0%, ${b} 45%, ${c} 100%)`,
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.15),transparent_45%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_100%,rgba(34,211,238,0.2),transparent_50%)]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="w-9 h-9 text-white/30" strokeWidth={1.5} />
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/40 to-transparent" />
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          <span className="px-1.5 py-0.5 rounded-md text-[8px] font-mono font-bold uppercase tracking-wider bg-[#be185d]/90 text-white border border-[#fda4af]/40">
            {t("art_lab_badge_exp")}
          </span>
          <span className="px-1.5 py-0.5 rounded-md text-[8px] font-mono font-bold uppercase tracking-wider bg-[#7c3aed]/80 text-white/95 border border-[#c4b5fd]/30">
            {badge}
          </span>
        </div>
        {selected && (
          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-gradient-to-br from-[#e879f9] to-[#7c3aed] flex items-center justify-center shadow-lg shadow-[#e879f9]/50 ring-2 ring-white/20">
            <Check className="w-4 h-4 text-white" strokeWidth={3} />
          </div>
        )}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Sparkles className="w-4 h-4 text-[#f0abfc]" />
        </div>
      </div>
      <div className="relative p-3 border-t border-[rgba(236,72,153,0.15)] bg-[#0c0a12]/95">
        <p className="text-white text-[12px] font-semibold font-['Inter_Tight'] leading-tight tracking-tight">
          {style.label}
        </p>
        <p className="text-[#a1a1aa] text-[10px] mt-1 line-clamp-2 leading-snug">{style.desc}</p>
      </div>
    </button>
  );
}
