import { useState, useCallback, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Wand2, Download, Copy, Loader2, Sparkles, Image as ImageIcon, AlertCircle, BookOpen } from "lucide-react";
import { buildFinalPrompt, buildFinalPagePrompt, countPanelNodes } from "./buildFlowPrompt";
import { uploadPost, pollPrediction, trackPendingPrediction } from "../../lib/api";
import {
  planMangaGeneration,
  appendMangaRefsToFormData,
} from "../../lib/mangaGenerationRefs";
import { validateGraphForGeneration } from "../../lib/mangaFlowGraph";
import { enrichEdgesSemantics } from "../../lib/mangaFlowSemantics";
import { shouldUseComicSheetMode } from "../../lib/mangaFlowOrchestrator";
import { toast } from "sonner";

const MODELS = [
  { id: "grok", name: "Fast", desc: "Quick", apiModel: "standard" },
  { id: "flux", name: "Flux Pro ★", desc: "Best", badge: null, apiModel: "pro" },
  { id: "gpt_image", name: "Premium", desc: "Max", apiModel: "gpt_image" },
];
const QUALITY = [
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
  { id: "ultra", label: "Ultra", badge: "★" },
];
const ASPECTS = [
  { id: "3:4", label: "Portrait (3:4)" },
  { id: "4:5", label: "Manga (4:5)" },
  { id: "1:1", label: "Square" },
  { id: "9:16", label: "Story (9:16)" },
  { id: "16:9", label: "Cinematic" },
];
const STYLES = [
  { id: "manga", label: "Manga B&W" },
  { id: "anime", label: "Anime Color" },
  { id: "comic", label: "Comic Book" },
  { id: "realistic", label: "Realistic" },
  { id: "ghibli", label: "Studio Ghibli" },
  { id: "webtoon", label: "Webtoon" },
];

