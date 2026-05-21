import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  ChevronRight,
  Copy,
  Eye,
  Loader2,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Sun,
  User,
  Workflow,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "../lib/i18n";
import { getMangaStudioCatalog } from "../lib/mangaStudioCatalog";
import { useFlowStore } from "./useFlowStore";
import { NODE_ICONS, NODE_LABELS, NODE_COLORS } from "./types";
import { getStorySequence } from "./storyAnalysis";
import { ASPECT_RATIOS, DEFAULT_PANEL_CONFIG } from "./panelDefaults";
import { buildPanelPromptFromFlow } from "./panelUtils";

function ChipRow({ options, value, onChange }) {
  return (
    <div className="mf-chips">
      {options.map((o) => {
        const id = o.id ?? o.key ?? o;
        const label = o.label ?? o;
        return (
          <button
            key={id}
            type="button"
            className={`mf-chip ${value === id ? "mf-chip--on" : ""}`}
            onClick={() => onChange(id)}
          >
            {o.emoji ? `${o.emoji} ` : ""}
            {label}
          </button>
        );
      })}
    </div>
  );
}

function Section({ icon: Icon, title, hint, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="mf-panel-section">
      <button type="button" className="mf-panel-section-head" onClick={() => setOpen((v) => !v)}>
        <Icon className="w-4 h-4 text-[#a78bfa]" />
        <div className="flex-1 text-left">
          <strong>{title}</strong>
          {hint && <p className="text-[0.7rem] text-[#9ca3af] font-normal">{hint}</p>}
        </div>
        <span className="text-[#5a5a5e]">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="mf-panel-section-body">{children}</div>}
    </section>
  );
}

function PanelPreview({ config, catalog, charName, sceneName }) {
  const balloonPos = config.balloonPos || "top";
  return (
    <div className="mf-panel-preview" data-aspect={config.aspect || "4:5"}>
      <div className="mf-panel-preview-frame">
        <span className="mf-panel-preview-shot">{catalog.shots.find((s) => s.id === config.shot)?.label || config.shot}</span>
        <span className="mf-panel-preview-angle">{catalog.angles.find((a) => a.id === config.angle)?.label}</span>
        {charName && (
          <div className="mf-panel-preview-char">
            <User className="w-3 h-3" />
            {charName}
          </div>
        )}
        {sceneName && <div className="mf-panel-preview-scene">📍 {sceneName}</div>}
        {config.showBalloon && config.balloonText && (
          <div className={`mf-panel-preview-balloon mf-panel-preview-balloon--${balloonPos}`}>
            {config.balloonText.slice(0, 60)}
            {config.balloonText.length > 60 ? "…" : ""}
          </div>
        )}
        {Object.entries(config.effects || {}).some(([, v]) => v) && (
          <div className="mf-panel-preview-fx">✨ FX</div>
        )}
      </div>
    </div>
  );
}

