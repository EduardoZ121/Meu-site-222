import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { characterConsistencyScore } from "../lib/comic-engine/characterLock";
import { emptyCharacter, emptyScenario, emptyPanel } from "../lib/mangaStudioData";
import { Card, Chips, Field, TextArea, Upload, Btn, Section } from "./ui";

export function SetupView({ t, catalog, project, modelKey, useGpt, onChange, onModel, onGpt, onAddChar, onStart, onDemo }) {
  const canStart = (project.characters || []).length > 0;
  const styleHint = {
    webtoon: "Scroll vertical, cores vibrantes",
    manhwa: "Estilo coreano, olhos expressivos",
    "western-comic": "Comic ocidental, sombras fortes",
    "manga-classic": "Manga clássico, dinâmica japonesa",
    anime: "Anime, cores vivas",
  };

  return (
    <div>
      <Card title={`🎨 ${t("manga_style_preset")}`} hint={styleHint[project.stylePreset] || ""}>
        <Chips
          options={catalog.stylePresets}
          value={project.stylePreset || "manga-classic"}
          onChange={(id) => onChange({ ...project, stylePreset: id })}
        />
      </Card>
      <Card title={`⚡ ${t("manga_model_engine")}`}>
        {catalog.models.map((m) => (
          <button
            key={m.key}
            type="button"
            className={`ms-card mb-2 w-full text-left ${modelKey === m.key ? "ring-1 ring-[#8b5cf6]" : ""}`}
            onClick={() => onModel(m.key)}
          >
            <strong className="text-white text-[0.9rem]">{m.label}</strong>
            <p className="text-[0.75rem] text-[#9ca3af] mt-1">{m.hint}</p>
          </button>
        ))}
        <label className="flex items-center gap-2 min-h-[44px] text-[0.85rem] text-[#c4b5fd]">
          <input type="checkbox" checked={useGpt} onChange={(e) => onGpt(e.target.checked)} />
          {t("manga_gpt_compose")}
        </label>
      </Card>
      <Card title={`👤 ${t("manga_wizard_character_title")}`} hint={t("manga_wizard_character_desc")}>
        <Btn onClick={onAddChar} className="w-full mb-2">
          <Plus className="w-4 h-4" /> {t("manga_create_character")}
        </Btn>
        <Btn onClick={onDemo} className="w-full mb-2">{t("manga_load_demo")}</Btn>
        <ul className="text-[0.85rem] text-[#c4b5fd] mb-3 list-disc pl-5">
          {(project.characters || []).map((c) => (
            <li key={c.id}>{c.name}</li>
          ))}
        </ul>
      </Card>
      <Btn variant="primary" disabled={!canStart} onClick={onStart} className="w-full">
        🚀 {t("manga_wizard_start")}
      </Btn>
    </div>
  );
}

