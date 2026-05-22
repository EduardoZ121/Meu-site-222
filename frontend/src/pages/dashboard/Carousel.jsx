import { useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2, ArrowLeft, Layers, Plus, Trash2, Sparkles,
  ChevronUp, ChevronDown, Image as ImageIcon, Download, ImagePlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { formatApiError, uploadPost } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { usePricing } from "../../lib/PricingContext";
import { carouselModelCosts } from "../../lib/pricingRegions";
import { toast } from "sonner";
import useTitle from "../../lib/useTitle";
import ImageUploadZone from "../../components/ImageUploadZone";
import StudioAccordionSection from "../../components/StudioAccordionSection";
import StudioResultAnchor from "../../components/StudioResultAnchor";
import { emptySlide, slideText, normalizeSlides } from "../../lib/carouselSlides";
import { getCarouselExample, getCarouselSlideRoles } from "../../lib/carouselLocales";
import { revokePanoramaBlobUrls, splitPanoramaToSlides } from "../../lib/carouselPanorama";
import { useI18n } from "../../lib/i18n";
import { useStudioI18n } from "../../lib/useStudioI18n";
import AspectPicker from "../../components/AspectPicker";
import { apiAspectRatio } from "../../lib/apiAspectRatio";

const COST_PER_SLIDE = 5;
const MIN_SLIDES = 2;
const MAX_SLIDES = 10;

const STYLE_PRESETS = [
  "editorial magazine photography, cinematic light",
  "soft pastel film, dreamy mood, 35mm grain",
  "high-fashion editorial, dramatic shadows, glossy",
  "warm golden hour, lifestyle storytelling",
  "minimal studio, neutral backdrop, premium product",
  "moody cinematic teal & orange grading",
  "bright airy lifestyle, natural daylight",
  "y2k pop, vivid neon, glossy chrome",
];

const ASPECTS = [
  { key: "4:5",  label: "4:5 · Feed" },
  { key: "1:1",  label: "1:1 · Square" },
  { key: "9:16", label: "9:16 · Story" },
  { key: "3:4",  label: "3:4 · Vertical" },
];

const MODEL_DEFS = [
  { key: "grok", hintKey: "car_model_fast_hint" },
  { key: "gpt_image", hintKey: "car_model_gpt_hint" },
];

const GENERATION_MODES = [
  { key: "panoramic", labelKey: "car_mode_panoramic", hintKey: "car_mode_panoramic_hint" },
  { key: "per-slide", labelKey: "car_mode_per_slide", hintKey: "car_mode_per_slide_hint" },
];

/* ------------------------------------------------------------------ */

export default function CarouselPage() {
  const { t, lang } = useStudioI18n();
  const slideRoles = useMemo(() => getCarouselSlideRoles(t), [t]);
  const errMsg = (err) => formatApiError(err, t("common_fail"));
  useTitle(t("car_page_title"));
  const navigate = useNavigate();
  const { refresh, user } = useAuth();
  const { region } = usePricing();
  const MODELS = useMemo(() => {
    const pc = carouselModelCosts(region);
    return MODEL_DEFS.map((m) => ({
      key: m.key,
      label: m.key === "grok" ? t("car_model_fast") : t("car_model_gpt"),
      cost: pc[m.key] ?? COST_PER_SLIDE,
      hint: `${t("car_credits_per_slide", { n: pc[m.key] ?? COST_PER_SLIDE })} · ${t(m.hintKey)}`,
    }));
  }, [region, t]);
  const generationModes = useMemo(
    () => GENERATION_MODES.map((m) => ({
      key: m.key,
      label: t(m.labelKey),
      hint: t(m.hintKey),
    })),
    [t],
  );

  const [generationMode, setGenerationMode] = useState("panoramic");
  const [campaignBrief, setCampaignBrief] = useState("");
  const [slides, setSlides] = useState([]);

  useEffect(() => {
    const ex = getCarouselExample(lang);
    setCampaignBrief(ex.brief);
    setSlides([...ex.slides]);
  }, [lang]);
  const [styleSuffix, setStyleSuffix] = useState(STYLE_PRESETS[0]);
  const [aspect, setAspect] = useState("4:5");
  const [photo, setPhoto] = useState(null);

  const [keepCharacter, setKeepCharacter] = useState(true);
  const [keepLighting, setKeepLighting] = useState(true);
  const [keepPalette, setKeepPalette] = useState(true);
  const [smoothTransitions, setSmoothTransitions] = useState(true);

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [slideProgress, setSlideProgress] = useState({ index: 0, total: 0, label: "" });
  const [result, setResult] = useState(null);
  const [panoramaPreviewUrl, setPanoramaPreviewUrl] = useState(null);
  const [modelKey, setModelKey] = useState("grok");
  const blobUrlsRef = useRef([]);
  const lastPanoramaRef = useRef(null);

  const isPanoramic = generationMode === "panoramic";
  const perSlide = MODELS.find((m) => m.key === modelKey)?.cost || COST_PER_SLIDE;
  const totalCost = slides.length * perSlide;

  useEffect(() => () => {
    revokePanoramaBlobUrls(blobUrlsRef.current);
  }, []);

  const clearBlobUrls = () => {
    revokePanoramaBlobUrls(blobUrlsRef.current);
    blobUrlsRef.current = [];
  };

  const applySeamlessExample = () => {
    const ex = getCarouselExample(lang);
    setGenerationMode("panoramic");
    setSlides([...ex.slides]);
    setCampaignBrief(ex.briefFull);
    setStyleSuffix("editorial magazine photography, cinematic light, premium advertising campaign");
    toast.success(t("car_example_loaded"));
  };

  const addSlide = () => {
    if (slides.length >= MAX_SLIDES) return;
    const role = slides.length === 0 ? "cover" : "content";
    setSlides([...slides, emptySlide(role)]);
  };
  const removeSlide = (i) => slides.length > MIN_SLIDES && setSlides(slides.filter((_, idx) => idx !== i));
  const updateSlideText = (i, v) => setSlides(slides.map((s, idx) => (idx === i ? { ...s, text: v } : s)));
  const updateSlideRole = (i, role) => setSlides(slides.map((s, idx) => (idx === i ? { ...s, role } : s)));
  const updateSlideRef = (i, file) => setSlides(slides.map((s, idx) => (idx === i ? { ...s, refPhoto: file || null } : s)));
  const moveSlide = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= slides.length) return;
    const next = [...slides];
    [next[i], next[j]] = [next[j], next[i]];
    setSlides(next);
  };

  const generatePanoramic = async (normalized, cleaned, effectiveModel) => {
    clearBlobUrls();
    setPanoramaPreviewUrl(null);
    setSlideProgress({ index: 1, total: 2, label: t("car_gen_panorama") });
    setProgress(15);

    const fd = new FormData();
    fd.append("slides_json", JSON.stringify(normalized.map((s) => ({
      text: slideText(s),
      role: s.role || "content",
    }))));
    fd.append("campaign_brief", campaignBrief.trim());
    fd.append("style_suffix", styleSuffix);
    fd.append("aspect_ratio", apiAspectRatio(aspect, { model: "standard" }));
    fd.append("keep_character", keepCharacter ? "true" : "false");
    fd.append("keep_lighting", keepLighting ? "true" : "false");
    fd.append("keep_palette", keepPalette ? "true" : "false");
    fd.append("model_key", effectiveModel);
    if (photo) fd.append("photo", photo);

    const { data } = await uploadPost("/generate/carousel-panoramic", fd, {
      timeout: 300000,
      pollTimeoutMs: 300000,
      onPollTick: (sec) => setProgress(Math.min(75, 15 + Math.round((sec / 120) * 60))),
    });

    const panoramaUrl = data?.creation?.result_urls?.[0];
    if (!panoramaUrl) throw new Error(t("car_no_panorama"));

    lastPanoramaRef.current = panoramaUrl;
    setPanoramaPreviewUrl(panoramaUrl);
    setSlideProgress({ index: 2, total: 2, label: t("car_split_panels") });
    setProgress(85);

    const splitUrls = await splitPanoramaToSlides(panoramaUrl, cleaned.length, aspect);
    blobUrlsRef.current = splitUrls;

    setProgress(100);
    setResult({
      result_urls: splitUrls,
      panorama_url: panoramaUrl,
      credits_spent: data?.credits_spent || totalCost,
      type: "carousel",
      mode: "panoramic",
    });
    await refresh();
    toast.success(t("car_success_seamless", { count: splitUrls.length, n: data?.credits_spent || totalCost }));
  };

  const generate = async () => {
    const normalized = normalizeSlides(slides);
    const cleaned = normalized.map((s) => slideText(s).trim());
    if (cleaned.some((s) => s.length < 3)) {
      toast.error(t("car_err_slide"));
      return;
    }
    if (campaignBrief.trim().length < 10) {
      toast.error(t("car_err_brief"));
      return;
    }
    if (cleaned.length < MIN_SLIDES || cleaned.length > MAX_SLIDES) {
      toast.error(t("car_err_slide_count", { min: MIN_SLIDES, max: MAX_SLIDES }));
      return;
    }
    if ((user?.credits ?? 0) < totalCost && !user?.is_unlimited) {
      toast.error(t("car_need_credits", { total: totalCost, per: perSlide, count: cleaned.length }));
      return;
    }

    let effectiveModel = modelKey;
    if (photo && modelKey === "gpt_image") {
      effectiveModel = "grok";
      toast.info(t("car_gpt_fallback"));
    }

    setBusy(true);
    clearBlobUrls();
    setResult(null);
    setPanoramaPreviewUrl(null);
    setProgress(0);
    setSlideProgress({
      index: 0,
      total: isPanoramic ? 2 : cleaned.length,
      label: isPanoramic ? t("car_start_panorama") : t("car_start"),
    });

    const allUrls = [];
    let creditsSpent = 0;
    let lastUrl = "";

    try {
      if (isPanoramic) {
        await generatePanoramic(normalized, cleaned, effectiveModel);
        return;
      }

      for (let i = 0; i < normalized.length; i += 1) {
        const slide = normalized[i];
        const pctBase = Math.round((i / normalized.length) * 100);
        setSlideProgress({
          index: i + 1,
          total: normalized.length,
          label: `Slide ${i + 1} de ${normalized.length}`,
        });
        setProgress(pctBase);

        const fd = new FormData();
        fd.append("slide_index", String(i));
        fd.append("total_slides", String(normalized.length));
        fd.append("slide_prompt", slideText(slide));
        fd.append("slide_role", slide.role || "content");
        fd.append("campaign_brief", campaignBrief.trim());
        fd.append("style_suffix", styleSuffix);
        fd.append("aspect_ratio", apiAspectRatio(aspect, { model: "standard" }));
        fd.append("keep_character", keepCharacter ? "true" : "false");
        fd.append("keep_lighting", keepLighting ? "true" : "false");
        fd.append("keep_palette", keepPalette ? "true" : "false");
        fd.append("smooth_transitions", smoothTransitions ? "true" : "false");
        fd.append("model_key", effectiveModel);

        if (slide.refPhoto) {
          fd.append("slide_photo", slide.refPhoto);
        } else if (i > 0 && smoothTransitions && lastUrl) {
          fd.append("previous_slide_url", lastUrl);
        } else if (photo) {
          fd.append("photo", photo);
        }

        // eslint-disable-next-line no-await-in-loop
        const { data } = await uploadPost("/generate/carousel-slide", fd, {
          timeout: 240000,
          pollTimeoutMs: 240000,
          onPollTick: (sec) => {
            const slice = 100 / normalized.length;
            setProgress(Math.min(99, Math.round(pctBase + (sec / 90) * slice)));
          },
        });

        const url = data?.creation?.result_urls?.[0];
        if (!url) throw new Error(`Slide ${i + 1} sem imagem.`);
        allUrls.push(url);
        lastUrl = url;
        creditsSpent += data?.credits_spent || perSlide;
        // eslint-disable-next-line no-await-in-loop
        await refresh();
      }

      setProgress(100);
      setResult({
        result_urls: allUrls,
        credits_spent: creditsSpent,
        type: "carousel",
      });
      toast.success(t("car_success", { count: allUrls.length, n: creditsSpent }));
    } catch (err) {
      if (allUrls.length > 0) {
        setResult({ result_urls: allUrls, credits_spent: creditsSpent, type: "carousel" });
        toast.error(`${allUrls.length} slide(s) gerada(s). ${errMsg(err)}`, { duration: 9000 });
      } else if (lastPanoramaRef.current) {
        setResult({
          result_urls: [],
          panorama_url: lastPanoramaRef.current,
          credits_spent: 0,
          type: "carousel",
          split_failed: true,
        });
        toast.error(
          t("car_split_failed", { err: errMsg(err) }),
          { duration: 12000 },
        );
      } else {
        toast.error(errMsg(err), { duration: 8000 });
      }
    } finally {
      lastPanoramaRef.current = null;
      setBusy(false);
      setSlideProgress({ index: 0, total: 0, label: "" });
    }
  };

  return (
    <motion.div className="rp-studio-shell pb-32" data-testid="carousel-page">
      <button type="button" onClick={() => navigate("/app/tools")} className="rp-studio-back">
        <ArrowLeft className="w-4 h-4" /> {t("back_to_tools")}
      </button>

      <header className="mb-10 pb-8 border-b border-[rgba(244,241,234,0.06)]">
        <p className="rp-editor-section-cap mb-2">{t("car_page_title")}</p>
        <h1 className="rp-studio-page-title mb-3 font-['Inter_Tight']">
          {t("car_title")}
        </h1>
        <p className="rp-studio-page-desc">
          {isPanoramic
            ? t("car_desc_panoramic", { n: slides.length })
            : t("car_desc_per_slide", { per: perSlide })}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={applySeamlessExample}
            className="text-[11px] px-3 py-1.5 rounded-full border border-[#FACC15]/35 text-[#FACC15] hover:bg-[#FACC15]/10 transition-colors font-['Inter_Tight']"
            data-testid="carousel-seamless-example"
          >
            {t("car_load_example")}
          </button>
        </div>
      </header>

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5" data-testid="carousel-generation-mode">
        {generationModes.map((mode) => (
          <button
            key={mode.key}
            type="button"
            onClick={() => setGenerationMode(mode.key)}
            data-testid={`carousel-mode-${mode.key}`}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              generationMode === mode.key
                ? "border-[#FACC15]/60 bg-[#FACC15]/8"
                : "border-[#2E2E30] bg-[#0B0B0C]/40 hover:border-[#FACC15]/35"
            }`}
          >
            <p className="text-[14px] font-medium text-[#F4F1EA] mb-1 font-['Inter_Tight']">{mode.label}</p>
            <p className="text-[#8A8A8E] text-[11px] leading-snug">{mode.hint}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-10">
        <div className="space-y-4">
          <StudioAccordionSection
            title={t("car_sec_ref")}
            defaultOpen
            testId="carousel-section-photo"
          >
            <p className="text-[#8A8A8E] text-[12px] mb-4 font-['Inter_Tight'] leading-relaxed">
              {t("car_sec_ref_hint")}
            </p>
            <ImageUploadZone
              value={photo}
              onChange={setPhoto}
              layout="carousel"
              testId="carousel-photo"
              emptyLabel={t("car_upload_label")}
              emptyHint={t("car_upload_hint")}
            />
          </StudioAccordionSection>

          <StudioAccordionSection
            title={t("car_sec_brief")}
            defaultOpen
            testId="carousel-section-brief"
          >
            <textarea
              value={campaignBrief}
              onChange={(e) => setCampaignBrief(e.target.value)}
              rows={3}
              maxLength={600}
              placeholder={t("car_brief_ph")}
              className="rp-editor-textarea min-h-[88px]"
              data-testid="carousel-brief"
            />
            <p className="text-[#6b6b70] text-[11px] mt-2 font-['Inter_Tight']">
              {t("car_brief_hint")}
            </p>
          </StudioAccordionSection>

          <StudioAccordionSection
            title={t("car_sec_style")}
            defaultOpen={false}
            testId="carousel-section-style"
          >
            <input
              value={styleSuffix}
              onChange={(e) => setStyleSuffix(e.target.value)}
              placeholder="ex: editorial magazine photography, cinematic light"
              className="field-input w-full"
              data-testid="carousel-style"
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {STYLE_PRESETS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStyleSuffix(s)}
                  className={`text-[11px] px-3 py-1.5 rounded-full border transition-colors font-['Inter_Tight'] ${
                    styleSuffix === s
                      ? "border-[#FACC15]/50 text-[#FACC15] bg-[#FACC15]/8"
                      : "border-[#2E2E30] text-[#8A8A8E] hover:text-[#F4F1EA] hover:border-[#FACC15]/30"
                  }`}
                  data-testid={`carousel-style-preset-${s.slice(0, 12)}`}
                >
                  {s.length > 38 ? `${s.slice(0, 36)}…` : s}
                </button>
              ))}
            </div>
          </StudioAccordionSection>

          <StudioAccordionSection
            title={t("car_sec_continuity")}
            defaultOpen={false}
            testId="carousel-section-continuity"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Toggle active={keepCharacter} onClick={() => setKeepCharacter(!keepCharacter)} label={t("car_toggle_character")} hint={t("car_toggle_character_hint")} testId="carousel-toggle-character" />
              <Toggle active={keepLighting} onClick={() => setKeepLighting(!keepLighting)} label={t("car_toggle_lighting")} hint={t("car_toggle_lighting_hint")} testId="carousel-toggle-lighting" />
              <Toggle active={keepPalette} onClick={() => setKeepPalette(!keepPalette)} label={t("car_toggle_palette")} hint={t("car_toggle_palette_hint")} testId="carousel-toggle-palette" />
              {!isPanoramic && (
                <Toggle active={smoothTransitions} onClick={() => setSmoothTransitions(!smoothTransitions)} label={t("car_toggle_smooth")} hint={t("car_toggle_smooth_hint")} testId="carousel-toggle-smooth" />
              )}
            </div>
            {isPanoramic && (
              <p className="text-[#6b6b70] text-[11px] mt-3 font-['Inter_Tight']">
                {t("car_panoramic_hint")}
              </p>
            )}
          </StudioAccordionSection>

          <StudioAccordionSection
            title={t("car_sec_panels", { n: slides.length, max: MAX_SLIDES })}
            defaultOpen
            testId="carousel-section-slides"
          >
            {slides.length < MAX_SLIDES && (
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={addSlide}
                  className="text-[#FACC15] hover:text-[#FDE68A] text-[12px] inline-flex items-center gap-1.5 transition-colors font-mono uppercase tracking-[0.1em]"
                  data-testid="slide-add"
                >
                  <Plus className="w-3.5 h-3.5" /> {t("car_add_slide")}
                </button>
              </div>
            )}

            <div className="space-y-3" data-testid="carousel-slides">
              {slides.map((slide, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-[#2E2E30] bg-[#0B0B0C]/60 p-3 group hover:border-[#FACC15]/25 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <span className="w-7 h-7 rounded-full bg-[#FACC15]/10 border border-[#FACC15]/30 text-[#FACC15] text-[11px] font-mono flex items-center justify-center">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <button type="button" onClick={() => moveSlide(i, -1)} disabled={i === 0} className="text-[#5A5A5E] hover:text-[#FACC15] disabled:opacity-30 p-0.5" data-testid={`slide-up-${i}`}>
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => moveSlide(i, 1)} disabled={i === slides.length - 1} className="text-[#5A5A5E] hover:text-[#FACC15] disabled:opacity-30 p-0.5" data-testid={`slide-down-${i}`}>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {slideRoles.map((r) => (
                          <button
                            key={r.key}
                            type="button"
                            onClick={() => updateSlideRole(i, r.key)}
                            title={r.hint}
                            className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                              slide.role === r.key
                                ? "bg-[#FACC15]/10 border-[#FACC15]/40 text-[#FACC15]"
                                : "border-[#2E2E30] text-[#8A8A8E] hover:border-[#FACC15]/30"
                            }`}
                            data-testid={`slide-role-${i}-${r.key}`}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={slideText(slide)}
                        onChange={(e) => updateSlideText(i, e.target.value)}
                        rows={2}
                        placeholder={t("car_slide_ph", { n: i + 1 })}
                        className="rp-editor-textarea min-h-[72px] !text-[14px]"
                        data-testid={`slide-${i}`}
                      />
                      <label className="flex items-center gap-2 text-[11px] text-[#8A8A8E] cursor-pointer hover:text-[#FACC15] transition-colors">
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => updateSlideRef(i, e.target.files?.[0] || null)} data-testid={`slide-ref-${i}`} />
                        <ImagePlus className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{slide.refPhoto ? slide.refPhoto.name : t("car_ref_optional")}</span>
                      </label>
                    </div>

                    {slides.length > MIN_SLIDES && (
                      <button type="button" onClick={() => removeSlide(i)} className="text-[#5A5A5E] hover:text-[#EF4444] p-1.5 shrink-0" data-testid={`slide-remove-${i}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </StudioAccordionSection>

          <StudioAccordionSection title={t("car_sec_model")} defaultOpen={false} testId="carousel-section-model">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="carousel-model-toggle">
              {MODELS.map((m) => {
                const disabled = m.key === "gpt_image" && !!photo;
                const active = modelKey === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => !disabled && setModelKey(m.key)}
                    disabled={disabled}
                    data-testid={`carousel-model-${m.key}`}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      disabled
                        ? "border-[#1F1F22] opacity-50 cursor-not-allowed"
                        : active
                          ? "border-[#FACC15]/60 bg-[#FACC15]/8"
                          : "border-[#2E2E30] bg-[#0B0B0C]/40 hover:border-[#FACC15]/35"
                    }`}
                  >
                    <p className="text-[15px] font-medium text-[#F4F1EA] mb-1 font-['Inter_Tight']">{m.label}</p>
                    <p className="text-[#8A8A8E] text-[11px] mb-1">{m.hint}</p>
                    <p className="text-[#FACC15] text-[12px] font-mono">{t("car_credits_per_slide", { n: m.cost })}</p>
                  </button>
                );
              })}
            </div>
          </StudioAccordionSection>

          <StudioAccordionSection title={t("car_sec_format")} defaultOpen testId="carousel-section-format">
            <AspectPicker
              value={aspect}
              onChange={setAspect}
              items={ASPECTS.map(({ key, label }) => ({ key, label }))}
              columns="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
              testIdPrefix="carousel-format"
            />
          </StudioAccordionSection>
        </div>

        <StudioResultAnchor busy={busy} ready={Boolean(result?.result_urls?.length)} className="lg:sticky lg:top-[88px] self-start space-y-3">
          <p className="rp-editor-section-cap !text-[#6b6b70]">{t("tool_preview")}</p>
          <div className="rp-editor-panel overflow-hidden p-4 sm:p-5">
            <ResultArea
              busy={busy}
              progress={progress}
              slideProgress={slideProgress}
              result={result}
              aspect={aspect}
              slidesCount={slides.length}
              isPanoramic={isPanoramic}
              panoramaPreviewUrl={panoramaPreviewUrl}
            />
          </div>
        </StudioResultAnchor>
      </div>

      <div className="fixed bottom-0 left-0 right-0 md:left-[240px] z-30 border-t border-rp-border bg-rp-bg/90 backdrop-blur-xl px-4 sm:px-6 md:px-10 py-4">
        <div className="rp-studio-shell flex items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-3 text-[12px] text-rp-mute font-['Inter_Tight']">
            <span>{t("carousel_cost", { n: totalCost })}</span>
            <span className="text-rp-mute2">·</span>
            <span>{slides.length} × {perSlide}</span>
            <span className="text-rp-mute2">·</span>
            <span>{t("carousel_balance")} <strong className="text-rp-text tabular-nums">{user?.is_unlimited ? "∞" : (user?.credits ?? 0)}</strong></span>
          </div>
          <button
            type="button"
            onClick={generate}
            disabled={busy || ((user?.credits ?? 0) < totalCost && !user?.is_unlimited)}
            className="rp-action-primary flex-1 sm:flex-initial sm:min-w-[280px] !py-3.5"
            data-testid="carousel-generate"
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {slideProgress.label || `A renderizar ${slides.length} slides…`}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {isPanoramic ? t("car_gen_panoramic") : t("car_gen_slides")} · {totalCost} {t("credits")}
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function Toggle({ active, onClick, label, hint, testId }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
        active
          ? "border-[#FACC15]/40 bg-[#FACC15]/6"
          : "border-[#2E2E30] bg-[#0B0B0C]/40 hover:border-[#FACC15]/25"
      }`}
    >
      <div className={`shrink-0 mt-0.5 w-10 h-6 rounded-full relative transition-colors ${active ? "bg-[#FACC15]" : "bg-[#2E2E30]"}`}>
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${active ? "translate-x-[18px]" : "translate-x-0.5"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[#F4F1EA] text-[13px] font-medium font-['Inter_Tight']">{label}</p>
        <p className="text-[#8A8A8E] text-[11px] leading-snug mt-0.5">{hint}</p>
      </div>
    </button>
  );
}

function ResultArea({ busy, progress, slideProgress, result, aspect, slidesCount, isPanoramic, panoramaPreviewUrl }) {
  const { t } = useStudioI18n();
  if (busy) {
    const slideLabel = slideProgress?.total
      ? slideProgress.label || t("car_loading_slide", { index: slideProgress.index, total: slideProgress.total })
      : isPanoramic
        ? t("car_gen_panorama")
        : t("car_gen_slides", { n: slidesCount });
    return (
      <div className="flex flex-col items-center text-center py-6" data-testid="carousel-loading">
        {panoramaPreviewUrl && (
          <div className="w-full mb-4 rounded-lg overflow-hidden border border-[#2E2E30] opacity-90">
            <img src={panoramaPreviewUrl} alt={t("car_alt_panorama")} className="w-full h-auto max-h-24 object-cover object-center" />
            <p className="text-[10px] text-[#6b6b70] py-1 font-mono">{t("car_splitting_vertical")}</p>
          </div>
        )}
        <div className="w-14 h-14 rounded-full border-2 border-[#FACC15]/30 border-t-[#FACC15] animate-spin mb-4" />
        <p className="text-[#F4F1EA] text-[14px] font-medium font-['Inter_Tight']">{slideLabel}</p>
        <p className="text-[#6b6b70] text-[11px] font-mono uppercase mt-2 tracking-[0.14em]">
          {isPanoramic
            ? (slideProgress?.index === 2 ? t("car_loading_cut") : t("car_loading_one_image"))
            : slideProgress?.total
              ? t("car_loading_progress", { index: slideProgress.index, total: slideProgress.total })
              : t("car_loading_preserve")}
        </p>
        <div className="w-full h-1.5 bg-[#2E2E30] rounded-full mt-5 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#FACC15] to-[#A78BFA]"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <p className="text-[#5A5A5E] text-[10px] font-mono mt-2">{progress}%</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="py-10 flex flex-col items-center text-center" data-testid="carousel-empty">
        <Layers className="w-8 h-8 text-[#FACC15]/70 mb-3" strokeWidth={1.5} />
        <p className="text-[#8A8A8E] text-[13px]">{t("car_result_here")}</p>
        <p className="text-[#6b6b70] text-[11px] mt-1.5 max-w-[260px]">
          {isPanoramic ? t("car_empty_panoramic") : t("car_empty_per_slide")}
        </p>
      </div>
    );
  }

  if (result.split_failed && result.panorama_url && !(result.result_urls || []).length) {
    return (
      <div className="space-y-3" data-testid="carousel-split-failed">
        <p className="text-[#FACC15] text-[13px] font-['Inter_Tight']">
          {t("car_split_fail_msg")}
        </p>
        <img
          src={result.panorama_url}
          alt={t("car_alt_panorama")}
          className="w-full rounded-lg border border-[#2E2E30]"
          crossOrigin="anonymous"
        />
        <a
          href={result.panorama_url}
          target="_blank"
          rel="noreferrer"
          className="block text-center text-[12px] text-[#FACC15] hover:underline font-['Inter_Tight']"
        >
          {t("car_open_panorama")}
        </a>
      </div>
    );
  }

  return (
    <CarouselViewer
      urls={result.result_urls || []}
      aspect={aspect}
      panoramaUrl={result.panorama_url}
    />
  );
}

function CarouselViewer({ urls, aspect, panoramaUrl }) {
  const { t } = useStudioI18n();
  const [current, setCurrent] = useState(0);
  const aspectClass = {
    "1:1": "aspect-square",
    "4:5": "aspect-[4/5]",
    "9:16": "aspect-[9/16]",
    "3:4": "aspect-[3/4]",
  }[aspect] || "aspect-[4/5]";

  const download = async (url, idx) => {
    try {
      const r = await fetch(url);
      const blob = await r.blob();
      const u = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = u;
      a.download = `remakepix-carousel-${idx + 1}-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(u), 1000);
    } catch {
      toast.error(t("car_download_fail"));
    }
  };

  const downloadAll = async () => {
    for (let i = 0; i < urls.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await download(urls[i], i);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 400));
    }
  };

  return (
    <div data-testid="carousel-result">
      {panoramaUrl && (
        <details className="mb-3 rounded-lg border border-[#2E2E30] overflow-hidden">
          <summary className="cursor-pointer text-[11px] text-[#8A8A8E] px-3 py-2 hover:text-[#FACC15] font-['Inter_Tight']">
            {t("car_view_original")}
          </summary>
          <img src={panoramaUrl} alt={t("car_alt_panorama")} className="w-full h-auto" crossOrigin="anonymous" />
        </details>
      )}
      <div className={`relative ${aspectClass} bg-black rounded-lg overflow-hidden`}>
        <img
          src={urls[current]}
          alt={`Slide ${current + 1}`}
          className="absolute inset-0 w-full h-full object-contain"
          crossOrigin="anonymous"
          data-testid="carousel-main-image"
        />
        <motion.div className="absolute top-2 left-2 text-[10px] font-mono uppercase tracking-wider bg-[#FACC15] text-[#0B0B0C] px-2 py-0.5 rounded">
          {String(current + 1).padStart(2, "0")} / {String(urls.length).padStart(2, "0")}
        </motion.div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {urls.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all ${i === current ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"}`}
              aria-label={`Slide ${i + 1}`}
              data-testid={`carousel-dot-${i}`}
            />
          ))}
        </div>
      </div>

      <div className="mt-2 grid grid-cols-5 gap-1.5">
        {urls.map((u, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrent(i)}
            className={`aspect-square rounded-md overflow-hidden border-2 transition-all ${
              i === current ? "border-[#FACC15]" : "border-[#2E2E30] hover:border-[#FACC15]/50"
            }`}
            data-testid={`carousel-thumb-${i}`}
          >
            <img src={u} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={downloadAll}
          className="flex-1 rp-action-primary !py-2.5 !text-[12px]"
          data-testid="carousel-download-all"
        >
          <Download className="w-4 h-4" />
          Baixar todas ({urls.length})
        </button>
        <button
          type="button"
          onClick={() => download(urls[current], current)}
          className="px-4 py-2.5 border border-[#2E2E30] hover:border-[#FACC15]/40 text-[#8A8A8E] hover:text-[#F4F1EA] rounded-lg text-[12px] transition-colors flex items-center gap-1.5"
          data-testid="carousel-download-current"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          Esta
        </button>
      </div>
    </div>
  );
}