export default function PanelTab({ onGoToFlow, onGeneratePanel, panelCost, busy }) {
  const { t } = useI18n();
  const catalog = useMemo(() => getMangaStudioCatalog(t), [t]);

  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const story = useFlowStore((s) => s.story);
  const globalSettings = useFlowStore((s) => s.globalSettings);
  const activePanelId = useFlowStore((s) => s.activePanelId);
  const ensurePanelsInitialized = useFlowStore((s) => s.ensurePanelsInitialized);
  const setActivePanel = useFlowStore((s) => s.setActivePanel);
  const setPanelConfig = useFlowStore((s) => s.setPanelConfig);
  const syncPanelFromFlow = useFlowStore((s) => s.syncPanelFromFlow);
  const panels = useFlowStore((s) => s.panels);

  useEffect(() => {
    ensurePanelsInitialized();
  }, [nodes.length, edges.length, ensurePanelsInitialized]);

  const sequence = useMemo(
    () => getStorySequence(nodes, edges, story.manualSequence),
    [nodes, edges, story.manualSequence],
  );

  const activeIndex = sequence.findIndex((n) => n.id === activePanelId);
  const activeNode = sequence[activeIndex] || null;
  const config = useMemo(() => {
    if (!activePanelId) return null;
    return { ...DEFAULT_PANEL_CONFIG, ...panels[activePanelId] };
  }, [activePanelId, panels]);

  const characterNodes = useMemo(
    () => nodes.filter((n) => n.data.flowType === "personagem"),
    [nodes],
  );
  const scenarioNodes = useMemo(() => nodes.filter((n) => n.data.flowType === "cenario"), [nodes]);

  const charNode = nodes.find((n) => n.id === config?.characterNodeId);
  const sceneNode = nodes.find((n) => n.id === config?.scenarioNodeId);

  const promptPreview = useMemo(() => {
    if (!config || !activePanelId) return "";
    return buildPanelPromptFromFlow(config, nodes, globalSettings);
  }, [config, activePanelId, nodes, globalSettings]);

  const patch = (p) => activePanelId && setPanelConfig(activePanelId, p);

  const goPanel = (delta) => {
    if (!sequence.length) return;
    const i = activeIndex < 0 ? 0 : (activeIndex + delta + sequence.length) % sequence.length;
    setActivePanel(sequence[i].id);
  };

  const copyPrompt = async () => {
    if (!promptPreview) return;
    await navigator.clipboard.writeText(promptPreview);
    toast.success("Prompt do painel copiado");
  };

  if (!sequence.length) {
    return (
      <div className="mf-panel-tab">
        <div className="mf-panel-hero">
          <h2>{t("manga_tab_panel")}</h2>
          <p>{t("manga_select_panel")}</p>
        </div>
        <div className="mf-empty">
          <p>Cria caixas no Flow e liga-as na História para configurar painéis.</p>
          <button type="button" className="mf-btn mf-btn--primary mt-3" onClick={onGoToFlow}>
            <Workflow className="w-4 h-4" />
            Ir ao Flow
          </button>
        </div>
      </div>
    );
  }

  if (!config || !activeNode) return null;

  return (
    <div className="mf-panel-tab" data-testid="manga-flow-panel-tab">
      <div className="mf-panel-hero">
        <div>
          <p className="mf-story-eyebrow">{t("manga_active_panel")}</p>
          <h2 className="mf-story-title">
            {t("manga_panel_of", {
              current: activeIndex + 1,
              total: sequence.length,
            })}
          </h2>
          <p className="mf-story-sub">
            {NODE_ICONS[activeNode.data.flowType]} {activeNode.data.name || NODE_LABELS[activeNode.data.flowType]}
          </p>
        </div>
        <div className="mf-panel-hero-nav">
          <button type="button" className="mf-btn" onClick={() => goPanel(-1)} aria-label="Anterior">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button type="button" className="mf-btn" onClick={() => goPanel(1)} aria-label="Seguinte">
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mf-panel-strip">
        {sequence.map((node, i) => (
          <button
            key={node.id}
            type="button"
            className={`mf-panel-thumb ${node.id === activePanelId ? "mf-panel-thumb--on" : ""}`}
            style={{ borderColor: NODE_COLORS[node.data.flowType] }}
            onClick={() => setActivePanel(node.id)}
          >
            <span className="mf-panel-thumb-num">{i + 1}</span>
            <span>{NODE_ICONS[node.data.flowType]}</span>
            <span className="truncate max-w-[72px]">{node.data.name || NODE_LABELS[node.data.flowType]}</span>
          </button>
        ))}
      </div>

      <div className="mf-panel-grid">
        <div className="mf-panel-main">
          <PanelPreview
            config={config}
            catalog={catalog}
            charName={charNode?.data?.name}
            sceneName={sceneNode?.data?.name}
          />

          {config.resultUrl && (
            <img src={config.resultUrl} alt="" className="mf-panel-result mt-2 rounded-lg border border-[#2e2e30]" />
          )}

          <div className="mf-panel-actions">
            <button type="button" className="mf-btn" onClick={() => syncPanelFromFlow(activePanelId)}>
              <RefreshCw className="w-4 h-4" />
              Sync Flow
            </button>
            <button type="button" className="mf-btn" onClick={() => onGoToFlow?.()}>
              <Workflow className="w-4 h-4" />
              {t("manga_go_panel")}
            </button>
            <button type="button" className="mf-btn" onClick={copyPrompt}>
              <Copy className="w-4 h-4" />
              Copiar prompt
            </button>
            <button
              type="button"
              className="mf-btn mf-btn--primary"
              disabled={busy}
              onClick={() => onGeneratePanel?.(activePanelId)}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {t("manga_gen_panel_btn", { n: panelCost ?? 15 })}
            </button>
          </div>

          <Section icon={User} title={t("manga_sec_character")} hint={t("manga_sec_character_hint")}>
            <label className="text-[0.75rem] text-[#c4b5fd]">{t("manga_character")}</label>
            <select
              className="mf-field"
              value={config.characterNodeId || ""}
              onChange={(e) => patch({ characterNodeId: e.target.value || null })}
            >
              <option value="">{t("manga_choose")}</option>
              {characterNodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.data.name}
                </option>
              ))}
            </select>
            <p className="text-[0.7rem] text-[#9ca3af] mb-1">{t("manga_sec_pose")}</p>
            <ChipRow value={config.poseId} onChange={(v) => patch({ poseId: v })} options={catalog.poses} />
            <p className="text-[0.7rem] text-[#9ca3af] mb-1">{t("manga_sec_expression")}</p>
            <ChipRow
              value={config.expression}
              onChange={(v) => patch({ expression: v })}
              options={catalog.expressions}
            />
            <p className="text-[0.7rem] text-[#9ca3af] mb-1">{t("manga_hand_pose")}</p>
            <ChipRow value={config.handPose} onChange={(v) => patch({ handPose: v })} options={catalog.handPoses} />
            <p className="text-[0.7rem] text-[#9ca3af] mb-1">{t("manga_body_type")}</p>
            <ChipRow
              value={charNode?.data?.bodyType || "athletic"}
              onChange={(v) => charNode && useFlowStore.getState().updateNodeData(charNode.id, { bodyType: v })}
              options={catalog.bodyTypes}
            />
            <label className="flex items-center gap-2 text-[0.8rem] mt-2">
              <input
                type="checkbox"
                checked={config.consistencyLock}
                onChange={(e) => patch({ consistencyLock: e.target.checked })}
              />
              {t("manga_consistency_lock")}
            </label>
          </Section>

          <Section icon={Camera} title={t("manga_sec_camera")} hint={t("manga_sec_camera_hint")}>
            <p className="text-[0.7rem] text-[#9ca3af]">Plano / enquadramento</p>
            <ChipRow value={config.shot} onChange={(v) => patch({ shot: v })} options={catalog.shots} />
            <p className="text-[0.7rem] text-[#9ca3af]">Ângulo</p>
            <ChipRow value={config.angle} onChange={(v) => patch({ angle: v })} options={catalog.angles} />
            <p className="text-[0.7rem] text-[#9ca3af]">Movimento de câmara</p>
            <ChipRow value={config.framing} onChange={(v) => patch({ framing: v })} options={catalog.framing} />
            <p className="text-[0.7rem] text-[#9ca3af]">{t("manga_screen_direction")}</p>
            <ChipRow
              value={config.screenDirection}
              onChange={(v) => patch({ screenDirection: v })}
              options={catalog.screenDirections}
            />
            <p className="text-[0.7rem] text-[#9ca3af]">
              {t("manga_eye_level")}: {config.eyeLevel ?? 0}°
            </p>
            <input
              type="range"
              min={-30}
              max={30}
              value={config.eyeLevel ?? 0}
              onChange={(e) => patch({ eyeLevel: Number(e.target.value) })}
              className="w-full"
            />
            <p className="text-[0.7rem] text-[#9ca3af] mt-2">Formato</p>
            <ChipRow value={config.aspect} onChange={(v) => patch({ aspect: v })} options={ASPECT_RATIOS} />
            <p className="text-[0.7rem] text-[#9ca3af]">Foco</p>
            <ChipRow value={config.focus} onChange={(v) => patch({ focus: v })} options={catalog.focus} />
          </Section>

          <Section icon={Sun} title={t("manga_sec_lighting")} hint={t("manga_sec_lighting_hint")}>
            <label className="text-[0.75rem] text-[#c4b5fd]">{t("manga_scenario")}</label>
            <select
              className="mf-field"
              value={config.scenarioNodeId || ""}
              onChange={(e) => patch({ scenarioNodeId: e.target.value || null })}
            >
              <option value="">{t("manga_choose")}</option>
              {scenarioNodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.data.name}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-[0.8rem] mt-2">
              <input
                type="checkbox"
                checked={config.inheritSceneLighting !== false}
                onChange={(e) => patch({ inheritSceneLighting: e.target.checked })}
              />
              {t("manga_inherit_scene")}
            </label>
            {!config.inheritSceneLighting && (
              <>
                <ChipRow value={config.lighting} onChange={(v) => patch({ lighting: v })} options={catalog.lighting} />
                <ChipRow
                  value={config.lightingColorTemp}
                  onChange={(v) => patch({ lightingColorTemp: v })}
                  options={catalog.lightingColorTemps}
                />
                <p className="text-[0.75rem] text-[#9ca3af]">
                  {t("manga_light_direction")}: {config.lightingDirection ?? 120}°
                </p>
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={config.lightingDirection ?? 120}
                  onChange={(e) => patch({ lightingDirection: Number(e.target.value) })}
                  className="w-full"
                />
              </>
            )}
          </Section>

          <Section icon={MessageSquare} title={t("manga_sec_dialogue")} hint={t("manga_sec_dialogue_hint")}>
            <label className="flex items-center gap-2 text-[0.8rem]">
              <input
                type="checkbox"
                checked={config.showBalloon}
                onChange={(e) => patch({ showBalloon: e.target.checked })}
              />
              Mostrar balão
            </label>
            <textarea
              className="mf-field min-h-[72px]"
              placeholder={t("manga_balloon_placeholder")}
              value={config.balloonText || ""}
              onChange={(e) => patch({ balloonText: e.target.value })}
            />
            <ChipRow
              value={config.balloonType}
              onChange={(v) => patch({ balloonType: v })}
              options={catalog.balloonTypes}
            />
            <ChipRow value={config.balloonPos} onChange={(v) => patch({ balloonPos: v })} options={catalog.balloonPos} />
            <ChipRow
              value={config.letterStyle}
              onChange={(v) => patch({ letterStyle: v })}
              options={catalog.letterStyles}
            />
            <ChipRow
              value={config.balloonShape || "round"}
              onChange={(v) => patch({ balloonShape: v })}
              options={catalog.balloonShapes}
            />
          </Section>

          <Section icon={Zap} title={t("manga_field_effects")} hint={t("manga_sec_effects_hint")} defaultOpen={false}>
            <div className="mf-chips">
              {catalog.effects.map((fx) => (
                <button
                  key={fx.id}
                  type="button"
                  className={`mf-chip ${config.effects?.[fx.id] ? "mf-chip--on" : ""}`}
                  onClick={() =>
                    patch({
                      effects: { ...config.effects, [fx.id]: !config.effects?.[fx.id] },
                    })
                  }
                >
                  {fx.label}
                </button>
              ))}
            </div>
          </Section>

          <Section icon={Eye} title="Avançado" defaultOpen={false}>
            <textarea
              className="mf-field min-h-[56px]"
              placeholder="Notas de composição (câmara, profundidade, simetria…)"
              value={config.compositionNotes || ""}
              onChange={(e) => patch({ compositionNotes: e.target.value })}
            />
            <textarea
              className="mf-field min-h-[56px]"
              placeholder="Prompt extra para este painel"
              value={config.extraPrompt || ""}
              onChange={(e) => patch({ extraPrompt: e.target.value })}
            />
            <textarea
              className="mf-field min-h-[48px]"
              placeholder="Evitar (negative)"
              value={config.negativePrompt || ""}
              onChange={(e) => patch({ negativePrompt: e.target.value })}
            />
            <label className="flex items-center gap-2 text-[0.8rem]">
              <input
                type="checkbox"
                checked={config.storyInjection}
                onChange={(e) => patch({ storyInjection: e.target.checked })}
              />
              Story injection (painel anterior)
            </label>
          </Section>
        </div>

        <aside className="mf-panel-side">
          <div className="mf-card mf-card--pad sticky top-0">
            <h3 className="text-white font-semibold text-[0.9rem] mb-2">{t("manga_prompt_preview")}</h3>
            <pre className="mf-prompt-preview">{promptPreview || t("manga_preview_placeholder")}</pre>
            <button type="button" className="mf-btn w-full mt-2" onClick={copyPrompt}>
              <Copy className="w-4 h-4" />
              Copiar
            </button>
            <button
              type="button"
              className="mf-btn mf-btn--primary w-full mt-2"
              disabled={busy}
              onClick={() => onGeneratePanel?.(activePanelId)}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
              {t("manga_gen_panel_short", { n: panelCost ?? 15 })}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
