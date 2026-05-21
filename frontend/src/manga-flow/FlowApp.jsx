import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, GitBranch, HelpCircle, LayoutGrid, Loader2, SlidersHorizontal, Workflow } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../lib/auth";
import { usePricing } from "../lib/PricingContext";
import { useI18n } from "../lib/i18n";
import useTitle from "../lib/useTitle";
import { api, formatApiError, pollPrediction, uploadPost } from "../lib/api";
import { composeMangaPromptApi } from "../lib/composeMangaPromptApi";
import { calcGenerationCost } from "./types";
import { buildFlowPrompt } from "./buildFlowPrompt";
import { useFlowStore } from "./useFlowStore";
import FlowCanvas from "./FlowCanvas";
import NodeEditor from "./NodeEditor";
import PromptEnhancement from "./PromptEnhancement";
import StoryTab from "./StoryTab";
import { NODE_ICONS, NODE_LABELS } from "./types";

const TABS = [
  { id: "assets", icon: BookOpen, label: "Assets" },
  { id: "page", icon: LayoutGrid, label: "Página" },
  { id: "panel", icon: SlidersHorizontal, label: "Painel" },
  { id: "flow", icon: Workflow, label: "Flow" },
  { id: "story", icon: GitBranch, label: "História" },
];

const ADD_TYPES = ["personagem", "cenario", "objeto", "acao", "dialogo", "efeito", "transicao"];

