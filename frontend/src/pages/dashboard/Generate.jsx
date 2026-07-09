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
import SettingCard from "../../components/studio/SettingCard";
import SettingModal from "../../components/studio/SettingModal";
import { applyGenerationSurcharges, getSurcharges } from "../../lib/creditPricing";
import { IMAGE_MODEL_OPTIONS, getImageModel, imageModelBaseCredits } from "../../lib/imageModelCatalog";

const SUBJECT_KEYS = [
  { value: "the man", labelKey: "studio_subj_man" },
  { value: "the woman", labelKey: "studio_subj_woman" },
  { value: "the person", labelKey: "studio_subj_person" },
];

// Modelos definidos em src/config/imageModels.json (Replicate)
const MODEL_OPTIONS = IMAGE_MODEL_OPTIONS;

function aspectApiModel(modelId) {
  const key = getImageModel(modelId).inputKey;
  if (key === "standard") return "standard";
  if (key === "pro") return "pro";
  return "flux";
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

  const [padrao, setPadrao] = useState([]);
  const [padraoCat, setPadraoCat] = useState("men");
  const [pickedStyle, setPickedStyle] = useState(null);
  const [subject, setSubject] = useState("the person");
  const [model, setModel] = useState("grok");
  const [openKey, setOpenKey] = useState(null);
  const openModal = (key) => setOpenKey(key);
  const closeModal = () => setOpenKey(null);

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
    // #region agent log
    fetch("http://127.0.0.1:7522/ingest/85cd46ef-59a7-4954-8db4-f9a1dbe4f482", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "df885c" }, body: JSON.stringify({ sessionId: "df885c", location: "Generate.jsx:generate", message: "generate submit", data: { mode, hdQuality, improve, cost, hasPhoto: Boolean(photo) }, timestamp: Date.now(), hypothesisId: "H-hd-generate" }) }).catch(() => {});
    // #endregion
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
      const data = await pollPrediction(submitData.prediction_id, {
        onTick: (sec) => setProgress(sec),
        credits_spent: submitData.credits_spent || cost,
        type: "image",
      });
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
  const qualityLabel = hdQuality ? "HD" : (t("quality_standard") || "Padrão");
  const styleLabel = picked ? picked.nome : (t("studio_styles_optional") || "Opcional");
  const modelOption = MODEL_OPTIONS.find((m) => m.id === model) || MODEL_OPTIONS[0];
  const modelLabel = modelOption.name;
  const modalTitle = {
    format: t("studio_acc_format"),
    quality: t("studio_hd_quality"),
    style: t("studio_acc_styles"),
    model: t("studio_model") || "Modelo",
  }[openKey] || "";

  return (
    <StudioCompactShell testId="generate-page" maxWidth="720px" className="pb-8">
      <StudioInlineHeader
        eyebrow={t("studio_eyebrow")}
        title={t("studio_title")}
        description={t("studio_desc")}
        testId="generate-header"
        helpKey="help_page_generate"
      />

      <div className="space-y-2.5">
          {/* Describe box (prompt + ícone de imagens) */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#141418]/80 p-3 md:p-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              maxLength={800}
              placeholder={photo ? t("studio_placeholder_photo") : t("studio_placeholder_text")}
              className="rp-editor-textarea rp-editor-textarea--compact min-h-[92px]"
              data-testid="prompt-input"
            />
            <div className="flex items-center justify-between gap-2 mt-3">
              <CompactImagePicker value={photos} onChange={setPhotos} maxFiles={5} testId="gen-photo" />
              <span className="text-[#5A5A5E] text-[10px] font-mono tabular-nums shrink-0">{prompt.length}/800</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <button type="button" onClick={() => navigate("/app/wizard")} className="rp-btn-surface" data-testid="open-wizard">
                <Wand2 className="w-3.5 h-3.5" strokeWidth={1.5} /> {t("studio_wizard")}
              </button>
              <button type="button" onClick={() => navigate("/app/suggest")} className="rp-btn-surface" data-testid="open-suggest">
                <Lightbulb className="w-3.5 h-3.5" strokeWidth={1.5} /> {t("studio_suggest")}
              </button>
            </div>
          </div>

          {/* Cartões de definição compactos (abrem em modal) */}
          <div className="mv-setting-grid">
            <SettingCard icon={Ratio} label={t("studio_acc_format")} value={aspectLabel} onOpen={() => openModal("format")} testId="gen-card-format" helpKey="help_sec_format" />
            <SettingCard icon={Gauge} label={t("studio_hd_quality")} value={qualityLabel} onOpen={() => openModal("quality")} testId="gen-card-quality" helpKey="help_ctrl_hd_quality" />
          </div>
          {!photo && (
            <SettingCard icon={Cpu} label={t("studio_model") || "Modelo"} value={modelLabel} onOpen={() => openModal("model")} testId="gen-card-model" helpKey="help_sec_model" />
          )}
          <SettingCard icon={Palette} label={t("studio_acc_styles")} value={styleLabel} onOpen={() => openModal("style")} testId="gen-card-style" helpKey="help_sec_styles" />

          {/* Melhorar prompt + Gerar (compacto, lado a lado) */}
          <div className="mv-setting-card mv-setting-card--static">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <PromptEnhanceToggle
                checked={improve}
                onChange={setImprove}
                locked={false}
                onLockedClick={undefined}
                testId="improve-toggle"
                cost={surcharges.enhancePrompt ?? 5}
              />
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
                buttonClassName="rp-gen-btn-inline"
                className="w-full sm:w-auto"
              />
            </div>
            <div className="mt-2 pt-2 border-t border-white/[0.06]">
              <StudioGenerateCostMeta cost={cost} user={user} />
            </div>
          </div>
      </div>

      <SettingModal open={openKey === "format"} title={modalTitle} onClose={closeModal}>
        <AspectPicker value={aspect} onChange={setAspect} hasPhoto={!!photo} testIdPrefix="aspect" />
        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="format-confirm">
          <Check className="w-4 h-4" /> {t("confirm") || "Confirmar"}
        </button>
      </SettingModal>

      <SettingModal open={openKey === "quality"} title={modalTitle} onClose={closeModal}>
        <div className="mv-picker__chips">
          <button type="button" onClick={() => setHdQuality(false)} className={`mktvid-chip ${!hdQuality ? "mktvid-chip-active" : ""}`} data-testid="quality-standard">
            {t("quality_standard") || "Padrão"}
          </button>
          <button type="button" onClick={() => setHdQuality(true)} className={`mktvid-chip ${hdQuality ? "mktvid-chip-active" : ""}`} data-testid="quality-hd">
            HD <span className="text-[#A855F7] font-mono text-[10px] ml-1">+{surcharges.hdImage ?? 8}</span>
          </button>
        </div>
        <div className="mt-2"><StudioHelpTip helpKey="help_ctrl_hd_quality" testId="hd-quality-help" size="lg" /></div>
        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="quality-confirm">
          <Check className="w-4 h-4" /> {t("confirm") || "Confirmar"}
        </button>
      </SettingModal>

      <SettingModal open={openKey === "model"} title={modalTitle} onClose={closeModal}>
        <p className="text-[12px] text-[#8A8A8E] mb-3 leading-relaxed">{t("help_sec_model")}</p>
        <div className="grid grid-cols-1 gap-2 max-h-[52vh] overflow-y-auto overscroll-contain pr-0.5" data-testid="model-grid">
          {MODEL_OPTIONS.map((m) => {
            const active = model === m.id;
            return (
              <button
                type="button"
                key={m.id}
                onClick={() => { setModel(m.id); closeModal(); }}
                className={`rp-model-row ${active ? "rp-model-row--active" : ""}`}
                data-testid={`model-${m.id}`}
              >
                <span className="rp-model-ico rp-model-ico--logo">
                  <img src={m.logo} alt="" className="h-6 w-6 object-contain" />
                </span>
                <span className="flex-1 text-left min-w-0">
                  <span className="block text-[13px] font-medium text-[#F4F1EA]">{m.name}</span>
                  <span className="block text-[10px] font-mono uppercase tracking-[0.12em] text-[#8A8A8E]">
                    {m.tagKey === "model_tag_default"
                      ? (t("model_tag_default") || "Padrão")
                      : m.tagKey === "model_tag_fast"
                        ? (t("model_tag_fast") || "Rápido")
                        : `${m.credits} ${t("credits")}`}
                    {m.tagKey ? ` · ${m.credits} ${t("credits")}` : ""}
                  </span>
                </span>
                {active && <Check className="w-4 h-4 text-[#A855F7] shrink-0" />}
              </button>
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
          <Check className="w-4 h-4" /> {t("confirm") || "Confirmar"}
        </button>
      </SettingModal>

      <GenerationBubble busy={busy} progress={progress} result={result} onChange={setResult} />
    </StudioCompactShell>
  );
}