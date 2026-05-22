import { useMemo, useState } from "react";
import {
  Plus, Upload, Users, Link2, MapPin, Cloud, Sun, Moon, ChevronDown,
  Save, Layers, Sparkles, Pencil, Copy, Trash2,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useI18n } from "../../lib/i18n";
import {
  SCENE_TYPES,
  SCENE_WEATHER,
  SCENE_LIGHTING,
  SCENE_TIME,
  SCENE_INTERACTIONS,
  SCENE_CHAR_POSITIONS,
  SCENE_DISTANCES,
  SCENE_FORMATIONS,
  buildSceneEnvironmentInfluence,
  buildPanelSceneDraft,
  emptySavedComposition,
} from "../../lib/mangaScenarioStudio";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
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

function SceneBadge({ children, variant = "default" }) {
  return (
    <span
      className={cn(
        "manga-scene-badge",
        variant === "accent" && "manga-scene-badge--accent",
        variant === "weather" && "manga-scene-badge--weather",
      )}
    >
      {children}
    </span>
  );
}

/** Linha colapsável com preview maior (só cenários). */
export function MangaScenarioRow({
  scenario: s,
  expanded,
  onToggle,
  onEdit,
  onDuplicate,
  onDelete,
  children,
  t,
}) {
  const cfg = s.sceneConfig || {};
  const connected = cfg.connectedCharacterIds?.length || 0;
  const ixCount = cfg.enabledInteractions?.length || 0;

  return (
    <div
      className={cn(
        "manga-scenario-row rounded-xl border overflow-hidden transition-all duration-300",
        expanded
          ? "border-[rgba(168,85,247,0.45)] shadow-[0_0_24px_-8px_rgba(147,51,234,0.45)]"
          : "border-[#2E2E30]/80",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start gap-3 px-2.5 py-2.5 text-left hover:bg-[#13131A]/60 transition-colors"
      >
        <div className="manga-scenario-row__thumb shrink-0">
          {s.thumb ? (
            <img src={s.thumb} alt="" className="w-full h-full object-cover" />
          ) : (
            <MapPin className="w-5 h-5 text-[#5A5A5E]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[#F4F1EA] text-[12px] font-semibold truncate">{s.name}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {cfg.weather && (
              <SceneBadge variant="weather">{t(`manga_scn_weather_${cfg.weather}`)}</SceneBadge>
            )}
            {cfg.lightingStyle && (
              <SceneBadge variant="accent">{t(`manga_scn_light_${cfg.lightingStyle}`)}</SceneBadge>
            )}
            {cfg.timeOfDay && (
              <SceneBadge>{t(`manga_scn_time_${cfg.timeOfDay}`)}</SceneBadge>
            )}
          </div>
          <p className="text-[#5A5A5E] text-[10px] mt-1 truncate">
            {connected > 0
              ? t("manga_scn_meta_connected", { n: connected, ix: ixCount })
              : t("manga_scn_meta_empty")}
          </p>
        </div>
        <span
          className={cn(
            "text-[#5A5A5E] text-xs shrink-0 transition-transform mt-1",
            expanded && "rotate-180",
          )}
        >
          ▼
        </span>
      </button>
      {expanded && (
        <div className="px-2.5 pb-2.5 border-t border-[#2E2E30]/60 pt-2 space-y-2 manga-scenario-row__body">
          {children}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button type="button" onClick={onEdit} className="manga-chip-btn">
              <Pencil className="w-3 h-3" /> {t("manga_edit")}
            </button>
            <button type="button" onClick={onDuplicate} className="manga-chip-btn">
              <Copy className="w-3 h-3" /> {t("manga_duplicate")}
            </button>
            <button type="button" onClick={onDelete} className="manga-chip-btn text-red-400/90">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MangaScenarioCard({
  scenario: s,
  characters,
  onUpdate,
  onSaveComposition,
  onPreparePanelDraft,
}) {
  const { t } = useI18n();
  const [connectOpen, setConnectOpen] = useState(true);
  const cfg = s.sceneConfig || {};
  const connectedIds = cfg.connectedCharacterIds || [];

  const patchConfig = (partial) => {
    onUpdate({
      ...s,
      sceneConfig: { ...cfg, ...partial },
    });
  };

  const toggleChar = (charId) => {
    const set = new Set(connectedIds);
    if (set.has(charId)) set.delete(charId);
    else set.add(charId);
    const next = [...set];
    const slots = { ...(cfg.positioning?.slots || {}) };
    if (!set.has(charId)) delete slots[charId];
    else if (!slots[charId]) slots[charId] = next.length <= 1 ? "left" : "right";
    patchConfig({
      connectedCharacterIds: next,
      positioning: { ...cfg.positioning, slots },
    });
  };

  const toggleInteraction = (ixId) => {
    const set = new Set(cfg.enabledInteractions || []);
    if (set.has(ixId)) set.delete(ixId);
    else set.add(ixId);
    patchConfig({ enabledInteractions: [...set] });
  };

  const influencePreview = useMemo(() => buildSceneEnvironmentInfluence(s), [s]);

  const canDraft = connectedIds.length >= 1;

  const handleSaveComposition = () => {
    const draft = buildPanelSceneDraft({
      scenario: s,
      characters,
      characterIds: connectedIds,
    });
    const label =
      window.prompt(t("manga_scn_comp_label"), t("manga_scn_comp_default")) ||
      t("manga_scn_comp_default");
    if (!label) return;
    const entry = emptySavedComposition({ label, draft });
    onUpdate({
      ...s,
      savedCompositions: [entry, ...(s.savedCompositions || [])].slice(0, 10),
    });
    onSaveComposition?.(draft, entry);
  };

  const handlePreparePanel = () => {
    if (!canDraft) return;
    const draft = buildPanelSceneDraft({
      scenario: s,
      characters,
      characterIds: connectedIds,
    });
    onPreparePanelDraft?.(draft);
  };

  return (
    <div className="manga-scenario-detail space-y-2.5" data-testid={`manga-scenario-${s.id}`}>
      <div className="manga-scenario-preview">
        {s.thumb ? (
          <img src={s.thumb} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[#5A5A5E] gap-1">
            <MapPin className="w-8 h-8 opacity-40" />
            <span className="text-[10px]">{t("manga_scn_no_preview")}</span>
          </div>
        )}
        <div className="manga-scenario-preview__glow" aria-hidden />
      </div>

      <label className="manga-chip-btn cursor-pointer w-full justify-center">
        <Upload className="w-3 h-3" /> {t("manga_upload_image")}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const url = await readFileAsDataUrl(f);
            onUpdate({ ...s, thumb: url });
          }}
        />
      </label>

      <div className="manga-char-block manga-char-block--accent">
        <p className="manga-char-block__title flex items-center gap-1">
          <Layers className="w-3.5 h-3.5" /> {t("manga_scn_config")}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <MiniSelect
            label={t("manga_scn_type")}
            value={cfg.sceneType}
            onChange={(v) => patchConfig({ sceneType: v })}
            options={SCENE_TYPES.map((x) => ({
              value: x.id,
              label: t(`manga_scn_type_${x.id}`),
            }))}
          />
          <MiniSelect
            label={t("manga_scn_weather")}
            value={cfg.weather}
            onChange={(v) => patchConfig({ weather: v })}
            options={SCENE_WEATHER.map((x) => ({
              value: x.id,
              label: t(`manga_scn_weather_${x.id}`),
            }))}
          />
          <MiniSelect
            label={t("manga_scn_lighting")}
            value={cfg.lightingStyle}
            onChange={(v) => patchConfig({ lightingStyle: v })}
            options={SCENE_LIGHTING.map((x) => ({
              value: x.id,
              label: t(`manga_scn_light_${x.id}`),
            }))}
          />
          <MiniSelect
            label={t("manga_scn_time")}
            value={cfg.timeOfDay}
            onChange={(v) => patchConfig({ timeOfDay: v })}
            options={SCENE_TIME.map((x) => ({
              value: x.id,
              label: t(`manga_scn_time_${x.id}`),
            }))}
          />
        </div>
        <p className="text-[10px] text-[#7c3aed] leading-snug mt-1.5">
          <Sparkles className="w-3 h-3 inline mr-0.5" />
          {t("manga_scn_influence_hint")}
        </p>
        <p className="text-[9px] text-[#5A5A5E] leading-relaxed max-h-16 overflow-y-auto">
          {influencePreview}
        </p>
      </div>

      <div className="manga-char-block">
        <button
          type="button"
          className="w-full flex items-center justify-between gap-2"
          onClick={() => setConnectOpen(!connectOpen)}
        >
          <span className="manga-char-block__title flex items-center gap-1">
            <Link2 className="w-3 h-3" /> {t("manga_scn_connect_chars")}
          </span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", connectOpen && "rotate-180")} />
        </button>
        {connectOpen && (
          <div className="mt-2 space-y-1 max-h-36 overflow-y-auto">
            {!characters.length && (
              <p className="text-[10px] text-[#5A5A5E]">{t("manga_no_characters")}</p>
            )}
            {characters.map((c) => (
              <label
                key={c.id}
                className="manga-scn-char-pick flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={connectedIds.includes(c.id)}
                  onChange={() => toggleChar(c.id)}
                  className="rounded border-[#2E2E30]"
                />
                {c.thumb || c.sheets?.front ? (
                  <img
                    src={c.thumb || c.sheets?.front}
                    alt=""
                    className="w-7 h-7 rounded object-cover border border-[#2E2E30]"
                  />
                ) : (
                  <Users className="w-4 h-4 text-[#5A5A5E]" />
                )}
                <span className="text-[11px] text-[#F4F1EA] truncate flex-1">{c.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {connectedIds.length > 0 && (
        <>
          <div className="manga-char-block">
            <p className="manga-char-block__title">{t("manga_scn_ix_possible")}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
              {SCENE_INTERACTIONS.map((ixId) => (
                <button
                  key={ixId}
                  type="button"
                  className={cn(
                    "manga-ix-type-btn text-[9px]",
                    (cfg.enabledInteractions || []).includes(ixId) && "manga-ix-type-btn--active",
                    cfg.activeInteraction === ixId && "ring-1 ring-[#22d3ee]",
                  )}
                  onClick={() => {
                    toggleInteraction(ixId);
                    patchConfig({ activeInteraction: ixId });
                  }}
                >
                  {["train", "group", "joint_pose"].includes(ixId)
                    ? t(`manga_scn_ix_${ixId}`)
                    : t(`manga_ix_type_${ixId}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="manga-char-block">
            <p className="manga-char-block__title">{t("manga_scn_positioning")}</p>
            <div className="grid grid-cols-2 gap-2">
              <MiniSelect
                label={t("manga_ix_distance")}
                value={cfg.positioning?.distance || "medium"}
                onChange={(v) =>
                  patchConfig({
                    positioning: { ...cfg.positioning, distance: v },
                  })}
                options={SCENE_DISTANCES.map((x) => ({
                  value: x.id,
                  label: t(`manga_ix_dist_${x.id}`),
                }))}
              />
              <MiniSelect
                label={t("manga_scn_formation")}
                value={cfg.positioning?.formation || "side_by_side"}
                onChange={(v) =>
                  patchConfig({
                    positioning: { ...cfg.positioning, formation: v },
                  })}
                options={SCENE_FORMATIONS.map((x) => ({
                  value: x.id,
                  label: t(`manga_scn_form_${x.id}`),
                }))}
              />
            </div>
            {connectedIds.map((cid) => {
              const ch = characters.find((c) => c.id === cid);
              if (!ch) return null;
              return (
                <MiniSelect
                  key={cid}
                  label={t("manga_scn_char_pos", { name: ch.name })}
                  value={cfg.positioning?.slots?.[cid] || "center"}
                  onChange={(v) =>
                    patchConfig({
                      positioning: {
                        ...cfg.positioning,
                        slots: { ...(cfg.positioning?.slots || {}), [cid]: v },
                      },
                    })}
                  options={SCENE_CHAR_POSITIONS.map((x) => ({
                    value: x.id,
                    label: t(`manga_scn_pos_${x.id}`),
                  }))}
                />
              );
            })}
          </div>
        </>
      )}

      <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          className="manga-chip-btn flex-1 justify-center min-w-0"
          disabled={!canDraft}
          onClick={handleSaveComposition}
        >
          <Save className="w-3 h-3 shrink-0" /> {t("manga_scn_save_comp")}
        </button>
        <button
          type="button"
          className="manga-generate-btn flex-1 min-w-0"
          disabled={!canDraft || connectedIds.length < 1}
          onClick={handlePreparePanel}
        >
          <Layers className="w-3.5 h-3.5 shrink-0" /> {t("manga_scn_prepare_panel")}
        </button>
      </div>
      <p className="text-[10px] text-[#5A5A5E] leading-snug">{t("manga_scn_panel_note")}</p>

      {(s.savedCompositions || []).length > 0 && (
        <div className="manga-char-block">
          <p className="manga-char-block__title">{t("manga_scn_memory")}</p>
          <ul className="space-y-1">
            {(s.savedCompositions || []).slice(0, 6).map((comp) => (
              <li key={comp.id} className="text-[10px] text-[#9CA3AF] flex justify-between gap-2">
                <span className="truncate">{comp.label}</span>
                <span className="text-[#5A5A5E] shrink-0">
                  {comp.draft?.characterNames?.length || 0} {t("manga_scn_chars_short")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