function FlowTutorial() {
  const step = useFlowStore((s) => s.tutorialStep);
  const setStep = useFlowStore((s) => s.setTutorialStep);
  if (step < 0) return null;

  const steps = [
    "Bem-vindo ao Manga Flow! Aqui constróis histórias visualmente.",
    "Clique no [+] para adicionar a tua primeira caixa.",
    "Escolhe o tipo «Personagem» e preenche os detalhes.",
    "Arrasta do port de saída (●) para criar uma ligação.",
    "Adiciona uma caixa «Ação» e liga-a ao personagem.",
    "Usa [▶️] para preview ou [Gerar] para criar a imagem.",
  ];

  return (
    <div className="mf-tutorial">
      <div className="mf-tutorial-card">
        <p className="text-[0.7rem] text-[#8b5cf6] mb-1">Tutorial {step + 1}/{steps.length}</p>
        <p className="text-white text-[0.9rem] mb-3">{steps[step]}</p>
        <div className="flex gap-2">
          <button type="button" className="mf-btn flex-1" onClick={() => setStep(-1)}>
            Pular
          </button>
          <button
            type="button"
            className="mf-btn mf-btn--primary flex-1"
            onClick={() => (step >= steps.length - 1 ? setStep(-1) : setStep(step + 1))}
          >
            {step >= steps.length - 1 ? "Começar" : "Seguinte"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PlaceholderTab({ title, hint }) {
  return (
    <div className="mf-card mf-card--pad">
      <h2 className="text-white font-semibold">{title}</h2>
      <p className="text-[#9ca3af] text-[0.85rem] mt-2">{hint}</p>
      <p className="text-[#8b5cf6] text-[0.8rem] mt-3">Em breve — diz <strong>próximo</strong> para trabalharmos nesta aba.</p>
    </div>
  );
}

export default function FlowApp() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const { costs } = usePricing();
  useTitle("Manga Flow");

  const [tab, setTab] = useState("flow");
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const projectName = useFlowStore((s) => s.projectName);
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const globalSettings = useFlowStore((s) => s.globalSettings);
  const status = useFlowStore((s) => s.status);
  const setGlobalSettings = useFlowStore((s) => s.setGlobalSettings);
  const addNode = useFlowStore((s) => s.addNode);
  const newProject = useFlowStore((s) => s.newProject);
  const getResolvedOutputMode = useFlowStore((s) => s.getResolvedOutputMode);
  const setStatus = useFlowStore((s) => s.setStatus);
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId);
  const story = useFlowStore((s) => s.story);

  const genCost = useMemo(() => {
    const mode = getResolvedOutputMode();
    const map = {
      panel: costs.mangaPanel ?? 15,
      page: costs.mangaPage ?? 40,
      chapter: costs.mangaChapter ?? 150,
    };
    return map[mode] ?? calcGenerationCost(nodes.length, mode);
  }, [nodes.length, costs, getResolvedOutputMode]);

  const generate = async () => {
    const prompt = buildFlowPrompt(nodes, edges, {
      ...globalSettings,
      storySynopsis: [story.logline, story.synopsis].filter(Boolean).join(" — "),
    });
    if (prompt.length < 12) {
      toast.error(t("manga_err_prompt_short"));
      return;
    }
    const mode = getResolvedOutputMode();
    const endpoint =
      mode === "chapter"
        ? "/generate/manga-chapter"
        : mode === "page"
          ? "/generate/manga-page"
          : "/generate/manga-panel";
    const cost = genCost;

    if ((user?.credits ?? 0) < cost && !user?.is_unlimited) {
      toast.error(t("manga_err_credits", { need: cost, have: user?.credits ?? 0 }));
      return;
    }

    setBusy(true);
    setStatus(t("manga_generating"));
    try {
      let finalPrompt = prompt;
      if (globalSettings.gptCompose) {
        const composed = await composeMangaPromptApi({
          mode: mode === "chapter" ? "chapter" : mode === "page" ? "page" : "panel",
          panels: [],
          project: { stylePreset: globalSettings.style, pageLayout: "horizontal" },
          lang: lang || "pt",
          useGpt: true,
        });
        finalPrompt = composed.prompt || prompt;
      }

      const { data } = await api.post(
        endpoint,
        {
          prompt_final: finalPrompt.trim(),
          aspect_ratio: "4:5",
          model_key: globalSettings.engine,
        },
        { timeout: 90000, headers: { "X-Skip-Auto-Poll": "1" } },
      );

      if (!data?.prediction_id) {
        const url = data?.creation?.result_urls?.[0];
        if (url) toast.success(t("manga_success_panel", { n: cost }));
        else throw new Error(t("manga_err_no_prediction"));
      } else {
        const polled = await pollPrediction(data.prediction_id, {
          credits_spent: data.credits_spent ?? cost,
          type: "manga",
          timeoutMs: 300000,
        });
        const url = polled?.creation?.result_urls?.[0];
        if (!url) throw new Error(t("manga_err_no_url"));
        toast.success(t("manga_success_panel", { n: polled?.creation?.credits_spent ?? cost }));
      }
      await refresh();
      setStatus("");
    } catch (e) {
      const msg = formatApiError(e, t("manga_fail"));
      setStatus(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const renderTab = () => {
    if (tab === "flow") {
      return (
        <div className="mf-layout-desktop">
          <div className="flex-1 min-h-0 flex flex-col">
            <FlowCanvas
              onAddMenu={() => setAddOpen(true)}
            />
            <div className="mf-canvas-toolbar">
              <span className="text-[0.75rem] text-[#9ca3af]">
                Zoom · Fit · {nodes.length} caixas · {getResolvedOutputMode()} · {genCost} cr
              </span>
            </div>
          </div>
          <aside className="mf-slide mf-slide--desktop hidden lg:block">
            <NodeEditor />
          </aside>
        </div>
      );
    }
    if (tab === "assets") {
      return <PlaceholderTab title="📚 Biblioteca de assets" hint="Personagens e cenários são criados como caixas no Flow." />;
    }
    if (tab === "page") {
      return <PlaceholderTab title="📄 Editor de página" hint="A ordem das caixas no Flow define a página gerada." />;
    }
    if (tab === "panel") {
      return <PlaceholderTab title="🖼️ Painel ativo" hint="Seleciona uma caixa no Flow para editar no painel lateral." />;
    }
    if (tab === "story") {
      return <StoryTab onGoToFlow={() => setTab("flow")} />;
    }
    return null;
  };

  return (
    <div className="mf-root" data-testid="manga-flow-page">
      <FlowTutorial />
      <PromptEnhancement />

      <header className="mf-header">
        <div className="mf-header-row">
          <button type="button" className="mf-back" onClick={() => navigate("/app/tools")} aria-label="Voltar">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="mf-title">
            <h1>MANGA FLOW</h1>
            <p>{projectName}</p>
          </div>
          <button type="button" className="mf-btn" onClick={() => useFlowStore.getState().setTutorialStep(0)}>
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        <div className="mf-chips mt-2">
          <Chip
            label="Manga"
            active={globalSettings.style === "manga"}
            onClick={() => setGlobalSettings({ style: "manga" })}
          />
          <Chip label="Comic" active={globalSettings.style === "comic"} onClick={() => setGlobalSettings({ style: "comic" })} />
          <Chip label="Webtoon" active={globalSettings.style === "webtoon"} onClick={() => setGlobalSettings({ style: "webtoon" })} />
          <Chip label="Grok" active={globalSettings.engine === "grok"} onClick={() => setGlobalSettings({ engine: "grok" })} />
          <Chip label="GPT" active={globalSettings.engine === "gpt_image"} onClick={() => setGlobalSettings({ engine: "gpt_image" })} />
        </div>
        <label className="flex items-center gap-2 text-[0.8rem] text-[#c4b5fd] mt-2 min-h-[44px]">
          <input
            type="checkbox"
            checked={globalSettings.gptCompose}
            onChange={(e) => setGlobalSettings({ gptCompose: e.target.checked })}
          />
          GPT compõe prompt
        </label>
        <div className="mf-chips mt-2">
          <Chip
            label="Auto"
            active={globalSettings.outputMode === "auto"}
            onClick={() => setGlobalSettings({ outputMode: "auto" })}
          />
          <Chip
            label="Painel"
            active={globalSettings.outputMode === "panel"}
            onClick={() => setGlobalSettings({ outputMode: "panel" })}
          />
          <Chip
            label="Página"
            active={globalSettings.outputMode === "page"}
            onClick={() => setGlobalSettings({ outputMode: "page" })}
          />
          <Chip
            label="Capítulo"
            active={globalSettings.outputMode === "chapter"}
            onClick={() => setGlobalSettings({ outputMode: "chapter" })}
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <button type="button" className="mf-btn" onClick={newProject}>
            Novo projeto
          </button>
          <button type="button" className="mf-btn mf-btn--primary" disabled={busy || !nodes.length} onClick={generate}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            🔄 Gerar · {genCost} cr
          </button>
        </div>
        {status && <div className="text-[0.75rem] text-[#c4b5fd] mt-2">{status}</div>}
      </header>

      <nav className="mf-tabs-bar" aria-label="Secções Manga Flow">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            className={`mf-tab-pill ${tab === id ? "mf-tab-pill--on" : ""}`}
            onClick={() => setTab(id)}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="mf-body mf-body--scroll">{renderTab()}</div>

      {tab === "flow" && selectedNodeId && (
        <div className="mf-slide lg:hidden">
          <NodeEditor />
        </div>
      )}

      <nav className="mf-nav lg:hidden">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            className={`mf-nav-btn ${tab === id ? "mf-nav-btn--on" : ""}`}
            onClick={() => setTab(id)}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {addOpen && (
        <div className="mf-modal-bg" onClick={() => setAddOpen(false)}>
          <div className="mf-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-semibold mb-2">Adicionar caixa</h3>
            {ADD_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className="mf-dropdown block w-full text-left mb-1"
                style={{ position: "static", boxShadow: "none" }}
                onClick={() => {
                  addNode(type, { x: 100 + Math.random() * 200, y: 80 + Math.random() * 120 });
                  setAddOpen(false);
                  setTab("flow");
                }}
              >
                {NODE_ICONS[type]} {NODE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({ label, active, onClick }) {
  return (
    <button type="button" className={`mf-chip ${active ? "mf-chip--on" : ""}`} onClick={onClick}>
      {label}
    </button>
  );
}
