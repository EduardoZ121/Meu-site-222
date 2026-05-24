import { Component, useEffect, useMemo, useState } from "react";
import {
  Loader2, Sparkles, ArrowLeft, Check, Layers, Crown, Zap, Aperture,
  Image as ImageIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { api, formatApiError, pollPrediction, uploadPost } from "../../lib/api";
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
import { POSTER_TEMPLATE_COVER_BY_ID } from "../../lib/posterTemplateCovers";
import {
  buildPosterPrompt,
  POSTER_MOOD_IDS,
  posterInitialValues,
  posterMissingFields,
} from "../../lib/posterPrompt";
import { PosterSection, CustomTextLayersEditor } from "../../components/poster/PosterEditorParts";
import PosterMoodPalette from "../../components/poster/PosterMoodPalette";
import AspectPicker from "../../components/AspectPicker";
import { apiAspectRatio } from "../../lib/apiAspectRatio";
import StudioResultAnchor from "../../components/StudioResultAnchor";
import StudioGenerateBar from "../../components/StudioGenerateBar";
import StudioGenerateCostMeta from "../../components/StudioGenerateCostMeta";
import { useStudioGenerateGate } from "../../lib/useStudioGenerateGate";
import { useI18n } from "../../lib/i18n";
import { useStudioI18n } from "../../lib/useStudioI18n";
import { posterFieldLabel, POSTER_CAT_KEYS } from "../../lib/posterFieldLocales";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CAT_ORDER = ["music", "food", "fitness", "motivational", "flyers"];

// Gradient backgrounds per category — gives visual hierarchy to template cards
const CAT_GRADIENTS = {
  music:     "linear-gradient(135deg,#0B0B0C 0%,#7C3AED 48%,#EC4899 100%)",
  food:      "linear-gradient(135deg,#1F1308 0%,#B45309 55%,#FACC15 100%)",
  fitness:   "linear-gradient(135deg,#020617 0%,#16A34A 52%,#BEF264 100%)",
  motivational: "linear-gradient(135deg,#111827 0%,#F59E0B 52%,#F4F1EA 100%)",
  flyers:    "linear-gradient(135deg,#1A1A1C 0%,#EF4444 55%,#FACC15 100%)",
  flyer:     "linear-gradient(135deg,#1A1A1C 0%,#EF4444 55%,#FACC15 100%)",
  editorial: "linear-gradient(135deg,#0F1419 0%,#2D3748 50%,#F4F1EA 100%)",
  epic:      "linear-gradient(135deg,#0B0B0C 0%,#7C3AED 50%,#FACC15 100%)",
  scifi:     "linear-gradient(135deg,#06122B 0%,#1E3A8A 55%,#06B6D4 100%)",
  hero:      "linear-gradient(135deg,#220505 0%,#7F1D1D 55%,#EF4444 100%)",
  phone:     "linear-gradient(135deg,#1B1340 0%,#7C3AED 50%,#EC4899 100%)",
};

const isLong = (k) => /text|description|tagline|story|notes|additional|caption|quote|details|deck|subhead|positions|extra_text/i.test(k);

const FORMATS = [
  { key: "1:1",  label: "Square",     hint: "Post · 1080×1080" },
  { key: "4:5",  label: "Feed Tall",  hint: "Post · 1080×1350" },
  { key: "9:16", label: "Story",      hint: "Story · 1080×1920" },
  { key: "16:9", label: "Banner",     hint: "Wide · 1920×1080" },
  { key: "3:4",  label: "A3 / Print", hint: "Vertical Print" },
];

const MODEL_ICONS = {
  grok: Zap,
  flux2: Aperture,
  gpt_image: Crown,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Posters() {
  const { t } = useStudioI18n();
  const { lang } = useI18n();
  const labelFor = (k) => posterFieldLabel(k, lang);
  const catLabel = (c) => (POSTER_CAT_KEYS[c] ? t(POSTER_CAT_KEYS[c]) : c);
  useTitle(t("sidebar_posters"));
  const navigate = useNavigate();
  const { refresh, user } = useAuth();
  const { region } = usePricing();

  const [templates, setTemplates] = useState([]);
  const [models, setModels] = useState([]);
  const [category, setCategory] = useState("flyers");
  const [picked, setPicked] = useState(null);

  // Editor state
  const [values, setValues] = useState({});
  const [photo, setPhoto] = useState(null);
  const [modelKey, setModelKey] = useState("grok");
  const [aspect, setAspect] = useState("");      // empty = template default (4:5)
  const [numOutputs, setNumOutputs] = useState(1);
  const [mood, setMood] = useState("");
  const [paletteColors, setPaletteColors] = useState([]);
  const [customBlocks, setCustomBlocks] = useState([]);

  const [busy, setBusy] = useState(false);
  const [genPhase, setGenPhase] = useState("");
  const [genProgress, setGenProgress] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get("/public/poster-templates")
      .then((r) => setTemplates(r.data.templates?.length ? r.data.templates : FALLBACK_POSTER_TEMPLATES))
      .catch(() => setTemplates(FALLBACK_POSTER_TEMPLATES));
    api.get("/public/poster-models")
      .then((r) => setModels(r.data.models?.length ? r.data.models : FALLBACK_POSTER_MODELS))
      .catch(() => setModels(FALLBACK_POSTER_MODELS));
  }, []);

  useEffect(() => {
    const pc = posterModelCosts(region);
    setModels((prev) => {
      const base = prev.length ? prev : FALLBACK_POSTER_MODELS;
      return base.map((m) => ({ ...m, cost: pc[m.key] ?? m.cost }));
    });
  }, [region]);

  const filtered = useMemo(() => templates.filter((t) => t.category === category), [templates, category]);

  const counts = useMemo(() => {
    const m = {};
    for (const t of templates) m[t.category] = (m[t.category] || 0) + 1;
    return m;
  }, [templates]);

  /** API legada pode devolver supports_photo:false no Premium — forçar desbloqueio com foto. */
  const engineModels = useMemo(
    () => models.map((m) => (m.key === "gpt_image" ? { ...m, supports_photo: true } : m)),
    [models],
  );

  const selectedModel = engineModels.find((m) => m.key === modelKey) || { cost: 24 };
  const totalCost = selectedModel.cost * numOutputs;

  const missing = useMemo(
    () => (picked ? posterMissingFields(picked, values) : []),
    [picked, values],
  );

  const openTemplate = (tpl) => {
    setPicked(tpl);
    setValues(posterInitialValues(tpl));
    setPhoto(null);
    setResult(null);
    setCustomBlocks([]);
    setMood("");
    setPaletteColors([]);
    setNumOutputs(1);
    // Default aspect ratio from prompt text (Vertical 4:5 / Square 1:1 etc.)
    const p = (tpl.prompt || "").toLowerCase();
    if (p.includes("9:16")) setAspect("9:16");
    else if (p.includes("16:9")) setAspect("16:9");
    else if (p.includes("1:1") || p.includes("square")) setAspect("1:1");
    else setAspect("4:5");
  };

  const generate = async () => {
    if (busy) return;
    if (!picked) { toast.error(t("post_pick_template")); return; }
    if (missing.length) {
      toast.error(`${t("post_fill")}: ${missing.map(labelFor).join(", ")}`, { duration: 8000 });
      return;
    }
    if ((user?.credits ?? 0) < totalCost && !user?.is_unlimited && user?.role !== "admin") {
      toast.error(t("common_need_credits", { need: totalCost, have: user?.credits ?? 0 }), { duration: 8000 });
      return;
    }

    const promptFinal = buildPosterPrompt(picked, values, {
      mood,
      paletteColors,
      customBlocks,
      hasPhoto: Boolean(photo),
    });

    const fd = new FormData();
    fd.append("template_id", picked.id);
    fd.append("template_category", picked.category || "");
    fd.append("prompt_final", promptFinal);
    fd.append("placeholders", JSON.stringify(values));
    fd.append("custom_blocks", JSON.stringify(customBlocks));
    fd.append("model_key", modelKey);
    fd.append("aspect_ratio", apiAspectRatio(aspect || picked.aspect || "4:5", { model: "standard" }));
    fd.append("num_outputs", String(numOutputs));
    fd.append("mood", mood || "");
    fd.append("palette_colors", JSON.stringify(paletteColors));
    fd.append("lang", lang || "en");
    if (photo) fd.append("photo", photo);

    setBusy(true);
    setResult(null);
    setGenProgress(0);
    setGenPhase("upload");

    let submitData;
    try {
      ({ data: submitData } = await uploadPost("/generate/poster", fd, {
        timeout: 90_000,
        headers: { "X-Skip-Auto-Poll": "1" },
        skipBlobOffload: !photo || photo.size < 3_500_000,
        blobOffloadTimeoutMs: 50_000,
      }));

      if (!submitData?.prediction_id) {
        throw new Error(t("common_no_result"));
      }

      setGenPhase("work");
      const polled = await pollPrediction(submitData.prediction_id, {
        onTick: (sec) => setGenProgress(sec),
        timeoutMs: 300_000,
        credits_spent: submitData.credits_spent ?? totalCost,
        type: "poster",
      });

      const normalized = normalizeCreation(polled?.creation);
      if (!primaryResultUrl(normalized)) throw new Error(t("common_no_result"));
      setResult(normalized);
      toast.success(t("post_success", { n: normalized?.credits_spent ?? submitData.credits_spent ?? totalCost }));
      await refresh();
    } catch (err) {
      const msg = formatApiError(err, t("post_fail"));
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
  if (picked) {
    return (
      <PosterEditorErrorBoundary onBack={() => setPicked(null)} t={t}>
      <Editor
        picked={picked}
        onBack={() => setPicked(null)}
        values={values} setValues={setValues}
        photo={photo} setPhoto={setPhoto}
        modelKey={modelKey} setModelKey={setModelKey}
        models={models}
        engineModels={engineModels}
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
    <div className="max-w-[1400px] mx-auto" data-testid="posters-page">
      <header className="mb-8 md:mb-10">
        <p className="text-[#7C3AED] text-[10px] font-mono uppercase tracking-[0.22em] mb-3">{t("sidebar_posters")}</p>
        <h1 className="text-[#F4F1EA] text-[36px] md:text-[52px] font-light tracking-[-0.02em] leading-[1.02] mb-3 font-['Inter_Tight']">
          {t("post_grid_title")}
        </h1>
        <p className="text-[#8A8A8E] text-[15px] max-w-[680px]">
          {t("post_grid_desc", { n: templates.length || 44 })}
        </p>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 mb-10" data-testid="poster-cats">
        {CAT_ORDER.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-4 py-2.5 rounded-full text-[12.5px] font-medium transition-all flex items-center gap-2 ${
              category === c
                ? "bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30"
                : "bg-[#13131A] border border-[#2E2E30] text-[#8A8A8E] hover:text-[#F4F1EA] hover:border-[#7C3AED]/40"
            }`}
            data-testid={`postercat-${c}`}
          >
            {catLabel(c)}
            <span className={`text-[10px] font-mono ${category === c ? "text-white/70" : "text-[#5A5A5E]"}`}>
              {counts[c] ?? "—"}
            </span>
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" data-testid="poster-templates-grid">
        {filtered.map((tpl, i) => (
          <TemplateCard key={tpl.id} tpl={tpl} index={i} onClick={() => openTemplate(tpl)} catLabel={catLabel} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Template card                                                      */
/* ------------------------------------------------------------------ */

function TemplateCard({ tpl, index, onClick, catLabel }) {
  const gradient = CAT_GRADIENTS[tpl.category] || CAT_GRADIENTS.editorial;
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.025, ease: [0.16, 1, 0.3, 1] }}
      className="group relative bg-[#13131A] border border-[#2E2E30] hover:border-[#7C3AED]/60 rounded-xl overflow-hidden text-left transition-all hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(124,58,237,0.45)]"
      data-testid={`tpl-${tpl.id}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden" style={{ background: gradient }}>
        <StyleCover
          id={tpl.id}
          title={tpl.label || tpl.id}
          prompt={tpl.prompt}
          category={tpl.category}
          eyebrow={catLabel(tpl.category)}
          compact
          coverSrc={POSTER_TEMPLATE_COVER_BY_ID[tpl.id] || ""}
        />
        {tpl.subtag && (
          <div className="absolute left-3 top-14 rounded-full border border-white/20 bg-black/25 px-2 py-1 font-['JetBrains_Mono'] text-[8px] uppercase tracking-[0.14em] text-white/70 backdrop-blur-sm">
            {tpl.subtag}
          </div>
        )}
        <div className="absolute bottom-3 right-3 font-['JetBrains_Mono'] text-[9px] uppercase tracking-[0.18em] text-white/70">
          {tpl.placeholders?.length ? `${tpl.placeholders.length} campos` : "Pronto"}
        </div>

        <div className="absolute inset-0 flex items-center justify-center bg-[#7C3AED]/85 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-white text-[12px] font-medium uppercase tracking-[0.15em] px-5 py-2.5 border border-white/50 rounded-full">
            Abrir editor →
          </span>
        </div>
      </div>

      {/* Footer strip */}
      <div className="px-4 py-3 flex items-center justify-between">
        <p className="text-[#F4F1EA] text-[13px] font-medium font-['Inter_Tight'] truncate">{tpl.label || tpl.id}</p>
        <Layers className="w-3.5 h-3.5 text-[#5A5A5E] shrink-0" />
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
    picked, onBack, values, setValues, photo, setPhoto,
    modelKey, setModelKey, models, engineModels,
    aspect, setAspect, numOutputs, setNumOutputs,
    mood, setMood, paletteColors, setPaletteColors,
    customBlocks, setCustomBlocks,
    totalCost, perImageCost,
    busy, result, setResult,
    missing, onGenerate, genPhase, genProgress, user,
    t, labelFor, catLabel,
  } = props;

  const modelsForPicker = useMemo(() => {
    if (engineModels?.length) return engineModels;
    if (models?.length) return models;
    return FALLBACK_POSTER_MODELS;
  }, [engineModels, models]);

  const promptPreview = useMemo(() => {
    try {
      return buildPosterPrompt(picked, values, {
        mood,
        paletteColors,
        customBlocks,
        hasPhoto: Boolean(photo),
      });
    } catch {
      return "";
    }
  }, [picked, values, mood, paletteColors, customBlocks, photo]);

  const { ready: genReady, hint: genHint } = useStudioGenerateGate({
    busy,
    user,
    cost: totalCost,
    missingCount: missing.length,
    hintOverride: missing.length > 0
      ? `${t("post_fill")}: ${missing.map(labelFor).join(", ")}`
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
    <div className="max-w-[1400px] mx-auto pb-32" data-testid="posters-editor">
      <button
        onClick={onBack}
        className="rp-studio-back"
        data-testid="posters-back-to-grid"
      >
        <ArrowLeft className="w-4 h-4" /> {t("post_back_templates")}
      </button>

      {/* Header */}
      <div className="mb-10 flex items-start gap-5">
        <div
          className="shrink-0 w-16 h-20 rounded-lg shadow-lg shadow-black/40 relative overflow-hidden"
          style={{ background: CAT_GRADIENTS[picked.category] }}
        >
          <div className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-mono uppercase tracking-[0.18em] px-2 text-center">
            {catLabel(picked.category)}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[#7C3AED] text-[10px] font-mono uppercase tracking-[0.22em] mb-2">
            {catLabel(picked.category)}
          </p>
          <h1 className="text-[#F4F1EA] text-[28px] md:text-[36px] font-light tracking-[-0.02em] mb-2 font-['Inter_Tight']">
            {picked.label || picked.id}
          </h1>
          <p className="text-[#8A8A8E] text-[14px] max-w-[640px] leading-relaxed">
            {t("post_template_ready")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_440px] gap-10">
        {/* ====== LEFT: form ====== */}
        <motion.div className="space-y-5">
          <PosterSection
            title={t("post_sec_ref")}
            optional
            defaultOpen
            hint={t("post_sec_ref_hint")}
          >
            <ImageUploadZone
              value={photo}
              onChange={setPhoto}
              layout="carousel"
              testId="poster-photo"
              emptyLabel={t("post_upload_label")}
              emptyHint={t("post_upload_hint")}
            />
          </PosterSection>

          {picked.placeholders && picked.placeholders.length > 0 && (
          <PosterSection
            title={t("post_sec_details")}
            optional={picked.optional?.length === picked.placeholders.length}
            hint={picked.category === "flyer" ? t("post_hint_flyer") : t("post_hint_default")}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {picked.placeholders.map((p) => {
                const isOptional = (picked.optional || []).includes(p);
                const originalText = (picked.replacements || {})[p] || "";
                return (
                <div key={p} className={isLong(p) ? "sm:col-span-2" : ""}>
                  <label className="block text-[#F4F1EA] text-[12.5px] font-medium mb-1.5 font-['Inter_Tight']">
                    {labelFor(p)}{" "}
                    {isOptional
                      ? <span className="text-[#5A5A5E] text-[11px] font-normal">{t("post_optional")}</span>
                      : <span className="text-[#7C3AED]">*</span>}
                  </label>
                  {isLong(p) ? (
                    <textarea
                      rows={2}
                      value={values[p] || ""}
                      onChange={(e) => setValues({ ...values, [p]: e.target.value })}
                      placeholder={originalText || `ex: ${labelFor(p).toLowerCase()}...`}
                      className="w-full bg-[#13131A] border border-[#2E2E30] focus:border-[#7C3AED] text-[#F4F1EA] text-[14px] placeholder:text-[#5A5A5E] px-4 py-3 rounded-lg focus:outline-none resize-none font-['Inter_Tight']"
                      data-testid={`field-${p}`}
                    />
                  ) : (
                    <input
                      value={values[p] || ""}
                      onChange={(e) => setValues({ ...values, [p]: e.target.value })}
                      placeholder={originalText || `ex: ${labelFor(p).toLowerCase()}...`}
                      className="w-full bg-[#13131A] border border-[#2E2E30] focus:border-[#7C3AED] text-[#F4F1EA] text-[14px] placeholder:text-[#5A5A5E] px-4 py-3 rounded-lg focus:outline-none font-['Inter_Tight']"
                      data-testid={`field-${p}`}
                    />
                  )}
                </div>
              );})}
            </div>
          </PosterSection>
          )}

          <PosterSection
            title={t("post_sec_layers")}
            optional
            hint={t("post_sec_layers_hint")}
          >
            <CustomTextLayersEditor blocks={customBlocks} onChange={setCustomBlocks} />
          </PosterSection>

          <PosterSection
            title={t("post_sec_mood")}
            optional
            hint={t("post_visual_hint")}
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
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" data-testid="poster-models">
              {modelsForPicker.map((m) => {
                const Icon = MODEL_ICONS[m.key] || Zap;
                const disabled = false;
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
                        Premium
                      </div>
                    )}
                    {active && (
                      <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#7C3AED]/20 blur-3xl pointer-events-none" />
                    )}
                    <div className="relative flex items-start justify-between mb-3">
                      <Icon className={`w-5 h-5 ${active ? "text-[#C4B5FD]" : "text-[#8A8A8E]"}`} strokeWidth={1.5} />
                      {active && (
                        <div className="w-5 h-5 rounded-full bg-[#7C3AED] flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <p className={`relative text-[15px] font-light tracking-[-0.01em] mb-1 font-['Inter_Tight'] ${
                      active ? "text-[#F4F1EA]" : "text-[#F4F1EA]/85"
                    }`}>{m.label}</p>
                    <p className="relative text-[#8A8A8E] text-[11px] mb-2.5">{m.tag}</p>
                    <p className="relative text-[#C4B5FD] text-[12px] font-mono">
                      {t("bill_credits_count", { n: m.cost })}
                    </p>
                  </button>
                );
              })}
            </div>
          </PosterSection>

          <PosterSection
            title={t("post_sec_format")}
            hint={t("post_sec_format_hint")}
          >
            <AspectPicker
              value={aspect || picked?.aspect || "4:5"}
              onChange={setAspect}
              items={FORMATS.map(({ key, label, hint }) => ({ key, label, hint }))}
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
          <p className="text-[#5A5A5E] text-[10px] font-mono uppercase tracking-[0.2em] mb-3">Preview</p>
          <PosterResult busy={busy} result={result} setResult={setResult} aspect={aspect} />
        </StudioResultAnchor>
      </div>

      <StudioGenerateBar
        ready={genReady}
        busy={busy}
        onClick={onGenerate}
        label={t("post_gen_btn", { n: totalCost })}
        busyLabel={genBusyLabel}
        hint={genHint || (missing.length > 0 ? `${t("post_fill")}: ${missing.map(labelFor).join(", ")}` : null)}
        testId="poster-generate"
        costMeta={(
          <StudioGenerateCostMeta
            cost={totalCost}
            user={user}
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

function PosterResult({ busy, result, setResult, aspect }) {
  const { t } = useStudioI18n();
  const aspectClass = {
    "1:1":  "aspect-square",
    "4:5":  "aspect-[4/5]",
    "9:16": "aspect-[9/16]",
    "16:9": "aspect-[16/9]",
    "3:4":  "aspect-[3/4]",
  }[aspect] || "aspect-[4/5]";

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
      <div className={`relative ${aspectClass} bg-black`}>
        <img src={main} alt="Poster" className="absolute inset-0 w-full h-full object-contain" crossOrigin="anonymous" data-testid="poster-result-image" />
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
      <div className="p-3 flex gap-2 border-t border-[#2E2E30] bg-[#0B0B0C]/60">
        <button
          onClick={() => download(main)}
          className="flex-1 bg-[#7C3AED] hover:bg-[#9333EA] text-white py-3 rounded-lg text-[12.5px] font-medium flex items-center justify-center gap-2 transition-colors"
          data-testid="poster-download"
        >
          Baixar Alta Resolução
        </button>
        <a
          href={main}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-3 border border-[#2E2E30] hover:border-[#7C3AED]/50 text-[#8A8A8E] hover:text-[#F4F1EA] rounded-lg text-[12.5px] transition-colors flex items-center"
          data-testid="poster-open"
        >
          Abrir
        </a>
      </div>
    </div>
  );
}

