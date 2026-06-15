import { Component, useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2, Sparkles, ArrowLeft, Check, Layers, Crown, Zap, Aperture,
  Image as ImageIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  api,
  formatApiError,
  pollPrediction,
  trackPendingPrediction,
  uploadPost,
} from "../../lib/api";
import { normalizeCreation, primaryResultUrl } from "../../lib/creationUrls";
import { useAuth } from "../../lib/auth";
import { usePricing } from "../../lib/PricingContext";
import { posterModelCosts } from "../../lib/pricingRegions";
import { toast } from "sonner";
import StyleCover from "../../components/StyleCover";
import ImageUploadZone from "../../components/ImageUploadZone";
import useTitle from "../../lib/useTitle";
import {
  FALLBACK_POSTER_MODELS,
  FALLBACK_POSTER_TEMPLATES,
} from "../../lib/posterFallbacks";
import { posterCoverSrc } from "../../lib/posterTemplateCovers";
import {
  defaultPosterCategory,
  normalizePosterTemplates,
  visiblePosterCategories,
  POSTER_CAT_ORDER,
} from "../../lib/posterCatalog";
import {
  buildPosterPrompt,
  POSTER_MOOD_IDS,
  posterInitialValues,
  posterMissingFields,
  isPosterFoodTemplate,
  isPosterFashionTemplate,
  isPosterProductTemplate,
  isPosterMenuTemplate,
  isPosterDualPhotoTemplate,
  splitPosterPlaceholders,
} from "../../lib/posterPrompt";
import { PosterSection, CustomTextLayersEditor } from "../../components/poster/PosterEditorParts";
import StudioHelpTip from "../../components/studio/StudioHelpTip";
import PosterMoodPalette from "../../components/poster/PosterMoodPalette";
import AspectPicker from "../../components/AspectPicker";
import { apiAspectRatio } from "../../lib/apiAspectRatio";
import StudioResultAnchor from "../../components/StudioResultAnchor";
import StudioGenerateBar from "../../components/StudioGenerateBar";
import StudioGenerateCostMeta from "../../components/StudioGenerateCostMeta";
import { useStudioGenerateGate } from "../../lib/useStudioGenerateGate";
import { usePhotoAspectDefault } from "../../lib/usePhotoAspectDefault";
import { useI18n } from "../../lib/i18n";
import { useStudioI18n } from "../../lib/useStudioI18n";
import { posterFieldLabel, POSTER_CAT_KEYS } from "../../lib/posterFieldLocales";
import { normalizePosterModels } from "../../lib/posterModels";
import {
  getFlyerVariants,
  posterTemplateHasVariants,
  resolvePosterWithVariant,
} from "../../lib/posterFlyerVariants";
import { scrollStudioToTop } from "../../lib/scrollToStudioResult";
import { useStudioSessionBack } from "../../lib/useStudioSessionBack";
import { appendStudioPhotos, primaryStudioPhoto } from "../../lib/studioFormData";
import PosterMotionFlyerButton from "../../components/poster/PosterMotionFlyerButton";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CAT_ORDER = POSTER_CAT_ORDER;

/** Grelha compacta — 2 colunas no telemóvel (igual /app/tools). */
const POSTER_GRID_CLASS =
  "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-2.5 md:gap-3";

// Gradient backgrounds per category — gives visual hierarchy to template cards
const CAT_GRADIENTS = {
  business:  "linear-gradient(135deg,#0B0B0C 0%,#1F2937 48%,#CA8A04 100%)",
  barber:    "linear-gradient(135deg,#0B0B0C 0%,#78350F 52%,#FACC15 100%)",
  carousel:  "linear-gradient(135deg,#E0F2FE 0%,#14B8A6 52%,#FDF2F8 100%)",
  dj:        "linear-gradient(135deg,#020617 0%,#0E7490 52%,#22D3EE 100%)",
  concert:   "linear-gradient(135deg,#0B0B0C 0%,#7F1D1D 55%,#EF4444 100%)",
  music:     "linear-gradient(135deg,#0B0B0C 0%,#7C3AED 48%,#EC4899 100%)",
  food:      "linear-gradient(135deg,#1F1308 0%,#B45309 55%,#FACC15 100%)",
  fitness:   "linear-gradient(135deg,#020617 0%,#16A34A 52%,#BEF264 100%)",
  motivational: "linear-gradient(135deg,#111827 0%,#F59E0B 52%,#F4F1EA 100%)",
  flyers:    "linear-gradient(135deg,#1A1A1C 0%,#EF4444 55%,#FACC15 100%)",
  flyer:     "linear-gradient(135deg,#1A1A1C 0%,#EF4444 55%,#FACC15 100%)",
  editorial: "linear-gradient(135deg,#0F1419 0%,#2D3748 50%,#F4F1EA 100%)",
  fashion:   "linear-gradient(135deg,#0B0B0C 0%,#78350F 42%,#F5F5DC 100%)",
  epic:      "linear-gradient(135deg,#0B0B0C 0%,#7C3AED 50%,#FACC15 100%)",
  scifi:     "linear-gradient(135deg,#06122B 0%,#1E3A8A 55%,#06B6D4 100%)",
  hero:      "linear-gradient(135deg,#220505 0%,#7F1D1D 55%,#EF4444 100%)",
  phone:     "linear-gradient(135deg,#1B1340 0%,#7C3AED 50%,#EC4899 100%)",
  social:    "linear-gradient(135deg,#E8F5E9 0%,#22C55E 52%,#064E3B 100%)",
  automotive:"linear-gradient(135deg,#0B0B0C 0%,#374151 48%,#CA8A04 100%)",
  beauty:    "linear-gradient(135deg,#FDF2F8 0%,#F472B6 52%,#831843 100%)",
  retail:    "linear-gradient(135deg,#EFF6FF 0%,#3B82F6 52%,#1E3A8A 100%)",
  gaming:    "linear-gradient(135deg,#020617 0%,#7C3AED 48%,#22D3EE 100%)",
  youtube:   "linear-gradient(135deg,#0B0B0C 0%,#DC2626 48%,#FACC15 100%)",
};

const isLong = (k) => /text|description|tagline|story|notes|additional|caption|quote|details|deck|subhead|positions|extra_text|policy|description/i.test(k);

const POSTER_OUTPUT_LANGS = [
  { key: "pt", labelKey: "post_output_lang_pt" },
  { key: "en", labelKey: "post_output_lang_en" },
  { key: "es", labelKey: "post_output_lang_es" },
  { key: "fr", labelKey: "post_output_lang_fr" },
];

const MODEL_ICONS = {
  grok: Zap,
  flux2: Aperture,
  gpt_image: Crown,
};

const POSTER_MODEL_LABEL_KEYS = {
  grok: "post_engine_grok",
  flux2: "post_engine_flux2",
  gpt_image: "post_engine_premium",
};

