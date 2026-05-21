import { useMemo, useRef, useState } from "react";
import {
  Plus, Pencil, Trash2, Copy, Upload, Sparkles,
  Users, MapPin, PersonStanding, Layers,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useI18n } from "../../lib/i18n";
import { getMangaStudioCatalog } from "../../lib/mangaStudioCatalog";
import CollapsibleSection from "../CollapsibleSection";
import { emptyCharacter, emptyScenario } from "../../lib/mangaStudioData";
import { characterConsistencyScore } from "../../lib/comic-engine/characterLock";

function ThumbBox({ src, label }) {
  return (
    <div className="w-10 h-10 rounded-lg bg-[#0B0B0C] border border-[#2E2E30] overflow-hidden shrink-0 flex items-center justify-center">
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-[9px] text-[#5A5A5E] text-center px-0.5 leading-tight">{label?.slice(0, 4)}</span>
      )}
    </div>
  );
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function LibraryRow({
  thumb, title, sub, expanded, onToggle, onEdit, onDelete, onDuplicate, children, t,
}) {
  return (
    <div className="rounded-lg border border-[#2E2E30]/80 bg-[#0B0B0C]/50 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 text-left hover:bg-[#13131A]/60 transition-colors"
      >
        <ThumbBox src={thumb} label={title} />
        <div className="flex-1 min-w-0">
          <p className="text-[#F4F1EA] text-[12px] font-medium truncate">{title}</p>
          {sub && <p className="text-[#5A5A5E] text-[10px] truncate">{sub}</p>}
        </div>
        <span className={cn("text-[#5A5A5E] text-xs transition-transform", expanded && "rotate-180")}>▼</span>
      </button>
      {expanded && (
        <div className="px-2.5 pb-2.5 border-t border-[#2E2E30]/60 pt-2 space-y-2">
          {children}
          <div className="flex flex-wrap gap-1.5">
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

export default function MangaLibrarySidebar({ project, onChange }) {
  const { t } = useI18n();
  const catalog = useMemo(() => getMangaStudioCatalog(t), [t]);
  const [expandedId, setExpandedId] = useState(null);
  const poseInputRef = useRef(null);

  const patch = (partial) => onChange({ ...project, ...partial });

  const addCharacter = () => {
    const name = window.prompt(t("manga_prompt_char_name"), t("manga_default_char"));
    if (!name) return;
    const c = emptyCharacter(name);
    patch({ characters: [...project.characters, c] });
  };

  const addScenario = () => {
    const name = window.prompt(t("manga_prompt_scene_name"), t("manga_default_scene"));
    if (!name) return;
    const s = emptyScenario(name);
    patch({ scenarios: [...project.scenarios, s] });
  };

  const elementSections = [
    { key: "effects", icon: Layers, items: catalog.elements.effects },
    { key: "expressions", icon: Users, items: catalog.elements.expressions },
    { key: "objects", icon: MapPin, items: catalog.elements.objects },
  ];

  return (
    <aside className="space-y-3" data-testid="manga-library">
      <CollapsibleSection
        title={t("manga_characters")}
        defaultOpen
        hint={t("manga_characters_hint")}
        testId="manga-sec-characters"
      >
        <div className="p-3 space-y-2">
          <button type="button" onClick={addCharacter} className="manga-primary-outline w-full justify-center">
            <Plus className="w-3.5 h-3.5" /> {t("manga_create_character")}
          </button>
          {project.characters.map((c) => (
            <LibraryRow
              key={c.id}
              t={t}
              thumb={c.thumb || c.sheets?.front}
              title={c.name}
              sub={c.tag || c.description?.slice(0, 40)}
              expanded={expandedId === c.id}
              onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
              onEdit={() => {
                const tag = window.prompt(t("manga_tag_short"), c.tag || "");
                if (tag === null) return;
                patch({
                  characters: project.characters.map((x) =>
                    x.id === c.id ? { ...x, tag } : x),
                });
              }}
              onDuplicate={() => {
                const copy = {
                  ...c,
                  id: `char_${Date.now()}`,
                  name: `${c.name}${t("manga_copy_suffix")}`,
                };
                patch({ characters: [...project.characters, copy] });
              }}
              onDelete={() => {
                if (!window.confirm(t("manga_delete_confirm", { name: c.name }))) return;
                patch({ characters: project.characters.filter((x) => x.id !== c.id) });
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-[10px] text-[#5A5A5E]">{t("manga_consistency_score")}</p>
                <span className="text-[10px] text-[#A855F7] font-mono">{characterConsistencyScore(c)}%</span>
              </div>
              <div className="h-1 rounded-full bg-[#2E2E30] mb-2 overflow-hidden">
                <div
                  className="h-full bg-[#9333EA] transition-all"
                  style={{ width: `${characterConsistencyScore(c)}%` }}
                />
              </div>
              <label className="text-[10px] text-[#9CA3AF] block mb-1">{t("manga_body_type")}</label>
              <select
                className="field-input w-full text-[11px] mb-2"
                value={c.bodyType || "slim"}
                onChange={(e) => {
                  patch({
                    characters: project.characters.map((x) =>
                      x.id === c.id ? { ...x, bodyType: e.target.value } : x),
                  });
                }}
              >
                {catalog.bodyTypes.map((b) => (
                  <option key={b.id} value={b.id}>{b.label}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-[10px] text-[#9CA3AF] mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={c.consistencyLock !== false}
                  onChange={(e) => {
                    patch({
                      characters: project.characters.map((x) =>
                        x.id === c.id ? { ...x, consistencyLock: e.target.checked } : x),
                    });
                  }}
                />
                {t("manga_consistency_lock")} 🔒
              </label>
              <p className="text-[10px] text-[#5A5A5E]">{t("manga_ref_sheet")}</p>
              <div className="grid grid-cols-4 gap-1">
                {["front", "profile", "back"].map((k) => (
                  <div
                    key={k}
                    className="aspect-square rounded bg-[#13131A] border border-[#2E2E30] text-[8px] text-[#5A5A5E] flex items-center justify-center uppercase"
                  >
                    {c.sheets?.[k] ? (
                      <img src={c.sheets[k]} alt="" className="w-full h-full object-cover rounded" />
                    ) : (
                      k.slice(0, 4)
                    )}
                  </div>
                ))}
                <div className="aspect-square rounded bg-[#13131A] border border-[#2E2E30] text-[8px] text-[#5A5A5E] flex items-center justify-center">
                  4×
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <label className="manga-chip-btn cursor-pointer">
                  <Upload className="w-3 h-3" /> {t("manga_upload_png")}
                  <input
                    type="file"
                    accept="image/png,image/webp,image/jpeg"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      let url = null;
                      try {
                        url = await readFileAsDataUrl(f);
                      } catch {
                        url = null;
                      }
                      patch({
                        characters: project.characters.map((x) =>
                          x.id === c.id
                            ? {
                                ...x,
                                thumb: url,
                                _refFile: f,
                                sheets: { ...x.sheets, front: url },
                              }
                            : x),
                      });
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="manga-chip-btn"
                  onClick={() => {
                    const desc = window.prompt(t("manga_char_desc_ai"), c.description || "");
                    if (desc === null) return;
                    patch({
                      characters: project.characters.map((x) =>
                        x.id === c.id ? { ...x, description: desc, tag: desc.slice(0, 48) } : x),
                    });
                  }}
                >
                  <Sparkles className="w-3 h-3" /> {t("manga_ia_sheet")}
                </button>
              </div>
            </LibraryRow>
          ))}
          {!project.characters.length && (
            <p className="text-[#5A5A5E] text-[11px] text-center py-2">{t("manga_no_characters")}</p>
          )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title={t("manga_scenarios")}
        hint={t("manga_scenarios_hint")}
        testId="manga-sec-scenarios"
      >
        <div className="p-3 space-y-2">
          <button type="button" onClick={addScenario} className="manga-primary-outline w-full justify-center">
            <Plus className="w-3.5 h-3.5" /> {t("manga_create_scenario")}
          </button>
          {project.scenarios.map((s) => (
            <LibraryRow
              key={s.id}
              t={t}
              thumb={s.thumb}
              title={s.name}
              sub={s.description?.slice(0, 40) || t("manga_day_night")}
              expanded={expandedId === `scene_${s.id}`}
              onToggle={() => setExpandedId(expandedId === `scene_${s.id}` ? null : `scene_${s.id}`)}
              onEdit={() => {
                const desc = window.prompt(t("manga_scene_desc"), s.description || "");
                if (desc === null) return;
                patch({
                  scenarios: project.scenarios.map((x) =>
                    x.id === s.id ? { ...x, description: desc } : x),
                });
              }}
              onDuplicate={() => {
                patch({
                  scenarios: [
                    ...project.scenarios,
                    {
                      ...s,
                      id: `scene_${Date.now()}`,
                      name: `${s.name}${t("manga_copy_suffix")}`,
                    },
                  ],
                });
              }}
              onDelete={() => {
                if (!window.confirm(t("manga_delete_confirm", { name: s.name }))) return;
                patch({ scenarios: project.scenarios.filter((x) => x.id !== s.id) });
              }}
            >
              <div className="flex gap-1 flex-wrap text-[9px] text-[#9CA3AF]">
                {catalog.lighting.slice(0, 3).map((v) => (
                  <span key={v.id} className="px-1.5 py-0.5 rounded bg-[#13131A] border border-[#2E2E30]">
                    {v.label}
                  </span>
                ))}
              </div>
              <label className="manga-chip-btn cursor-pointer w-fit">
                <Upload className="w-3 h-3" /> {t("manga_upload_image")}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const url = await readFileAsDataUrl(f);
                    patch({
                      scenarios: project.scenarios.map((x) =>
                        x.id === s.id ? { ...x, thumb: url } : x),
                    });
                  }}
                />
              </label>
            </LibraryRow>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title={t("manga_poses")}
        defaultOpen
        hint={t("manga_poses_hint")}
        testId="manga-sec-poses"
      >
        <div className="p-3 space-y-1.5">
          {catalog.poses.map((p) => (
            <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#13131A]/50">
              <span className="text-base w-6 text-center">{p.emoji}</span>
              <p className="text-[12px] text-[#F4F1EA] flex-1">{p.label}</p>
            </div>
          ))}
          <label className="manga-primary-outline w-full justify-center cursor-pointer mt-2">
            <Upload className="w-3.5 h-3.5" /> {t("manga_upload_pose")}
            <input
              ref={poseInputRef}
              type="file"
              accept="image/png,image/webp"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const url = await readFileAsDataUrl(f);
                const name = f.name.replace(/\.[^.]+$/, "") || "Pose";
                patch({
                  customPoses: [
                    ...(project.customPoses || []),
                    { id: `pose_${Date.now()}`, label: name, thumb: url },
                  ],
                });
              }}
            />
          </label>
          {(project.customPoses || []).map((p) => (
            <div key={p.id} className="flex items-center gap-2 px-2 py-1">
              <ThumbBox src={p.thumb} label={p.label} />
              <span className="text-[12px] text-[#F4F1EA]">{p.label}</span>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title={t("manga_elements")}
        hint={t("manga_elements_hint")}
        testId="manga-sec-elements"
      >
        <div className="p-3 space-y-3">
          {elementSections.map(({ key, icon: Icon, items }) => (
            <div key={key}>
              <p className="text-[10px] uppercase tracking-wider text-[#A855F7] mb-1.5 flex items-center gap-1">
                <Icon className="w-3 h-3" />
                {key === "effects" && t("manga_field_effects")}
                {key === "expressions" && t("manga_field_expression")}
                {key === "objects" && t("manga_elements")}
              </p>
              <div className="space-y-1">
                {items.map((el) => (
                  <div key={el.id} className="flex items-center gap-2 text-[11px] text-[#9CA3AF] px-1">
                    <PersonStanding className="w-3 h-3 text-[#5A5A5E]" />
                    {el.label}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </aside>
  );
}
