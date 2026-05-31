import { useState, useCallback, useMemo, useEffect } from "react";
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
import { useAuth } from "../../lib/auth";
import { usePricing } from "../../lib/PricingContext";
import { useI18n } from "../../lib/i18n";
import { useStudioI18n } from "../../lib/useStudioI18n";
import StudioResultAnchor from "../StudioResultAnchor";
import { toast } from "sonner";

const MODELS = [
  { id: "grok", labelKey: "manga_model_grok", apiModel: "grok" },
  { id: "flux", labelKey: "manga_flow_model_flux", apiModel: "flux2" },
  { id: "gpt_image", labelKey: "manga_model_gpt", apiModel: "gpt_image" },
];
const QUALITY = [
  { id: "medium", labelKey: "manga_flow_quality_medium" },
  { id: "high", labelKey: "manga_flow_quality_high" },
  { id: "ultra", labelKey: "manga_flow_quality_ultra", badge: "★" },
];
const ASPECTS = [
  { id: "3:4", labelKey: "manga_flow_aspect_34" },
  { id: "4:5", labelKey: "manga_flow_aspect_45" },
  { id: "1:1", labelKey: "manga_flow_aspect_11" },
  { id: "9:16", labelKey: "manga_flow_aspect_916" },
  { id: "16:9", labelKey: "manga_flow_aspect_169" },
];
const STYLES = [
  { id: "manga", labelKey: "manga_flow_style_manga" },
  { id: "anime", labelKey: "manga_flow_style_anime" },
  { id: "comic", labelKey: "manga_flow_style_comic" },
  { id: "realistic", labelKey: "manga_flow_style_realistic" },
  { id: "ghibli", labelKey: "manga_flow_style_ghibli" },
  { id: "webtoon", labelKey: "manga_flow_style_webtoon" },
];
const MOBILE_TABS = [
  { id: "create", labelKey: "studio_tab_create", icon: Sparkles },
  { id: "result", labelKey: "studio_tab_result", icon: ImageIcon },
];

