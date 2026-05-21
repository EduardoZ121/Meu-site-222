import { useMemo, useState } from "react";
import {
  Eye, Pencil, RefreshCw, Loader2, PersonStanding, ChevronLeft, Save,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useI18n } from "../../lib/i18n";
import { getMangaStudioCatalog } from "../../lib/mangaStudioCatalog";
import StudioFieldTooltip from "./StudioFieldTooltip";
import { Slider } from "../ui/slider";
import { Switch } from "../ui/switch";
import { characterConsistencyScore } from "../../lib/comic-engine/characterLock";
import { resolvePanelLighting } from "../../lib/comic-engine/sceneContinuity";
import { useSingleAccordion } from "./useSingleAccordion";
import PanelSection from "./PanelSection";
import MangaUploadZone from "./MangaUploadZone";
import { toast } from "sonner";

const POSE_CATS = [
  { id: "all", labelKey: "manga_pose_filter_all" },
  { id: "standing", labelKey: "manga_pose_filter_stand" },
  { id: "action", labelKey: "manga_pose_filter_action" },
  { id: "emotional", labelKey: "manga_pose_filter_emo" },
];

const POSE_CAT_MAP = {
  talk: "standing",
  sit: "standing",
  think: "emotional",
  surprise: "emotional",
  run: "action",
  attack: "action",
};

const EXPR_EMOJI = {
  normal: "😐",
  happy: "😊",
  sad: "😢",
  angry: "😠",
  fear: "😲",
  shy: "😳",
  determined: "😤",
};