export function AssetsView({ t, project, onChange }) {
  const [tab, setTab] = useState("characters");
  const chars = project.characters || [];
  const scenes = project.scenarios || [];
  const patch = (partial) => onChange({ ...project, ...partial });

  return (
    <div>
      <h2 className="text-[1rem] font-semibold text-white mb-3">📚 {t("manga_asset_library_title")}</h2>
      <div className="ms-chips mb-3">
        {[
          ["characters", t("manga_tab_chars")],
          ["scenarios", t("manga_tab_scenes")],
          ["poses", t("manga_tab_poses")],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`ms-chip ${tab === id ? "ms-chip--on" : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "characters" && (
        <div className="ms-grid-2">
          {chars.map((c) => (
            <div key={c.id} className="ms-asset">
              <div className="ms-asset-thumb">
                {c.thumb || c.sheets?.front ? <img src={c.thumb || c.sheets.front} alt="" /> : "👤"}
              </div>
              <p className="text-white text-[0.85rem] font-medium mt-2 truncate">{c.name}</p>
              <p className="text-[0.7rem] text-[#9ca3af]">{characterConsistencyScore(c)}%</p>
              <Btn
                className="mt-2 !min-h-[36px]"
                onClick={() => {
                  if (!window.confirm(t("manga_delete_confirm", { name: c.name }))) return;
                  patch({ characters: chars.filter((x) => x.id !== c.id) });
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Btn>
              <Upload
                onFile={({ url, file }) => {
                  patch({
                    characters: chars.map((x) =>
                      x.id === c.id
                        ? { ...x, thumb: url, _refFile: file, sheets: { ...x.sheets, front: url } }
                        : x),
                  });
                }}
              />
            </div>
          ))}
          <button
            type="button"
            className="ms-asset min-h-[120px] border-dashed border-[#8b5cf6] w-full"
            onClick={() => {
              const name = window.prompt(t("manga_prompt_char_name"), t("manga_default_char"));
              if (!name?.trim()) return;
              patch({ characters: [...chars, emptyCharacter(name.trim())] });
            }}
          >
            <Plus className="w-5 h-5 mx-auto text-[#8b5cf6]" />
            <span className="block text-[0.8rem] text-[#8b5cf6] mt-1">{t("manga_create_character")}</span>
          </button>
        </div>
      )}

      {tab === "scenarios" && (
        <div className="ms-grid-2">
          {scenes.map((s) => (
            <div key={s.id} className="ms-asset">
              <div className="ms-asset-thumb">{s.thumb ? <img src={s.thumb} alt="" /> : "🌅"}</div>
              <p className="text-white text-[0.85rem] mt-2">{s.name}</p>
              <Upload
                onFile={({ url }) => {
                  patch({ scenarios: scenes.map((x) => (x.id === s.id ? { ...x, thumb: url } : x)) });
                }}
              />
            </div>
          ))}
          <button
            type="button"
            className="ms-asset min-h-[100px] border-dashed w-full"
            onClick={() => {
              const name = window.prompt(t("manga_prompt_scene_name"), t("manga_default_scene"));
              if (!name?.trim()) return;
              patch({ scenarios: [...scenes, emptyScenario(name.trim())] });
            }}
          >
            <Plus className="w-5 h-5 mx-auto" /> {t("manga_create_scenario")}
          </button>
        </div>
      )}

      {tab === "poses" && (
        <Card hint={t("manga_pose_upload_hint")}>
          <Upload label={t("manga_upload_pose")} onFile={() => {}} />
        </Card>
      )}
    </div>
  );
}

export function PageView({ t, catalog, project, activePanelId, onSelectPanel, onChange, onGeneratePage, busy, cost }) {
  const panels = [...(project.panels || [])].sort((a, b) => a.order - b.order);
  const patchPanels = (next) => onChange({ ...project, panels: next });

  return (
    <div>
      <h2 className="text-[1rem] font-semibold text-white mb-2">{t("manga_page_editor")}</h2>
      <p className="text-[0.75rem] text-[#9ca3af] mb-3">{t("manga_read_order_legend")}</p>
      <Chips
        options={catalog.pageLayouts}
        value={project.pageLayout || "horizontal"}
        onChange={(id) => onChange({ ...project, pageLayout: id })}
      />
      <div className="ms-panels my-3">
        {panels.map((p, i) => {
          const char = (project.characters || []).find((c) => c.id === p.characterId);
          return (
            <button
              key={p.id}
              type="button"
              className={`ms-panel ${p.id === activePanelId ? "ms-panel--on" : ""}`}
              onClick={() => onSelectPanel(p.id)}
            >
              <div className="ms-panel-frame">
                <span className="ms-order">{i + 1}</span>
                {p.resultUrl ? <img src={p.resultUrl} alt="" /> : (
                  <div className="ms-preview-placeholder text-[0.65rem]">{char?.name || "—"}</div>
                )}
              </div>
              <div className="ms-panel-meta">{p.aspect}</div>
            </button>
          );
        })}
      </div>
      <div className="ms-chips">
        <Btn
          onClick={() => {
            const p = emptyPanel(panels.length);
            patchPanels([...panels, p]);
            onSelectPanel(p.id);
          }}
        >
          <Plus className="w-4 h-4" /> {t("manga_add_panel")}
        </Btn>
        {activePanelId && panels.length > 1 && (
          <Btn
            onClick={() => {
              const next = panels.filter((p) => p.id !== activePanelId).map((p, i) => ({ ...p, order: i }));
              patchPanels(next);
              onSelectPanel(next[0]?.id);
            }}
          >
            <Trash2 className="w-4 h-4" /> {t("manga_remove")}
          </Btn>
        )}
      </div>
      {onGeneratePage && (
        <Btn variant="primary" className="w-full mt-3" disabled={busy} onClick={onGeneratePage}>
          {t("manga_gen_page_btn", { n: cost })}
        </Btn>
      )}
    </div>
  );
}

function balloonClass(type) {
  if (type === "thought") return "ms-balloon ms-balloon--top";
  if (type === "shout") return "ms-balloon ms-balloon--top";
  return "ms-balloon ms-balloon--top";
}

export function PanelView({
  t,
  catalog,
  project,
  panel,
  onPatch,
  onPatchChar,
  onPatchScene,
  openSection,
  onToggleSection,
}) {
  if (!panel) {
    return <p className="text-[#9ca3af]">{t("manga_select_panel")}</p>;
  }

  const char = (project.characters || []).find((c) => c.id === panel.characterId);
  const outfits = char?.outfitSlots?.length
    ? char.outfitSlots
    : [{ id: "default", name: t("manga_outfit_default"), isDefault: true }];
  const pose = catalog.poses.find((p) => p.id === panel.poseId);

  return (
    <div>
      <div className="ms-preview">
        <div className="ms-preview-frame">
          {panel.resultUrl ? (
            <img src={panel.resultUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="ms-preview-placeholder">{t("manga_preview_placeholder")}</div>
          )}
          {panel.balloonText?.trim() && (
            <div className={balloonClass(panel.balloonType)}>{panel.balloonText}</div>
          )}
        </div>
        <p className="text-[0.75rem] text-[#9ca3af] mt-2 text-center">
          {t("manga_pose_current")}: {pose?.emoji} {pose?.label}
        </p>
      </div>

      <Section id="character" title={`👤 ${t("manga_sec_character")}`} open={openSection === "character"} onToggle={onToggleSection}>
        <Field
          as="select"
          label={t("manga_sec_character")}
          value={panel.characterId}
          onChange={(v) => onPatch({ characterId: v || null })}
          options={
            <>
              <option value="">{t("manga_choose")}</option>
              {(project.characters || []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </>
          }
        />
        {char && (
          <Chips
            options={outfits.map((o) => ({ id: o.id, label: o.name }))}
            value={panel.outfitId || outfits.find((o) => o.isDefault)?.id}
            onChange={(v) => onPatch({ outfitId: v })}
          />
        )}
      </Section>

      <Section id="pose" title={`🏃 ${t("manga_sec_pose")}`} open={openSection === "pose"} onToggle={onToggleSection}>
        <Chips options={catalog.poses} value={panel.poseId} onChange={(v) => onPatch({ poseId: v })} tile />
        <Upload label={t("manga_upload_pose")} hint={t("manga_pose_upload_hint")} onFile={() => {}} />
        <span className="ms-label">{t("manga_hand_pose")}</span>
        <Chips options={catalog.handPoses} value={panel.handPose || "open"} onChange={(v) => onPatch({ handPose: v })} />
      </Section>

      <Section id="expression" title={`😊 ${t("manga_sec_expression")}`} open={openSection === "expression"} onToggle={onToggleSection}>
        <Chips
          options={catalog.expressions.map((e) => ({
            ...e,
            emoji: { normal: "😐", happy: "😊", sad: "😢", angry: "😠", fear: "😲", shy: "😳", determined: "😤" }[e.id],
          }))}
          value={panel.expression}
          onChange={(v) => onPatch({ expression: v })}
          tile
        />
      </Section>

      <Section id="camera" title={`📐 ${t("manga_sec_camera")}`} open={openSection === "camera"} onToggle={onToggleSection}>
        <Chips options={catalog.angles} value={panel.angle} onChange={(v) => onPatch({ angle: v })} />
        <Chips options={catalog.shots} value={panel.shot} onChange={(v) => onPatch({ shot: v })} />
      </Section>

      <Section id="dialogue" title={`💬 ${t("manga_sec_dialogue")}`} open={openSection === "dialogue"} onToggle={onToggleSection}>
        <TextArea
          label={t("manga_balloon_placeholder")}
          value={panel.balloonText}
          onChange={(v) => onPatch({ balloonText: v })}
        />
        <Chips options={catalog.balloonTypes} value={panel.balloonType} onChange={(v) => onPatch({ balloonType: v })} />
        <Chips options={catalog.balloonPos} value={panel.balloonPos} onChange={(v) => onPatch({ balloonPos: v })} />
      </Section>

      <Section id="lighting" title={`🌅 ${t("manga_sec_lighting")}`} open={openSection === "lighting"} onToggle={onToggleSection}>
        <Field
          as="select"
          label={t("manga_scenario")}
          value={panel.scenarioId}
          onChange={(v) => onPatch({ scenarioId: v || null })}
          options={
            <>
              <option value="">{t("manga_choose")}</option>
              {(project.scenarios || []).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </>
          }
        />
        {panel.scenarioId && onPatchScene && (
          <Upload
            onFile={({ url }) => onPatchScene(panel.scenarioId, { thumb: url })}
          />
        )}
        <Chips options={catalog.lighting} value={panel.lighting} onChange={(v) => onPatch({ lighting: v })} />
      </Section>

      <Section id="effects" title={`✨ ${t("manga_field_effects")}`} open={openSection === "effects"} onToggle={onToggleSection}>
        {catalog.effects.map((fx) => (
          <label key={fx.id} className="flex items-center gap-2 min-h-[44px] text-[0.85rem]">
            <input
              type="checkbox"
              checked={!!panel.effects?.[fx.id]}
              onChange={() => onPatch({ effects: { ...panel.effects, [fx.id]: !panel.effects?.[fx.id] } })}
            />
            {fx.label}
          </label>
        ))}
      </Section>

      {char && onPatchChar && (
        <Upload
          label={t("manga_outfit_upload_label")}
          onFile={({ url }) => {
            const oid = panel.outfitId || outfits.find((o) => o.isDefault)?.id;
            onPatchChar(char.id, {
              outfitSlots: outfits.map((o) => (o.id === oid ? { ...o, thumb: url } : o)),
            });
          }}
        />
      )}
    </div>
  );
}

export function StoryView({ t, project, activePanelId, onSelectPanel, onCoherence, coherenceScore, loading }) {
  const panels = [...(project.panels || [])].sort((a, b) => a.order - b.order);

  return (
    <div>
      <h2 className="text-[1rem] font-semibold text-white mb-2">🗺️ {t("manga_story_nav")}</h2>
      <p className="text-[0.8rem] text-[#9ca3af] mb-3">{t("manga_story_nav_hint")}</p>
      <Btn variant="warn" className="w-full mb-3" disabled={loading} onClick={onCoherence}>
        ⚠️ {t("manga_coherence_btn")}
        {coherenceScore != null ? ` · ${coherenceScore}%` : ""}
      </Btn>
      <div className="ms-tree">
        {panels.map((p, i) => {
          const char = (project.characters || []).find((c) => c.id === p.characterId);
          return (
            <button
              key={p.id}
              type="button"
              className={`ms-tree-item ${p.id === activePanelId ? "ms-tree-item--on" : ""}`}
              onClick={() => onSelectPanel(p.id)}
            >
              <span className="text-[#22c55e] font-bold mr-2">{i + 1}</span>
              {char?.name || "—"} · {p.poseId} · {p.balloonText ? `"${p.balloonText.slice(0, 24)}…"` : "—"}
            </button>
          );
        })}
      </div>
    </div>
  );
}
