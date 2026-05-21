import { useState } from "react";
import { ChevronDown, Settings2, Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Estilo + motor — colapsável no mobile, sempre visível no desktop.
 */
export default function MangaStudioSettingsPanel({
  t,
  catalog,
  project,
  modelKey,
  useGptCompose,
  onStyleChange,
  onModelChange,
  onGptComposeChange,
}) {
  const [open, setOpen] = useState(false);

  const inner = (
    <div className="space-y-4">
      <div>
        <p className="manga-settings-label">{t("manga_style_preset")}</p>
        <div className="manga-chip-scroll">
          {catalog.stylePresets.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onStyleChange(s.id)}
              className={cn(
                "manga-pill",
                (project.stylePreset || "manga-classic") === s.id && "manga-pill--active",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="manga-settings-label">{t("manga_model_engine")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {catalog.models.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => onModelChange(m.key)}
              className={cn(
                "manga-model-card text-left",
                modelKey === m.key && "manga-model-card--active",
              )}
              data-testid={`manga-model-${m.key}`}
            >
              <span className="font-semibold text-[12px] block text-white">{m.label}</span>
              <span className="text-[10px] text-[#9CA3AF] leading-snug">{m.hint}</span>
            </button>
          ))}
        </div>
        <label className="mt-3 flex items-center gap-2.5 text-[12px] text-[#C4B5FD] cursor-pointer p-2.5 rounded-lg border border-[#2E2E30] bg-[#0B0B0C]/60">
          <input
            type="checkbox"
            checked={useGptCompose}
            onChange={(e) => onGptComposeChange(e.target.checked)}
            className="rounded border-[#5A5A5E] text-[#9333EA] w-4 h-4"
          />
          <Sparkles className="w-4 h-4 text-[#A855F7] shrink-0" />
          <span>{t("manga_gpt_compose")}</span>
        </label>
      </div>
    </div>
  );

  return (
    <>
      <div className="lg:hidden manga-settings-mobile">
        <button
          type="button"
          className="manga-settings-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <Settings2 className="w-4 h-4 text-[#A855F7]" />
          <span className="flex-1 text-left text-[12px] font-medium text-[#E9D5FF]">
            {t("manga_settings_toggle")}
          </span>
          <span className="text-[10px] text-[#5A5A5E] mr-1">
            {catalog.stylePresets.find((s) => s.id === (project.stylePreset || "manga-classic"))?.label}
          </span>
          <ChevronDown className={cn("w-4 h-4 text-[#5A5A5E] transition-transform", open && "rotate-180")} />
        </button>
        {open && <div className="manga-settings-body">{inner}</div>}
      </div>
      <div className="hidden lg:block manga-settings-desktop rounded-xl border border-[#2E2E30] bg-[#111118]/80 p-4 mb-4">
        {inner}
      </div>
    </>
  );
}
