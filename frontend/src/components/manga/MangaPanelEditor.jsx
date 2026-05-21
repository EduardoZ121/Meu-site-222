import { useMemo } from "react";
import {
  Eye, Pencil, RefreshCw, Loader2, PersonStanding, ChevronLeft,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useI18n } from "../../lib/i18n";
import { getMangaStudioCatalog } from "../../lib/mangaStudioCatalog";
import CollapsibleSection from "../CollapsibleSection";
import StudioFieldTooltip from "./StudioFieldTooltip";
import { Slider } from "../ui/slider";
import { Switch } from "../ui/switch";
import { characterConsistencyScore } from "../../lib/comic-engine/characterLock";
import { resolvePanelLighting } from "../../lib/comic-engine/sceneContinuity";

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

export default function MangaPanelEditor({
  project,
  panel,
  panelIndex = 0,
  panelTotal = 1,
  onPatchPanel,
  costs,
  busy,
  activeCharacterId,
  onEditCharacter,
  onPreviewCharacter,
  onGeneratePanel,
  onGeneratePage,
  onGenerateChapter,
  onBackToStory,
  hideGenerateActions = false,
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
  const char = characters.find((c) => c.id === panel.characterId);
  const scene = scenarios.find((s) => s.id === panel.scenarioId);
  const consistency = char ? characterConsistencyScore(char) : 0;
  const lighting = resolvePanelLighting(panel, scene);
  const outfits = char?.outfitSlots?.length
    ? char.outfitSlots
    : [{ id: "default", name: t("manga_outfit_default"), category: "casual", isDefault: true }];

  return (
    <section
      className="manga-panel-editor rounded-2xl border border-[rgba(147,51,234,0.25)] bg-[#111118] overflow-hidden flex flex-col lg:max-h-[calc(100vh-10rem)]"
      data-testid="manga-panel-editor"
    >
      <div className="px-3 sm:px-4 py-2.5 border-b border-[#2E2E30] flex items-center gap-2 shrink-0">
        {onBackToStory && (
          <button
            type="button"
            onClick={onBackToStory}
            className="lg:hidden text-[11px] text-[#A855F7] flex items-center gap-1 hover:text-white shrink-0"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-white text-[13px] font-semibold">{t("manga_active_panel")}</h2>
          <p className="text-[10px] text-[#5A5A5E]">
            {t("manga_panel_of", { current: panelIndex + 1, total: panelTotal })}
          </p>
        </div>
      </div>

      <div className="relative shrink-0 mx-3 sm:mx-4 mt-3 rounded-xl border border-[#2E2E30] bg-[#0a0a0f] overflow-hidden aspect-[16/10] sm:aspect-[4/5] max-h-[160px] sm:max-h-[200px]">
        {panel.resultUrl ? (
          <img src={panel.resultUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#5A5A5E] text-xs p-4 text-center">
            <PersonStanding className="w-8 h-8 mb-2 text-[#9333EA]/50" />
            {t("manga_preview_placeholder")}
            <span className="text-[10px] mt-1 text-[#9333EA]/80">{catalog.poses.find((p) => p.id === panel.poseId)?.label}</span>
          </div>
        )}
        {panel.status === "generating" && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#A855F7]" />
          </div>
        )}
      </div>

      <div className="manga-panel-scroll flex-1 overflow-y-auto p-3 space-y-2 pb-4 lg:pb-3">
        <CollapsibleSection
          title={`👤 ${t("manga_sec_character")}`}
          hint={t("manga_sec_character_hint")}
          defaultOpen={panelIndex === 0}
          variant="boxed"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[#9CA3AF]">{t("manga_character")}</span>
              <StudioFieldTooltip
                title={t("manga_tip_char_title")}
                why={t("manga_tip_char_why")}
                tip={t("manga_tip_char_tip")}
              />
            </div>
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
              <button type="button" className="manga-chip-btn" disabled={!activeCharacterId} onClick={() => activeCharacterId && onPreviewCharacter?.(activeCharacterId)}>
                <Eye className="w-3 h-3" />
              </button>
              <button type="button" className="manga-chip-btn" disabled={!activeCharacterId} onClick={() => activeCharacterId && onEditCharacter?.(activeCharacterId)}>
                <Pencil className="w-3 h-3" />
              </button>
            </div>
            {char && (
              <p className="text-[10px] text-[#5A5A5E]">
                {t("manga_consistency_score")}: <span className="text-[#A855F7]">{consistency}%</span>
                {char.consistencyLock ? " 🔒" : ""}
              </p>
            )}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title={`🏃 ${t("manga_sec_pose")}`} hint={t("manga_sec_pose_hint")} variant="boxed">
          <label className="text-[11px] text-[#9CA3AF] block mb-1">{t("manga_field_pose")}</label>
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            {catalog.poses.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onPatchPanel({ poseId: p.id })}
                className={cn(
                  "rounded-lg border p-2 text-center text-[10px] transition-colors",
                  panel.poseId === p.id
                    ? "border-[#A855F7] bg-[#9333EA]/20 text-white"
                    : "border-[#2E2E30] text-[#9CA3AF] hover:border-[#5A5A5E]",
                )}
              >
                <span className="text-lg block">{p.emoji}</span>
                {p.label}
              </button>
            ))}
          </div>
          <label className="text-[11px] text-[#9CA3AF] block">{t("manga_hand_pose")}</label>
          <ChipGroup options={catalog.handPoses} value={panel.handPose || "open"} onChange={(v) => onPatchPanel({ handPose: v })} />
        </CollapsibleSection>

        <CollapsibleSection title={`😊 ${t("manga_sec_expression")}`} hint={t("manga_sec_expression_hint")} variant="boxed">
          <ChipGroup options={catalog.expressions} value={panel.expression} onChange={(v) => onPatchPanel({ expression: v })} />
        </CollapsibleSection>

        <CollapsibleSection title={`👕 ${t("manga_sec_outfit")}`} hint={t("manga_sec_outfit_hint")} variant="boxed">
          <ChipGroup
            options={outfits.map((o) => ({ id: o.id, label: o.name }))}
            value={panel.outfitId || outfits.find((o) => o.isDefault)?.id}
            onChange={(v) => onPatchPanel({ outfitId: v })}
          />
        </CollapsibleSection>

        <CollapsibleSection title={`📐 ${t("manga_sec_camera")}`} hint={t("manga_sec_camera_hint")} variant="boxed">
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-[#9CA3AF]">{t("manga_field_angle")}</span>
              <StudioFieldTooltip title={t("manga_tip_angle_title")} why={t("manga_tip_angle_why")} tip={t("manga_tip_angle_tip")} />
            </div>
            <ChipGroup options={catalog.angles} value={panel.angle} onChange={(v) => onPatchPanel({ angle: v })} />
            <span className="text-[11px] text-[#9CA3AF]">{t("manga_field_shot_size")}</span>
            <ChipGroup options={catalog.shots} value={panel.shot} onChange={(v) => onPatchPanel({ shot: v })} />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#9CA3AF]">{t("manga_eye_level")} ({panel.eyeLevel ?? 0}°)</span>
              <StudioFieldTooltip title={t("manga_tip_eye_title")} why={t("manga_tip_eye_why")} tip={t("manga_tip_eye_tip")} />
            </div>
            <Slider
              value={[panel.eyeLevel ?? 0]}
              min={-30}
              max={30}
              step={1}
              onValueChange={([v]) => onPatchPanel({ eyeLevel: v })}
              className="py-2"
            />
            <span className="text-[11px] text-[#9CA3AF]">{t("manga_screen_direction")}</span>
            <ChipGroup
              options={catalog.screenDirections}
              value={panel.screenDirection || "left-to-right"}
              onChange={(v) => onPatchPanel({ screenDirection: v })}
            />
            <span className="text-[11px] text-[#9CA3AF]">{t("manga_field_framing")}</span>
            <ChipGroup options={catalog.framing} value={panel.framing} onChange={(v) => onPatchPanel({ framing: v })} />
            <span className="text-[11px] text-[#9CA3AF]">{t("manga_field_focus")}</span>
            <ChipGroup options={catalog.focus} value={panel.focus} onChange={(v) => onPatchPanel({ focus: v })} />
          </div>
        </CollapsibleSection>

        <CollapsibleSection title={`💬 ${t("manga_sec_dialogue")}`} hint={t("manga_sec_dialogue_hint")} variant="boxed">
          <textarea
            className="field-input w-full min-h-[72px] text-[12px] resize-y"
            placeholder={t("manga_balloon_placeholder")}
            value={panel.balloonText}
            onChange={(e) => onPatchPanel({ balloonText: e.target.value })}
          />
          <ChipGroup options={catalog.balloonTypes} value={panel.balloonType} onChange={(v) => onPatchPanel({ balloonType: v })} />
          <ChipGroup options={catalog.balloonShapes} value={panel.balloonShape || "round"} onChange={(v) => onPatchPanel({ balloonShape: v })} />
          <ChipGroup options={catalog.balloonPos} value={panel.balloonPos} onChange={(v) => onPatchPanel({ balloonPos: v })} />
          <ChipGroup options={catalog.letterStyles} value={panel.letterStyle} onChange={(v) => onPatchPanel({ letterStyle: v })} />
          <label className="flex items-center gap-2 text-[11px] text-[#9CA3AF] mt-2 cursor-pointer">
            <input type="checkbox" checked={!!panel.narration} onChange={(e) => onPatchPanel({ narration: e.target.checked })} />
            {t("manga_narration_panel")}
          </label>
        </CollapsibleSection>

        <CollapsibleSection title={`🎨 ${t("manga_sec_lighting")}`} hint={t("manga_sec_lighting_hint")} variant="boxed">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-[#9CA3AF]">{t("manga_inherit_scene")}</span>
            <Switch
              checked={panel.inheritSceneLighting !== false}
              onCheckedChange={(v) => onPatchPanel({ inheritSceneLighting: v })}
            />
          </div>
          {scene && panel.inheritSceneLighting !== false && (
            <p className="text-[10px] text-[#5A5A5E] mb-2 italic">
              {t("manga_inherit_from", { name: scene.name, time: lighting.timeOfDay })}
            </p>
          )}
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
          {panel.inheritSceneLighting === false && (
            <>
              <ChipGroup options={catalog.lighting} value={panel.lighting} onChange={(v) => onPatchPanel({ lighting: v })} />
              <ChipGroup
                options={catalog.lightingColorTemps}
                value={panel.lightingColorTemp || "neutral"}
                onChange={(v) => onPatchPanel({ lightingColorTemp: v })}
              />
              <p className="text-[10px] text-[#5A5A5E] mt-1">
                {t("manga_light_direction")}: {panel.lightingDirection ?? 120}°
              </p>
              <Slider
                value={[panel.lightingDirection ?? 120]}
                min={0}
                max={360}
                step={5}
                onValueChange={([v]) => onPatchPanel({ lightingDirection: v })}
              />
            </>
          )}
        </CollapsibleSection>

        <CollapsibleSection title={`✨ ${t("manga_field_effects")}`} hint={t("manga_sec_effects_hint")} variant="boxed">
          <div className="grid grid-cols-1 gap-2">
            {catalog.effects.map((fx) => (
              <label key={fx.id} className="flex items-start gap-2 text-[11px] text-[#9CA3AF] cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!panel.effects?.[fx.id]}
                  onChange={() => onPatchPanel({ effects: { ...panel.effects, [fx.id]: !panel.effects?.[fx.id] } })}
                  className="rounded border-[#2E2E30] mt-0.5"
                />
                <span>{fx.label}</span>
              </label>
            ))}
          </div>
        </CollapsibleSection>
      </div>

      {!hideGenerateActions && (
        <div className="hidden lg:block p-3 space-y-2 border-t border-[#2E2E30] shrink-0">
          <button type="button" disabled={busy} onClick={onGeneratePanel} className="manga-generate-btn w-full" data-testid="manga-gen-panel">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {t("manga_gen_panel_btn", { n: costs?.mangaPanel ?? 15 })}
          </button>
          <button type="button" disabled={busy} onClick={onGeneratePage} className="manga-generate-btn w-full manga-generate-secondary" data-testid="manga-gen-page">
            {t("manga_gen_page_btn", { n: costs?.mangaPage ?? 40 })}
          </button>
          <button type="button" disabled={busy} onClick={onGenerateChapter} className="manga-generate-btn w-full manga-generate-secondary" data-testid="manga-gen-chapter">
            {t("manga_gen_chapter_btn", { n: costs?.mangaChapter ?? 150 })}
          </button>
        </div>
      )}
    </section>
  );
}