function ChipBtn({ options, value, onChange, size = "md" }) {
  return (
    <div className="manga-chip-grid">
      {options.map((opt) => {
        const id = typeof opt === "string" ? opt : opt.id;
        const label = typeof opt === "string" ? opt : opt.label;
        const emoji = opt.emoji;
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              "manga-chip-btn-lg",
              size === "sm" && "manga-chip-btn-lg--sm",
              active && "manga-chip-btn-lg--active",
            )}
          >
            {emoji && <span className="text-lg leading-none">{emoji}</span>}
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function balloonPreviewClass(type, shape) {
  const base = "manga-balloon-preview";
  if (type === "thought") return `${base} manga-balloon-preview--thought`;
  if (type === "shout") return `${base} manga-balloon-preview--shout`;
  if (type === "whisper") return `${base} manga-balloon-preview--whisper`;
  if (type === "narration" || shape === "rectangular") return `${base} manga-balloon-preview--narration`;
  return base;
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
  onBackToEditor,
  onSaveDraft,
  hideGenerateActions = false,
}) {
  const { t } = useI18n();
  const catalog = useMemo(() => getMangaStudioCatalog(t), [t]);
  const { isOpen, toggle } = useSingleAccordion("character");
  const [poseFilter, setPoseFilter] = useState("all");

  if (!panel) {
    return (
      <div className="manga-empty-state">
        <p>{t("manga_select_panel")}</p>
      </div>
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

  const filteredPoses = catalog.poses.filter((p) => {
    if (poseFilter === "all") return true;
    return (POSE_CAT_MAP[p.id] || "standing") === poseFilter;
  });

  const currentPose = catalog.poses.find((p) => p.id === panel.poseId);

  const tipEye = {
    title: t("manga_tip_eye_title"),
    why: t("manga_tip_eye_why"),
    tip: t("manga_tip_eye_tip"),
  };
  const tipScreen = {
    title: t("manga_tip_screen_title"),
    why: t("manga_tip_screen_why"),
    tip: t("manga_tip_screen_tip"),
  };
  const tipShot = {
    title: t("manga_tip_shot_title"),
    why: t("manga_tip_shot_why"),
    tip: t("manga_tip_shot_tip"),
  };

  return (
    <div className="manga-panel-editor-v21" data-testid="manga-panel-editor">
      {onBackToEditor && (
        <button type="button" className="manga-back-link min-h-[44px]" onClick={onBackToEditor}>
          <ChevronLeft className="w-4 h-4" />
          {t("manga_back_page_editor")}
        </button>
      )}

      <p className="manga-panel-step-label">
        {t("manga_panel_of", { current: panelIndex + 1, total: panelTotal })}
      </p>

      {/* Preview */}
      <div className="manga-panel-preview-card">
        <div className="manga-panel-preview-frame">
          {panel.resultUrl ? (
            <img src={panel.resultUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="manga-panel-preview-placeholder">
              <PersonStanding className="w-10 h-10 text-[#8B5CF6]/40" />
              <span>{t("manga_preview_placeholder")}</span>
            </div>
          )}
          {panel.balloonText?.trim() && (
            <div
              className={cn(
                balloonPreviewClass(panel.balloonType, panel.balloonShape),
                panel.balloonPos === "top" && "top-3",
                panel.balloonPos === "bottom" && "bottom-3",
                panel.balloonPos === "left" && "left-3 top-1/2 -translate-y-1/2",
                panel.balloonPos === "right" && "right-3 top-1/2 -translate-y-1/2",
              )}
            >
              {panel.balloonText}
            </div>
          )}
          {panel.status === "generating" && (
            <div className="manga-panel-preview-loading">
              <Loader2 className="w-8 h-8 animate-spin text-[#8B5CF6]" />
            </div>
          )}
        </div>
        <p className="manga-panel-preview-meta">
          {t("manga_pose_current")}: {currentPose?.emoji} {currentPose?.label}
        </p>
      </div>

      <div className="manga-panel-sections">
        <PanelSection
          id="character"
          icon="👤"
          title={t("manga_sec_character")}
          hint={t("manga_sec_character_hint")}
          open={isOpen("character")}
          onToggle={toggle}
        >
          <select
            className="field-input w-full text-[16px] min-h-[44px] mb-2"
            value={panel.characterId || ""}
            onChange={(e) => onPatchPanel({ characterId: e.target.value || null })}
          >
            <option value="">{t("manga_choose")}</option>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              className="manga-chip-btn flex-1 min-h-[44px] justify-center"
              disabled={!activeCharacterId}
              onClick={() => activeCharacterId && onPreviewCharacter?.(activeCharacterId)}
            >
              <Eye className="w-4 h-4" /> {t("manga_visual")}
            </button>
            <button
              type="button"
              className="manga-chip-btn flex-1 min-h-[44px] justify-center"
              disabled={!activeCharacterId}
              onClick={() => activeCharacterId && onEditCharacter?.(activeCharacterId)}
            >
              <Pencil className="w-4 h-4" /> {t("manga_edit")}
            </button>
          </div>
          {char && (
            <div className="manga-inline-card">
              <p className="text-[13px] text-[#E9D5FF]">
                {t("manga_outfit_current")}: 👕 {outfits.find((o) => o.id === panel.outfitId)?.name || outfits[0]?.name}
              </p>
              <ChipBtn
                options={outfits.map((o) => ({ id: o.id, label: o.name }))}
                value={panel.outfitId || outfits.find((o) => o.isDefault)?.id}
                onChange={(v) => onPatchPanel({ outfitId: v })}
                size="sm"
              />
              <p className="text-[12px] text-[#9CA3AF] mt-2">
                🔒 {t("manga_consistency_lock")} · {consistency}%
              </p>
              <p className="text-[11px] text-[#5A5A5E] italic">{t("manga_consistency_lock_hint")}</p>
            </div>
          )}
        </PanelSection>

        <PanelSection
          id="pose"
          icon="🏃"
          title={t("manga_sec_pose")}
          hint={t("manga_sec_pose_hint")}
          open={isOpen("pose")}
          onToggle={toggle}
        >
          <div className="manga-chip-scroll mb-2">
            {POSE_CATS.map((c) => (
              <button
                key={c.id}
                type="button"
                className={cn("manga-pill", poseFilter === c.id && "manga-pill--active")}
                onClick={() => setPoseFilter(c.id)}
              >
                {t(c.labelKey)}
              </button>
            ))}
          </div>
          <div className="manga-pose-grid">
            {filteredPoses.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onPatchPanel({ poseId: p.id })}
                className={cn("manga-pose-tile", panel.poseId === p.id && "manga-pose-tile--active")}
              >
                <span className="text-xl">{p.emoji}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
          <MangaUploadZone
            compact
            hint={t("manga_pose_upload_hint")}
            onFile={() => toast.message(t("manga_pose_upload_ok"))}
          />
          <div className="manga-inline-card mt-3">
            <p className="text-[13px] font-medium text-[#E9D5FF] mb-2 flex items-center gap-1">
              👐 {t("manga_hand_pose")}
              <StudioFieldTooltip
                title={t("manga_tip_hand_title")}
                why={t("manga_tip_hand_why")}
                tip={t("manga_tip_hand_tip")}
              />
            </p>
            <ChipBtn
              options={catalog.handPoses}
              value={panel.handPose || "open"}
              onChange={(v) => onPatchPanel({ handPose: v })}
              size="sm"
            />
            <p className="text-[11px] text-amber-200/80 mt-2">⚠️ {t("manga_hand_warn")}</p>
          </div>
        </PanelSection>

        <PanelSection
          id="expression"
          icon="😊"
          title={t("manga_sec_expression")}
          hint={t("manga_sec_expression_hint")}
          open={isOpen("expression")}
          onToggle={toggle}
        >
          <div className="manga-pose-grid">
            {catalog.expressions.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => onPatchPanel({ expression: ex.id })}
                className={cn("manga-pose-tile", panel.expression === ex.id && "manga-pose-tile--active")}
              >
                <span className="text-xl">{EXPR_EMOJI[ex.id] || "😐"}</span>
                <span>{ex.label}</span>
              </button>
            ))}
          </div>
        </PanelSection>

        <PanelSection
          id="outfit"
          icon="👕"
          title={t("manga_sec_outfit")}
          hint={t("manga_sec_outfit_hint")}
          open={isOpen("outfit")}
          onToggle={toggle}
        >
          <MangaUploadZone
            label={t("manga_outfit_upload_label")}
            hint={t("manga_outfit_upload_hint")}
            onFile={async ({ url, file }) => {
              if (!char) {
                return;
              }
              /* parent should patch character - emit via onEditCharacter for now */
            }}
          />
          <ChipBtn
            options={outfits.map((o) => ({ id: o.id, label: o.name }))}
            value={panel.outfitId || outfits.find((o) => o.isDefault)?.id}
            onChange={(v) => onPatchPanel({ outfitId: v })}
          />
        </PanelSection>

        <PanelSection
          id="camera"
          icon="📐"
          title={t("manga_sec_camera")}
          hint={t("manga_sec_camera_hint")}
          open={isOpen("camera")}
          onToggle={toggle}
          tooltip={tipScreen}
        >
          <p className="manga-field-label">{t("manga_field_angle")}</p>
          <ChipBtn options={catalog.angles} value={panel.angle} onChange={(v) => onPatchPanel({ angle: v })} size="sm" />
          <p className="manga-field-label mt-3 flex items-center gap-1">
            {t("manga_field_shot_size")}
            <StudioFieldTooltip {...tipShot} />
          </p>
          <ChipBtn options={catalog.shots} value={panel.shot} onChange={(v) => onPatchPanel({ shot: v })} size="sm" />
          <p className="manga-field-label mt-3 flex items-center gap-1">
            {t("manga_eye_level")} ({panel.eyeLevel ?? 0}°)
            <StudioFieldTooltip {...tipEye} />
          </p>
          <Slider
            value={[panel.eyeLevel ?? 0]}
            min={-30}
            max={30}
            step={1}
            onValueChange={([v]) => onPatchPanel({ eyeLevel: v })}
            className="py-3"
          />
          <p className="manga-field-label mt-2">{t("manga_screen_direction")}</p>
          <ChipBtn
            options={catalog.screenDirections}
            value={panel.screenDirection || "left-to-right"}
            onChange={(v) => onPatchPanel({ screenDirection: v })}
            size="sm"
          />
          <p className="manga-field-label mt-3">{t("manga_field_framing")}</p>
          <ChipBtn options={catalog.framing} value={panel.framing} onChange={(v) => onPatchPanel({ framing: v })} size="sm" />
          <p className="manga-field-label mt-2">{t("manga_field_focus")}</p>
          <ChipBtn options={catalog.focus} value={panel.focus} onChange={(v) => onPatchPanel({ focus: v })} size="sm" />
        </PanelSection>

        <PanelSection
          id="dialogue"
          icon="💬"
          title={t("manga_sec_dialogue")}
          hint={t("manga_sec_dialogue_hint")}
          open={isOpen("dialogue")}
          onToggle={toggle}
        >
          <textarea
            className="field-input w-full min-h-[88px] text-[16px] resize-y"
            placeholder={t("manga_balloon_placeholder")}
            value={panel.balloonText}
            onChange={(e) => onPatchPanel({ balloonText: e.target.value })}
          />
          <p className="manga-field-label">{t("manga_field_type")}</p>
          <ChipBtn options={catalog.balloonTypes} value={panel.balloonType} onChange={(v) => onPatchPanel({ balloonType: v })} size="sm" />
          <p className="manga-field-label">{t("manga_field_position")}</p>
          <ChipBtn options={catalog.balloonPos} value={panel.balloonPos} onChange={(v) => onPatchPanel({ balloonPos: v })} size="sm" />
          <p className="manga-field-label">{t("manga_field_letter")}</p>
          <ChipBtn options={catalog.letterStyles} value={panel.letterStyle} onChange={(v) => onPatchPanel({ letterStyle: v })} size="sm" />
        </PanelSection>

        <PanelSection
          id="lighting"
          icon="🌅"
          title={t("manga_sec_lighting")}
          hint={t("manga_sec_lighting_hint")}
          open={isOpen("lighting")}
          onToggle={toggle}
        >
          <div className="flex items-center justify-between min-h-[44px] mb-2">
            <span className="text-[14px] text-[#E9D5FF]">{t("manga_inherit_scene")}</span>
            <Switch
              checked={panel.inheritSceneLighting !== false}
              onCheckedChange={(v) => onPatchPanel({ inheritSceneLighting: v })}
            />
          </div>
          {scene && panel.inheritSceneLighting !== false && (
            <p className="text-[12px] text-[#9CA3AF] mb-3 italic">
              {t("manga_inherit_from", { name: scene.name, time: lighting.timeOfDay })}
            </p>
          )}
          <select
            className="field-input w-full text-[16px] min-h-[44px] mb-3"
            value={panel.scenarioId || ""}
            onChange={(e) => onPatchPanel({ scenarioId: e.target.value || null })}
          >
            <option value="">{t("manga_choose")} {t("manga_scenario")}</option>
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {scenarios.find((s) => s.id === panel.scenarioId) && (
            <MangaUploadZone compact label={t("manga_scene_upload_label")} hint={t("manga_scene_upload_hint")} />
          )}
          {panel.inheritSceneLighting === false && (
            <>
              <p className="manga-field-label">{t("manga_field_lighting")}</p>
              <ChipBtn options={catalog.lighting} value={panel.lighting} onChange={(v) => onPatchPanel({ lighting: v })} size="sm" />
              <p className="manga-field-label mt-2">{t("manga_light_direction")}: {panel.lightingDirection ?? 120}°</p>
              <Slider
                value={[panel.lightingDirection ?? 120]}
                min={0}
                max={360}
                step={5}
                onValueChange={([v]) => onPatchPanel({ lightingDirection: v })}
              />
              <p className="manga-field-label mt-2">
                {t("manga_light_intensity")}: {Math.round((panel.lightingIntensity ?? 0.72) * 100)}%
              </p>
              <Slider
                value={[Math.round((panel.lightingIntensity ?? 0.72) * 100)]}
                min={0}
                max={100}
                step={5}
                onValueChange={([v]) => onPatchPanel({ lightingIntensity: v / 100 })}
              />
              <ChipBtn
                options={catalog.lightingColorTemps}
                value={panel.lightingColorTemp || "neutral"}
                onChange={(v) => onPatchPanel({ lightingColorTemp: v })}
                size="sm"
              />
            </>
          )}
        </PanelSection>

        <PanelSection
          id="effects"
          icon="✨"
          title={t("manga_field_effects")}
          hint={t("manga_sec_effects_hint")}
          open={isOpen("effects")}
          onToggle={toggle}
        >
          <div className="space-y-3">
            {catalog.effects.map((fx) => (
              <label key={fx.id} className="manga-effect-row min-h-[44px]">
                <input
                  type="checkbox"
                  checked={!!panel.effects?.[fx.id]}
                  onChange={() => {
                    onPatchPanel({
                      effects: { ...panel.effects, [fx.id]: !panel.effects?.[fx.id] },
                    });
                  }}
                  className="w-4 h-4"
                />
                <span className="text-[14px]">{fx.label}</span>
              </label>
            ))}
            {panel.effects?.speed_lines && (
              <div className="manga-inline-card">
                <p className="manga-field-label">{t("manga_fx_direction")}</p>
                <Slider
                  value={[panel.effects?.speed_direction ?? 45]}
                  min={0}
                  max={360}
                  step={15}
                  onValueChange={([v]) => onPatchPanel({
                    effects: { ...panel.effects, speed_direction: v },
                  })}
                />
              </div>
            )}
          </div>
        </PanelSection>
      </div>

      {!hideGenerateActions && (
        <div className="manga-panel-actions-inline hidden lg:flex flex-col gap-2 mt-4">
          <button type="button" disabled={busy} onClick={onGeneratePanel} className="manga-cta-btn min-h-[56px]" data-testid="manga-gen-panel">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {t("manga_gen_panel_btn", { n: costs?.mangaPanel ?? 15 })}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" disabled={busy} onClick={onGeneratePage} className="manga-secondary-cta min-h-[48px]">
              {t("manga_gen_page_short", { n: costs?.mangaPage ?? 40 })}
            </button>
            <button type="button" disabled={busy} onClick={onGenerateChapter} className="manga-secondary-cta min-h-[48px]">
              {t("manga_gen_chapter_short", { n: costs?.mangaChapter ?? 150 })}
            </button>
          </div>
          {onSaveDraft && (
            <button type="button" className="manga-chip-btn w-full min-h-[44px] justify-center" onClick={onSaveDraft}>
              <Save className="w-4 h-4" /> {t("manga_save_draft")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
