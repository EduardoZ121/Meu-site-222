import { useMemo } from "react";
import {
  Eye, Pencil, Users, Link2, MessageCircle, ChevronDown, Layers, ArrowRight,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useI18n } from "../../lib/i18n";
import { getMangaStudioCatalog } from "../../lib/mangaStudioCatalog";
import {
  MANGA_INTERACTION_TYPES,
  MANGA_CHAR_DISTANCES,
  MANGA_CHAR_EMOTIONS,
  MANGA_CHAR_FOCUS,
  MANGA_CHAR_GAZE,
  defaultInteractionConfig,
} from "../../lib/mangaCharacterInteractions";
import { characterHasReference } from "../../lib/mangaCharacterRef";
import { buildPanelSceneDraft } from "../../lib/mangaScenarioStudio";

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

function MiniSelect({ label, value, onChange, options }) {
  return (
    <label className="manga-char-field">
      <span className="manga-char-field__label">{label}</span>
      <select
        className="manga-char-field__select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function MangaSceneEditor({
  project,
  editorScene,
  onChangeEditorScene,
  onSyncToPanel,
  onGoToPanel,
  onEditCharacter,
  onPreviewCharacter,
}) {
  const { t } = useI18n();
  const catalog = useMemo(() => getMangaStudioCatalog(t), [t]);
  const characters = project.characters || [];
  const scenarios = project.scenarios || [];

  const interactionOptions = useMemo(
    () =>
      MANGA_INTERACTION_TYPES.map((item) => ({
        id: item.id,
        label: t(`manga_ix_type_${item.id}`),
      })),
    [t],
  );

  if (!editorScene) {
    return (
      <section className="rounded-2xl border border-[rgba(147,51,234,0.2)] bg-[#111118] p-4 text-[#5A5A5E] text-sm">
        {t("manga_editor_empty")}
      </section>
    );
  }

  const patch = (partial) => onChangeEditorScene({ ...editorScene, ...partial });
  const ix = editorScene.interaction || defaultInteractionConfig();
  const patchIx = (partial) =>
    patch({
      interaction: { ...ix, ...partial },
      ...(partial.partnerId !== undefined
        ? { partnerCharacterId: partial.partnerId, duoMode: Boolean(partial.partnerId) }
        : {}),
    });

  const primary = characters.find((c) => c.id === editorScene.characterId);
  const partner = characters.find((c) => c.id === editorScene.partnerCharacterId);
  const others = characters.filter((c) => c.id !== editorScene.characterId);

  const applyScenarioPreset = (scenarioId) => {
    const s = scenarios.find((x) => x.id === scenarioId);
    if (!s) return;
    const ids = s.sceneConfig?.connectedCharacterIds || [];
    const draft = buildPanelSceneDraft({
      scenario: s,
      characters,
      characterIds: ids,
    });
    patch({
      scenarioId: s.id,
      characterId: ids[0] || editorScene.characterId,
      partnerCharacterId: ids[1] || null,
      duoMode: ids.length >= 2,
      poseId: editorScene.poseId,
      interaction: {
        ...defaultInteractionConfig(ids[1] || null),
        interactionType: draft.interactionType || "talk",
        partnerId: ids[1] || null,
      },
    });
  };

  return (
    <section
      className="rounded-2xl border border-[rgba(147,51,234,0.25)] bg-[#111118] p-4 space-y-4"
      data-testid="manga-scene-editor"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-white text-[13px] font-semibold">{t("manga_editor_title")}</h2>
          <p className="text-[10px] text-[#5A5A5E] mt-0.5">{t("manga_editor_desc")}</p>
        </div>
        <span className="text-[9px] uppercase tracking-wider text-[#A855F7] px-2 py-0.5 rounded border border-[#A855F7]/30">
          {t("manga_flow_step_editor")}
        </span>
      </div>

      <div>
        <FieldLabel>{t("manga_character")}</FieldLabel>
        <div className="flex gap-2 flex-wrap items-center">
          <select
            className="field-input flex-1 min-w-[120px] text-[12px]"
            value={editorScene.characterId || ""}
            onChange={(e) => patch({ characterId: e.target.value || null })}
          >
            <option value="">{t("manga_choose")}</option>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            type="button"
            className="manga-chip-btn"
            disabled={!editorScene.characterId}
            onClick={() => editorScene.characterId && onPreviewCharacter?.(editorScene.characterId)}
          >
            <Eye className="w-3 h-3" />
          </button>
          <button
            type="button"
            className="manga-chip-btn"
            disabled={!editorScene.characterId}
            onClick={() => editorScene.characterId && onEditCharacter?.(editorScene.characterId)}
          >
            <Pencil className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="manga-char-block manga-char-block--accent">
        <label className="flex items-center gap-2 text-[11px] text-[#9CA3AF] cursor-pointer mb-2">
          <input
            type="checkbox"
            checked={editorScene.duoMode}
            onChange={(e) => {
              const on = e.target.checked;
              patch({
                duoMode: on,
                partnerCharacterId: on ? editorScene.partnerCharacterId : null,
                interaction: on
                  ? { ...defaultInteractionConfig(editorScene.partnerCharacterId), ...ix }
                  : defaultInteractionConfig(),
              });
            }}
            className="rounded border-[#2E2E30]"
          />
          <Users className="w-3.5 h-3.5 text-[#A855F7]" />
          {t("manga_editor_duo_mode")}
        </label>

        {editorScene.duoMode && (
          <div className="space-y-2.5">
            <MiniSelect
              label={t("manga_ix_partner")}
              value={editorScene.partnerCharacterId || ""}
              onChange={(v) =>
                patchIx({ partnerId: v || null, interactionType: ix.interactionType })}
              options={[
                { value: "", label: t("manga_ix_pick_partner") },
                ...others.map((o) => ({ value: o.id, label: o.name })),
              ]}
            />
            {partner && (
              <>
                <p
                  className={cn(
                    "text-[10px] rounded-md px-2 py-1 border",
                    characterHasReference(primary) && characterHasReference(partner)
                      ? "text-emerald-400/90 border-emerald-500/30 bg-emerald-500/10"
                      : "text-amber-400/90 border-amber-500/30 bg-amber-500/10",
                  )}
                >
                  {characterHasReference(primary) && characterHasReference(partner)
                    ? t("manga_editor_duo_refs_ok")
                    : t("manga_ix_need_refs")}
                </p>
                <p className="text-[10px] text-[#9CA3AF]">{t("manga_ix_type_label")}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                  {interactionOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={cn(
                        "manga-ix-type-btn",
                        ix.interactionType === opt.id && "manga-ix-type-btn--active",
                      )}
                      onClick={() => patchIx({ interactionType: opt.id })}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <MiniSelect
                    label={t("manga_ix_position", { name: primary?.name || "A" })}
                    value={ix.slotA}
                    onChange={(v) => patchIx({ slotA: v })}
                    options={[
                      { value: "left", label: t("manga_ix_left") },
                      { value: "right", label: t("manga_ix_right") },
                    ]}
                  />
                  <MiniSelect
                    label={t("manga_ix_distance")}
                    value={ix.distance}
                    onChange={(v) => patchIx({ distance: v })}
                    options={MANGA_CHAR_DISTANCES.map((d) => ({
                      value: d.id,
                      label: t(`manga_ix_dist_${d.id}`),
                    }))}
                  />
                  <MiniSelect
                    label={t("manga_ix_emotion_a", { name: primary?.name || "A" })}
                    value={ix.emotionA}
                    onChange={(v) => patchIx({ emotionA: v })}
                    options={MANGA_CHAR_EMOTIONS.map((e) => ({
                      value: e.id,
                      label: t(`manga_ix_emo_${e.id}`),
                    }))}
                  />
                  <MiniSelect
                    label={t("manga_ix_emotion_b", { name: partner.name })}
                    value={ix.emotionB}
                    onChange={(v) => patchIx({ emotionB: v })}
                    options={MANGA_CHAR_EMOTIONS.map((e) => ({
                      value: e.id,
                      label: t(`manga_ix_emo_${e.id}`),
                    }))}
                  />
                  <MiniSelect
                    label={t("manga_ix_focus")}
                    value={ix.focus}
                    onChange={(v) => patchIx({ focus: v })}
                    options={MANGA_CHAR_FOCUS.map((f) => ({
                      value: f.id,
                      label: t(`manga_ix_focus_${f.id}`),
                    }))}
                  />
                </div>
                <div className="manga-char-block manga-char-block--dialogue">
                  <p className="manga-char-block__title flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" /> {t("manga_ix_dialogue")}
                  </p>
                  <input
                    className="manga-char-input w-full"
                    placeholder={t("manga_ix_line_a", { name: primary?.name || "A" })}
                    value={ix.dialogueA}
                    onChange={(e) => patchIx({ dialogueA: e.target.value })}
                  />
                  <input
                    className="manga-char-input w-full mt-1"
                    placeholder={t("manga_ix_line_b", { name: partner.name })}
                    value={ix.dialogueB}
                    onChange={(e) => patchIx({ dialogueB: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div>
        <FieldLabel>{t("manga_scenario")}</FieldLabel>
        <select
          className="field-input w-full text-[12px] mb-2"
          value={editorScene.scenarioId || ""}
          onChange={(e) => {
            const id = e.target.value || null;
            patch({ scenarioId: id });
            if (id) applyScenarioPreset(id);
          }}
        >
          <option value="">{t("manga_choose")}</option>
          {scenarios.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <label className="text-[11px] text-[#9CA3AF] block">{t("manga_field_pose")}</label>
        <select
          className="field-input w-full text-[12px] mb-2"
          value={editorScene.poseId}
          onChange={(e) => patch({ poseId: e.target.value })}
        >
          {catalog.poses.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
        <label className="text-[11px] text-[#9CA3AF] block">{t("manga_field_expression")}</label>
        <ChipGroup
          options={catalog.expressions}
          value={editorScene.expression}
          onChange={(v) => patch({ expression: v })}
        />
        <label className="text-[11px] text-[#9CA3AF] block mt-2">{t("manga_field_angle")}</label>
        <ChipGroup
          options={catalog.angles}
          value={editorScene.angle}
          onChange={(v) => patch({ angle: v })}
        />
        <label className="text-[11px] text-[#9CA3AF] block mt-2">{t("manga_field_shot_size")}</label>
        <ChipGroup
          options={catalog.shots}
          value={editorScene.shot}
          onChange={(v) => patch({ shot: v })}
        />
        <label className="text-[11px] text-[#9CA3AF] block mt-2">{t("manga_field_lighting")}</label>
        <ChipGroup
          options={catalog.lighting}
          value={editorScene.lighting}
          onChange={(v) => patch({ lighting: v })}
        />
        <label className="text-[11px] text-[#9CA3AF] block mt-2">{t("manga_field_focus")}</label>
        <ChipGroup
          options={catalog.focus}
          value={editorScene.focus}
          onChange={(v) => patch({ focus: v })}
        />
      </div>

      <div>
        <FieldLabel>{t("manga_field_framing")}</FieldLabel>
        <ChipGroup
          options={catalog.framing}
          value={editorScene.framing}
          onChange={(v) => patch({ framing: v })}
        />
      </div>

      <div>
        <FieldLabel>{t("manga_balloon_text")}</FieldLabel>
        <textarea
          className="field-input w-full min-h-[72px] text-[12px] resize-y"
          placeholder={t("manga_balloon_placeholder")}
          value={editorScene.balloonText}
          onChange={(e) => patch({ balloonText: e.target.value })}
        />
        <p className="text-[11px] text-[#9CA3AF] mt-2">{t("manga_field_type")}</p>
        <ChipGroup
          options={catalog.balloonTypes}
          value={editorScene.balloonType}
          onChange={(v) => patch({ balloonType: v })}
        />
        <p className="text-[11px] text-[#9CA3AF] mt-2">{t("manga_field_position")}</p>
        <ChipGroup
          options={catalog.balloonPos}
          value={editorScene.balloonPos}
          onChange={(v) => patch({ balloonPos: v })}
        />
        <p className="text-[11px] text-[#9CA3AF] mt-2">{t("manga_field_letter")}</p>
        <ChipGroup
          options={catalog.letterStyles}
          value={editorScene.letterStyle}
          onChange={(v) => patch({ letterStyle: v })}
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
                checked={!!editorScene.effects?.[fx.id]}
                onChange={() =>
                  patch({
                    effects: {
                      ...editorScene.effects,
                      [fx.id]: !editorScene.effects?.[fx.id],
                    },
                  })}
                className="rounded border-[#2E2E30]"
              />
              {fx.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2 border-t border-[#2E2E30]">
        <button
          type="button"
          className="manga-chip-btn w-full justify-center"
          onClick={onSyncToPanel}
          data-testid="manga-sync-to-panel"
        >
          <Layers className="w-3.5 h-3.5" /> {t("manga_editor_sync_panel")}
        </button>
        <button
          type="button"
          className="manga-generate-btn w-full"
          onClick={onGoToPanel}
        >
          <ArrowRight className="w-4 h-4" /> {t("manga_editor_go_panel")}
        </button>
        <p className="text-[10px] text-[#5A5A5E] leading-snug">{t("manga_editor_flow_hint")}</p>
      </div>
    </section>
  );
}
