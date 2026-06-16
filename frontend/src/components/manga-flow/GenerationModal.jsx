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
import { getCreditCostsForRegion, getStoredPricingRegion } from "../../lib/pricingRegions";
import { toast } from "sonner";

const MODELS = [
  { id: "grok", name: "Fast", desc: "Quick", apiModel: "standard" },
  { id: "flux", name: "Flux Pro ★", desc: "Best", badge: null, apiModel: "pro" },
  { id: "gpt_image", name: "High Quality", desc: "Flux Klein", apiModel: "pro" },
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

function mangaModelCost(modelId, { dualRef = false } = {}) {
  const costs = getCreditCostsForRegion(getStoredPricingRegion() || "intl");
  if (dualRef) return costs.edit ?? costs.mangaPanel ?? 15;
  return modelId === "grok" ? (costs.image ?? 15) : (costs.pro ?? 30);
}

function buildGenerationJob(page, pageContext, settings) {
  const pageNodes = page?.nodes || [];
  const pageEdges = page?.edges || [];
  const semanticEdges = enrichEdgesSemantics(pageEdges, pageNodes);
  const genPlan = planMangaGeneration(pageNodes, semanticEdges);
  const panelCount = countPanelNodes(pageNodes);
  const isComicSheet = shouldUseComicSheetMode(pageNodes);
  const isMultiPanelPage = panelCount >= 2;
  const dualCharRefs = genPlan.refSlots.filter((s) => s.role === "character").length >= 2;
  const usesDualRef = dualCharRefs || genPlan.endpoint === "/generate/manga-interaction";
  const promptSettings = {
    ...settings,
    refSlots: genPlan.refSlots,
    pageContext: pageContext || {},
  };
  const finalPrompt =
    isMultiPanelPage || dualCharRefs || isComicSheet
      ? buildFinalPagePrompt(pageNodes, semanticEdges, promptSettings)
      : buildFinalPrompt(pageNodes, semanticEdges, promptSettings);
  const generateEndpoint = genPlan.error
    ? null
    : usesDualRef
      ? "/generate/manga-interaction"
      : isComicSheet || isMultiPanelPage
        ? "/generate/manga-page"
        : genPlan.endpoint || "/generate/manga-panel";

  return {
    page,
    pageNodes,
    pageEdges,
    pageContext,
    semanticEdges,
    genPlan,
    panelCount,
    isComicSheet,
    isMultiPanelPage,
    dualCharRefs,
    usesDualRef,
    finalPrompt,
    generateEndpoint,
    cost: mangaModelCost(settings.model, { dualRef: usesDualRef }),
  };
}

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

export default function GenerationModal({
  nodes,
  edges,
  pages = [],
  pageContexts = [],
  activePageIndex = 0,
  onClose,
  onResult,
  onPageResults,
  pageContext = null,
}) {
  const [model, setModel] = useState("grok");
  const [quality, setQuality] = useState("high");
  const [aspect, setAspect] = useState("3:4");
  const [style, setStyle] = useState("manga");
  const [extraInstructions, setExtraInstructions] = useState("");
  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [pageResults, setPageResults] = useState([]);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [generationScope, setGenerationScope] = useState("current");
  const [showPrompt, setShowPrompt] = useState(false);

  const pagesForGeneration = useMemo(() => {
    if (pages?.length) return pages;
    return [{ id: "current", name: pageContext?.pageName || "Current page", nodes, edges }];
  }, [pages, nodes, edges, pageContext?.pageName]);
  const safeActivePageIndex = Math.min(Math.max(0, Number(activePageIndex) || 0), pagesForGeneration.length - 1);
  const activePage = pagesForGeneration[safeActivePageIndex] || pagesForGeneration[0];
  const activePageContext = useMemo(
    () => pageContexts[safeActivePageIndex] || pageContext || {},
    [pageContexts, safeActivePageIndex, pageContext],
  );
  const commonSettings = useMemo(() => ({
    model,
    quality,
    aspect,
    style,
    extraInstructions,
  }), [model, quality, aspect, style, extraInstructions]);
  const activeJob = useMemo(
    () => buildGenerationJob(activePage, activePageContext, commonSettings),
    [activePage, activePageContext, commonSettings],
  );
  const allJobs = useMemo(
    () => pagesForGeneration.map((page, index) => buildGenerationJob(page, pageContexts[index] || {}, commonSettings)),
    [pagesForGeneration, pageContexts, commonSettings],
  );
  const genPlan = activeJob.genPlan;
  const panelCount = activeJob.panelCount;
  const isComicSheet = activeJob.isComicSheet;
  const isMultiPanelPage = activeJob.isMultiPanelPage;
  const dualCharRefs = activeJob.dualCharRefs;

  // Force portrait 3:4 aspect when generating a comic sheet (standard manga page format).
  // Keeps the UI in sync with the server which already locks comic-sheet aspect.
  useEffect(() => {
    if (isComicSheet && aspect !== "3:4") {
      setAspect("3:4");
    }
  }, [isComicSheet, aspect]);
  const finalPrompt = activeJob.finalPrompt;
  const modelDef = MODELS.find(m => m.id === model) || MODELS[0];
  const usesDualRef = activeJob.usesDualRef;
  const currentPageCost = activeJob.cost;
  const totalPages = Math.max(1, pagesForGeneration.length);
  const allPagesEstimate = allJobs.reduce((sum, job) => sum + job.cost, 0);
  const canGenerateAllPages = totalPages > 1;

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
    setPageResults([]);
    setProgress(5);

    try {
      const jobs = generationScope === "all" ? allJobs : [activeJob];
      if (generationScope === "all") {
        toast.info(`A gerar ${jobs.length} páginas: 1 imagem por página, com os blocos dentro de cada imagem.`, { duration: 7000 });
      }

      const completed = [];
      for (let index = 0; index < jobs.length; index += 1) {
        const job = jobs[index];
        const pageLabel = job.page?.name || `Page ${index + 1}`;
        if (job.genPlan.error) throw new Error(`${pageLabel}: ${job.genPlan.error}`);

        const baseProgress = Math.round((index / jobs.length) * 100);
        setProgress(Math.max(5, baseProgress));

        const fd = new FormData();
        fd.append("prompt_final", job.finalPrompt);
        fd.append("aspect_ratio", aspect);
        if (job.isComicSheet) {
          fd.append("generation_mode", "comic_sheet");
          fd.append("panel_count", String(job.panelCount));
        }
        fd.append("image_count", "1");
        if (!job.usesDualRef) {
          fd.append("model_key", model);
        } else {
          toast.info(
            `${pageLabel}: modo 2 personagens (${job.genPlan.refSlots.map((s) => s.label).join(" + ")})`,
            { duration: 5000 },
          );
        }

        const missingRefs = await appendMangaRefsToFormData(fd, job.genPlan.refSlots);
        if (job.dualCharRefs && missingRefs.length) {
          throw new Error(`${pageLabel}: falta a foto de referência: ${missingRefs.join(", ")}.`);
        }
        if (missingRefs.length) {
          throw new Error(`${pageLabel}: não foi possível ler a foto de ${missingRefs.join(", ")}.`);
        }

        if (job.genPlan.warning) toast.info(`${pageLabel}: ${job.genPlan.warning}`);
        if (job.isComicSheet) {
          toast.info(`${pageLabel}: ${job.panelCount} blocos/painéis numa única imagem.`, { duration: 4000 });
        }
        validateGraphForGeneration(job.pageNodes, job.semanticEdges).forEach((w) => toast.warning(`${pageLabel}: ${w}`, { duration: 8000 }));

        const endpoint = job.generateEndpoint || "/generate/manga-panel";
        const { data: submitData } = await uploadPost(endpoint, fd, {
          timeout: 120000,
          headers: { "X-Skip-Auto-Poll": "1" },
        });

        let url = submitData?.creation?.result_urls?.[0];
        if (!url) {
          if (!submitData?.prediction_id) {
            throw new Error(submitData?.detail || `${pageLabel}: no prediction ID returned`);
          }
          trackPendingPrediction(submitData.prediction_id, {
            credits_spent: submitData.credits_spent || job.cost,
            type: "manga",
          });
          const polled = await pollPrediction(submitData.prediction_id, {
            credits_spent: submitData.credits_spent || job.cost,
            type: "manga",
            timeoutMs: 300000,
            onTick: (sec) => {
              const withinJob = Math.min(0.9, sec / 120);
              setProgress(Math.min(98, Math.round(((index + withinJob) / jobs.length) * 100)));
            },
          });
          url = polled?.creation?.result_urls?.[0];
        }
        if (!url) throw new Error(`${pageLabel}: generation finished but no image returned`);

        const item = {
          pageId: job.page?.id || `page-${index}`,
          pageName: pageLabel,
          pageNumber: job.pageContext?.activePageNumber || index + 1,
          url,
        };
        completed.push(item);
        setPageResults([...completed]);
        setResultUrl(url);
        if (onResult && jobs.length === 1) onResult(url);
      }

      setProgress(100);
      toast.success(
        generationScope === "all"
          ? `Geradas ${completed.length} páginas/imagens.`
          : "Página gerada!",
      );
      if (onPageResults) onPageResults(completed);

    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "Generation failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  }, [
    aspect,
    model,
    generationScope,
    activeJob,
    allJobs,
    onResult,
    onPageResults,
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
                {generationScope === "all"
                  ? `Generate ${totalPages} Manga Pages`
                  : isComicSheet ? "Generate Comic Sheet" : isMultiPanelPage ? "Generate Manga Page" : "Generate Manga Panel"}
              </h2>
              <p className="mfg-header__sub line-clamp-2">
                {generationScope === "all" ? `${totalPages} páginas/imagens` : `${nodes.length} cards · ${edges.length} connections`}
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

            {pageResults.length > 0 && (
              <div className="mfg-page-results" data-testid="manga-page-results">
                <p className="mfg-page-results__title">Páginas geradas</p>
                {pageResults.map((item) => (
                  <a
                    key={item.pageId}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mfg-page-result"
                  >
                    <img src={item.url} alt={item.pageName} crossOrigin="anonymous" />
                    <span>Página {item.pageNumber}: {item.pageName}</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="mfg-settings mfg-body__settings">
            {canGenerateAllPages && (
              <div className="mfg-section">
                <h3 className="mfg-section__title">Generation Scope</h3>
                <div className="mfg-scope-toggle" data-testid="manga-generation-scope">
                  <button
                    type="button"
                    className={`mfg-scope-btn ${generationScope === "current" ? "mfg-scope-btn--active" : ""}`}
                    onClick={() => setGenerationScope("current")}
                  >
                    Página atual
                    <span>1 imagem · {currentPageCost} créditos</span>
                  </button>
                  <button
                    type="button"
                    className={`mfg-scope-btn ${generationScope === "all" ? "mfg-scope-btn--active" : ""}`}
                    onClick={() => setGenerationScope("all")}
                  >
                    Todas as páginas
                    <span>{totalPages} imagens · {allPagesEstimate} créditos</span>
                  </button>
                </div>
              </div>
            )}
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
              <div className="mfg-cost-note" data-testid="manga-generation-cost">
                <strong>{generationScope === "all" ? allPagesEstimate : currentPageCost} créditos</strong>
                {generationScope === "all" ? ` para ${totalPages} páginas/imagens` : " por esta página/imagem"}
                <span>
                  Página = 1 imagem final. Blocos/painéis ficam dentro da página.
                  {canGenerateAllPages && generationScope !== "all" ? ` Todas as ${totalPages} páginas: ${allPagesEstimate} créditos.` : ""}
                </span>
              </div>
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
              <><Loader2 className="w-5 h-5 animate-spin" /> {generationScope === "all" ? `Generating pages...` : "Generating..."}</>
            ) : generationScope === "all" ? (
              <><BookOpen className="w-5 h-5" /> Generate {totalPages} Pages ({totalPages} images)</>
            ) : isComicSheet ? (
              <><BookOpen className="w-5 h-5" /> Generate Comic Sheet</>
            ) : (
              <><Wand2 className="w-5 h-5" /> Generate with {modelDef.name}</>
            )}
          </button>

          {resultUrl && (
            <a href={resultUrl} download="manga-page.png" target="_blank" rel="noreferrer" className="mfg-download-btn">
              <Download className="w-4 h-4" /> Download latest page
            </a>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return modal;
  return createPortal(modal, document.body);
}
