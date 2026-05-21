import { Plus, Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";
import { emptyCharacter } from "../../lib/mangaStudioData";

const STYLE_HINTS = {
  webtoon: "Webtoon: scroll vertical, cores vibrantes, linhas limpas",
  manhwa: "Manhwa: estilo coreano, olhos expressivos, sombreamento suave",
  "western-comic": "Comic ocidental: sombras fortes, cores saturadas",
  "manga-classic": "Manga clássico: preto e branco, screentones, dinâmica japonesa",
  anime: "Anime: cores vivas, olhos grandes, estilo TV",
};

export default function MangaProjectWizard({
  t,
  catalog,
  stylePreset,
  modelKey,
  useGptCompose,
  characters,
  onStyleChange,
  onModelChange,
  onGptComposeChange,
  onAddCharacter,
  onStart,
}) {
  const canStart = characters.length > 0;

  return (
    <div className="manga-wizard" data-testid="manga-wizard">
      <p className="manga-wizard-lead">{t("manga_wizard_lead")}</p>

      <section className="manga-card">
        <h3 className="manga-card-title">🎨 {t("manga_style_preset")}</h3>
        <div className="manga-chip-scroll">
          {catalog.stylePresets.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onStyleChange(s.id)}
              className={cn("manga-pill", stylePreset === s.id && "manga-pill--active")}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="manga-card-desc">{STYLE_HINTS[stylePreset] || STYLE_HINTS["manga-classic"]}</p>
      </section>

      <section className="manga-card">
        <h3 className="manga-card-title">⚡ {t("manga_model_engine")}</h3>
        <div className="manga-wizard-models">
          {catalog.models.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => onModelChange(m.key)}
              className={cn("manga-model-card", modelKey === m.key && "manga-model-card--active")}
            >
              <span className="font-semibold text-[14px] text-white block">{m.label}</span>
              <span className="text-[12px] text-[#9CA3AF] block mt-1">{m.hint}</span>
              <span className="manga-model-select-label">
                {modelKey === m.key ? t("manga_selected") : t("manga_select")}
              </span>
            </button>
          ))}
        </div>
        <label className="manga-wizard-check">
          <input
            type="checkbox"
            checked={useGptCompose}
            onChange={(e) => onGptComposeChange(e.target.checked)}
          />
          <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
          <span>{t("manga_gpt_compose")}</span>
        </label>
      </section>

      <section className="manga-card">
        <h3 className="manga-card-title">👤 {t("manga_wizard_character_title")}</h3>
        <p className="manga-card-desc">{t("manga_wizard_character_desc")}</p>
        {characters.length > 0 && (
          <ul className="manga-wizard-char-list">
            {characters.map((c) => (
              <li key={c.id}>{c.name}</li>
            ))}
          </ul>
        )}
        <button type="button" className="manga-primary-btn w-full min-h-[48px]" onClick={onAddCharacter}>
          <Plus className="w-4 h-4" /> {t("manga_create_character")}
        </button>
      </section>

      <button
        type="button"
        disabled={!canStart}
        className="manga-cta-btn w-full min-h-[56px]"
        onClick={onStart}
      >
        🚀 {t("manga_wizard_start")}
      </button>
    </div>
  );
}

export function promptNewCharacter(t) {
  const name = window.prompt(t("manga_prompt_char_name"), t("manga_default_char"));
  if (!name?.trim()) return null;
  return emptyCharacter(name.trim());
}
