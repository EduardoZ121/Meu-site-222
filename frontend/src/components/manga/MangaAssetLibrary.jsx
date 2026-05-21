import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { useI18n } from "../../lib/i18n";
import { getMangaStudioCatalog } from "../../lib/mangaStudioCatalog";
import {
  emptyCharacter,
  emptyScenario,
  EXPRESSION_KEYS,
  DEFAULT_OUTFIT_SLOTS,
} from "../../lib/mangaStudioData";
import { characterConsistencyScore } from "../../lib/comic-engine/characterLock";
import MangaUploadZone, { readFileAsDataUrl } from "./MangaUploadZone";

const TABS = ["characters", "scenarios", "poses", "sfx"];

const SHEET_KEYS = [
  { key: "front", label: "FRONT" },
  { key: "profile", label: "PROF" },
  { key: "threeQuarter", label: "3/4" },
  { key: "back", label: "BACK" },
];

const EXPR_EMOJI = {
  normal: "😐",
  happy: "😊",
  sad: "😢",
  angry: "😠",
  fear: "😲",
};

function normalizeCharacter(c) {
  return {
    ...c,
    sheets: {
      front: null,
      profile: null,
      threeQuarter: null,
      back: null,
      expressions: {},
      ...(c.sheets || {}),
      expressions: { ...(c.sheets?.expressions || {}) },
    },
    outfitSlots: c.outfitSlots?.length
      ? c.outfitSlots
      : DEFAULT_OUTFIT_SLOTS.map((o) => ({ ...o })),
  };
}