function Chips({ label, options, value, onChange, t, disabledIds = [] }) {
  return (
    <div className="mfg-field">
      <label className="mfg-label">{label}</label>
      <div className="mfg-chips">
        {options.map((opt) => {
          const id = typeof opt === "string" ? opt : opt.id;
          const disabled = disabledIds.includes(id);
          return (
            <button
              key={id}
              onClick={() => !disabled && onChange(id)}
              disabled={disabled}
              className={`mfg-chip ${value === id ? "mfg-chip--active" : ""} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
              type="button"
            >
              {typeof opt === "string" ? opt : t(opt.labelKey)}
              {opt.badge && <span className="mfg-chip__badge">{opt.badge}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function estimateCost({ isComicSheet, isMultiPanelPage, usesDualInteraction, costs }) {
  if (isComicSheet || isMultiPanelPage) return costs?.mangaPage ?? 40;
  return costs?.mangaPanel ?? 15;
}

export default function GenerationModal({ nodes, edges, onClose, onResult, pageContext = null }) {
  const { t } = useI18n();
  const { errToast, clearUploadToast } = useStudioI18n();
  const { refresh, refundCredits } = useAuth();
  const { costs } = usePricing();
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
  const [mobileTab, setMobileTab] = useState("create");

  const semanticEdges = useMemo(() => enrichEdgesSemantics(edges, nodes), [edges, nodes]);
  const genPlan = useMemo(
    () => planMangaGeneration(nodes, semanticEdges),
    [nodes, semanticEdges],
  );
  const panelCount = countPanelNodes(nodes);
  const isComicSheet = shouldUseComicSheetMode(nodes);
  const isMultiPanelPage = panelCount >= 2;
  const dualCharRefs = genPlan.refSlots.filter((s) => s.role === "character").length >= 2;
  const usesDualInteraction = dualCharRefs && !isComicSheet && !isMultiPanelPage
    && genPlan.endpoint === "/generate/manga-interaction";
  const usesDualRef = usesDualInteraction || (dualCharRefs && !isComicSheet && !isMultiPanelPage);

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
  const modelDef = MODELS.find((m) => m.id === model) || MODELS[0];
  const generateEndpoint = genPlan.error
    ? null
    : isComicSheet || isMultiPanelPage
      ? "/generate/manga-page"
      : usesDualInteraction
        ? "/generate/manga-interaction"
        : genPlan.endpoint || "/generate/manga-panel";
  const estimatedCost = estimateCost({ isComicSheet, isMultiPanelPage, usesDualInteraction, costs });
  const panelVisibility = (tab) => (mobileTab !== tab ? "hidden md:block" : "");

  const copyPrompt = () => {
    navigator.clipboard.writeText(finalPrompt)
      .then(() => toast.success(t("manga_flow_prompt_copied")))
      .catch(() => toast.error(t("manga_flow_prompt_copy_fail")));
  };

  const handleGenerate = useCallback(async () => {
    clearUploadToast();
    setMobileTab("result");
    setGenerating(true);
    setError(null);
    setResultUrl(null);
    setProgress(0);
    window.requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent("rp:scroll-to-result"));
    });

    let submitData;
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
        fd.append("model_key", modelDef.apiModel || "grok");
      } else {
        toast.info(
          t("manga_flow_dual_ref_toast", {
            names: genPlan.refSlots.map((s) => s.label).join(" + "),
          }),
          { duration: 5000 },
        );
      }

      const missingRefs = await appendMangaRefsToFormData(fd, genPlan.refSlots);
      if (dualCharRefs && missingRefs.length) {
        const msg = t("manga_flow_err_missing_ref", { names: missingRefs.join(", ") });
        setError(msg);
        toast.error(msg);
        return;
      }
      if (missingRefs.length) {
        const msg = t("manga_flow_err_ref_read", { names: missingRefs.join(", ") });
        setError(msg);
        toast.error(msg);
        return;
      }

      if (genPlan.warning) toast.info(genPlan.warning);

      if (isComicSheet) {
        toast.info(t("manga_flow_comic_toast", { n: panelCount }), { duration: 6000 });
      }

      const graphWarnings = validateGraphForGeneration(nodes, semanticEdges);
      graphWarnings.forEach((w) => toast.warning(w, { duration: 8000 }));

      const endpoint = generateEndpoint || "/generate/manga-panel";
      ({ data: submitData } = await uploadPost(endpoint, fd, {
        timeout: 120000,
        headers: { "X-Skip-Auto-Poll": "1" },
      }));

      if (!submitData?.prediction_id) {
        const directUrl = submitData?.creation?.result_urls?.[0];
        if (directUrl) {
          setResultUrl(directUrl);
          toast.success(
            isComicSheet || isMultiPanelPage
              ? t("manga_success_page", { n: submitData?.credits_spent || estimatedCost })
              : t("manga_success_panel", { n: submitData?.credits_spent || estimatedCost }),
          );
          if (onResult) onResult(directUrl);
          await refresh();
          return;
        }
        throw new Error(submitData?.detail || t("manga_err_no_url"));
      }

      trackPendingPrediction(submitData.prediction_id, {
        credits_spent: submitData.credits_spent || estimatedCost,
        type: "manga",
      });

      const polled = await pollPrediction(submitData.prediction_id, {
        credits_spent: submitData.credits_spent || estimatedCost,
        type: "manga",
        timeoutMs: 300000,
        onTick: (sec) => setProgress(sec),
      });

      const url = polled?.creation?.result_urls?.[0];
      if (!url) throw new Error(t("manga_err_no_url"));

      setResultUrl(url);
      const spent = polled?.creation?.credits_spent || submitData.credits_spent || estimatedCost;
      toast.success(
        isComicSheet || isMultiPanelPage
          ? t("manga_success_page", { n: spent })
          : t("manga_success_panel", { n: spent }),
      );
      if (onResult) onResult(url);
      await refresh();
    } catch (err) {
      errToast(err);
      const msg = err?.response?.data?.detail || err?.message || t("manga_fail");
      setError(msg);
      if (err?.refunded && submitData?.credits_spent && !submitData?.server_billing) {
        refundCredits?.(submitData.credits_spent, t("studio_refund_desc"));
      }
      try { await refresh(); } catch { /* ignore */ }
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
    isMultiPanelPage,
    estimatedCost,
    clearUploadToast,
    errToast,
    refundCredits,
    refresh,
    t,
  ]);

  const headerTitle = isComicSheet
    ? t("manga_flow_gen_comic")
    : isMultiPanelPage
      ? t("manga_flow_gen_page")
      : t("manga_flow_gen_panel");

  return (
    <div className="mfg-overlay" data-testid="generation-modal">
      <div className="mfg-modal">
        <div className="mfg-header">
          <div className="flex items-center gap-3">
            <div className="mfg-header__icon"><Sparkles className="w-5 h-5" /></div>
            <div>
              <h2 className="mfg-header__title">{headerTitle}</h2>
              <p className="mfg-header__sub">
                {nodes.length} · {edges.length}
                {isComicSheet ? ` · ${panelCount} ${t("manga_tab_panel").toLowerCase()}` : ""}
                {genPlan.refSlots.length > 0 && (
                  <> · {genPlan.refSlots.length} ref{genPlan.refSlots.length > 1 ? "s" : ""}{usesDualRef ? t("manga_flow_dual_mode") : ""}</>
                )}
                {" · "}{estimatedCost} {t("label_credits")}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="mfg-close" type="button"><X className="w-5 h-5" /></button>
        </div>

        <div
          className="md:hidden flex gap-2 mx-4 mt-3 p-1 rounded-xl border border-white/[0.08] bg-white/[0.03]"
          role="tablist"
          data-testid="manga-gen-mobile-tabs"
        >
          {MOBILE_TABS.map(({ id, labelKey, icon: Icon }) => {
            const active = mobileTab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMobileTab(id)}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(167,139,250,0.35)]"
                    : "text-[#8A8A8E]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={active ? 2 : 1.75} />
                {t(labelKey)}
              </button>
            );
          })}
        </div>

        <div className="mfg-body">
          <div className={`mfg-settings ${panelVisibility("create")}`}>
            {isComicSheet && (
              <div className="mfg-orchestration-banner" data-testid="comic-sheet-banner">
                <BookOpen className="w-4 h-4 shrink-0" />
                <div>
                  <p className="mfg-orchestration-banner__title">{t("manga_flow_comic_banner_title")}</p>
                  <p className="mfg-orchestration-banner__text">
                    {t("manga_flow_comic_banner_text", { n: panelCount })}
                  </p>
                </div>
              </div>
            )}
            <div className="mfg-section">
              <h3 className="mfg-section__title">{t("manga_flow_section_model")}</h3>
              <Chips
                label={t("manga_model_engine")}
                options={MODELS}
                value={model}
                onChange={setModel}
                t={t}
                disabledIds={usesDualRef ? MODELS.map((m) => m.id) : []}
              />
              {usesDualRef && (
                <p className="text-[#8A8A8E] text-[11px] mt-2">{t("manga_flow_dual_model_note")}</p>
              )}
              <Chips label={t("manga_flow_quality_label")} options={QUALITY} value={quality} onChange={setQuality} t={t} />
              <Chips label={t("manga_flow_aspect_label")} options={ASPECTS} value={aspect} onChange={setAspect} t={t} />
            </div>
            <div className="mfg-section">
              <h3 className="mfg-section__title">{t("manga_flow_section_style")}</h3>
              <Chips label={t("manga_flow_style_label")} options={STYLES} value={style} onChange={setStyle} t={t} />
              <div className="mfg-field">
                <label className="mfg-label">{t("manga_flow_extra_label")}</label>
                <textarea
                  value={extraInstructions}
                  onChange={(e) => setExtraInstructions(e.target.value)}
                  placeholder={t("manga_flow_extra_ph")}
                  className="mfg-textarea"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className={`mfg-preview ${panelVisibility("result")}`}>
            <StudioResultAnchor busy={generating} ready={Boolean(resultUrl)} className="space-y-3">
              <div className="mfg-preview__card">
                {resultUrl ? (
                  <img src={resultUrl} alt="" className="mfg-preview__img" crossOrigin="anonymous" />
                ) : generating ? (
                  <div className="mfg-preview__loading">
                    <Loader2 className="w-10 h-10 animate-spin text-[#A855F7]" />
                    <p className="mfg-preview__loading-text">
                      {t("manga_status_generating_sec", { n: progress || 0 })}
                    </p>
                    <div className="mfg-progress-bar">
                      <div
                        className="mfg-progress-bar__fill"
                        style={{ width: `${Math.min(95, Math.max(8, progress * 2))}%` }}
                      />
                    </div>
                    <p className="mfg-preview__loading-hint">{t("manga_status_generating")}</p>
                  </div>
                ) : (
                  <div className="mfg-preview__empty">
                    <ImageIcon className="w-12 h-12 text-[#2E2E30]" />
                    <p className="mfg-preview__empty-text">
                      {isComicSheet ? t("manga_flow_preview_empty_comic") : t("manga_flow_preview_empty_page")}
                    </p>
                  </div>
                )}
              </div>
            </StudioResultAnchor>

            {error && (
              <div className="mfg-error"><AlertCircle className="w-4 h-4" /><span>{error}</span></div>
            )}

            {showPrompt && (
              <div className="mfg-prompt-preview">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-[#5A5A5E] uppercase tracking-wider font-mono">
                    {t("manga_prompt_preview")}
                  </span>
                  <button onClick={copyPrompt} className="manga-flow-btn" style={{ padding: "4px 10px", fontSize: 11 }} type="button">
                    <Copy className="w-3 h-3" /> {t("manga_flow_copy")}
                  </button>
                </div>
                <pre className="mfg-prompt-text">{finalPrompt}</pre>
              </div>
            )}

            <div className="mfg-actions">
              <button onClick={() => setShowPrompt(!showPrompt)} className="manga-flow-btn" style={{ flex: 1 }} type="button">
                {showPrompt ? t("manga_flow_hide_prompt") : t("manga_flow_preview_prompt")}
              </button>
              <button onClick={copyPrompt} className="manga-flow-btn" style={{ flex: 1 }} type="button">
                <Copy className="w-4 h-4" /> {t("manga_flow_copy")}
              </button>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating || !nodes.length}
              className={`mfg-generate-btn ${isComicSheet ? "mfg-generate-btn--comic-sheet" : ""}`}
              data-testid={isComicSheet ? "generate-comic-sheet-btn" : "generate-manga-btn"}
              type="button"
            >
              {generating ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> {t("manga_generating")}</>
              ) : isComicSheet ? (
                <><BookOpen className="w-5 h-5" /> {t("manga_flow_comic_sheet_btn", { n: estimatedCost })}</>
              ) : (
                <><Wand2 className="w-5 h-5" /> {t("manga_flow_generate_btn", { model: t(modelDef.labelKey), n: estimatedCost })}</>
              )}
            </button>

            {resultUrl && (
              <a href={resultUrl} download="manga-comic-sheet.png" target="_blank" rel="noreferrer" className="mfg-download-btn">
                <Download className="w-4 h-4" /> {t("manga_flow_download")}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
