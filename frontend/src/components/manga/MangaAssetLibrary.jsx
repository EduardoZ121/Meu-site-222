import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Copy, Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";
import { useI18n } from "../../lib/i18n";
import { getMangaStudioCatalog } from "../../lib/mangaStudioCatalog";
import { emptyCharacter, emptyScenario } from "../../lib/mangaStudioData";
import { characterConsistencyScore } from "../../lib/comic-engine/characterLock";
import MangaUploadZone, { readFileAsDataUrl } from "./MangaUploadZone";

const TABS = ["characters", "scenarios", "poses", "sfx"];

const SHEET_KEYS = [
  { key: "front", label: "FRONT" },
  { key: "profile", label: "PROF" },
  { key: "threeQuarter", label: "3/4" },
  { key: "back", label: "BACK" },
];

function CharCard({ c, t, expanded, onToggle, onPatch, onDelete, onDuplicate }) {
  const score = characterConsistencyScore(c);
  const missing = [];
  if (!c.sheets?.front) missing.push("frente");
  if (!c.sheets?.profile) missing.push("perfil");
  if (!c.sheets?.back) missing.push("costas");

  return (
    <article className={cn("manga-asset-card", expanded && "manga-asset-card--open")}>
      <button type="button" className="manga-asset-card-head" onClick={onToggle}>
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
                  {c.sheets?.[key] ? <img src={c.sheets[key]} alt="" /> : null}
                </div>
                <label className="manga-sheet-upload">
                  📷
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const url = await readFileAsDataUrl(f);
                      onPatch({
                        ...c,
                        thumb: key === "front" ? url : c.thumb,
                        _refFile: key === "front" ? f : c._refFile,
                        sheets: { ...c.sheets, [key]: url },
                      });
                    }}
                  />
                </label>
              </div>
            ))}
          </div>
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
            <button type="button" className="manga-chip-btn min-h-[44px]" onClick={onDuplicate}>
              <Copy className="w-3 h-3" /> {t("manga_duplicate")}
            </button>
            <button type="button" className="manga-chip-btn min-h-[44px]" onClick={onDelete}>
              <Trash2 className="w-3 h-3 text-red-400" />
            </button>
          </div>
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
              onPatch={(next) => {
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
          <div className="manga-pose-grid manga-pose-grid--lib">
            {catalog.poses.map((p) => (
              <div key={p.id} className="manga-pose-tile manga-pose-tile--static">
                <span className="text-xl">{p.emoji}</span>
                <span>{p.label}</span>
              </div>
            ))}
          </div>
          <MangaUploadZone label={t("manga_upload_pose")} hint={t("manga_pose_upload_hint")} />
        </div>
      )}

      {tab === "sfx" && (
        <div className="space-y-2 text-[14px] text-[#9CA3AF]">
          {catalog.effects.map((fx) => (
            <p key={fx.id} className="px-2 py-2 rounded-lg bg-[#1a1a2e] border border-[#2E2E30]">
              {fx.label}
            </p>
          ))}
          <p className="text-[12px] italic">{t("manga_sfx_hint")}</p>
        </div>
      )}
    </div>
  );
}
