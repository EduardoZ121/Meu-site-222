import { useEffect, useMemo, useState } from "react";
import {
  Wand2, Lightbulb, Ratio, Palette, Gauge, Check, Cpu,
} from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api, trackPendingPrediction, uploadPost, pollPrediction } from "../../lib/api";
import { normalizeCreation, primaryResultUrl } from "../../lib/creationUrls";
import { useAuth } from "../../lib/auth";
import { usePricing } from "../../lib/PricingContext";
import { useI18n } from "../../lib/i18n";
import { useStudioI18n } from "../../lib/useStudioI18n";
import { toast } from "sonner";
import CompactImagePicker from "../../components/studio/CompactImagePicker";
import { appendStudioPhotos, primaryStudioPhoto } from "../../lib/studioFormData";
import AspectPicker from "../../components/AspectPicker";
import GenerationBubble from "../../components/studio/GenerationBubble";
import StyleCover from "../../components/StyleCover";
import { FALLBACK_PADRAO_STYLES } from "../../lib/publicFallbacks";
import { PADRAO_STYLE_COVER_BY_ID } from "../../lib/padraoStyleCovers";
import useTitle from "../../lib/useTitle";
import StudioGenerateBar from "../../components/StudioGenerateBar";
import StudioCompactShell from "../../components/studio/StudioCompactShell";
import StudioInlineHeader from "../../components/studio/StudioInlineHeader";
import StudioGenerateCostMeta from "../../components/StudioGenerateCostMeta";
import { readUserSettings } from "../../lib/userSettings";
import { usePhotoAspectDefault, ASPECT_MATCH } from "../../lib/usePhotoAspectDefault";
import { apiAspectRatio } from "../../lib/apiAspectRatio";
import { hasStudioCredits, useStudioGenerateGate } from "../../lib/useStudioGenerateGate";
import PromptEnhanceToggle from "../../components/promptAssist/PromptEnhanceToggle";
import StudioHelpTip from "../../components/studio/StudioHelpTip";
import { PROMPT_MAX_LENGTH } from "../../lib/promptLimits";
import SettingCard from "../../components/studio/SettingCard";
import SettingModal from "../../components/studio/SettingModal";
import { applyGenerationSurcharges, getSurcharges } from "../../lib/creditPricing";
import { IMAGE_MODEL_OPTIONS, getImageModel, imageModelBaseCredits } from "../../lib/imageModelCatalog";
import { imageModelBlurbKey, imageModelProvider } from "../../lib/imageModelMeta";

const SUBJECT_KEYS = [
  { value: "the man", labelKey: "studio_subj_man" },
  { value: "the woman", labelKey: "studio_subj_woman" },
  { value: "the person", labelKey: "studio_subj_person" },
];

const PROMPT_ROTATE_KEYS = [
  "studio_ph_rotate_1",
  "studio_ph_rotate_2",
  "studio_ph_rotate_3",
];

// Modelos definidos em src/config/imageModels.json (Replicate)
const MODEL_OPTIONS = IMAGE_MODEL_OPTIONS;

function aspectApiModel(modelId) {
  const key = getImageModel(modelId).inputKey;
  if (key === "standard") return "standard";
  if (key === "pro") return "pro";
  return "flux";
}

function useRotatingPlaceholder(keys, enabled, intervalMs = 4200) {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (!enabled || keys.length < 2) return undefined;
    const id = window.setInterval(() => {
      setFade(false);
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % keys.length);
        setFade(true);
      }, 220);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [enabled, keys, intervalMs]);

  return { key: keys[index % keys.length], fade };
}

