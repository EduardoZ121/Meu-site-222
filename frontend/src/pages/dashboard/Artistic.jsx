import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ImageIcon,
  Palette,
  Type,
  Wand2,
  Layers,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { api, pollPrediction, trackPendingPrediction, uploadPost } from "../../lib/api";
import { normalizeCreation, primaryResultUrl } from "../../lib/creationUrls";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { usePricing } from "../../lib/PricingContext";
import { computeArtisticEffectSurcharge } from "../../lib/creditPricing";
import { apiAspectRatio } from "../../lib/apiAspectRatio";
import { localizeArtisticCatalog, countStylesInCategory } from "../../lib/artisticStudioLocales";
import { canAccessNsfwArtisticStyles } from "../../lib/artisticStudioData";
import { isArtisticExperimentalStyle } from "../../lib/artisticLabStyles";
import {
  buildArtisticStudioPrompt,
  buildRecipeChips,
  EMPTY_EFFECTS,
  getStyleById,
} from "../../lib/buildArtisticStudioPrompt";
import useTitle from "../../lib/useTitle";
import { useStudioI18n } from "../../lib/useStudioI18n";
import { useStudioGenerateGate } from "../../lib/useStudioGenerateGate";
import { usePhotoAspectDefault } from "../../lib/usePhotoAspectDefault";
import ImageUploadZone from "../../components/ImageUploadZone";
import AspectPicker from "../../components/AspectPicker";
import ResultPanel from "../../components/ResultPanel";
import StudioResultAnchor from "../../components/StudioResultAnchor";
import StudioGenerateBar from "../../components/StudioGenerateBar";
import StudioGenerateCostMeta from "../../components/StudioGenerateCostMeta";
import StudioPhotoUploadNotice, { isPhotoUploadBusy } from "../../components/studio/StudioPhotoUploadNotice";
import ArtisticStep from "../../components/artistic-studio/ArtisticStep";
import ArtisticCategoryPills from "../../components/artistic-studio/ArtisticCategoryPills";
import ArtisticStyleGrid from "../../components/artistic-studio/ArtisticStyleGrid";
import ArtisticEffectsPanel from "../../components/artistic-studio/ArtisticEffectsPanel";
import ArtisticFlowSteps from "../../components/artistic-studio/ArtisticFlowSteps";
import ArtisticMobileTabs from "../../components/artistic-studio/ArtisticMobileTabs";

const TABS = ["style", "effects", "prompt"];

function panelVisibility(activeTab, currentTab) {
  return currentTab !== activeTab ? "hidden xl:block" : "";
}

