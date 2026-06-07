import { useState } from "react";
import { ChevronDown, ChevronUp, Palette, RotateCcw } from "lucide-react";

const QUICK_COLORS = [
  "#7C3AED", "#EF4444", "#F59E0B", "#22C55E", "#3B82F6",
  "#EC4899", "#F4F1EA", "#0A0A0A", "#FACC15", "#06B6D4",
];

const MAX_PALETTE = 6;

/**
 * Mood & paleta — padrão do template; paleta personalizada só ao expandir.
 */
export default function PosterMoodPalette({
  mood,
  setMood,
  paletteColors,
  setPaletteColors,
  moodIds,
  t,
}) {
  const [paletteOpen, setPaletteOpen] = useState(() => paletteColors.length > 0);
  const hasCustomPalette = paletteColors.length > 0;
  const hasCustomMood = Boolean(mood);

  const addColor = (hex) => {
    const c = String(hex || "").trim();
    if (!c) return;
    setPaletteColors((prev) => {
      if (prev.includes(c)) return prev.filter((x) => x !== c);
      if (prev.length >= MAX_PALETTE) return [...prev.slice(1), c];
      return [...prev, c];
    });
    setPaletteOpen(true);
  };

  const removeColor = (hex) => {
    setPaletteColors((prev) => prev.filter((c) => c !== hex));
  };

  const resetPalette = () => {
    setPaletteColors([]);
    setPaletteOpen(false);
  };

  return (
    <div className="space-y-5" data-testid="poster-mood-palette">
      <p className="text-[#6B6B70] text-[11px] leading-relaxed">{t("post_visual_hint")}</p>

      <div>
        <p className="text-[#8A8A8E] text-[11px] mb-2">{t("post_mood_label")}</p>
        <div className="flex flex-wrap gap-2" data-testid="poster-moods">
          <button
            type="button"
            onClick={() => setMood("")}
            data-testid="mood-default"
            className={`px-3 py-1.5 rounded-full text-[11.5px] font-medium transition-all border ${
              !hasCustomMood
                ? "bg-[#7C3AED] border-[#7C3AED] text-white shadow-sm shadow-[#7C3AED]/30"
                : "bg-[#13131A] border-[#2E2E30] text-[#8A8A8E] hover:text-[#F4F1EA] hover:border-[#7C3AED]/40"
            }`}
          >
            {t("post_mood_default")}
          </button>
          {moodIds.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setMood(mood === id ? "" : id)}
              data-testid={`mood-${id}`}
              className={`px-3 py-1.5 rounded-full text-[11.5px] font-medium transition-all border ${
                mood === id
                  ? "bg-[#7C3AED] border-[#7C3AED] text-white shadow-sm shadow-[#7C3AED]/30"
                  : "bg-[#13131A] border-[#2E2E30] text-[#8A8A8E] hover:text-[#F4F1EA] hover:border-[#7C3AED]/40"
              }`}
            >
              {t(`post_mood_${id}`)}
            </button>
          ))}
        </div>
        {hasCustomMood && (
          <p className="text-[#5A5A5E] text-[10px] mt-2">{t("post_mood_active_hint")}</p>
        )}
      </div>

      <div className="rounded-xl border border-[#2E2E30] bg-[#0E0E12]/60 overflow-hidden">
        <button
          type="button"
          onClick={() => setPaletteOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#13131A]/80 transition-colors"
          data-testid="palette-panel-toggle"
        >
          <span className="flex items-center gap-2 text-[#8A8A8E] text-[11px]">
            <Palette className="w-3.5 h-3.5 shrink-0" />
            {t("post_palette_label")}
            {!hasCustomPalette && (
              <span className="text-[#5A5A5E]">— {t("post_palette_default")}</span>
            )}
          </span>
          <span className="flex items-center gap-2 shrink-0">
            {hasCustomPalette && (
              <span className="flex gap-1">
                {paletteColors.slice(0, 4).map((c) => (
                  <span
                    key={c}
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ background: c }}
                  />
                ))}
              </span>
            )}
            {paletteOpen ? (
              <ChevronUp className="w-4 h-4 text-[#8A8A8E]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#8A8A8E]" />
            )}
          </span>
        </button>

        {paletteOpen && (
          <div className="px-4 pb-4 pt-0 border-t border-[#2E2E30]/80" data-testid="palette-panel-body">
            <div className="flex flex-wrap items-center gap-2 mb-3 pt-3">
              <button
                type="button"
                onClick={resetPalette}
                data-testid="palette-default"
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all ${
                  !hasCustomPalette
                    ? "bg-[#7C3AED]/20 border-[#7C3AED] text-[#C4B5FD]"
                    : "border-[#2E2E30] text-[#8A8A8E] hover:border-[#7C3AED]/40"
                }`}
              >
                {t("post_palette_default")}
              </button>
              {hasCustomPalette && (
                <button
                  type="button"
                  onClick={resetPalette}
                  className="px-2.5 py-1 rounded-full text-[10px] text-[#8A8A8E] border border-[#2E2E30] hover:text-[#F4F1EA] flex items-center gap-1"
                  data-testid="palette-clear"
                >
                  <RotateCcw className="w-3 h-3" />
                  {t("post_palette_clear")}
                </button>
              )}
            </div>

            <p className="text-[#5A5A5E] text-[10px] mb-2">{t("post_palette_pick_hint")}</p>

            {hasCustomPalette && (
              <div className="flex flex-wrap gap-2 mb-3" data-testid="palette-selected">
                {paletteColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => removeColor(c)}
                    className="group flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full border border-[#7C3AED]/50 bg-[#7C3AED]/10"
                    title={t("post_palette_remove")}
                    data-testid={`palette-chip-${c.replace("#", "")}`}
                  >
                    <span
                      className="w-5 h-5 rounded-full border border-white/20 shrink-0"
                      style={{ background: c }}
                    />
                    <span className="text-[10px] font-mono text-[#C4B5FD]">{c.toUpperCase()}</span>
                    <span className="text-[#8A8A8E] group-hover:text-[#EF4444] text-xs">×</span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {QUICK_COLORS.map((c) => {
                const selected = paletteColors.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => (selected ? removeColor(c) : addColor(c))}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selected
                        ? "border-[#F4F1EA] scale-110 ring-2 ring-[#7C3AED]/50"
                        : "border-[#2E2E30] hover:border-[#7C3AED]/50"
                    }`}
                    style={{ background: c }}
                    data-testid={`palette-swatch-${c.replace("#", "")}`}
                    aria-label={c}
                  />
                );
              })}
              <label
                className="flex items-center gap-1.5 px-2.5 h-8 text-[11px] text-[#8A8A8E] hover:text-[#F4F1EA] border border-[#2E2E30] rounded-full cursor-pointer transition-colors"
              >
                + {t("post_palette_custom")}
                <input
                  type="color"
                  className="sr-only"
                  defaultValue="#7C3AED"
                  onChange={(e) => addColor(e.target.value)}
                  data-testid="poster-color-picker"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { QUICK_COLORS };