export default function Generate() {
  const { t, lang } = useI18n();
  const { errToast, clearUploadToast } = useStudioI18n();
  useTitle(t("sidebar_generate"));
  const { refresh, user, refundCredits } = useAuth();
  const { costs, region } = usePricing();
  const surcharges = useMemo(() => getSurcharges(region), [region]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [photos, setPhotos] = useState([]);
  const photo = primaryStudioPhoto(photos);
  const [prompt, setPrompt] = useState(searchParams.get("prompt") || "");
  const [improve, setImprove] = useState(false);
  const [hdQuality, setHdQuality] = useState(false);
  const settingsFallback = (() => {
    const d = readUserSettings().aspect_ratio_default || "4:5";
    return d === ASPECT_MATCH ? "4:5" : d;
  })();
  const [aspect, setAspect] = usePhotoAspectDefault(photos, settingsFallback, settingsFallback);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [promptFocused, setPromptFocused] = useState(false);

  const [padrao, setPadrao] = useState([]);
  const [padraoCat, setPadraoCat] = useState("men");
  const [pickedStyle, setPickedStyle] = useState(null);
  const [subject, setSubject] = useState("the person");
  const [model, setModel] = useState("grok");
  const [openKey, setOpenKey] = useState(null);
  const openModal = (key) => setOpenKey(key);
  const closeModal = () => setOpenKey(null);

  const rotate = useRotatingPlaceholder(PROMPT_ROTATE_KEYS, !prompt.trim());

  useEffect(() => {
    api.get("/public/padrao-styles")
      .then((r) => setPadrao(r.data.styles?.length ? r.data.styles : FALLBACK_PADRAO_STYLES))
      .catch(() => setPadrao(FALLBACK_PADRAO_STYLES));
  }, []);

  const padraoCats = useMemo(() => Array.from(new Set(padrao.map((s) => s.cat))), [padrao]);
  const padraoFiltered = padrao.filter((s) => s.cat === padraoCat);
  const picked = padrao.find((s) => s.id === pickedStyle);

  const catLabel = (c) => t(`cat_${c}`) || c;

  const { mode, cost, ctaLabel, styleNeedsPhoto } = useMemo(() => {
    if (photo && pickedStyle) {
      const easyCost = applyGenerationSurcharges(costs.easy, surcharges, { hdQuality, hdMode: "image" });
      return { mode: "easy", cost: easyCost, ctaLabel: t("studio_cta_easy", { n: easyCost }), styleNeedsPhoto: false };
    }
    if (photo && !pickedStyle) {
      const editCost = applyGenerationSurcharges(costs.edit, surcharges, { improvePrompt: improve, hdQuality, hdMode: "image" });
      return { mode: "edit", cost: editCost, ctaLabel: t("studio_cta_edit", { n: editCost }), styleNeedsPhoto: false };
    }
    const textCost = applyGenerationSurcharges(imageModelBaseCredits(model, costs), surcharges, {
      improvePrompt: improve,
      hdQuality,
      hdMode: "image",
    });
    return {
      mode: "text",
      cost: textCost,
      ctaLabel: t("studio_cta_text", { n: textCost }),
      styleNeedsPhoto: Boolean(pickedStyle),
    };
  }, [photo, pickedStyle, costs, surcharges, t, improve, hdQuality, model]);

  const generateReady = mode === "easy" || prompt.trim().length >= 3;

  const { ready: gateReady, hint: gateHint } = useStudioGenerateGate({
    busy,
    user,
    cost,
    readyOverride: generateReady,
    hintOverride: (mode === "text" || mode === "edit") && prompt.trim().length < 3
      ? t("studio_gen_hint_prompt")
      : null,
  });

  const generate = async () => {
    if (mode === "text" && prompt.trim().length < 3) {
      toast.error(t("studio_err_text"));
      return;
    }
    if (mode === "edit" && prompt.trim().length < 3) {
      toast.error(t("studio_err_edit"));
      return;
    }
    if (!hasStudioCredits(user, cost)) {
      toast.error(t("studio_err_credits", { need: cost, have: user?.credits ?? 0 }));
      return;
    }
    if (styleNeedsPhoto) {
      toast.message(t("studio_style_ignored_hint"));
    }

    clearUploadToast();
    setBusy(true); setResult(null); setProgress(0);
    let submitData;
    try {
      if (mode === "easy") {
        if (!photo) {
          toast.error(t("studio_gen_hint_photo"));
          setBusy(false);
          return;
        }
        const fd = new FormData();
        appendStudioPhotos(fd, photos);
        fd.append("style_id", pickedStyle);
        fd.append("subject", subject);
        fd.append("aspect_ratio", apiAspectRatio(aspect, {
          model: "standard",
          hasPhoto: Boolean(photo) && (aspect === "match" || aspect === ASPECT_MATCH),
        }));
        fd.append("lang", lang || "en");
        if (prompt.trim()) fd.append("extra_prompt", prompt.trim());
        if (hdQuality) fd.append("hd_quality", "1");
        ({ data: submitData } = await uploadPost("/generate/easy", fd, { timeout: 120000, headers: { "X-Skip-Auto-Poll": "1" } }));
      } else if (mode === "edit") {
        if (!photo) {
          toast.error(t("studio_gen_hint_photo"));
          setBusy(false);
          return;
        }
        const fd = new FormData();
        appendStudioPhotos(fd, photos);
        fd.append("prompt", prompt.trim());
        fd.append("aspect_ratio", apiAspectRatio(aspect, {
          model: "standard",
          hasPhoto: Boolean(photo) && (aspect === "match" || aspect === ASPECT_MATCH),
        }));
        fd.append("lang", lang || "en");
        if (improve) fd.append("improve_prompt", "1");
        if (hdQuality) fd.append("hd_quality", "1");
        ({ data: submitData } = await uploadPost("/generate/edit", fd, { timeout: 120000, headers: { "X-Skip-Auto-Poll": "1" } }));
      } else {
        ({ data: submitData } = await api.post("/generate/image", {
          prompt: prompt.trim(),
          mode: "advanced",
          model,
          aspect_ratio: apiAspectRatio(aspect, {
            model: aspectApiModel(model),
            hasPhoto: false,
          }),
          num_outputs: 1,
          improve_prompt: improve,
          hd_quality: hdQuality,
          lang: lang || "en",
        }, { timeout: 60000, headers: { "X-Skip-Auto-Poll": "1" } }));
      }

      trackPendingPrediction(submitData.prediction_id, {
        credits_spent: submitData.credits_spent || cost,
        type: "image",
      });
      // If axios interceptor already polled (skip header missed), reuse result.
      let data = submitData;
      if (!data?.creation?.result_urls?.length) {
        if (!submitData?.prediction_id) {
          throw new Error("Resposta inválida do servidor (sem prediction_id).");
        }
        data = await pollPrediction(submitData.prediction_id, {
          onTick: (sec) => setProgress(sec),
          credits_spent: submitData.credits_spent || cost,
          type: "image",
        });
      }
      const creation = normalizeCreation(data?.creation);
      if (!primaryResultUrl(creation)) throw new Error(t("common_no_result"));
      setResult(creation);
      toast.success(t("studio_success", { n: creation?.credits_spent ?? cost }));
      await refresh();
    } catch (err) {
      errToast(err);
      if (err?.refunded && submitData?.credits_spent && !submitData?.server_billing) {
        refundCredits?.(submitData.credits_spent, t("studio_refund_desc"));
      }
      console.error("Generation error:", err);
      try { await refresh(); } catch { /* ignore */ }
    } finally { setBusy(false); setProgress(0); }
  };

  const aspectLabel = (aspect === "match" || aspect === ASPECT_MATCH)
    ? (t("aspect_original") || t("aspect_match") || "Original")
    : String(aspect || "4:5").toUpperCase();
  const qualityLabel = hdQuality ? "HD" : (t("quality_standard"));
  const styleLabel = picked
    ? picked.nome
    : (t("studio_styles_none") || t("studio_styles_optional"));
  const modelOption = MODEL_OPTIONS.find((m) => m.id === model) || MODEL_OPTIONS[0];
  const modelProvider = imageModelProvider(modelOption);
  const blurbKey = imageModelBlurbKey(modelOption);
  const blurbRaw = blurbKey ? t(blurbKey) : "";
  const modelBlurb = blurbRaw && blurbRaw !== blurbKey
    ? blurbRaw
    : modelOption.tagKey === "model_tag_default"
      ? (t("model_tag_default"))
      : modelOption.tagKey === "model_tag_fast"
        ? (t("model_tag_fast"))
        : `${modelOption.credits} ${t("credits")}`;
  const modelMeta = [modelProvider, modelBlurb].filter(Boolean).join(" · ");
  const modelLabel = modelOption.name;
  const modalTitle = {
    format: t("studio_card_format") || t("studio_acc_format"),
    quality: t("studio_card_quality") || t("studio_hd_quality"),
    style: t("studio_card_style") || t("studio_acc_styles"),
    model: t("studio_card_model") || t("studio_model"),
  }[openKey] || "";

  const rotatingPh = t(rotate.key);
  const fallbackPh = photo ? t("studio_placeholder_photo") : t("studio_placeholder_text");
  const showOverlayPh = !prompt.trim();

  const summaryStrip = (
    <div className="rp-gen-summary" data-testid="gen-summary">
      <span className="rp-gen-summary__item">
        <span className="rp-gen-summary__k">{t("studio_card_model")}</span>
        <span className="rp-gen-summary__v">{!photo ? modelLabel : "—"}</span>
      </span>
      <span className="rp-gen-summary__item">
        <span className="rp-gen-summary__k">{t("studio_card_format")}</span>
        <span className="rp-gen-summary__v rp-gen-summary__v--mono">{aspectLabel}</span>
      </span>
      <span className="rp-gen-summary__item">
        <span className="rp-gen-summary__k">{t("studio_card_quality")}</span>
        <span className="rp-gen-summary__v rp-gen-summary__v--mono">{qualityLabel}</span>
      </span>
      <span className="rp-gen-summary__item">
        <span className="rp-gen-summary__k">{t("studio_card_style")}</span>
        <span className="rp-gen-summary__v">{styleLabel}</span>
      </span>
      <span className="rp-gen-summary__item rp-gen-summary__item--credits">
        <span className="rp-gen-summary__k">{t("label_credits") || "Créditos"}</span>
        <span className="rp-gen-summary__v rp-gen-summary__v--mono rp-gen-summary__v--accent">{cost}</span>
      </span>
    </div>
  );

  return (
    <StudioCompactShell testId="generate-page" maxWidth="720px" className="rp-gen-page pb-8">
      <StudioInlineHeader
        eyebrow={t("studio_eyebrow")}
        title={t("studio_title")}
        description={t("studio_desc")}
        testId="generate-header"
        helpKey="help_page_generate"
      />

      <div className="rp-gen-stack">
        <div className={`rp-gen-prompt-card${promptFocused ? " rp-gen-prompt-card--focus" : ""}`}>
          <div className="rp-gen-prompt-wrap">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onFocus={() => setPromptFocused(true)}
              onBlur={() => setPromptFocused(false)}
              rows={4}
              maxLength={PROMPT_MAX_LENGTH}
              placeholder={showOverlayPh ? "" : fallbackPh}
              className="rp-gen-textarea"
              data-testid="prompt-input"
              aria-label={t("studio_acc_prompt")}
            />
            {showOverlayPh ? (
              <span
                className={`rp-gen-placeholder${rotate.fade ? " rp-gen-placeholder--in" : " rp-gen-placeholder--out"}`}
                aria-hidden
              >
                {rotatingPh && rotatingPh !== rotate.key ? rotatingPh : fallbackPh}
              </span>
            ) : null}
          </div>
          <div className="rp-gen-prompt-footer">
            <CompactImagePicker value={photos} onChange={setPhotos} maxFiles={5} testId="gen-photo" showMultiHint />
            <span className="rp-gen-charcount">{prompt.length}/{PROMPT_MAX_LENGTH}</span>
          </div>
          <div className="rp-gen-glass-row">
            <button type="button" onClick={() => navigate("/app/wizard")} className="rp-gen-glass-btn" data-testid="open-wizard">
              <Wand2 className="w-3.5 h-3.5" strokeWidth={1.5} /> {t("studio_wizard")}
            </button>
            <button type="button" onClick={() => navigate("/app/suggest")} className="rp-gen-glass-btn" data-testid="open-suggest">
              <Lightbulb className="w-3.5 h-3.5" strokeWidth={1.5} /> {t("studio_suggest")}
            </button>
          </div>
        </div>

        <div className="mv-setting-grid">
          <SettingCard
            icon={Ratio}
            label={t("studio_card_format") || t("studio_acc_format")}
            value={aspectLabel}
            onOpen={() => openModal("format")}
            testId="gen-card-format"
            helpKey="help_sec_format"
          />
          <SettingCard
            icon={Gauge}
            label={t("studio_card_quality") || t("studio_hd_quality")}
            value={qualityLabel}
            onOpen={() => openModal("quality")}
            testId="gen-card-quality"
            helpKey="help_ctrl_hd_quality"
          />
        </div>
        {!photo && (
          <SettingCard
            icon={Cpu}
            label={t("studio_card_model") || t("studio_model")}
            value={modelLabel}
            meta={modelMeta}
            onOpen={() => openModal("model")}
            testId="gen-card-model"
            helpKey="help_sec_model"
            className="rp-gen-model-card"
          />
        )}
        <SettingCard
          icon={Palette}
          label={t("studio_card_style") || t("studio_acc_styles")}
          value={styleLabel}
          onOpen={() => openModal("style")}
          testId="gen-card-style"
          helpKey="help_sec_styles"
        />

        <div className="rp-gen-refine-card">
          <PromptEnhanceToggle
            checked={improve}
            onChange={setImprove}
            locked={false}
            onLockedClick={undefined}
            testId="improve-toggle"
            cost={surcharges.enhancePrompt ?? 5}
          />
        </div>

        {summaryStrip}

        <div className="mv-setting-card mv-setting-card--static rp-gen-inline-cta" data-testid="generate-inline-wrap">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-end">
            <StudioGenerateBar
              layout="inline"
              ready={gateReady}
              busy={busy}
              onClick={generate}
              label={ctaLabel}
              busyLabel={progress > 0 ? t("studio_generating", { n: progress }) : t("studio_sending")}
              hint={gateHint}
              cost={cost}
              testId="generate-button"
              buttonClassName="rp-gen-btn-inline rp-gen-cta w-full sm:w-auto"
              className="w-full sm:w-auto"
            />
          </div>
          <div className="mt-2 pt-2 border-t border-white/[0.06]">
            <StudioGenerateCostMeta cost={cost} user={user} className="rp-gen-cost-meta" />
          </div>
        </div>
      </div>

      <SettingModal open={openKey === "format"} title={modalTitle} onClose={closeModal}>
        <AspectPicker value={aspect} onChange={setAspect} hasPhoto={!!photo} testIdPrefix="aspect" />
        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="format-confirm">
          <Check className="w-4 h-4" /> {t("confirm")}
        </button>
      </SettingModal>

      <SettingModal open={openKey === "quality"} title={modalTitle} onClose={closeModal}>
        <div className="mv-picker__chips">
          <button type="button" onClick={() => setHdQuality(false)} className={`mktvid-chip ${!hdQuality ? "mktvid-chip-active" : ""}`} data-testid="quality-standard">
            {t("quality_standard")}
          </button>
          <button type="button" onClick={() => setHdQuality(true)} className={`mktvid-chip ${hdQuality ? "mktvid-chip-active" : ""}`} data-testid="quality-hd">
            HD <span className="text-[#A855F7] font-mono text-[10px] ml-1">+{surcharges.hdImage ?? 8}</span>
          </button>
        </div>
        <div className="mt-2"><StudioHelpTip helpKey="help_ctrl_hd_quality" testId="hd-quality-help" size="lg" /></div>
        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="quality-confirm">
          <Check className="w-4 h-4" /> {t("confirm")}
        </button>
      </SettingModal>

      <SettingModal open={openKey === "model"} title={modalTitle} onClose={closeModal}>
        <div className="flex items-start gap-2 mb-3">
          <p className="rp-gen-model-help flex-1 m-0">{t("help_sec_model")}</p>
          <StudioHelpTip helpKey="help_sec_model" testId="model-section-help" size="lg" />
        </div>
        <div className="grid grid-cols-1 gap-2 max-h-[52vh] overflow-y-auto overscroll-contain pr-0.5" data-testid="model-grid">
          {MODEL_OPTIONS.map((m) => {
            const active = model === m.id;
            const provider = imageModelProvider(m);
            const mBlurbKey = imageModelBlurbKey(m);
            const mBlurbRaw = mBlurbKey ? t(mBlurbKey) : "";
            const mBlurb = mBlurbRaw && mBlurbRaw !== mBlurbKey
              ? mBlurbRaw
              : m.tagKey === "model_tag_default"
                ? (t("model_tag_default"))
                : m.tagKey === "model_tag_fast"
                  ? (t("model_tag_fast"))
                  : `${m.credits} ${t("credits")}`;
            const modelHelpKey = `help_model_${m.id}`;
            return (
              <div
                key={m.id}
                className={`rp-model-row ${active ? "rp-model-row--active" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => { setModel(m.id); closeModal(); }}
                  className="flex flex-1 items-center gap-3 min-w-0 text-left bg-transparent border-0 p-0 cursor-pointer"
                  data-testid={`model-${m.id}`}
                >
                  <span className="rp-model-ico rp-model-ico--logo">
                    <img src={m.logo} alt="" className="h-6 w-6 object-contain" />
                  </span>
                  <span className="flex-1 text-left min-w-0">
                    <span className="rp-gen-model-name">{m.name}</span>
                    <span className="block text-[10px] font-mono uppercase tracking-[0.12em] text-[#8A8A8E]">
                      {[provider, mBlurb].filter(Boolean).join(" · ")}
                      {` · ${m.credits} ${t("credits")}`}
                    </span>
                  </span>
                  {active && <Check className="w-4 h-4 text-[#A855F7] shrink-0" />}
                </button>
                <StudioHelpTip helpKey={modelHelpKey} testId={`model-help-${m.id}`} />
              </div>
            );
          })}
        </div>
      </SettingModal>

      <SettingModal open={openKey === "style"} title={modalTitle} onClose={closeModal}>
        {pickedStyle && picked && (
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[rgba(124,58,237,0.35)] bg-[rgba(124,58,237,0.08)] text-[#E9E4DC] text-[12px] font-medium">
              {picked.nome}
              <button type="button" onClick={() => setPickedStyle(null)} className="text-[#8A8A8E] hover:text-[#F4F1EA] text-lg leading-none" aria-label={t("studio_remove_style")}>×</button>
            </span>
          </div>
        )}
        {styleNeedsPhoto && (
          <p className="mb-3 text-[#C4B5FD] text-[12px] leading-relaxed" data-testid="studio-style-needs-photo">{t("studio_style_needs_photo")}</p>
        )}
        <div className="flex flex-wrap gap-2 mb-3" data-testid="subject-bar">
          {SUBJECT_KEYS.map((s) => (
            <button type="button" key={s.value} onClick={() => setSubject(s.value)} className={`rp-pill ${subject === s.value ? "rp-pill-active" : ""}`} data-testid={`subj-${s.value.replace(/\s/g, "-")}`}>
              {t(s.labelKey)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3" data-testid="padrao-cats">
          {padraoCats.map((c) => (
            <button type="button" key={c} onClick={() => { setPadraoCat(c); setPickedStyle(null); }} className={`rp-pill text-[11px] sm:text-[12px] px-2.5 py-1 sm:px-3 sm:py-1.5 ${padraoCat === c ? "rp-pill-active" : ""}`} data-testid={`pcat-${c}`}>
              {catLabel(c)}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[46vh] overflow-y-auto overscroll-contain pr-0.5" data-testid="padrao-grid">
          {padraoFiltered.map((s) => (
            <button
              type="button"
              key={s.id}
              onClick={() => setPickedStyle(pickedStyle === s.id ? null : s.id)}
              className={`group flex h-full flex-col text-left rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 ${pickedStyle === s.id ? "ring-2 ring-rp-purple/50" : ""} ${s.locked ? "opacity-90" : ""}`}
              data-testid={`pstyle-${s.id}`}
            >
              <div className={`relative aspect-[4/5] overflow-hidden rounded-xl border ${pickedStyle === s.id ? "border-rp-purple shadow-[0_0_24px_-8px_rgba(168,85,247,0.45)]" : "border-white/[0.08] group-hover:border-rp-purple/40"}`}>
                <StyleCover
                  id={s.id}
                  title={s.nome}
                  prompt={s.prompt}
                  category={s.cat}
                  imageOnly
                  selected={pickedStyle === s.id}
                  coverSrc={PADRAO_STYLE_COVER_BY_ID[s.id] || ""}
                  className="absolute inset-0 h-full w-full"
                />
              </div>
              <p className="mt-1 px-0.5 text-[10px] sm:text-[11px] text-[#EDEBE8] font-medium line-clamp-2 leading-snug">
                {s.nome}
              </p>
            </button>
          ))}
        </div>
        <button type="button" onClick={closeModal} className="rp-modal-confirm" data-testid="style-confirm">
          <Check className="w-4 h-4" /> {t("confirm")}
        </button>
      </SettingModal>

      <GenerationBubble busy={busy} progress={progress} result={result} onChange={setResult} />
    </StudioCompactShell>
  );
}