function CharCard({ c, t, expanded, onToggle, onCommit, onDelete, onDuplicate }) {
  const [draft, setDraft] = useState(() => normalizeCharacter(c));
  const snapshotRef = useRef(null);

  useEffect(() => {
    if (expanded) setDraft(normalizeCharacter(c));
  }, [expanded, c]);

  const score = characterConsistencyScore(draft);
  const missing = [];
  if (!draft.sheets?.front) missing.push(t("manga_ref_front"));
  if (!draft.sheets?.profile) missing.push(t("manga_ref_profile"));
  if (!draft.sheets?.back) missing.push(t("manga_ref_back"));
  EXPRESSION_KEYS.forEach((k) => {
    if (!draft.sheets?.expressions?.[k]) missing.push(EXPR_EMOJI[k]);
  });

  const openExpand = () => {
    snapshotRef.current = JSON.stringify(normalizeCharacter(c));
    setDraft(normalizeCharacter(c));
    onToggle();
  };

  const handleToggle = () => {
    if (expanded) {
      onToggle();
      return;
    }
    openExpand();
  };

  const save = () => {
    onCommit(draft);
    onToggle();
  };

  const cancel = () => {
    if (snapshotRef.current) {
      try {
        setDraft(JSON.parse(snapshotRef.current));
      } catch {
        setDraft(normalizeCharacter(c));
      }
    }
    onToggle();
  };

  const patchDraft = (partial) => setDraft((prev) => ({ ...prev, ...partial }));

  const patchSheet = async (key, file) => {
    const url = await readFileAsDataUrl(file);
    patchDraft({
      thumb: key === "front" ? url : draft.thumb,
      _refFile: key === "front" ? file : draft._refFile,
      sheets: { ...draft.sheets, [key]: url },
    });
  };

  const addOutfit = () => {
    const name = window.prompt(t("manga_outfit_name_prompt"), t("manga_outfit_new"));
    if (!name?.trim()) return;
    patchDraft({
      outfitSlots: [
        ...draft.outfitSlots,
        { id: `outfit_${Date.now()}`, name: name.trim(), category: "custom", thumb: null },
      ],
    });
  };

  return (
    <article className={cn("manga-asset-card", expanded && "manga-asset-card--open")}>
      <button type="button" className="manga-asset-card-head" onClick={handleToggle}>
        <div className="manga-asset-thumb">
          {c.thumb || c.sheets?.front ? (
            <img src={c.thumb || c.sheets?.front} alt="" />
          ) : (
            <span>👤</span>
          )}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="font-medium text-[14px] text-white truncate">{c.name}</p>
          <p className="text-[11px] text-[#9CA3AF] truncate">{c.tag || c.bodyType}</p>
        </div>
        <span className="text-[11px] text-[#8B5CF6] font-mono">{score}%</span>
      </button>
      {expanded && (
        <div className="manga-asset-card-body">
          <p className="text-[12px] text-[#9CA3AF] mb-2">{t("manga_ref_sheet")}</p>
          <div className="manga-sheet-grid">
            {SHEET_KEYS.map(({ key, label }) => (
              <div key={key} className="manga-sheet-slot">
                <span className="manga-sheet-label">{label}</span>
                <div className="manga-sheet-img">
                  {draft.sheets?.[key] ? <img src={draft.sheets[key]} alt="" /> : null}
                </div>
                <MangaUploadZone
                  compact
                  className="!p-1 !mt-1 border-0 bg-transparent"
                  onFile={({ file }) => patchSheet(key, file)}
                />
              </div>
            ))}
          </div>

          <p className="text-[12px] text-[#A855F7] mt-3 mb-1">{t("manga_expressions_section")}</p>
          <div className="manga-expr-row">
            {EXPRESSION_KEYS.map((key) => (
              <div key={key} className="manga-expr-chip">
                <span className="text-lg">{EXPR_EMOJI[key]}</span>
                <div className="manga-sheet-img w-12 h-12 mx-auto">
                  {draft.sheets?.expressions?.[key] ? (
                    <img src={draft.sheets.expressions[key]} alt="" />
                  ) : null}
                </div>
                <label className="text-[10px] text-[#8B5CF6] cursor-pointer">
                  📷
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const url = await readFileAsDataUrl(f);
                      patchDraft({
                        sheets: {
                          ...draft.sheets,
                          expressions: { ...draft.sheets.expressions, [key]: url },
                        },
                      });
                    }}
                  />
                </label>
              </div>
            ))}
          </div>

          <p className="text-[12px] text-[#A855F7] mt-3 mb-1">👕 {t("manga_outfits_section")}</p>
          <div className="manga-outfit-slot-grid">
            {draft.outfitSlots.map((slot) => (
              <div key={slot.id} className="manga-outfit-slot">
                <p className="text-[11px] text-white font-medium truncate">{slot.name}</p>
                <div className="manga-sheet-img mt-1">
                  {slot.thumb ? <img src={slot.thumb} alt="" /> : null}
                </div>
                <MangaUploadZone
                  compact
                  className="!p-0 !mt-1 border-0 bg-transparent"
                  onFile={({ url }) => {
                    patchDraft({
                      outfitSlots: draft.outfitSlots.map((o) =>
                        o.id === slot.id ? { ...o, thumb: url } : o),
                    });
                  }}
                />
              </div>
            ))}
          </div>
          <button type="button" className="manga-primary-btn w-full mt-2 min-h-[44px]" onClick={addOutfit}>
            <Plus className="w-4 h-4" /> {t("manga_add_outfit")}
          </button>

          <div className="mt-3">
            <p className="text-[12px] text-[#A855F7] mb-1">{t("manga_consistency_score")}</p>
            <div className="manga-score-bar">
              <div className="manga-score-fill" style={{ width: `${score}%` }} />
            </div>
            {missing.length > 0 && (
              <p className="text-[11px] text-amber-200/80 mt-1">
                {t("manga_missing_refs", { list: missing.join(", ") })}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <button type="button" className="manga-cta-btn flex-1 min-h-[44px] !py-2" onClick={save}>
              💾 {t("manga_save")}
            </button>
            <button type="button" className="manga-secondary-cta flex-1 min-h-[44px]" onClick={cancel}>
              {t("manga_cancel")}
            </button>
            <button type="button" className="manga-chip-btn min-h-[44px]" onClick={onDuplicate}>
              <Copy className="w-3 h-3" /> {t("manga_duplicate")}
            </button>
            <button type="button" className="manga-chip-btn min-h-[44px]" onClick={onDelete}>
              <Trash2 className="w-3 h-3 text-red-400" />
            </button>
          </div>
        </div>
      )}
      {!expanded && (
        <div className="flex gap-2 px-3 pb-2">
          <button type="button" className="manga-chip-btn min-h-[40px] flex-1 justify-center" onClick={onDuplicate}>
            <Copy className="w-3 h-3" /> {t("manga_duplicate")}
          </button>
          <button type="button" className="manga-chip-btn min-h-[40px]" onClick={onDelete}>
            <Trash2 className="w-3 h-3 text-red-400" />
          </button>
        </div>
      )}
    </article>
  );
}

