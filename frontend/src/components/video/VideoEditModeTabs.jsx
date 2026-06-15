import { Image, Palette, Shirt, Sparkles, Sun } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { VIDEO_EDIT_MODES } from "../../lib/videoEditCatalog";

const ICONS = {
  image: Image,
  sun: Sun,
  sparkles: Sparkles,
  shirt: Shirt,
  palette: Palette,
};

function tabClass(active) {
  return [
    "flex items-center gap-2 shrink-0 px-4 py-2.5 rounded-xl border text-[13px] font-medium transition-all",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/50",
    active
      ? "border-[#7C3AED] bg-gradient-to-br from-[#7C3AED]/20 to-[#7C3AED]/5 text-[#F4F1EA] shadow-[0_0_24px_-8px_rgba(124,58,237,0.55)]"
      : "border-[#2E2E30] bg-[#0F0F12] text-[#8A8A8E] hover:border-[#5A5A5E] hover:text-[#C4C4C8]",
  ].join(" ");
}

export default function VideoEditModeTabs({ modeId, onChange, disabled = false }) {
  const { t } = useI18n();

  return (
    <div className="mb-3 md:mb-5" data-testid="video-edit-mode-tabs">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
        {VIDEO_EDIT_MODES.map((mode) => {
          const Icon = ICONS[mode.icon] || Sparkles;
          const active = mode.id === modeId;
          return (
            <button
              key={mode.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(mode.id)}
              className={tabClass(active)}
              data-testid={`video-edit-mode-${mode.id}`}
              aria-pressed={active}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? "text-[#C4B5FD]" : ""}`} strokeWidth={1.75} />
              {t(mode.nameKey)}
            </button>
          );
        })}
      </div>
      <p className="hidden sm:block text-[#6f6f76] text-[11px] mt-1.5 leading-relaxed">
        {t(VIDEO_EDIT_MODES.find((m) => m.id === modeId)?.descKey || "vid_mode_vfx_desc")}
      </p>
    </div>
  );
}