function Chips({ label, options, value, onChange }) {
  return (
    <div className="mfg-field">
      <label className="mfg-label">{label}</label>
      <div className="mfg-chips">
        {options.map((opt) => {
          const id = typeof opt === "string" ? opt : opt.id;
          return (
            <button key={id} onClick={() => onChange(id)} className={`mfg-chip ${value === id ? "mfg-chip--active" : ""}`} type="button">
              {typeof opt === "string" ? opt : opt.label}
              {opt.badge && <span className="mfg-chip__badge">{opt.badge}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function GenerationModal({ nodes, edges, onClose, onResult, pageContext = null }) {
  const [model, setModel] = useState("grok");
  const [quality, setQuality] = useState("high");
  const [aspect, setAspect] = useState("3:4");
  const [style, setStyle] = useState("manga");
  const [extraInstructions, setExtraInstructions] = useState("");
  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);

  const semanticEdges = useMemo(() => enrichEdgesSemantics(edges, nodes), [edges, nodes]);
  const genPlan = useMemo(
    () => planMangaGeneration(nodes, semanticEdges),
    [nodes, semanticEdges],
  );
  const panelCount = countPanelNodes(nodes);
  const isComicSheet = shouldUseComicSheetMode(nodes);
  const isMultiPanelPage = panelCount >= 2;
  const dualCharRefs = genPlan.refSlots.filter((s) => s.role === "character").length >= 2;

  // Force portrait 3:4 aspect when generating a comic sheet (standard manga page format).
  // Keeps the UI in sync with the server which already locks comic-sheet aspect.
  useEffect(() => {
    if (isComicSheet && aspect !== "3:4") {
      setAspect("3:4");
    }
  }, [isComicSheet, aspect]);
  const promptSettings = {
    model,
    quality,
    aspect,
    style,
    extraInstructions,
    refSlots: genPlan.refSlots,
    pageContext: pageContext || {},
  };
  const finalPrompt =
    isMultiPanelPage || dualCharRefs || isComicSheet
      ? buildFinalPagePrompt(nodes, semanticEdges, promptSettings)
      : buildFinalPrompt(nodes, semanticEdges, promptSettings);
  const modelDef = MODELS.find(m => m.id === model) || MODELS[0];
  const usesDualRef = dualCharRefs || genPlan.endpoint === "/generate/manga-interaction";
  const generateEndpoint = genPlan.error
    ? null
    : usesDualRef
      ? "/generate/manga-interaction"
      : isComicSheet || isMultiPanelPage
        ? "/generate/manga-page"
        : genPlan.endpoint || "/generate/manga-panel";

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("manga-mfg-modal-open");
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.classList.remove("manga-mfg-modal-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const copyPrompt = () => {
    navigator.clipboard.writeText(finalPrompt).then(() => toast.success("Prompt copied!")).catch(() => toast.error("Copy failed"));
  };

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    setResultUrl(null);
    setProgress(5);

    try {
      if (genPlan.error) {
        setError(genPlan.error);
        toast.error(genPlan.error);
        return;
      }

      const fd = new FormData();
      fd.append("prompt_final", finalPrompt);
      fd.append("aspect_ratio", aspect);
      if (isComicSheet) {
        fd.append("generation_mode", "comic_sheet");
        fd.append("panel_count", String(panelCount));
      }
      if (!usesDualRef) {
        fd.append("model_key", modelDef.apiModel || "standard");
      } else {
        toast.info(
          `Modo 2 personagens: ${genPlan.refSlots.map((s) => s.label).join(" + ")} (Qwen, identidade bloqueada)`,
          { duration: 5000 },
        );
      }

      const missingRefs = await appendMangaRefsToFormData(fd, genPlan.refSlots);
      if (dualCharRefs && missingRefs.length) {
        const msg = `Falta a foto de referência: ${missingRefs.join(", ")}. Volta a carregar em cada card Personagem.`;
        setError(msg);
        toast.error(msg);
        return;
      }
      if (missingRefs.length) {
        const msg = `Não foi possível ler a foto de: ${missingRefs.join(", ")}. Volta a carregar a imagem de referência.`;
        setError(msg);
        toast.error(msg);
        return;
      }

      if (genPlan.warning) toast.info(genPlan.warning);

      if (isComicSheet) {
        toast.info(
          `Comic Sheet: ${panelCount} painéis sequenciais numa única página (orquestração semântica)`,
          { duration: 6000 },
        );
      }

      const graphWarnings = validateGraphForGeneration(nodes, semanticEdges);
      graphWarnings.forEach((w) => toast.warning(w, { duration: 8000 }));

      setProgress(15);

      const endpoint = generateEndpoint || "/generate/manga-panel";
      const { data: submitData } = await uploadPost(endpoint, fd, {
        timeout: 120000,
        headers: { "X-Skip-Auto-Poll": "1" },
      });

      setProgress(30);

      if (!submitData?.prediction_id) {
        const directUrl = submitData?.creation?.result_urls?.[0];
        if (directUrl) {
          setResultUrl(directUrl);
          setProgress(100);
          toast.success(`Generated! ${submitData?.credits_spent || 0} credits`);
          if (onResult) onResult(directUrl);
          return;
        }
        throw new Error(submitData?.detail || "No prediction ID returned");
      }

      trackPendingPrediction(submitData.prediction_id, {
        credits_spent: submitData.credits_spent || 15,
        type: "manga",
      });

      setProgress(40);

      const polled = await pollPrediction(submitData.prediction_id, {
        credits_spent: submitData.credits_spent || 15,
        type: "manga",
        timeoutMs: 300000,
        onTick: (sec) => setProgress(Math.min(90, 40 + Math.round((sec / 120) * 50))),
      });

      const url = polled?.creation?.result_urls?.[0];
      if (!url) throw new Error("Generation finished but no image returned");

      setResultUrl(url);
      setProgress(100);
      toast.success(`Generated! ${polled?.creation?.credits_spent || submitData.credits_spent || 0} credits`);
      if (onResult) onResult(url);
      return;

    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "Generation failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  }, [
    finalPrompt,
    aspect,
    modelDef,
    genPlan,
    usesDualRef,
    dualCharRefs,
    generateEndpoint,
    onResult,
    nodes,
    semanticEdges,
    isComicSheet,
    panelCount,
  ]);

  const modal = (
    <div
      className="mfg-overlay"
      data-testid="generation-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mfg-modal-title"
      onClick={onClose}
    >
      <div className="mfg-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mfg-header">
          <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
            <div className="mfg-header__icon shrink-0"><Sparkles className="w-5 h-5" /></div>
            <div className="min-w-0">
              <h2 id="mfg-modal-title" className="mfg-header__title truncate">
                {isComicSheet ? "Generate Comic Sheet" : isMultiPanelPage ? "Generate Manga Page" : "Generate Manga Panel"}
              </h2>
              <p className="mfg-header__sub line-clamp-2">
                {nodes.length} cards · {edges.length} connections
                {isComicSheet && <> · {panelCount} panels · semantic orchestration</>}
                {genPlan.refSlots.length > 0 && (
                  <> · {genPlan.refSlots.length} ref{genPlan.refSlots.length > 1 ? "s" : ""}{usesDualRef ? " (2-image mode)" : ""}</>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mfg-close"
            aria-label="Close"
            data-testid="generation-modal-close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mfg-body">
          <div className="mfg-preview mfg-body__preview">
            <div className="mfg-preview__card">
              {resultUrl ? (
                <img src={resultUrl} alt="Generated manga" className="mfg-preview__img" crossOrigin="anonymous" />
              ) : generating ? (
                <div className="mfg-preview__loading">
                  <Loader2 className="w-10 h-10 animate-spin text-[#A855F7]" />
                  <p className="mfg-preview__loading-text">Generating with {modelDef.name}...</p>
                  <div className="mfg-progress-bar"><div className="mfg-progress-bar__fill" style={{ width: `${progress}%` }} /></div>
                  <p className="mfg-preview__loading-hint">{progress}% · May take 30-120s</p>
                </div>
              ) : (
                <div className="mfg-preview__empty">
                  <ImageIcon className="w-12 h-12 text-[#2E2E30]" />
                  <p className="mfg-preview__empty-text">
                    {isComicSheet ? "Your comic sheet appears here" : "Your manga page appears here"}
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="mfg-error"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span></div>
            )}

            {showPrompt && (
              <div className="mfg-prompt-preview">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-[#5A5A5E] uppercase tracking-wider font-mono">Orchestrated Prompt</span>
                  <button type="button" onClick={copyPrompt} className="manga-flow-btn" style={{ padding: "4px 10px", fontSize: 11 }}><Copy className="w-3 h-3" /> Copy</button>
                </div>
                <pre className="mfg-prompt-text">{finalPrompt}</pre>
              </div>
            )}
          </div>

          <div className="mfg-settings mfg-body__settings">
            {isComicSheet && (
              <div className="mfg-orchestration-banner" data-testid="comic-sheet-banner">
                <BookOpen className="w-4 h-4 shrink-0" />
                <div>
                  <p className="mfg-orchestration-banner__title">Comic Sheet mode</p>
                  <p className="mfg-orchestration-banner__text">
                    One unified page with {panelCount} isolated narrative panels. Character identity, camera and scene continuity enforced by the graph.
                  </p>
                </div>
              </div>
            )}
            <div className="mfg-section">
              <h3 className="mfg-section__title">Model & Quality</h3>
              <Chips label="AI Model" options={MODELS} value={model} onChange={setModel} />
              <Chips label="Quality" options={QUALITY} value={quality} onChange={setQuality} />
              <Chips label="Aspect Ratio" options={ASPECTS} value={aspect} onChange={setAspect} />
            </div>
            <div className="mfg-section">
              <h3 className="mfg-section__title">Style</h3>
              <Chips label="Art Style" options={STYLES} value={style} onChange={setStyle} />
              <div className="mfg-field">
                <label className="mfg-label">Extra Instructions</label>
                <textarea value={extraInstructions} onChange={(e) => setExtraInstructions(e.target.value)}
                  placeholder="e.g. 'style of Eiichiro Oda', 'cinematic composition'..."
                  className="mfg-textarea" rows={3} />
              </div>
            </div>
          </div>
        </div>

        <div className="mfg-footer">
          <div className="mfg-actions">
            <button type="button" onClick={() => setShowPrompt(!showPrompt)} className="manga-flow-btn" style={{ flex: 1 }}>
              {showPrompt ? "Hide Prompt" : "Preview Prompt"}
            </button>
            <button type="button" onClick={copyPrompt} className="manga-flow-btn" style={{ flex: 1 }}>
              <Copy className="w-4 h-4" /> Copy
            </button>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || !nodes.length}
            className={`mfg-generate-btn ${isComicSheet ? "mfg-generate-btn--comic-sheet" : ""}`}
            data-testid={isComicSheet ? "generate-comic-sheet-btn" : "generate-manga-btn"}
          >
            {generating ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>
            ) : isComicSheet ? (
              <><BookOpen className="w-5 h-5" /> Generate Comic Sheet</>
            ) : (
              <><Wand2 className="w-5 h-5" /> Generate with {modelDef.name}</>
            )}
          </button>

          {resultUrl && (
            <a href={resultUrl} download="manga-comic-sheet.png" target="_blank" rel="noreferrer" className="mfg-download-btn">
              <Download className="w-4 h-4" /> Download Comic Sheet
            </a>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return modal;
  return createPortal(modal, document.body);
}