const POSTER_MODEL_TAG_KEYS = {
  grok: "post_engine_grok_tag",
  flux2: "post_engine_flux2_tag",
  gpt_image: "post_engine_premium_tag",
};

function posterModelLabel(model, t) {
  const key = POSTER_MODEL_LABEL_KEYS[model?.key];
  if (key) {
    const label = t(key);
    if (label && label !== key) return label;
  }
  return model?.label || model?.key || "";
}

function posterModelTag(model, t) {
  const key = POSTER_MODEL_TAG_KEYS[model?.key];
  if (key) {
    const tag = t(key);
    if (tag && tag !== key) return tag;
  }
  return model?.tag || "";
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Posters() {
  const { t } = useStudioI18n();
  const { lang } = useI18n();
  const catLabel = (c) => (POSTER_CAT_KEYS[c] ? t(POSTER_CAT_KEYS[c]) : c);
  useTitle(t("sidebar_posters"));
  const navigate = useNavigate();
  const { refresh, user } = useAuth();
  const { region } = usePricing();

  const [templates, setTemplates] = useState([]);
  const [models, setModels] = useState([]);
  const [openaiReady, setOpenaiReady] = useState(true);
  const [category, setCategory] = useState("business");

  const catalogTemplates = useMemo(
    () => normalizePosterTemplates(templates),
    [templates],
  );

  const activeCategories = useMemo(
    () => visiblePosterCategories(catalogTemplates),
    [catalogTemplates],
  );

  useEffect(() => {
    if (!activeCategories.length) return;
    if (!activeCategories.includes(category)) {
      setCategory(defaultPosterCategory(catalogTemplates));
    }
  }, [activeCategories, catalogTemplates, category]);
  const [picked, setPicked] = useState(null);
  const [variantBase, setVariantBase] = useState(null);

  const labelFor = (k, fieldIndex, template = picked) =>
    posterFieldLabel(k, lang, { template, fieldIndex });

  // Editor state
  const [values, setValues] = useState({});
  const [photos, setPhotos] = useState([]);
  const photo = primaryStudioPhoto(photos);
  const [logo, setLogo] = useState(null);
  const [outputLang, setOutputLang] = useState("pt");
  const [modelKey, setModelKey] = useState("grok");
  const [aspect, setAspect] = usePhotoAspectDefault(photo, "4:5", "4:5");
  const [numOutputs, setNumOutputs] = useState(1);
  const [mood, setMood] = useState("");
  const [paletteColors, setPaletteColors] = useState([]);
  const [customBlocks, setCustomBlocks] = useState([]);

  const [busy, setBusy] = useState(false);
  const [genPhase, setGenPhase] = useState("");
  const [genProgress, setGenProgress] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.get("/public/poster-templates")
      .then((r) => {
        if (cancelled) return;
        setTemplates(r.data.templates?.length ? r.data.templates : FALLBACK_POSTER_TEMPLATES);
      })
      .catch(() => {
        if (cancelled) return;
        setTemplates(FALLBACK_POSTER_TEMPLATES);
        toast.message(t("post_templates_offline"), { duration: 8000 });
      });
    api.get("/public/poster-models")
      .then((r) => {
        if (cancelled) return;
        setOpenaiReady(r.data.openai_ready !== false);
        setModels(
          normalizePosterModels(r.data.models?.length ? r.data.models : FALLBACK_POSTER_MODELS),
        );
      })
      .catch(() => {
        if (cancelled) return;
        setModels(normalizePosterModels(FALLBACK_POSTER_MODELS));
      });
    return () => {
      cancelled = true;
    };
    // Mount-only: avoid re-fetch on every render (t() is recreated each time).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!openaiReady && modelKey === "gpt_image") {
      setModelKey("grok");
      toast.error(t("post_gpt_unavailable"), { duration: 10000 });
    }
  }, [openaiReady, modelKey, t]);

  useEffect(() => {
    const pc = posterModelCosts(region);
    setModels((prev) => {
      const base = prev.length ? prev : FALLBACK_POSTER_MODELS;
      return normalizePosterModels(base.map((m) => ({ ...m, cost: pc[m.key] ?? m.cost })));
    });
  }, [region]);

  const filtered = useMemo(
    () => catalogTemplates.filter((t) => t.category === category),
    [catalogTemplates, category],
  );

  const counts = useMemo(() => {
    const m = {};
    for (const t of catalogTemplates) m[t.category] = (m[t.category] || 0) + 1;
    return m;
  }, [catalogTemplates]);

  const selectedModel = models.find((m) => m.key === modelKey) || { cost: 10 };
  const usesPremiumWallet = modelKey === "gpt_image" || selectedModel.wallet === "premium";
  const totalCost = selectedModel.cost * numOutputs;
  const userBalance = usesPremiumWallet ? (user?.premium_credits ?? 0) : (user?.credits ?? 0);

  const missing = useMemo(
    () => (picked ? posterMissingFields(picked, values) : []),
    [picked, values],
  );

  const enterEditor = (tpl) => {
    setPicked(tpl);
    setValues(posterInitialValues(tpl));
    setPhotos([]);
    setLogo(null);
    setOutputLang(lang === "pt" || lang === "en" || lang === "es" || lang === "fr" ? lang : "pt");
    setResult(null);
    setCustomBlocks([]);
    setMood("");
    setPaletteColors([]);
    setNumOutputs(1);
    if (isPosterFashionTemplate(tpl)) {
      setModelKey("flux2");
    } else if (isPosterDualPhotoTemplate(tpl)) {
      setModelKey("flux2");
    }
    if (!photo) {
      if (tpl.aspect) {
        setAspect(tpl.aspect);
      } else if (!tpl.styleVariants) {
        const p = (tpl.prompt || "").toLowerCase();
        if (p.includes("9:16")) setAspect("9:16");
        else if (p.includes("2:3")) setAspect("2:3");
        else if (p.includes("16:9")) setAspect("16:9");
        else if (p.includes("1:1") || p.includes("square")) setAspect("1:1");
        else setAspect("4:5");
      } else {
        setAspect("4:5");
      }
    }
  };

  const openTemplate = (tpl) => {
    if (posterTemplateHasVariants(tpl)) {
      setVariantBase(tpl);
      return;
    }
    enterEditor(tpl);
  };

  const pickVariant = (variant) => {
    if (!variantBase) return;
    enterEditor(resolvePosterWithVariant(variantBase, variant));
    setVariantBase(null);
  };

  const backFromEditor = useCallback(() => {
    if (picked?.variantParentId) {
      const parent = templates.find((t) => t.id === picked.variantParentId) || {
        ...picked,
        id: picked.variantParentId,
        category: picked.category || "flyers",
      };
      setPicked(null);
      setVariantBase(parent);
      return;
    }
    setPicked(null);
  }, [picked, templates]);

  useEffect(() => {
    scrollStudioToTop();
  }, [picked?.id, variantBase?.id]);

  const handleSessionBack = useCallback(() => {
    if (picked) {
      backFromEditor();
      scrollStudioToTop();
      return;
    }
    if (variantBase) {
      setVariantBase(null);
      scrollStudioToTop();
      return;
    }
    navigate("/app/tools");
  }, [picked, variantBase, backFromEditor, navigate]);

  useStudioSessionBack(handleSessionBack);

  const generate = async () => {
    if (busy) return;
    if (!picked) { toast.error(t("post_pick_template")); return; }
    if (missing.length) {
      toast.error(
        `${t("post_fill")}: ${missing.map((k) => labelFor(k, picked?.placeholders?.indexOf(k))).join(", ")}`,
        { duration: 8000 },
      );
      return;
    }
    if (isPosterFashionTemplate(picked) && !photo) {
      toast.error(t("post_fashion_photo_required"), { duration: 8000 });
      return;
    }
    const photoCount = (Array.isArray(photos) ? photos : []).filter(Boolean).length;
    if (isPosterDualPhotoTemplate(picked) && photoCount < 2) {
      toast.error(t("post_dual_photo_required"), { duration: 8000 });
      return;
    }
    if (userBalance < totalCost && !user?.is_unlimited && user?.role !== "admin") {
      const msg = usesPremiumWallet
        ? t("post_need_hq_credits", { need: totalCost, have: userBalance })
        : t("common_need_credits", { need: totalCost, have: userBalance });
      toast.error(msg, { duration: 8000 });
      return;
    }

    const promptFinal = buildPosterPrompt(picked, values, {
      mood,
      paletteColors,
      customBlocks,
      hasPhoto: Boolean(photo),
      hasLogo: Boolean(logo),
      photoCount,
      outputLang: outputLang || lang || "pt",
    });

    const fd = new FormData();
    fd.append("template_id", picked.variantParentId || picked.id);
    fd.append("variant_key", picked.variantKey || "");
    fd.append("template_category", picked.category || "");
    if (isPosterDualPhotoTemplate(picked)) {
      fd.append("requires_dual_photo", "1");
    }
    fd.append("prompt_final", promptFinal);
    fd.append("placeholders", JSON.stringify(values));
    fd.append("custom_blocks", JSON.stringify(customBlocks));
    fd.append("model_key", modelKey);
    const posterAspectModel = "standard";
    const chosenAspect = aspect === "match" && !photo
      ? (picked?.aspect || "4:5")
      : (aspect || picked?.aspect || "4:5");
    fd.append("aspect_ratio", apiAspectRatio(chosenAspect, {
      model: posterAspectModel,
      hasPhoto: Boolean(photo) && chosenAspect === "match",
    }));
    fd.append("num_outputs", String(numOutputs));
    fd.append("mood", mood || "");
    fd.append("palette_colors", JSON.stringify(paletteColors));
    fd.append("lang", lang || "en");
    fd.append("output_lang", outputLang || lang || "pt");
    if (photo) appendStudioPhotos(fd, photos);
    if (logo) fd.append("logo", logo);

    setBusy(true);
    setResult(null);
    setGenProgress(0);
    setGenPhase("upload");
    const isGptPoster = modelKey === "gpt_image";
    let submitData;
    try {
      ({ data: submitData } = await uploadPost("/generate/poster", fd, {
        timeout: isGptPoster ? 300_000 : 120_000,
        headers: { "X-Skip-Auto-Poll": "1" },
        skipBlobOffload: !photo || photo.size < 3_500_000,
        blobOffloadTimeoutMs: 50_000,
      }));

      if (!submitData?.prediction_id) {
        throw new Error(t("common_no_result"));
      }

      setGenPhase("work");
      trackPendingPrediction(submitData.prediction_id, {
        credits_spent: submitData.credits_spent ?? totalCost,
        type: "poster",
      });
      const polled = await pollPrediction(submitData.prediction_id, {
        onTick: (sec) => setGenProgress(sec),
        timeoutMs: isGptPoster ? 120_000 : 600_000,
        credits_spent: submitData.credits_spent ?? totalCost,
        type: "poster",
      });

      const normalized = normalizeCreation(polled?.creation);
      if (!primaryResultUrl(normalized)) throw new Error(t("common_no_result"));
      setResult(normalized);
      toast.success(t("post_success", { n: normalized?.credits_spent ?? submitData.credits_spent ?? totalCost }));
      await refresh();
    } catch (err) {
      const msg = formatApiError(err, t("post_fail"), { context: "image_upload", t });
      console.error("[Posters] generate failed", err);
      toast.error(msg, { duration: 12000 });
    } finally {
      setBusy(false);
      setGenPhase("");
      setGenProgress(0);
    }
  };

  /* ============================================================ */
  /*  EDITOR                                                       */
  /* ============================================================ */
  if (variantBase) {
    return (
      <VariantPicker
        base={variantBase}
        variants={getFlyerVariants(variantBase.id, variantBase)}
        onBack={() => setVariantBase(null)}
        onPick={pickVariant}
        catLabel={catLabel}
        t={t}
      />
    );
  }

  if (picked) {
    return (
      <PosterEditorErrorBoundary onBack={backFromEditor} t={t}>
      <Editor
        picked={picked}
        onBack={backFromEditor}
        values={values} setValues={setValues}
        photos={photos} setPhotos={setPhotos}
        logo={logo} setLogo={setLogo}
        outputLang={outputLang} setOutputLang={setOutputLang}
        modelKey={modelKey} setModelKey={setModelKey}
        models={models}
        openaiReady={openaiReady}
        aspect={aspect} setAspect={setAspect}
        numOutputs={numOutputs} setNumOutputs={setNumOutputs}
        mood={mood} setMood={setMood}
        paletteColors={paletteColors} setPaletteColors={setPaletteColors}
        customBlocks={customBlocks} setCustomBlocks={setCustomBlocks}
        totalCost={totalCost} perImageCost={selectedModel.cost}
        busy={busy} result={result} setResult={setResult}
        missing={missing}
        onGenerate={generate}
        genPhase={genPhase}
        genProgress={genProgress}
        user={user}
        lang={lang}
        t={t}
        labelFor={labelFor}
        catLabel={catLabel}
      />
      </PosterEditorErrorBoundary>
    );
  }

  /* ============================================================ */
  /*  GRID                                                         */
  /* ============================================================ */
  return (
    <div className="max-w-[1400px] mx-auto pb-6" data-testid="posters-page">
      <header className="mb-4 md:mb-8 hidden md:block">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#8A8A8E] mb-2">{t("sidebar_posters")}</p>
        <p className="text-[15px] text-[#8A8A8E] max-w-lg leading-snug">
          {t("post_grid_desc", { n: templates.length || 44 })}
        </p>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4 md:mb-6 overflow-x-auto pb-1 scrollbar-none" data-testid="poster-cats">
        {activeCategories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rp-tools-hub-pill shrink-0 ${category === c ? "rp-tools-hub-pill--active" : ""}`}
            data-testid={`postercat-${c}`}
          >
            <span className="truncate">{catLabel(c)}</span>
            <span className={`text-[10px] font-mono shrink-0 ml-1 ${category === c ? "text-black/45" : "text-[#5A5A5E]"}`}>
              {counts[c] ?? "—"}
            </span>
          </button>
        ))}
      </div>

      {category === "flyers" && (
        <p className="mb-5 md:mb-6 text-[#C4B5FD] text-[13px] sm:text-[14px] max-w-[720px] leading-relaxed border border-[#7C3AED]/30 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 bg-[#7C3AED]/10 break-words">
          {t("post_flyers_pick_hint")}
        </p>
      )}

      {(category === "business" || category === "dj" || category === "concert" || category === "fitness" || category === "barber" || category === "carousel" || category === "editorial" || category === "fashion") && (
        <p className="mb-5 md:mb-6 text-[#C4B5FD] text-[13px] sm:text-[14px] max-w-[720px] leading-relaxed border border-[#7C3AED]/30 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 bg-[#7C3AED]/10 break-words">
          {t("post_premium_pick_hint")}
        </p>
      )}

      {/* Grid */}
      <div className={POSTER_GRID_CLASS} data-testid="poster-templates-grid">
        {filtered.map((tpl, i) => (
          <TemplateCard key={tpl.id} tpl={tpl} index={i} onClick={() => openTemplate(tpl)} catLabel={catLabel} t={t} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Flyer variant picker                                               */
/* ------------------------------------------------------------------ */

function variantDisplayLabel(variant, t) {
  if (variant?.label) return variant.label;
  const key = variant?.labelKey;
  if (!key) return variant?.variantKey || "";
  const tr = t(key);
  return tr !== key ? tr : (variant?.variantKey || key);
}

function VariantPicker({ base, variants, onBack, onPick, catLabel, t }) {
  return (
    <div className="max-w-[1400px] mx-auto pb-20 min-w-0" data-testid="poster-variant-picker">
      <button type="button" onClick={onBack} className="rp-studio-back hidden md:inline-flex" data-testid="posters-back-to-grid">
        <ArrowLeft className="w-4 h-4" /> {t("post_back_templates")}
      </button>

      <header className="mb-5 md:mb-10">
        <p className="text-[#7C3AED] text-[10px] font-mono uppercase tracking-[0.16em] sm:tracking-[0.22em] mb-2 sm:mb-3 break-words">
          {catLabel(base.category)} · {t("post_variant_picker_eyebrow_n", { n: variants.length })}
        </p>
        <h1 className="text-[#F4F1EA] text-[22px] sm:text-[32px] md:text-[44px] font-light tracking-[-0.02em] mb-2 sm:mb-3 font-['Inter_Tight'] break-words leading-[1.1]">
          {base.label || base.id}
        </h1>
        <p className="text-[#8A8A8E] text-[13px] sm:text-[15px] max-w-[640px] leading-relaxed break-words">
          {t("post_variant_picker_desc")}
        </p>
        {isPosterDualPhotoTemplate(base) && (
          <p className="mt-3 text-[#FBBF24] text-[12px] sm:text-[13px] max-w-[640px] leading-relaxed rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2">
            {t("post_dual_photo_banner")}
          </p>
        )}
      </header>

      <div className={POSTER_GRID_CLASS} data-testid="poster-variants-grid">
        {variants.map((variant, i) => (
          <motion.button
            key={variant.variantKey}
            type="button"
            onClick={() => onPick(variant)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.35) }}
            className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-[rgba(147,51,234,0.25)] bg-[#13131A] text-left shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[#A855F7]/50 hover:shadow-[0_12px_32px_-14px_rgba(124,58,237,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
            data-testid={`poster-variant-${variant.variantKey}`}
          >
            <div
              className="relative aspect-[4/5] overflow-hidden"
              style={posterCoverSrc(`${base.id}__${variant.variantKey}`) ? undefined : { background: variant.gradient || CAT_GRADIENTS[base.category] || CAT_GRADIENTS.flyers }}
            >
              <StyleCover
                id={`${base.id}__${variant.variantKey}`}
                title={variantDisplayLabel(variant, t)}
                prompt={variant.prompt || base.prompt}
                category={base.category}
                eyebrow={catLabel(base.category)}
                compact
                coverSrc={posterCoverSrc(`${base.id}__${variant.variantKey}`) || posterCoverSrc(base.id) || ""}
                className="absolute inset-0 h-full w-full"
              />
              <div className="absolute inset-0 z-[3] hidden sm:flex items-center justify-center bg-[#7C3AED]/85 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="text-white text-[11px] font-medium uppercase tracking-[0.12em] px-4 py-2 border border-white/50 rounded-full">
                  {t("post_variant_open")} →
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-1 border-t border-[#2E2E30]/80 px-2 py-2 sm:px-3 sm:py-2.5">
              <p className="text-[#8A8A8E] text-[11px] truncate">{variantDisplayLabel(variant, t)}</p>
              <Sparkles className="w-3.5 h-3.5 text-[#7C3AED] shrink-0 opacity-70" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Template card                                                      */
/* ------------------------------------------------------------------ */

function TemplateCard({ tpl, index, onClick, catLabel, t }) {
  const hasVariants = posterTemplateHasVariants(tpl);
  const variantCount = hasVariants ? getFlyerVariants(tpl.id, tpl).length : 0;
  const gradient = CAT_GRADIENTS[tpl.category] || CAT_GRADIENTS.editorial;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.4), ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex h-full flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 rounded-2xl"
      data-testid={`tpl-${tpl.id}`}
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0c]" style={{ background: gradient }}>
        <StyleCover
          id={tpl.id}
          title={tpl.label || tpl.id}
          prompt={tpl.prompt}
          category={tpl.category}
          imageOnly
          coverSrc={posterCoverSrc(tpl.id) || ""}
          className="pro-poster-card__cover"
        />
        {tpl.subtag && (
          <div className="absolute left-2 top-9 sm:left-3 sm:top-12 max-w-[85%] rounded-full border border-white/20 bg-black/30 px-1.5 py-0.5 sm:px-2 sm:py-1 font-['JetBrains_Mono'] text-[7px] sm:text-[8px] uppercase tracking-[0.12em] text-white/75 backdrop-blur-sm truncate z-[2]">
            {tpl.subtag}
          </div>
        )}
        {isPosterDualPhotoTemplate(tpl) && (
          <div className="absolute left-2 top-2 sm:left-3 sm:top-3 z-[2] rounded-full border border-amber-400/40 bg-amber-500/25 px-1.5 py-0.5 sm:px-2 sm:py-1 font-['JetBrains_Mono'] text-[7px] sm:text-[8px] uppercase tracking-[0.12em] text-amber-100 backdrop-blur-sm">
            {t("post_dual_photo_badge")}
          </div>
        )}
        <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-[2] font-['JetBrains_Mono'] text-[8px] sm:text-[9px] uppercase tracking-[0.14em] text-white/70">
          {hasVariants
            ? t("post_flyer_styles_count", { n: variantCount })
            : (tpl.placeholders?.length ? t("post_template_fields", { n: tpl.placeholders.length }) : t("post_template_ready_short"))}
        </div>

        <div className="absolute inset-0 z-[3] hidden sm:flex items-center justify-center bg-[#7C3AED]/85 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <span className="text-white text-[11px] font-medium uppercase tracking-[0.12em] px-4 py-2 border border-white/50 rounded-full">
            {t("post_open_editor")}
          </span>
        </div>
      </div>

      <div className="mt-1.5 px-0.5 flex items-start justify-between gap-1">
        <p className="text-[#EDEBE8] text-[12px] sm:text-[13px] font-medium font-['Inter_Tight'] line-clamp-2 leading-snug flex-1">
          {tpl.label || tpl.id}
        </p>
        <Layers className="hidden sm:block w-3.5 h-3.5 text-[#5A5A5E] shrink-0 mt-0.5" />
      </div>
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/*  Editor error boundary (evita ecrã preto total em runtime)          */
/* ------------------------------------------------------------------ */

class PosterEditorErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    const { error } = this.state;
    const { onBack, t, children } = this.props;
    if (error) {
      return (
        <div className="max-w-[640px] mx-auto py-16 px-6 text-center" data-testid="posters-editor-error">
          <p className="text-[#F4F1EA] text-[18px] font-medium mb-2 font-['Inter_Tight']">
            {t("post_editor_error_title")}
          </p>
          <p className="text-[#8A8A8E] text-[14px] mb-6 leading-relaxed">
            {t("post_editor_error_desc")}
          </p>
          <button type="button" onClick={onBack} className="rp-action-primary !w-auto !inline-flex px-8">
            {t("post_back_templates")}
          </button>
        </div>
      );
    }
    return children;
  }
}

/* ------------------------------------------------------------------ */
/*  Editor                                                             */
/* ------------------------------------------------------------------ */

function Editor(props) {
  const {
    picked, onBack, values, setValues, photos, setPhotos, logo, setLogo,
    outputLang, setOutputLang,
    modelKey, setModelKey, models, openaiReady = true,
    aspect, setAspect, numOutputs, setNumOutputs,
    mood, setMood, paletteColors, setPaletteColors,
    customBlocks, setCustomBlocks,
    totalCost, perImageCost,
    busy, result, setResult,
    missing, onGenerate, genPhase, genProgress, user, lang,
    t, labelFor, catLabel,
  } = props;

  const photo = primaryStudioPhoto(photos);
  const photoCount = (Array.isArray(photos) ? photos : []).filter(Boolean).length;
  const dualPhotoStyle = isPosterDualPhotoTemplate(picked);

  const modelsForPicker = useMemo(() => {
    if (models?.length) return models;
    return FALLBACK_POSTER_MODELS;
  }, [models]);

  const usesPremiumWallet = modelKey === "gpt_image"
    || modelsForPicker.find((m) => m.key === modelKey)?.wallet === "premium";

  const promptPreview = useMemo(() => {
    try {
      return buildPosterPrompt(picked, values, {
        mood,
        paletteColors,
        customBlocks,
        hasPhoto: Boolean(photo),
        hasLogo: Boolean(logo),
        photoCount,
        outputLang: outputLang || lang || "pt",
      });
    } catch {
      return "";
    }
  }, [picked, values, mood, paletteColors, customBlocks, photo, logo, photoCount, outputLang, lang]);

  const { menu: menuFields, details: detailFields } = useMemo(
    () => splitPosterPlaceholders(picked),
    [picked],
  );

  const posterFormatItems = useMemo(() => {
    const mapped = [
      { key: "1:1", label: t("post_fmt_square"), hint: t("post_fmt_square_hint") },
      { key: "2:3", label: "Menu 2:3", hint: "1080×1620" },
      { key: "4:5", label: t("post_fmt_feed"), hint: t("post_fmt_feed_hint") },
      { key: "9:16", label: t("post_fmt_story"), hint: t("post_fmt_story_hint") },
      { key: "16:9", label: t("post_fmt_banner"), hint: t("post_fmt_banner_hint") },
      { key: "3:4", label: t("post_fmt_print"), hint: t("post_fmt_print_hint") },
    ];
    if (!photo) return mapped;
    return [
      { key: "match", label: t("aspect_original"), hint: t("aspect_original_hint") },
      ...mapped,
    ];
  }, [photo, t]);

  const fashionNeedsPhoto = isPosterFashionTemplate(picked) && !photo;
  const dualNeedsPhotos = dualPhotoStyle && photoCount < 2;

  const { ready: genReady, hint: genHint } = useStudioGenerateGate({
    busy,
    user,
    cost: totalCost,
    missingCount: missing.length + (fashionNeedsPhoto ? 1 : 0) + (dualNeedsPhotos ? 1 : 0),
    hintOverride: fashionNeedsPhoto
      ? t("post_fashion_photo_required")
      : dualNeedsPhotos
        ? t("post_dual_photo_required")
        : missing.length > 0
          ? `${t("post_fill")}: ${missing.map((k) => labelFor(k, picked?.placeholders?.indexOf(k))).join(", ")}`
          : null,
  });

  const genBusyLabel = genPhase === "upload"
    ? t("post_gen_uploading")
    : genProgress > 0
      ? t("post_gen_working", { n: genProgress })
      : numOutputs > 1
        ? t("post_generating_variations", { n: numOutputs })
        : t("post_generating_poster");

  return (
    <div className="max-w-[1400px] mx-auto pb-32 min-w-0" data-testid="posters-editor">
      <button
        onClick={onBack}
        className="rp-studio-back hidden md:inline-flex"
        data-testid="posters-back-to-grid"
      >
        <ArrowLeft className="w-4 h-4" /> {t("post_back_templates")}
      </button>

      {/* Header */}
      <div className="mb-6 md:mb-10 flex flex-col sm:flex-row items-start gap-3 sm:gap-5">
        <div
          className="shrink-0 w-14 h-[4.5rem] sm:w-16 sm:h-20 rounded-lg shadow-lg shadow-black/40 relative overflow-hidden"
          style={{ background: CAT_GRADIENTS[picked.category] }}
        >
          <div className="absolute inset-0 flex items-center justify-center text-white text-[8px] sm:text-[10px] font-mono uppercase tracking-[0.14em] sm:tracking-[0.18em] px-1.5 sm:px-2 text-center leading-tight">
            {catLabel(picked.category)}
          </div>
        </div>
        <div className="flex-1 min-w-0 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[#7C3AED] text-[10px] font-mono uppercase tracking-[0.16em] sm:tracking-[0.22em] mb-1.5 sm:mb-2 break-words">
              {catLabel(picked.category)}
            </p>
            <h1 className="text-[#F4F1EA] text-[22px] sm:text-[28px] md:text-[36px] font-light tracking-[-0.02em] mb-1.5 sm:mb-2 font-['Inter_Tight'] break-words leading-[1.1]">
              {picked.label || picked.id}
            </h1>
            <p className="text-[#8A8A8E] text-[13px] sm:text-[14px] max-w-[640px] leading-relaxed break-words">
              {picked.variantLabelKey
                ? t("post_template_variant_ready", { style: t(picked.variantLabelKey) })
                : t("post_template_ready")}
            </p>
          </div>
          <StudioHelpTip helpKey="help_page_posters" size="lg" testId="posters-page-help" className="shrink-0 mt-1" />
        </div>
      </div>

      {dualPhotoStyle && (
        <div className="mb-5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-100 leading-relaxed">
          {t("post_dual_photo_banner")}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_440px] gap-10">
        {/* ====== LEFT: form ====== */}
        <motion.div className="space-y-5">
          <PosterSection
            title={
              isPosterFoodTemplate(picked)
                ? t("post_sec_food_ref")
                : isPosterProductTemplate(picked)
                  ? t("post_sec_product_ref")
                  : isPosterFashionTemplate(picked)
                    ? t("post_sec_fashion_person")
                    : t("post_sec_ref")
            }
            optional={!isPosterFashionTemplate(picked)}
            defaultOpen
            hint={
              isPosterFoodTemplate(picked)
                ? t("post_sec_food_ref_hint")
                : isPosterProductTemplate(picked)
                  ? t("post_sec_product_ref_hint")
                  : isPosterFashionTemplate(picked)
                    ? t("post_sec_fashion_person_hint")
                    : t("post_sec_ref_hint")
            }
            helpKey="help_sec_post_photo"
          >
            <div className="max-w-[560px]">
              <ImageUploadZone
                multiple
                maxFiles={5}
                value={photos}
                onChange={setPhotos}
                layout="wide"
                testId="poster-photo"
                compressOptions={{ maxSize: 2048 }}
                emptyLabel={
                  isPosterFoodTemplate(picked)
                    ? t("post_food_upload_label")
                    : isPosterProductTemplate(picked)
                      ? t("post_product_upload_label")
                      : isPosterFashionTemplate(picked)
                        ? t("post_fashion_person_upload_label")
                        : dualPhotoStyle
                          ? t("post_dual_photo_upload_label")
                          : t("upload_drop")
                }
                emptyHint={
                  isPosterFoodTemplate(picked)
                    ? t("post_food_upload_hint")
                    : isPosterProductTemplate(picked)
                      ? t("post_product_upload_hint")
                      : isPosterFashionTemplate(picked)
                        ? t("post_fashion_person_upload_hint")
                        : dualPhotoStyle
                          ? t("post_dual_photo_upload_hint")
                          : t("tool_accept_formats")
                }
              />
            </div>
          </PosterSection>

          {isPosterFashionTemplate(picked) && (
            <PosterSection title={t("post_sec_fashion_garment")} optional hint={t("post_sec_fashion_garment_hint")} helpKey="help_sec_post_garment">
              <div className="max-w-[280px]">
                <ImageUploadZone
                  value={logo}
                  onChange={setLogo}
                  layout="square"
                  testId="poster-garment"
                  compressOptions={{ maxSize: 2048 }}
                  emptyLabel={t("post_fashion_garment_upload_label")}
                  emptyHint={t("post_fashion_garment_upload_hint")}
                />
              </div>
            </PosterSection>
          )}

          {isPosterFoodTemplate(picked) && (
            <PosterSection title={t("post_sec_logo")} optional hint={t("post_sec_logo_hint")} helpKey="help_sec_post_logo">
              <div className="max-w-[280px]">
                <ImageUploadZone
                  value={logo}
                  onChange={setLogo}
                  layout="square"
                  testId="poster-logo"
                  compressOptions={{ maxSize: 1024 }}
                  emptyLabel={t("post_logo_upload_label")}
                  emptyHint={t("post_logo_upload_hint")}
                />
              </div>
            </PosterSection>
          )}

          {isPosterFoodTemplate(picked) && (
            <PosterSection title={t("post_sec_output_lang")} hint={t("post_sec_output_lang_hint")} helpKey="help_sec_post_lang">
              <select
                value={outputLang}
                onChange={(e) => setOutputLang(e.target.value)}
                className="w-full max-w-xs bg-[#13131A] border border-[#2E2E30] focus:border-[#7C3AED] text-[#F4F1EA] text-[14px] px-4 py-3 rounded-lg focus:outline-none"
                data-testid="poster-output-lang"
              >
                {POSTER_OUTPUT_LANGS.map(({ key, labelKey }) => (
                  <option key={key} value={key}>{t(labelKey)}</option>
                ))}
              </select>
            </PosterSection>
          )}

          {menuFields.length > 0 && (
            <PosterSection title={t("post_sec_menu")} hint={t("post_sec_menu_hint")} helpKey="help_sec_post_menu">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {menuFields.map((p) => {
                  const fieldIndex = picked.placeholders.indexOf(p);
                  const isOptional = (picked.optional || []).includes(p);
                  const originalText = (picked.replacements || {})[p] || "";
                  return (
                    <div key={p}>
                      <label className="block text-[#F4F1EA] text-[12.5px] font-medium mb-1.5">
                        {labelFor(p, fieldIndex)}{" "}
                        {isOptional ? <span className="text-[#5A5A5E] text-[11px]">{t("post_optional")}</span> : <span className="text-[#7C3AED]">*</span>}
                      </label>
                      <input
                        value={values[p] || ""}
                        onChange={(e) => setValues({ ...values, [p]: e.target.value })}
                        placeholder={originalText || labelFor(p, fieldIndex)}
                        className="w-full bg-[#13131A] border border-[#2E2E30] focus:border-[#7C3AED] text-[#F4F1EA] text-[14px] px-4 py-3 rounded-lg"
                        data-testid={`field-${p}`}
                      />
                    </div>
                  );
                })}
              </div>
            </PosterSection>
          )}

          {detailFields.length > 0 && (
          <PosterSection
            title={isPosterMenuTemplate(picked) ? t("post_sec_business") : t("post_sec_details")}
            optional={picked.optional?.length === picked.placeholders.length}
            hint={picked.category === "flyer" ? t("post_hint_flyer") : t("post_hint_default")}
            helpKey="help_sec_post_details"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {detailFields.map((p) => {
                const idx = picked.placeholders.indexOf(p);
                const isOptional = (picked.optional || []).includes(p);
                const originalText = (picked.replacements || {})[p] || "";
                return (
                <div key={p} className={isLong(p) ? "sm:col-span-2" : ""}>
                  <label className="block text-[#F4F1EA] text-[12.5px] font-medium mb-1.5 font-['Inter_Tight']">
                    {labelFor(p, idx)}{" "}
                    {isOptional
                      ? <span className="text-[#5A5A5E] text-[11px] font-normal">{t("post_optional")}</span>
                      : <span className="text-[#7C3AED]">*</span>}
                  </label>
                  {isLong(p) ? (
                    <textarea
                      rows={2}
                      value={values[p] || ""}
                      onChange={(e) => setValues({ ...values, [p]: e.target.value })}
                      placeholder={originalText || `ex: ${labelFor(p, idx).toLowerCase()}...`}
                      className="w-full bg-[#13131A] border border-[#2E2E30] focus:border-[#7C3AED] text-[#F4F1EA] text-[14px] placeholder:text-[#5A5A5E] px-4 py-3 rounded-lg focus:outline-none resize-none font-['Inter_Tight']"
                      data-testid={`field-${p}`}
                    />
                  ) : (
                    <input
                      value={values[p] || ""}
                      onChange={(e) => setValues({ ...values, [p]: e.target.value })}
                      placeholder={originalText || `ex: ${labelFor(p, idx).toLowerCase()}...`}
                      className="w-full bg-[#13131A] border border-[#2E2E30] focus:border-[#7C3AED] text-[#F4F1EA] text-[14px] placeholder:text-[#5A5A5E] px-4 py-3 rounded-lg focus:outline-none font-['Inter_Tight']"
                      data-testid={`field-${p}`}
                    />
                  )}
                </div>
              );})}
            </div>
          </PosterSection>
          )}

          {!isPosterFashionTemplate(picked) && (
          <PosterSection
            title={t("post_sec_layers")}
            optional
            hint={t("post_sec_layers_hint")}
            helpKey="help_sec_post_layers"
          >
            <CustomTextLayersEditor blocks={customBlocks} onChange={setCustomBlocks} />
          </PosterSection>
          )}

          <PosterSection
            title={t("post_sec_mood")}
            optional
            hint={t("post_visual_hint")}
            helpKey="help_sec_post_mood"
          >
            <PosterMoodPalette
              mood={mood}
              setMood={setMood}
              paletteColors={paletteColors}
              setPaletteColors={setPaletteColors}
              moodIds={POSTER_MOOD_IDS}
              t={t}
            />
          </PosterSection>

          <PosterSection
            title={t("post_sec_engine")}
            hint={t("post_sec_engine_hint")}
            helpKey="help_sec_post_engine"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" data-testid="poster-models">
              {modelsForPicker.map((m) => {
                const Icon = MODEL_ICONS[m.key] || Zap;
                const disabled = m.key === "gpt_image" && !openaiReady;
                const active = modelKey === m.key;
                return (
                  <button
                    key={m.key}
                    onClick={() => !disabled && setModelKey(m.key)}
                    disabled={disabled}
                    data-testid={`poster-model-${m.key}`}
                    className={`relative text-left p-4 rounded-2xl border-2 transition-all overflow-hidden group ${
                      disabled
                        ? "border-[#1F1F22] bg-[#0E0E12]/40 opacity-50 cursor-not-allowed"
                        : active
                          ? "border-[#7C3AED] bg-[#7C3AED]/10"
                          : "border-[#2E2E30] bg-[#13131A]/50 hover:border-[#7C3AED]/40"
                    }`}
                  >
                    {m.key === "gpt_image" && !disabled && (
                      <div className="absolute -top-px -right-px bg-gradient-to-l from-[#FACC15] to-[#F59E0B] text-black text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-bl-lg">
                        HQ
                      </div>
                    )}
                    {active && (
                      <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#7C3AED]/20 blur-3xl pointer-events-none" />
                    )}
                    <div className="relative flex items-start justify-between mb-3">
                      <Icon className={`w-5 h-5 ${active ? "text-[#C4B5FD]" : "text-[#8A8A8E]"}`} strokeWidth={1.5} />
                      <div className="flex items-center gap-1">
                        {m.key === "gpt_image" && !disabled && (
                          <span
                            className="relative z-10"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                            role="presentation"
                          >
                            <StudioHelpTip helpKey="help_sec_post_hq" testId="poster-hq-help" />
                          </span>
                        )}
                        {active && (
                          <div className="w-5 h-5 rounded-full bg-[#7C3AED] flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </div>
                    <p className={`relative text-[15px] font-light tracking-[-0.01em] mb-1 font-['Inter_Tight'] ${
                      active ? "text-[#F4F1EA]" : "text-[#F4F1EA]/85"
                    }`}>{posterModelLabel(m, t)}</p>
                    <p className="relative text-[#8A8A8E] text-[11px] mb-2.5">{posterModelTag(m, t)}</p>
                    <p className="relative text-[12px] font-mono">
                      {m.wallet === "premium" || m.key === "gpt_image" ? (
                        <span className="text-[#FACC15]">{t("bill_hq_credits_count", { n: m.cost })}</span>
                      ) : (
                        <span className="text-[#C4B5FD]">{t("bill_credits_count", { n: m.cost })}</span>
                      )}
                    </p>
                  </button>
                );
              })}
            </div>
            {modelKey === "gpt_image" && openaiReady && (
              <p className="mt-3 text-[#FACC15]/90 text-[12px] leading-relaxed border border-[#FACC15]/25 rounded-xl px-4 py-3 bg-[#FACC15]/5">
                {t("post_hq_email_note")}
              </p>
            )}
          </PosterSection>

          <PosterSection
            title={t("post_sec_format")}
            hint={t("post_sec_format_hint")}
            helpKey="help_sec_post_format"
          >
            <AspectPicker
              value={
                aspect === "match" && !photo
                  ? (picked?.aspect || "4:5")
                  : (aspect || picked?.aspect || "4:5")
              }
              onChange={setAspect}
              items={posterFormatItems}
              columns="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-5"
              testIdPrefix="poster-format"
            />

            <div className="flex items-center justify-between p-4 rounded-xl border border-[#2E2E30] bg-[#13131A]/50">
              <div>
                <p className="text-[#F4F1EA] text-[13px] font-medium font-['Inter_Tight']">{t("post_gen_variations")}</p>
                <p className="text-[#8A8A8E] text-[11.5px] mt-0.5">
                  {t("post_variations_hint", { n: perImageCost })}
                </p>
              </div>
              <div className="inline-flex rounded-lg border border-[#2E2E30] p-0.5 bg-[#0B0B0C]" data-testid="poster-variations">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => setNumOutputs(n)}
                    className={`w-10 py-1.5 text-[12px] rounded-md transition-all font-['Inter_Tight'] ${
                      numOutputs === n
                        ? "bg-[#7C3AED] text-white shadow-sm shadow-[#7C3AED]/30"
                        : "text-[#8A8A8E] hover:text-[#F4F1EA]"
                    }`}
                    data-testid={`poster-variations-${n}`}
                  >
                    {n}×
                  </button>
                ))}
              </div>
            </div>
          </PosterSection>

          <PosterSection
            title={t("post_sec_prompt")}
            optional
            hint={t("post_sec_prompt_hint")}
            helpKey="help_sec_post_prompt"
          >
            <p
              className="text-[#8A8A8E] text-[11px] leading-relaxed font-mono max-h-40 overflow-y-auto whitespace-pre-wrap break-words"
              data-testid="poster-prompt-preview"
            >
              {promptPreview}
            </p>
          </PosterSection>
        </motion.div>

        {/* ====== RIGHT: result panel ====== */}
        <StudioResultAnchor busy={busy} ready={Boolean(primaryResultUrl(result))} className="xl:sticky xl:top-[80px] self-start">
          <p className="text-[#5A5A5E] text-[10px] font-mono uppercase tracking-[0.2em] mb-3">{t("post_preview_label")}</p>
          <PosterResult busy={busy} result={result} setResult={setResult} aspect={aspect} />
        </StudioResultAnchor>
      </div>

      <StudioGenerateBar
        ready={genReady}
        busy={busy}
        onClick={onGenerate}
        label={t("post_gen_btn", { n: totalCost })}
        busyLabel={genBusyLabel}
        hint={genHint || (missing.length > 0 ? `${t("post_fill")}: ${missing.map((k) => labelFor(k, picked?.placeholders?.indexOf(k))).join(", ")}` : null)}
        testId="poster-generate"
        costMeta={(
          <StudioGenerateCostMeta
            cost={totalCost}
            user={user}
            wallet={usesPremiumWallet ? "premium" : "standard"}
            extra={`${numOutputs}× ${perImageCost}`}
          />
        )}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Result panel for posters (supports multiple outputs)               */
/* ------------------------------------------------------------------ */

function posterPreviewAspect(result, fallbackAspect) {
  const stored = result?.aspect_ratio || result?.aspectRatio;
  if (stored && !["match", "match_input_image", "original", "auto"].includes(String(stored))) {
    return stored;
  }

  const model = String(result?.model_used || result?.modelUsed || "");
  const apiAspect = apiAspectRatio(fallbackAspect || "4:5", {
    model: "standard",
    hasPhoto: true,
  });

  if (/openai\/gpt-image/i.test(model)) {
    if (["3:4", "4:5", "9:16", "2:3", "1:2"].includes(apiAspect)) return "2:3";
  }

  if (apiAspect === "match_input_image") return fallbackAspect || "4:5";
  return apiAspect;
}

function PosterResult({ busy, result, setResult, aspect }) {
  const { t } = useStudioI18n();
  const previewAspect = posterPreviewAspect(result, aspect);
  const aspectClass = {
    "1:1":  "aspect-square",
    "4:5":  "aspect-[4/5]",
    "9:16": "aspect-[9/16]",
    "16:9": "aspect-[16/9]",
    "3:4":  "aspect-[3/4]",
    "2:3":  "aspect-[2/3]",
  }[previewAspect] || "aspect-[4/5]";

  if (busy) {
    return (
      <div className={`rounded-2xl bg-[#0E0E12] border border-[#2E2E30] ${aspectClass} flex flex-col items-center justify-center p-10 relative overflow-hidden`} data-testid="poster-loading">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.18),transparent_65%)] animate-pulse pointer-events-none" />
        <div className="relative w-14 h-14 rounded-full border-2 border-[#7C3AED]/30 border-t-[#C4B5FD] animate-spin mb-5" />
        <p className="relative text-[#F4F1EA] text-[14px] font-medium font-['Inter_Tight']">{t("post_composing")}</p>
        <p className="relative text-[#5A5A5E] text-[11px] font-mono uppercase mt-2 tracking-[0.18em]">30–120 seg</p>
      </div>
    );
  }
  if (!result) {
    return (
      <div className={`rounded-2xl bg-[#0E0E12] border border-dashed border-[#2E2E30] ${aspectClass} flex flex-col items-center justify-center p-10`} data-testid="poster-empty">
        <div className="w-12 h-12 rounded-full bg-[#7C3AED]/10 flex items-center justify-center mb-4">
          <ImageIcon className="w-5 h-5 text-[#C4B5FD]" strokeWidth={1.5} />
        </div>
        <p className="text-[#8A8A8E] text-[13px] text-center">{t("post_empty_here")}</p>
        <p className="text-[#5A5A5E] text-[11px] text-center mt-1.5">{t("post_fill_cta")}</p>
      </div>
    );
  }

  const urls = result.result_urls || [];
  const [main, ...rest] = urls;

  const download = async (url) => {
    try {
      const r = await fetch(url);
      const blob = await r.blob();
      const u = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = u;
      a.download = `remakepix-poster-${Date.now()}.jpg`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(u), 1000);
    } catch {
      toast.error("Falha ao baixar.");
    }
  };

  return (
    <div className="rounded-2xl bg-[#0E0E12] border border-[#2E2E30] overflow-hidden" data-testid="poster-result">
      <div className={`relative ${aspectClass} bg-[#0E0E12]`}>
        <img
          src={main}
          alt="Poster"
          className="absolute inset-0 w-full h-full object-contain object-center"
          crossOrigin="anonymous"
          data-testid="poster-result-image"
        />
      </div>
      {rest.length > 0 && (
        <div className="p-2 grid grid-cols-3 gap-2 border-t border-[#2E2E30]">
          {urls.map((u, i) => (
            <button
              key={i}
              onClick={() => setResult({ ...result, result_urls: [u, ...urls.filter((x) => x !== u)] })}
              className={`aspect-square rounded-md overflow-hidden border-2 transition-all ${
                u === main ? "border-[#7C3AED]" : "border-[#2E2E30] hover:border-[#7C3AED]/50"
              }`}
              data-testid={`poster-variant-${i}`}
            >
              <img src={u} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="p-3 flex flex-col gap-2 border-t border-[#2E2E30] bg-[#0B0B0C]/60">
        <PosterMotionFlyerButton
          imageUrl={main}
          creationId={result?.id}
          aspectRatio={previewAspect}
          testId="poster-motion-flyer-cta"
        />
        <div className="flex gap-2">
        <button
          onClick={() => download(main)}
          className="flex-1 bg-[#7C3AED] hover:bg-[#9333EA] text-white py-3 rounded-lg text-[12.5px] font-medium flex items-center justify-center gap-2 transition-colors"
          data-testid="poster-download"
        >
          {t("upscale_download")}
        </button>
        <a
          href={main}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-3 border border-[#2E2E30] hover:border-[#7C3AED]/50 text-[#8A8A8E] hover:text-[#F4F1EA] rounded-lg text-[12.5px] transition-colors flex items-center"
          data-testid="poster-open"
        >
          {t("common_open")}
        </a>
        </div>
      </div>
    </div>
  );
}