export default function MangaAssetLibrary({ project, onChange }) {
  const { t } = useI18n();
  const catalog = useMemo(() => getMangaStudioCatalog(t), [t]);
  const [tab, setTab] = useState("characters");
  const [expandedId, setExpandedId] = useState(null);

  const patch = (partial) => onChange({ ...project, ...partial });

  const addCharacter = () => {
    const name = window.prompt(t("manga_prompt_char_name"), t("manga_default_char"));
    if (!name?.trim()) return;
    const c = emptyCharacter(name.trim());
    patch({ characters: [...(project.characters || []), c] });
    setExpandedId(c.id);
  };

  const addScenario = () => {
    const name = window.prompt(t("manga_prompt_scene_name"), t("manga_default_scene"));
    if (!name?.trim()) return;
    patch({ scenarios: [...(project.scenarios || []), emptyScenario(name.trim())] });
  };

  return (
    <div className="manga-asset-library" data-testid="manga-asset-library">
      <h2 className="manga-pane-title">📚 {t("manga_asset_library_title")}</h2>
      <div className="manga-asset-tabs">
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            className={cn("manga-asset-tab", tab === id && "manga-asset-tab--active")}
            onClick={() => setTab(id)}
          >
            {id === "characters" && t("manga_tab_chars")}
            {id === "scenarios" && t("manga_tab_scenes")}
            {id === "poses" && t("manga_tab_poses")}
            {id === "sfx" && t("manga_tab_sfx")}
          </button>
        ))}
      </div>

      {tab === "characters" && (
        <div className="manga-asset-grid">
          {(project.characters || []).map((c) => (
            <CharCard
              key={c.id}
              c={c}
              t={t}
              expanded={expandedId === c.id}
              onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
              onCommit={(next) => {
                patch({
                  characters: project.characters.map((x) => (x.id === c.id ? next : x)),
                });
              }}
              onDuplicate={() => {
                patch({
                  characters: [
                    ...project.characters,
                    { ...c, id: `char_${Date.now()}`, name: `${c.name}${t("manga_copy_suffix")}` },
                  ],
                });
              }}
              onDelete={() => {
                if (!window.confirm(t("manga_delete_confirm", { name: c.name }))) return;
                patch({ characters: project.characters.filter((x) => x.id !== c.id) });
                if (expandedId === c.id) setExpandedId(null);
              }}
            />
          ))}
          <button type="button" className="manga-asset-add-card min-h-[88px]" onClick={addCharacter}>
            <Plus className="w-5 h-5" /> {t("manga_create_character")}
          </button>
        </div>
      )}

      {tab === "scenarios" && (
        <div className="manga-asset-grid">
          {(project.scenarios || []).map((s) => (
            <article key={s.id} className="manga-asset-card">
              <div className="manga-asset-card-head p-3">
                <div className="manga-asset-thumb">
                  {s.thumb ? <img src={s.thumb} alt="" /> : <span>🌅</span>}
                </div>
                <p className="font-medium text-[14px] text-white">{s.name}</p>
              </div>
              <div className="p-3 pt-0">
                <MangaUploadZone
                  compact
                  label={t("manga_scene_upload_label")}
                  hint={t("manga_scene_upload_hint")}
                  onFile={async ({ url }) => {
                    patch({
                      scenarios: project.scenarios.map((x) =>
                        x.id === s.id ? { ...x, thumb: url } : x),
                    });
                  }}
                />
              </div>
            </article>
          ))}
          <button type="button" className="manga-asset-add-card" onClick={addScenario}>
            <Plus className="w-5 h-5" /> {t("manga_create_scenario")}
          </button>
        </div>
      )}

      {tab === "poses" && (
        <div className="space-y-3">
          <div className="manga-pose-grid">
            {catalog.poses.map((p) => (
              <div key={p.id} className="manga-pose-tile manga-pose-tile--static">
                <span className="text-xl">{p.emoji}</span>
                <span>{p.label}</span>
              </div>
            ))}
          </div>
          <MangaUploadZone
            label={t("manga_upload_pose")}
            hint={t("manga_pose_upload_hint")}
            onFile={() => {}}
          />
        </div>
      )}

      {tab === "sfx" && (
        <div className="space-y-2">
          {catalog.effects.map((fx) => (
            <div key={fx.id} className="manga-card !mb-2">
              <p className="text-[14px] text-[#E9D5FF]">{fx.label}</p>
              <MangaUploadZone compact hint={t("manga_sfx_upload_hint")} onFile={() => {}} />
            </div>
          ))}
          <p className="text-[12px] italic text-[#5A5A5E]">{t("manga_sfx_hint")}</p>
        </div>
      )}
    </div>
  );
}
