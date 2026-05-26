import { useMemo } from "react";
import { Eye, Pencil, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { useI18n } from "../../lib/i18n";
import { getMangaStudioCatalog } from "../../lib/mangaStudioCatalog";

function ChipGroup({ options, value, onChange, multi }) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((opt) => {
        const id = typeof opt === "string" ? opt : opt.id;
        const label = typeof opt === "string" ? opt : opt.label;
        const active = multi ? value?.[id] : value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => {
              if (multi) onChange({ ...value, [id]: !value?.[id] });
              else onChange(id);
            }}
            className={cn(
              "px-2 py-0.5 rounded text-[10px] border transition-colors",
              active
                ? "bg-[#9333EA]/25 border-[#A855F7] text-[#E9D5FF]"
                : "border-[#2E2E30] text-[#9CA3AF] hover:border-[#5A5A5E]",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function FieldLabel({ children }) {
  return <p className="text-[10px] uppercase tracking-wider text-[#A855F7] mb-1.5">{children}</p>;
}

export default function MangaPanelConfig({
  project,
  panel,
  onPatchPanel,
  costs,
  busy,
  activeCharacterId,
  onEditCharacter,
  onPreviewCharacter,
  onGeneratePanel,
  onGeneratePage,
  onGenerateChapter,
}) {
  const { t } = useI18n();
  const catalog = useMemo(() => getMangaStudioCatalog(t), [t]);

  if (!panel) {
    return (
      <section className="rounded-2xl border border-[rgba(147,51,234,0.2)] bg-[#111118] p-6 text-center text-[#5A5A5E] text-sm">
        {t("manga_select_panel")}
      </section>
    );
  }

  const characters = project.characters || [];
  const scenarios = project.scenarios || [];

  return (
    <section
      className="rounded-2xl border border-[rgba(147,51,234,0.25)] bg-[#111118] p-4 space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto"
      data-testid="manga-panel-config"
    >
      <h2 className="text-white text-[13px] font-semibold">{t("manga_active_panel")}</h2>

      <div>
        <FieldLabel>{t("manga_character")}</FieldLabel>
        <div className="flex gap-2 flex-wrap items-center">
          <select
            className="field-input flex-1 min-w-[120px] text-[12px]"
            value={panel.characterId || ""}
            onChange={(e) => onPatchPanel({ characterId: e.target.value || null })}
          >
            <option value="">{t("manga_choose")}</option>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            type="button"
            className="manga-chip-btn"
            title={t("manga_visual")}
            disabled={!activeCharacterId}
            onClick={() => activeCharacterId && onPreviewCharacter?.(activeCharacterId)}
          >
            <Eye className="w-3 h-3" />
          </button>
          <button
            type="button"
            className="manga-chip-btn"
            title={t("manga_edit")}
            disabled={!activeCharacterId}
            onClick={() => activeCharacterId && onEditCharacter?.(activeCharacterId)}
          >
            <Pencil className="w-3 h-3" />
          </button>
        </div>
        <div className="mt-2 space-y-2">
          <label className="text-[11px] text-[#9CA3AF] block">{t("manga_field_pose")}</label>
          <select
            className="field-input w-full text-[12px]"
            value={panel.poseId}
            onChange={(e) => onPatchPanel({ poseId: e.target.value })}
          >
            {catalog.poses.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <label className="text-[11px] text-[#9CA3AF] block">{t("manga_field_expression")}</label>
          <ChipGroup
            options={catalog.expressions}
            value={panel.expression}
            onChange={(v) => onPatchPanel({ expression: v })}
          />
          <label className="text-[11px] text-[#9CA3AF] block">{t("manga_field_angle")}</label>
          <ChipGroup options={catalog.angles} value={panel.angle} onChange={(v) => onPatchPanel({ angle: v })} />
          <label className="text-[11px] text-[#9CA3AF] block">{t("manga_field_shot_size")}</label>
          <ChipGroup options={catalog.shots} value={panel.shot} onChange={(v) => onPatchPanel({ shot: v })} />
        </div>
      </div>

      <div>
        <FieldLabel>{t("manga_scenario")}</FieldLabel>
        <select
          className="field-input w-full text-[12px] mb-2"
          value={panel.scenarioId || ""}
          onChange={(e) => onPatchPanel({ scenarioId: e.target.value || null })}
        >
          <option value="">{t("manga_choose")}</option>
          {scenarios.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <label className="text-[11px] text-[#9CA3AF] block">{t("manga_field_lighting")}</label>
        <ChipGroup
          options={catalog.lighting}
          value={panel.lighting}
          onChange={(v) => onPatchPanel({ lighting: v })}
        />
        <label className="text-[11px] text-[#9CA3AF] block mt-2">{t("manga_field_focus")}</label>
        <ChipGroup options={catalog.focus} value={panel.focus} onChange={(v) => onPatchPanel({ focus: v })} />
      </div>

      <div>
        <FieldLabel>{t("manga_field_framing")}</FieldLabel>
        <ChipGroup
          options={catalog.framing}
          value={panel.framing}
          onChange={(v) => onPatchPanel({ framing: v })}
        />
      </div>

      <div>
        <FieldLabel>{t("manga_balloon_text")}</FieldLabel>
        <textarea
          className="field-input w-full min-h-[72px] text-[12px] resize-y"
          placeholder={t("manga_balloon_placeholder")}
          value={panel.balloonText}
          onChange={(e) => onPatchPanel({ balloonText: e.target.value })}
        />
        <p className="text-[11px] text-[#9CA3AF] mt-2">{t("manga_field_type")}</p>
        <ChipGroup
          options={catalog.balloonTypes}
          value={panel.balloonType}
          onChange={(v) => onPatchPanel({ balloonType: v })}
        />
        <p className="text-[11px] text-[#9CA3AF] mt-2">{t("manga_field_position")}</p>
        <ChipGroup
          options={catalog.balloonPos}
          value={panel.balloonPos}
          onChange={(v) => onPatchPanel({ balloonPos: v })}
        />
        <p className="text-[11px] text-[#9CA3AF] mt-2">{t("manga_field_letter")}</p>
        <ChipGroup
          options={catalog.letterStyles}
          value={panel.letterStyle}
          onChange={(v) => onPatchPanel({ letterStyle: v })}
        />
      </div>

      <div>
        <FieldLabel>{t("manga_field_effects")}</FieldLabel>
        <div className="grid grid-cols-1 gap-1.5">
          {catalog.effects.map((fx) => (
            <label
              key={fx.id}
              className="flex items-center gap-2 text-[11px] text-[#9CA3AF] cursor-pointer"
            >
              <input
                type="checkbox"
                checked={!!panel.effects?.[fx.id]}
                onChange={() => {
                  onPatchPanel({
                    effects: { ...panel.effects, [fx.id]: !panel.effects?.[fx.id] },
                  });
                }}
                className="rounded border-[#2E2E30]"
              />
              {fx.label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-[#2E2E30]">
        <button
          type="button"
          disabled={busy}
          onClick={onGeneratePanel}
          className="manga-generate-btn w-full"
          data-testid="manga-gen-panel"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {t("manga_gen_panel_btn", { n: costs?.mangaPanel ?? 15 })}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onGeneratePage}
          className="manga-generate-btn w-full manga-generate-secondary"
          data-testid="manga-gen-page"
        >
          {t("manga_gen_page_btn", { n: costs?.mangaPage ?? 40 })}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onGenerateChapter}
          className="manga-generate-btn w-full manga-generate-secondary"
          data-testid="manga-gen-chapter"
        >
          {t("manga_gen_chapter_btn", { n: costs?.mangaChapter ?? 150 })}
        </button>
      </div>
    </section>
  );
}
