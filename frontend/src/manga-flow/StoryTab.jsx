import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BookMarked,
  CheckCircle2,
  ChevronRight,
  Copy,
  GitBranch,
  GripVertical,
  LayoutList,
  Loader2,
  Map,
  Sparkles,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "../lib/i18n";
import { useFlowStore } from "./useFlowStore";
import { NODE_ICONS, NODE_LABELS } from "./types";
import { buildFlowPrompt } from "./buildFlowPrompt";
import {
  analyzeCoherence,
  buildBranches,
  DEFAULT_STORY,
  DEMO_STORY,
  exportStoryText,
  getStorySequence,
  READING_ORDERS,
  stepSummary,
  STORY_GENRES,
  STORY_POV,
  STORY_TONES,
} from "./storyAnalysis";

const THEME_PRESETS = [
  "amizade",
  "vingança",
  "mistério",
  "escola",
  "batalha",
  "viagem no tempo",
  "família",
  "super-herói",
];

export default function StoryTab({ onGoToFlow }) {
  const { t } = useI18n();
  const projectName = useFlowStore((s) => s.projectName);
  const setProjectName = useFlowStore((s) => s.setProjectName);
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const story = useFlowStore((s) => s.story);
  const globalSettings = useFlowStore((s) => s.globalSettings);
  const setStory = useFlowStore((s) => s.setStory);
  const setSceneNote = useFlowStore((s) => s.setSceneNote);
  const setManualSequence = useFlowStore((s) => s.setManualSequence);
  const moveStep = useFlowStore((s) => s.moveStoryStep);
  const selectNode = useFlowStore((s) => s.selectNode);
  const addBeat = useFlowStore((s) => s.addStoryBeat);
  const removeBeat = useFlowStore((s) => s.removeStoryBeat);
  const loadDemoStory = useFlowStore((s) => s.loadDemoStory);
  const autoOrganizeSequence = useFlowStore((s) => s.autoOrganizeSequence);

  const [view, setView] = useState("timeline");
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [checking, setChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);

  const sequence = useMemo(
    () => getStorySequence(nodes, edges, story.manualSequence),
    [nodes, edges, story.manualSequence],
  );

  const filteredSequence = useMemo(() => {
    if (filter === "all") return sequence;
    return sequence.filter((n) => n.data.flowType === filter);
  }, [sequence, filter]);

  const branches = useMemo(() => buildBranches(nodes, edges), [nodes, edges]);

  const coherence = useMemo(
    () => analyzeCoherence(nodes, edges, story, sequence),
    [nodes, edges, story, sequence],
  );

  const displayScore = lastCheck?.score ?? coherence.score;
  const displayIssues = lastCheck?.issues ?? coherence.issues;

  const fullPrompt = useMemo(
    () => buildFlowPrompt(nodes, edges, { ...globalSettings, storySynopsis: story.synopsis }),
    [nodes, edges, globalSettings, story.synopsis],
  );

  const runCoherenceCheck = () => {
    setChecking(true);
    setTimeout(() => {
      const result = analyzeCoherence(nodes, edges, story, sequence);
      setLastCheck(result);
      setChecking(false);
      if (result.score >= 80) toast.success(t("manga_coherence_good", { score: result.score }));
      else if (result.issues.length) toast.info(t("manga_coherence_issues", { n: result.issues.length }));
      else toast.success(t("manga_coherence_ok"));
    }, 400);
  };

  const copyPrompt = async () => {
    const header = story.synopsis ? `Sinopse: ${story.synopsis}\n\n` : "";
    await navigator.clipboard.writeText(header + fullPrompt);
    toast.success("Prompt copiado");
  };

  const copyExport = async () => {
    const text = exportStoryText(projectName, story, sequence, edges);
    await navigator.clipboard.writeText(text);
    toast.success("História exportada (texto)");
  };

  const focusNode = (nodeId) => {
    selectNode(nodeId);
    setExpandedId(nodeId);
    onGoToFlow?.();
  };

  const toggleTheme = (theme) => {
    const themes = story.themes || [];
    const next = themes.includes(theme) ? themes.filter((x) => x !== theme) : [...themes, theme];
    setStory({ themes: next });
  };

  const stats = [
    { label: "Passos", value: sequence.length, icon: LayoutList },
    { label: "Ligações", value: edges.length, icon: GitBranch },
    { label: "Ramos", value: branches.length, icon: Map },
    { label: "Coerência", value: `${displayScore}%`, icon: CheckCircle2 },
  ];

  return (
    <div className="mf-story" data-testid="manga-flow-story-tab">
      <div className="mf-story-hero">
        <div>
          <p className="mf-story-eyebrow">{t("manga_story_nav")}</p>
          <h2 className="mf-story-title">{t("manga_tab_story")}</h2>
          <p className="mf-story-sub">{t("manga_story_nav_hint")}</p>
        </div>
        <div className="mf-story-hero-actions">
          <button type="button" className="mf-btn" onClick={() => loadDemoStory()}>
            <Sparkles className="w-4 h-4" />
            {t("manga_load_demo")}
          </button>
          <button type="button" className="mf-btn mf-btn--primary" onClick={() => onGoToFlow?.()}>
            <Workflow className="w-4 h-4" />
            Canvas Flow
          </button>
        </div>
      </div>

      <div className="mf-story-stats">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="mf-story-stat">
            <Icon className="w-4 h-4 text-[#a78bfa]" />
            <span className="mf-story-stat-val">{value}</span>
            <span className="mf-story-stat-lbl">{label}</span>
          </div>
        ))}
      </div>

      <section className="mf-card mf-story-section">
        <h3 className="mf-section-title">
          <BookMarked className="w-4 h-4" />
          Metadados do capítulo
        </h3>
        <input
          className="mf-field"
          placeholder="Nome do projeto"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
        <input
          className="mf-field"
          placeholder="Título do capítulo"
          value={story.chapterTitle || ""}
          onChange={(e) => setStory({ chapterTitle: e.target.value })}
        />
        <input
          className="mf-field"
          placeholder="Logline (uma frase)"
          value={story.logline || ""}
          onChange={(e) => setStory({ logline: e.target.value })}
        />
        <textarea
          className="mf-field min-h-[88px]"
          placeholder="Sinopse — o enredo completo deste capítulo (mín. 20 caracteres para coerência)"
          value={story.synopsis || ""}
          onChange={(e) => setStory({ synopsis: e.target.value })}
        />
        <p className="text-[0.7rem] text-[#9ca3af] mb-1">Género</p>
        <div className="mf-chips">
          {STORY_GENRES.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`mf-chip ${story.genre === g.id ? "mf-chip--on" : ""}`}
              onClick={() => setStory({ genre: g.id })}
            >
              {g.icon} {g.label}
            </button>
          ))}
        </div>
        <p className="text-[0.7rem] text-[#9ca3af] mb-1 mt-2">Tom narrativo</p>
        <div className="mf-chips">
          {STORY_TONES.map((x) => (
            <button
              key={x.id}
              type="button"
              className={`mf-chip ${story.tone === x.id ? "mf-chip--on" : ""}`}
              onClick={() => setStory({ tone: x.id })}
            >
              {x.label}
            </button>
          ))}
        </div>
        <p className="text-[0.7rem] text-[#9ca3af] mb-1 mt-2">Ponto de vista</p>
        <div className="mf-chips">
          {STORY_POV.map((x) => (
            <button
              key={x.id}
              type="button"
              className={`mf-chip ${story.pov === x.id ? "mf-chip--on" : ""}`}
              onClick={() => setStory({ pov: x.id })}
            >
              {x.label}
            </button>
          ))}
        </div>
        <p className="text-[0.7rem] text-[#9ca3af] mb-1 mt-2">Ordem de leitura</p>
        <div className="mf-chips">
          {READING_ORDERS.map((x) => (
            <button
              key={x.id}
              type="button"
              className={`mf-chip ${story.readingOrder === x.id ? "mf-chip--on" : ""}`}
              onClick={() => setStory({ readingOrder: x.id })}
            >
              {x.label}
            </button>
          ))}
        </div>
        <p className="text-[0.7rem] text-[#9ca3af] mb-1 mt-2">Temas</p>
        <div className="mf-chips">
          {THEME_PRESETS.map((th) => (
            <button
              key={th}
              type="button"
              className={`mf-chip ${(story.themes || []).includes(th) ? "mf-chip--on" : ""}`}
              onClick={() => toggleTheme(th)}
            >
              {th}
            </button>
          ))}
        </div>
      </section>

      <section className="mf-card mf-story-section mf-story-coherence">
        <div className="mf-coherence-head">
          <div>
            <h3 className="mf-section-title">{t("manga_coherence_title")}</h3>
            <p className="text-[0.75rem] text-[#9ca3af]">{t("manga_coherence_score_desc")}</p>
          </div>
          <div className="mf-score-ring" style={{ "--mf-score": displayScore }}>
            <span>{displayScore}%</span>
          </div>
        </div>
        <button
          type="button"
          className="mf-btn mf-btn--primary w-full"
          disabled={checking || !nodes.length}
          onClick={runCoherenceCheck}
        >
          {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {t("manga_coherence_btn")}
        </button>
        {displayIssues.length > 0 && (
          <ul className="mf-issue-list">
            {displayIssues.slice(0, 8).map((issue) => (
              <li key={issue.id} className={`mf-issue mf-issue--${issue.level}`}>
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{issue.message}</span>
                {issue.nodeId && (
                  <button type="button" className="mf-issue-fix" onClick={() => focusNode(issue.nodeId)}>
                    {t("manga_go_panel")}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mf-story-toolbar">
        <div className="mf-chips">
          {[
            { id: "all", label: "Todos" },
            { id: "personagem", label: "👤" },
            { id: "cenario", label: "🌅" },
            { id: "acao", label: "🏃" },
            { id: "dialogo", label: "💬" },
            { id: "efeito", label: "✨" },
            { id: "transicao", label: "➡️" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              className={`mf-chip ${filter === f.id ? "mf-chip--on" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="mf-btn" onClick={autoOrganizeSequence}>
            {t("manga_auto_layout")}
          </button>
          <button type="button" className="mf-btn" onClick={() => setManualSequence(null)}>
            Reset ordem
          </button>
          <button type="button" className="mf-btn" onClick={copyExport}>
            <Copy className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      <div className="mf-view-tabs">
        <button
          type="button"
          className={view === "timeline" ? "mf-view-tab mf-view-tab--on" : "mf-view-tab"}
          onClick={() => setView("timeline")}
        >
          <LayoutList className="w-4 h-4" />
          Timeline
        </button>
        <button
          type="button"
          className={view === "branches" ? "mf-view-tab mf-view-tab--on" : "mf-view-tab"}
          onClick={() => setView("branches")}
        >
          <GitBranch className="w-4 h-4" />
          Ramos ({branches.length})
        </button>
        <button
          type="button"
          className={view === "prompt" ? "mf-view-tab mf-view-tab--on" : "mf-view-tab"}
          onClick={() => setView("prompt")}
        >
          Prompt
        </button>
      </div>

      {view === "timeline" && (
        <section className="mf-story-timeline">
          <p className="text-[0.75rem] text-[#8b5cf6] mb-2">{t("manga_story_legend")}</p>
          {!filteredSequence.length ? (
            <div className="mf-empty">
              <p>Sem passos no fluxo.</p>
              <button type="button" className="mf-btn mf-btn--primary mt-2" onClick={() => onGoToFlow?.()}>
                Ir ao canvas e criar caixas
              </button>
            </div>
          ) : (
            filteredSequence.map((node) => {
              const globalIndex = sequence.findIndex((n) => n.id === node.id);
              const edgeIn = edges.find((e) => e.target === node.id);
              const s = stepSummary(node, edgeIn);
              const isOpen = expandedId === node.id;
              const note = story.sceneNotes?.[node.id] || "";
              return (
                <article
                  key={node.id}
                  className="mf-timeline-step"
                  style={{ "--step-color": s.color }}
                >
                  <div className="mf-timeline-rail">
                    <span className="mf-step-num">{globalIndex + 1}</span>
                  </div>
                  <div className="mf-timeline-body">
                    <div className="mf-timeline-head">
                      <GripVertical className="w-4 h-4 text-[#5a5a5e]" />
                      <span className="mf-step-type" style={{ borderColor: s.color }}>
                        {s.icon} {s.label}
                      </span>
                      <strong className="flex-1 truncate">{s.name}</strong>
                      <div className="mf-timeline-move">
                        <button type="button" aria-label="Subir" onClick={() => moveStep(node.id, -1)}>
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button type="button" aria-label="Descer" onClick={() => moveStep(node.id, 1)}>
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {s.detail && <p className="mf-step-detail">{s.detail}</p>}
                    {(node.data.avatarUrl || node.data.backgroundUrl || node.data.poseImageUrl) && (
                      <img
                        src={node.data.avatarUrl || node.data.backgroundUrl || node.data.poseImageUrl}
                        alt=""
                        className="mf-step-thumb"
                      />
                    )}
                    <button
                      type="button"
                      className="mf-btn mf-btn--sm"
                      onClick={() => setExpandedId(isOpen ? null : node.id)}
                    >
                      {isOpen ? "Ocultar notas" : "Notas de cena"}
                    </button>
                    {isOpen && (
                      <textarea
                        className="mf-field min-h-[64px] mt-1"
                        placeholder="O que acontece neste momento? Emoção, câmara, continuidade…"
                        value={note}
                        onChange={(e) => setSceneNote(node.id, e.target.value)}
                      />
                    )}
                    <div className="flex gap-2 mt-2">
                      <button type="button" className="mf-btn flex-1" onClick={() => focusNode(node.id)}>
                        <ChevronRight className="w-4 h-4" />
                        Editar no Flow
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
          <button
            type="button"
            className="mf-btn w-full mt-2"
            onClick={() => addBeat({ title: "Novo beat", summary: "" })}
          >
            + Adicionar beat narrativo (nota)
          </button>
          {(story.beats || []).map((beat) => (
            <div key={beat.id} className="mf-beat-card">
              <input
                className="mf-field"
                value={beat.title}
                onChange={(e) =>
                  useFlowStore.getState().updateStoryBeat(beat.id, { title: e.target.value })
                }
              />
              <textarea
                className="mf-field min-h-[56px]"
                placeholder="Resumo do beat"
                value={beat.summary || ""}
                onChange={(e) =>
                  useFlowStore.getState().updateStoryBeat(beat.id, { summary: e.target.value })
                }
              />
              <button type="button" className="mf-btn" onClick={() => removeBeat(beat.id)}>
                Remover beat
              </button>
            </div>
          ))}
        </section>
      )}

      {view === "branches" && (
        <section className="mf-card mf-story-section">
          {branches.length === 0 ? (
            <p className="text-[#9ca3af] text-sm">Liga caixas no Flow para ver ramificações.</p>
          ) : (
            branches.map((branch) => (
              <div key={branch.id} className="mf-branch">
                <h4>
                  {branch.label} · {branch.length} passos
                </h4>
                <div className="mf-branch-trail">
                  {branch.nodeIds.map((nid, i) => {
                    const n = nodes.find((x) => x.id === nid);
                    if (!n) return null;
                    return (
                      <button
                        key={nid}
                        type="button"
                        className="mf-branch-node"
                        onClick={() => focusNode(nid)}
                      >
                        {NODE_ICONS[n.data.flowType]} {n.data.name || NODE_LABELS[n.data.flowType]}
                        {i < branch.nodeIds.length - 1 && <span className="mf-branch-arrow">→</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {view === "prompt" && (
        <section className="mf-card mf-story-section">
          <p className="text-[0.75rem] text-[#9ca3af] mb-2">
            Prompt compilado a partir do fluxo + sinopse (usado na geração).
          </p>
          <pre className="mf-prompt-preview">{fullPrompt || "(vazio — adiciona caixas e sinopse)"}</pre>
          <button type="button" className="mf-btn mf-btn--primary w-full mt-2" onClick={copyPrompt}>
            <Copy className="w-4 h-4" />
            Copiar prompt
          </button>
        </section>
      )}
    </div>
  );
}