export default function Artistic() {
  const { lang, t } = useI18n();
  const { errToast, clearUploadToast } = useStudioI18n();
  const navigate = useNavigate();
  const { refresh, user } = useAuth();
  const { costs, region } = usePricing();

  const [tab, setTab] = useState("style");
  const [mode, setMode] = useState("image");
  const [styleCat, setStyleCat] = useState("photography");
  const [styleId, setStyleId] = useState(null);
  const [effects, setEffects] = useState(EMPTY_EFFECTS);
  const [prompt, setPrompt] = useState("");
  const [photo, setPhoto] = useState(null);
  const [aspect, setAspect] = usePhotoAspectDefault(photo, "3:4", "match");
  const [busy, setBusy] = useState(false);
  const [improving, setImproving] = useState(false);
  const [result, setResult] = useState(null);
  const [photoUploadStatus, setPhotoUploadStatus] = useState("idle");

  useTitle(t("art_page_title"));
  const photoUploading = isPhotoUploadBusy(photoUploadStatus);
  const includeNsfw = useMemo(() => canAccessNsfwArtisticStyles(user), [user]);

  const catalog = useMemo(
    () => localizeArtisticCatalog(lang, { includeNsfw }),
    [lang, includeNsfw],
  );

  const selectedStyle = useMemo(
    () => catalog.styles.find((s) => s.id === styleId) || null,
    [catalog.styles, styleId],
  );

  const stylesInCat = useMemo(
    () => catalog.styles.filter((s) => s.cat === styleCat),
    [catalog.styles, styleCat],
  );

  const categoryCounts = useMemo(() => {
    const map = {};
    catalog.categories.forEach((c) => {
      map[c.id] = countStylesInCategory(catalog.styles, c.id);
    });
    return map;
  }, [catalog.categories, catalog.styles]);

  const activeCategory = useMemo(
    () => catalog.categories.find((c) => c.id === styleCat) || null,
    [catalog.categories, styleCat],
  );

  const recipeChips = useMemo(
    () => buildRecipeChips({ styleId, effects }),
    [styleId, effects],
  );

  const cost = useMemo(
    () => (costs.artistic ?? 25) + computeArtisticEffectSurcharge(effects, region),
    [costs.artistic, effects, region],
  );

  const isLabStyle = useMemo(() => isArtisticExperimentalStyle(styleId), [styleId]);
  const isPhotoCategory = styleCat === "photography";
  const isPhotoStyle = selectedStyle?.cat === "photography";

  useEffect(() => {
    if (!includeNsfw && styleCat === "nsfw") setStyleCat("photography");
  }, [includeNsfw, styleCat]);

  useEffect(() => {
    const catIds = catalog.categories.map((c) => c.id);
    if (!catIds.includes(styleCat) && catIds.length) setStyleCat(catIds[0]);
  }, [catalog.categories, styleCat]);

  useEffect(() => {
    if (isPhotoCategory && mode !== "image") setMode("image");
  }, [isPhotoCategory, mode]);

  useEffect(() => {
    if (mode === "text" && aspect === "match") setAspect("3:4");
  }, [mode, aspect, setAspect]);

  const effectsSummary = useMemo(() => {
    if (!recipeChips.length) return "—";
    return recipeChips.filter((c) => c.emoji !== "🎨").map((c) => c.label).join(", ") || "—";
  }, [recipeChips]);

  const tabLabels = useMemo(
    () => ({
      style: t("art_tab_style"),
      effects: t("art_tab_effects"),
      prompt: t("art_tab_prompt"),
    }),
    [t],
  );

  const generateLabel = mode === "image" ? t("art_edit_credits", { n: cost }) : t("art_generate_credits", { n: cost });

  const readyOverride = useMemo(() => {
    if (photoUploading || busy) return false;
    const hasPrompt = prompt.trim().length >= 3;
    if (!styleId && !hasPrompt) return false;
    if (mode === "image" && !photo) return false;
    if (isLabStyle && !photo) return false;
    if ((isPhotoStyle || isPhotoCategory) && !photo) return false;
    return true;
  }, [
    photoUploading,
    busy,
    prompt,
    styleId,
    mode,
    photo,
    isLabStyle,
    isPhotoStyle,
    isPhotoCategory,
  ]);

  const hintOverride = useMemo(() => {
    if (photoUploading) return t("upload_wait_generate");
    if (mode === "image" && !photo) return t("art_err_image_mode");
    if (isLabStyle && !photo) return t("art_lab_need_photo");
    if ((isPhotoStyle || isPhotoCategory) && !photo) return t("art_photo_need_photo");
    if (!styleId && prompt.trim().length < 3) return t("art_empty");
    return null;
  }, [
    photoUploading,
    mode,
    photo,
    isLabStyle,
    isPhotoStyle,
    isPhotoCategory,
    styleId,
    prompt,
    t,
  ]);

  const { ready, hint } = useStudioGenerateGate({
    busy,
    user,
    cost,
    readyOverride,
    hintOverride,
    uploading: photoUploading,
  });

  const selectStyle = useCallback(
    (id) => {
      setStyleId(id);
      setTab("prompt");
      const picked = catalog.styles.find((s) => s.id === id);
      if (picked?.cat) setStyleCat(picked.cat);
      if (picked?.cat === "nsfw" && mode !== "image") {
        setMode("image");
        toast.message(t("art_lab_image_hint"));
      }
      if (picked?.cat === "photography" && mode !== "image") {
        setMode("image");
        toast.message(t("art_photo_image_hint"));
      }
    },
    [catalog.styles, mode, t],
  );

  const setRadioEffect = (sectionId, optionId) => {
    setEffects((prev) => ({ ...prev, [sectionId]: optionId }));
  };

  const toggleCheckboxEffect = (sectionId, optionId) => {
    setEffects((prev) => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], [optionId]: !prev[sectionId]?.[optionId] },
    }));
  };

  const clearRecipe = () => {
    setStyleId(null);
    setEffects(EMPTY_EFFECTS);
    setPrompt("");
    toast.message(t("art_recipe_cleared"));
  };

  const improvePromptOnly = useCallback(async () => {
    const userPrompt = prompt.trim();
    if (userPrompt.length < 3) {
      toast.error(t("studio_err_text"));
      return;
    }
    setImproving(true);
    try {
      const pickedStyle = getStyleById(styleId);
      const { data: imp } = await api.post("/prompt/improve", {
        prompt: userPrompt,
        lang: lang || "en",
        tool: "artistic",
        style_id: styleId || "",
        style_label: pickedStyle?.label || "",
        style_suffix: pickedStyle?.suffix || "",
        image_mode: mode === "image",
      });
      if (imp?.prompt && imp.prompt.trim().length >= 3) {
        setPrompt(imp.prompt.trim().slice(0, 800));
        toast.success(imp.enhanced ? t("art_prompt_refined") : t("art_refine_unchanged"));
      }
    } catch (impErr) {
      toast.error(impErr?.response?.data?.detail || t("art_refine_unavailable"));
    } finally {
      setImproving(false);
    }
  }, [prompt, styleId, mode, lang, t]);

  const generate = useCallback(async () => {
    if (photoUploading) {
      toast.message(t("upload_wait_generate"), { duration: 6000 });
      return;
    }
    if (!ready) {
      if (hint) toast.error(hint);
      return;
    }
    clearUploadToast();
    setTab("prompt");
    setBusy(true);
    setResult(null);
    const effectiveStyleCat = selectedStyle?.cat || styleCat;
    let submitData;
    try {
      const finalPrompt = buildArtisticStudioPrompt({
        userPrompt: prompt.trim(),
        styleId,
        styleCat: effectiveStyleCat,
        effects,
        imageMode: mode === "image",
      });

      const pollOpts = {
        credits_spent: cost,
        type: "artistic",
        timeoutMs: 240_000,
      };
      const skipPollHeaders = { "X-Skip-Auto-Poll": "1" };

      if (mode === "image" && photo) {
        const fd = new FormData();
        fd.append("photo", photo);
        fd.append("prompt_final", finalPrompt);
        fd.append("aspect_ratio", apiAspectRatio(aspect, { model: "artistic", hasPhoto: true }));
        fd.append("style_id", styleId || "");
        fd.append("style_cat", effectiveStyleCat || "");
        fd.append("effects_json", JSON.stringify(effects));
        fd.append("lang", lang || "en");
        ({ data: submitData } = await uploadPost("/generate/artistic-studio", fd, {
          timeout: 120_000,
          headers: skipPollHeaders,
        }));
      } else {
        ({ data: submitData } = await api.post("/generate/artistic-studio", {
          prompt_final: finalPrompt,
          aspect_ratio: apiAspectRatio(aspect, { model: "artistic", hasPhoto: false }),
          style_id: styleId || "",
          style_cat: effectiveStyleCat || "",
          effects_json: JSON.stringify(effects),
          lang: lang || "en",
        }, { timeout: 60_000, headers: skipPollHeaders }));
      }

      if (!submitData?.prediction_id) throw new Error(t("common_no_result"));

      trackPendingPrediction(submitData.prediction_id, {
        credits_spent: submitData.credits_spent || cost,
        type: "artistic",
      });
      const data = await pollPrediction(submitData.prediction_id, {
        ...pollOpts,
        credits_spent: submitData.credits_spent || cost,
      });
      const creation = normalizeCreation(data?.creation);
      if (!primaryResultUrl(creation)) throw new Error(t("common_no_result"));
      setResult(creation);
      toast.success(t("common_generated", { n: creation.credits_spent ?? cost }));
      await refresh();
    } catch (err) {
      errToast(err);
    } finally {
      setBusy(false);
    }
  }, [
    photoUploading,
    ready,
    hint,
    clearUploadToast,
    prompt,
    styleId,
    styleCat,
    selectedStyle,
    effects,
    mode,
    photo,
    aspect,
    cost,
    lang,
    refresh,
    t,
    errToast,
  ]);

  const hasResult = Boolean(primaryResultUrl(result));
  const showResultPanel = tab === "prompt" || busy || hasResult;

  return (
    <div className="as-v2-page rp-studio-shell pb-28" data-testid="artistic-page">
      <button
        type="button"
        onClick={() => navigate("/app/tools")}
        className="rp-studio-back"
        data-testid="artistic-back"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        {t("art_back")}
      </button>

      <header className="as-v2-hero mb-6 pb-6 border-b border-[rgba(244,241,234,0.06)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="as-v2-mark">
                <Palette className="w-4 h-4 text-[#C4B5FD]" strokeWidth={1.5} />
              </div>
              <p className="rp-editor-section-cap !text-[#a89bc9] !mb-0">{t("art_brand")}</p>
            </div>
            <h1 className="rp-studio-page-title mb-2 text-[2rem] sm:text-[2.75rem] font-['Inter_Tight']">
              {t("art_hero_title")}
            </h1>
            <p className="rp-studio-page-desc text-[14px] max-w-[640px]">{t("art_hero_subtitle")}</p>
          </div>
          <div className="as-v2-recipe-badge shrink-0">
            <Layers className="w-3.5 h-3.5 text-purple-300/80" strokeWidth={1.75} />
            <span>{t("art_recipe")}</span>
            <em>{selectedStyle?.label || "—"}</em>
          </div>
        </div>
      </header>

      <ArtisticFlowSteps activeStep={tab} styleSelected={Boolean(styleId)} />

      <ArtisticMobileTabs value={tab} onChange={setTab} />

      <div className="as-v2-tabs mb-6 hidden xl:flex" role="tablist" aria-label={t("art_page_title")} data-testid="artistic-tabs">
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`as-v2-tab ${tab === id ? "as-v2-tab--active" : ""}`}
            data-testid={`artistic-tab-${id}`}
          >
            {tabLabels[id]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 xl:gap-8">
        <div className="rp-editor-panel overflow-hidden">
          <div className="rp-editor-panel-accent" />
          <div className="p-5 sm:p-7 space-y-7">
            <ArtisticStep step="1" title={mode === "image" ? t("art_input_image") : t("art_input_text")} hint={t("art_upload_hint")}>
              <div className="flex flex-wrap gap-2 mb-4" data-testid="artistic-mode-toggle">
                <button
                  type="button"
                  className={`as-v2-mode ${mode === "text" ? "as-v2-mode--active" : ""}`}
                  onClick={() => setMode("text")}
                  aria-pressed={mode === "text"}
                  disabled={isPhotoCategory}
                >
                  <Type className="w-3.5 h-3.5" strokeWidth={1.75} />
                  {t("art_mode_text")}
                </button>
                <button
                  type="button"
                  className={`as-v2-mode ${mode === "image" ? "as-v2-mode--active" : ""}`}
                  onClick={() => setMode("image")}
                  aria-pressed={mode === "image"}
                >
                  <ImageIcon className="w-3.5 h-3.5" strokeWidth={1.75} />
                  {t("art_mode_image")}
                </button>
              </div>

              {mode === "image" ? (
                <div className="max-w-[560px]">
                  <ImageUploadZone
                    value={photo}
                    onChange={setPhoto}
                    onStatusChange={setPhotoUploadStatus}
                    layout="wide"
                    testId="artistic-photo"
                    compressOptions={{ maxSize: 2048 }}
                    emptyLabel={t("art_upload_label")}
                    emptyHint={t("art_upload_hint")}
                  />
                </div>
              ) : null}
            </ArtisticStep>

            <div className={panelVisibility("style", tab)}>
              <ArtisticStep step="2" title={t("art_sec_style")} hint={t("art_style_label")}>
                <ArtisticCategoryPills
                  categories={catalog.categories}
                  activeId={styleCat}
                  onSelect={setStyleCat}
                  counts={categoryCounts}
                />
                <div className="mt-4 max-h-[min(62vh,640px)] overflow-y-auto overscroll-contain pr-1">
                  <ArtisticStyleGrid
                    styles={stylesInCat}
                    selectedId={styleId}
                    onSelect={selectStyle}
                    categoryLabel={activeCategory?.label || ""}
                  />
                </div>
              </ArtisticStep>
            </div>

            <div className={panelVisibility("effects", tab)}>
              <ArtisticStep step="2" title={t("art_sec_effects")}>
                <div className="max-h-[min(62vh,640px)] overflow-y-auto overscroll-contain pr-1">
                  <ArtisticEffectsPanel
                    sections={catalog.sections}
                    effects={effects}
                    onRadioChange={setRadioEffect}
                    onToggleChange={toggleCheckboxEffect}
                  />
                </div>
              </ArtisticStep>
            </div>

            <div className={panelVisibility("prompt", tab)}>
              <ArtisticStep step="2" title={t("art_prompt_label")} hint={t("studio_styles_optional")}>
                <textarea
                  className="rp-editor-textarea min-h-[120px]"
                  placeholder={mode === "image" ? t("art_prompt_ph_image") : t("art_prompt_ph_text")}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  maxLength={800}
                  data-testid="artistic-prompt"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    type="button"
                    className="rp-btn-surface"
                    onClick={improvePromptOnly}
                    disabled={improving || prompt.trim().length < 3}
                  >
                    <Wand2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                    {improving ? t("art_generating") : t("art_refine_btn")}
                  </button>
                  <button type="button" className="rp-btn-surface" onClick={clearRecipe}>
                    {t("art_prompt_clear")}
                  </button>
                </div>
              </ArtisticStep>

              <ArtisticStep step="3" title={t("art_format_label")}>
                <div className="max-w-[560px]">
                  <AspectPicker
                    value={aspect}
                    onChange={setAspect}
                    hasPhoto={mode === "image" && !!photo}
                    testIdPrefix="artistic-aspect"
                    premium
                  />
                </div>
              </ArtisticStep>
            </div>

            {(tab === "style" || tab === "effects") && (
              <div className="hidden xl:block">
                <ArtisticStep step="3" title={t("art_prompt_label_image")} hint={t("studio_styles_optional")}>
                  <textarea
                    className="rp-editor-textarea min-h-[88px]"
                    placeholder={t("art_extra_placeholder")}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    maxLength={800}
                  />
                </ArtisticStep>
              </div>
            )}
          </div>
        </div>

        <StudioResultAnchor
          busy={busy}
          ready={hasResult}
          className={`space-y-4 ${showResultPanel ? "" : "hidden xl:block"} xl:sticky xl:top-[80px] self-start`}
        >
          <div className="rp-editor-panel overflow-hidden">
            <div className="rp-editor-panel-accent" />
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <p className="rp-editor-section-cap !mb-0">{t("art_result_label")}</p>
                <SlidersHorizontal className="w-4 h-4 text-zinc-600" strokeWidth={1.75} />
              </div>
              <ResultPanel
                creation={result}
                loading={busy}
                onChange={setResult}
                emptyLabel={t("art_result_empty")}
              />
            </div>
          </div>

          <div className="as-v2-meta-panel">
            <p className="as-v2-meta-line">{t("art_meta_style", { style: selectedStyle?.label || "—" })}</p>
            <p className="as-v2-meta-line">{t("art_meta_effects", { effects: effectsSummary })}</p>
            {recipeChips.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {recipeChips.map((chip) => (
                  <span key={`${chip.emoji}-${chip.label}`} className="as-v2-recipe-chip">
                    {chip.emoji} {chip.label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </StudioResultAnchor>
      </div>

      <StudioPhotoUploadNotice status={photoUploadStatus} className="mb-3" />

      <StudioGenerateBar
        ready={ready}
        busy={busy}
        onClick={generate}
        label={generateLabel}
        busyLabel={t("art_generating")}
        hint={hint}
        blockedNotify={photoUploading ? "message" : "error"}
        layout="sticky"
        testId="artistic-generate"
        costMeta={<StudioGenerateCostMeta cost={cost} user={user} />}
      />
    </div>
  );
}
