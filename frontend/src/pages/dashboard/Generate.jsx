import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles, ImagePlus, Wand2, Lightbulb } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api, pollPrediction, trackPendingPrediction, uploadPost } from "../../lib/api";
import { normalizeCreation, primaryResultUrl } from "../../lib/creationUrls";
import { useAuth } from "../../lib/auth";
import { usePricing } from "../../lib/PricingContext";
import { useI18n } from "../../lib/i18n";
import { useStudioI18n } from "../../lib/useStudioI18n";
import { toast } from "sonner";
import PhotoUpload from "../../components/PhotoUpload";
import AspectPicker from "../../components/AspectPicker";
import ResultPanel from "../../components/ResultPanel";
import StudioResultAnchor from "../../components/StudioResultAnchor";
import StyleCover from "../../components/StyleCover";
import { FALLBACK_PADRAO_STYLES } from "../../lib/publicFallbacks";
import { PADRAO_STYLE_COVER_BY_ID } from "../../lib/padraoStyleCovers";
import useTitle from "../../lib/useTitle";
import StudioAccordionSection from "../../components/StudioAccordionSection";
import StudioGenerateBar from "../../components/StudioGenerateBar";
import { readUserSettings } from "../../lib/userSettings";
import { usePhotoAspectDefault, ASPECT_MATCH } from "../../lib/usePhotoAspectDefault";
import { apiAspectRatio } from "../../lib/apiAspectRatio";
import { useStudioGenerateGate } from "../../lib/useStudioGenerateGate";
import StudioPhotoUploadNotice, { isPhotoUploadBusy } from "../../components/studio/StudioPhotoUploadNotice";
import PromptEnhanceToggle from "../../components/promptAssist/PromptEnhanceToggle";
import { applyGenerationSurcharges, getSurcharges } from "../../lib/creditPricing";

const SUBJECT_KEYS = [
  { value: "the man", labelKey: "studio_subj_man" },
  { value: "the woman", labelKey: "studio_subj_woman" },
  { value: "the person", labelKey: "studio_subj_person" },
];

export default function Generate() {
  const { t, lang } = useI18n();
  const { errToast, clearUploadToast } = useStudioI18n();
  useTitle(t("sidebar_generate"));
  const { refresh, user, refundCredits } = useAuth();
  const { costs, region } = usePricing();
  const surcharges = useMemo(() => getSurcharges(region), [region]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [photo, setPhoto] = useState(null);
  const [photoUploadStatus, setPhotoUploadStatus] = useState("idle");
  const photoUploading = isPhotoUploadBusy(photoUploadStatus);
  const [prompt, setPrompt] = useState(searchParams.get("prompt") || "");
  const [improve, setImprove] = useState(false);
  const [hdQuality, setHdQuality] = useState(false);
  const settingsFallback = (() => {
    const d = readUserSettings().aspect_ratio_default || "4:5";
    return d === ASPECT_MATCH ? "4:5" : d;
  })();
  const [aspect, setAspect] = usePhotoAspectDefault(photo, settingsFallback, settingsFallback);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(0);

  const [showStyles, setShowStyles] = useState(true);
  const [padrao, setPadrao] = useState([]);
  const [padraoCat, setPadraoCat] = useState("men");
  const [pickedStyle, setPickedStyle] = useState(null);
  const [subject, setSubject] = useState("the person");

  useEffect(() => {
    api.get("/public/padrao-styles")
      .then((r) => setPadrao(r.data.styles?.length ? r.data.styles : FALLBACK_PADRAO_STYLES))
      .catch(() => setPadrao(FALLBACK_PADRAO_STYLES));
  }, []);

  const padraoCats = useMemo(() => Array.from(new Set(padrao.map((s) => s.cat))), [padrao]);
  const padraoFiltered = padrao.filter((s) => s.cat === padraoCat);
  const picked = padrao.find((s) => s.id === pickedStyle);

  const catLabel = (c) => t(`cat_${c}`) || c;

  const { mode, cost, ctaLabel } = useMemo(() => {
    if (photo && pickedStyle) return { mode: "easy", cost: costs.easy, ctaLabel: t("studio_cta_easy", { n: costs.easy }) };
    if (photo && !pickedStyle) return { mode: "edit", cost: costs.edit, ctaLabel: t("studio_cta_edit", { n: costs.edit }) };
    if (!photo && pickedStyle) return { mode: "blocked", cost: 0, ctaLabel: t("studio_cta_blocked") };
    const textCost = applyGenerationSurcharges(costs.image, surcharges, {
      improvePrompt: improve,
      hdQuality,
      hdMode: "image",
    });
    return { mode: "text", cost: textCost, ctaLabel: t("studio_cta_text", { n: textCost }) };
  }, [photo, pickedStyle, costs, surcharges, t, improve, hdQuality]);

  const generateReady = mode !== "blocked"
    && (mode === "easy" || prompt.trim().length >= 3);

  const { ready: gateReady, hint: gateHint } = useStudioGenerateGate({
    busy,
    user,
    cost,
    uploading: photoUploading,
    readyOverride: generateReady,
    hintOverride: mode === "blocked"
      ? t("studio_gen_hint_blocked")
      : (mode === "text" || mode === "edit") && prompt.trim().length < 3
        ? t("studio_gen_hint_prompt")
        : null,
  });

  const generate = async () => {
    if (photoUploading) {
      toast.message(t("upload_wait_generate"), { duration: 6000 });
      return;
    }
    if (mode === "blocked") { toast.error(t("studio_err_blocked")); return; }
    if (mode === "text" && prompt.trim().length < 3) {
      toast.error(t("studio_err_text"));
      return;
    }
    if (mode === "edit" && prompt.trim().length < 3) {
      toast.error(t("studio_err_edit"));
      return;
    }
    if ((user?.credits ?? 0) < cost) {
      toast.error(t("studio_err_credits", { need: cost, have: user?.credits ?? 0 }));
      return;
    }

    clearUploadToast();
    setBusy(true); setResult(null); setProgress(0);
    let submitData;
    try {
      if (mode === "easy") {
        const fd = new FormData();
        fd.append("photo", photo);
        fd.append("style_id", pickedStyle);
        fd.append("subject", subject);
        fd.append("aspect_ratio", apiAspectRatio(aspect, { model: "standard", hasPhoto: true }));
        fd.append("lang", lang || "en");
        if (prompt.trim()) fd.append("extra_prompt", prompt.trim());
        ({ data: submitData } = await uploadPost("/generate/easy", fd, { timeout: 120000, headers: { "X-Skip-Auto-Poll": "1" } }));
      } else if (mode === "edit") {
        const fd = new FormData();
        fd.append("photo", photo);
        fd.append("prompt", prompt.trim());
        fd.append("aspect_ratio", apiAspectRatio(aspect, { model: "standard", hasPhoto: true }));
        fd.append("lang", lang || "en");
        ({ data: submitData } = await uploadPost("/generate/edit", fd, { timeout: 120000, headers: { "X-Skip-Auto-Poll": "1" } }));
      } else {
        ({ data: submitData } = await api.post("/generate/image", {
          prompt: prompt.trim(),
          mode: "advanced",
          aspect_ratio: apiAspectRatio(aspect, { model: "standard", hasPhoto: false }),
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

  return (
    <div className="rp-studio-shell max-w-[1200px] mx-auto pb-28" data-testid="generate-page">
      <header className="mb-10 pb-8 border-b border-[rgba(244,241,234,0.06)]">
        <p className="rp-editor-section-cap mb-2">{t("studio_eyebrow")}</p>
        <h1 className="rp-studio-page-title mb-3 font-['Inter_Tight']">{t("studio_title")}</h1>
        <p className="rp-studio-page-desc">{t("studio_desc")}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-10">
        <div className="space-y-4">
          <StudioAccordionSection title={t("studio_acc_photo")} defaultOpen={false} testId="studio-acc-photo">
            <div className="flex items-baseline justify-end mb-3">
              {photo && (
                <button type="button" onClick={() => setPhoto(null)} className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#8A8A8E] hover:text-[#F4F1EA] transition-colors">{t("remove")}</button>
              )}
            </div>
            <div className="max-w-[420px]">
              <PhotoUpload
                value={photo}
                onChange={(f) => setPhoto(f || null)}
                onStatusChange={setPhotoUploadStatus}
                testId="gen-photo"
              />
              <StudioPhotoUploadNotice status={photoUploadStatus} className="mt-3" />
            </div>
          </StudioAccordionSection>

          <StudioAccordionSection title={t("studio_acc_prompt")} defaultOpen testId="studio-acc-prompt">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              maxLength={800}
              placeholder={photo ? t("studio_placeholder_photo") : t("studio_placeholder_text")}
              className="rp-editor-textarea min-h-[120px]"
              data-testid="prompt-input"
            />
            <div className="flex flex-col gap-2.5 mt-3">
              <PromptEnhanceToggle
                checked={improve}
                onChange={setImprove}
                locked={false}
                onLockedClick={undefined}
                testId="improve-toggle"
                cost={surcharges.enhancePrompt ?? 3}
              />
              <label className="inline-flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={hdQuality}
                  disabled={false}
                  onChange={(e) => {
                    setHdQuality(e.target.checked);
                  }}
                  className="accent-[#7C3AED] w-3.5 h-3.5 rounded border-[#2E2E30]"
                  data-testid="hd-quality-toggle"
                />
                <span className="text-[#8A8A8E] text-[12px] font-['Inter_Tight']">
                  {t("studio_hd_quality")}{" "}
                  <span className="text-[#A855F7] font-mono text-[10px]">+{surcharges.hdImage ?? 8}</span>
                </span>
              </label>
            </div>
            <div className="flex justify-end mt-2">
              <span className="text-[#5A5A5E] text-[10px] font-mono tabular-nums">{prompt.length}/800</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <button type="button" onClick={() => navigate("/app/wizard")} className="rp-btn-surface" data-testid="open-wizard">
                <Wand2 className="w-3.5 h-3.5" strokeWidth={1.5} /> {t("studio_wizard")}
              </button>
              <button type="button" onClick={() => navigate("/app/suggest")} className="rp-btn-surface" data-testid="open-suggest">
                <Lightbulb className="w-3.5 h-3.5" strokeWidth={1.5} /> {t("studio_suggest")}
              </button>
            </div>
          </StudioAccordionSection>

          <StudioAccordionSection
            title={t("studio_acc_styles")}
            defaultOpen={false}
            testId="studio-acc-styles"
            titleClassName="studio-customize-title"
          >
            <button type="button" onClick={() => setShowStyles(!showStyles)} className="flex items-center gap-2 w-full text-left rp-editor-section-cap !text-[#a89bc9] hover:!text-[#c4b8e6] transition-colors mb-4" data-testid="toggle-styles">
              {t("studio_styles_toggle")} <span className="text-[#5A5A5E] font-['Inter_Tight'] normal-case tracking-normal text-[12px] font-normal">{t("studio_styles_optional")}</span>
              <span className="text-[#5A5A5E] ml-auto font-mono text-[11px]">{showStyles ? "−" : "+"}</span>
            </button>
            {pickedStyle && picked && (
              <div className="mb-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[rgba(124,58,237,0.35)] bg-[rgba(124,58,237,0.08)]">
                <span className="text-[#E9E4DC] text-[12px] font-medium font-['Inter_Tight']">{picked.nome}</span>
                <button type="button" onClick={() => setPickedStyle(null)} className="text-[#8A8A8E] hover:text-[#F4F1EA] text-lg leading-none w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/5" aria-label={t("studio_remove_style")}>×</button>
              </div>
            )}
            {showStyles && (
              <>
                <div className="flex flex-wrap gap-2 mb-4" data-testid="subject-bar">
                  {SUBJECT_KEYS.map((s) => (
                    <button type="button" key={s.value} onClick={() => setSubject(s.value)} className={`rp-pill ${subject === s.value ? "rp-pill-active" : ""}`} data-testid={`subj-${s.value.replace(/\s/g, "-")}`}>
                      {t(s.labelKey)}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mb-4" data-testid="padrao-cats">
                  {padraoCats.map((c) => (
                    <button type="button" key={c} onClick={() => { setPadraoCat(c); setPickedStyle(null); }} className={`rp-pill ${padraoCat === c ? "rp-pill-active" : ""}`} data-testid={`pcat-${c}`}>
                      {catLabel(c)}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto pr-1" data-testid="padrao-grid">
                  {padraoFiltered.map((s) => (
                    <button type="button" key={s.id} onClick={() => setPickedStyle(pickedStyle === s.id ? null : s.id)} className={`rp-style-card-shell relative aspect-[3/4] overflow-hidden rounded-xl text-left transition-all border group ${pickedStyle === s.id ? "border-rp-purple ring-2 ring-rp-purple/35 shadow-[0_0_36px_-10px_rgba(168,85,247,0.55),inset_0_0_0_1px_rgba(255,255,255,0.06)]" : "border-rp-border hover:border-rp-purple/45 hover:shadow-[0_16px_40px_-20px_rgba(124,58,237,0.35)]"} ${s.locked ? "opacity-90" : ""}`} data-testid={`pstyle-${s.id}`}>
                      <StyleCover id={s.id} title={s.nome} prompt={s.prompt} category={s.cat} eyebrow={catLabel(s.cat)} premium={s.locked} selected={pickedStyle === s.id} coverSrc={PADRAO_STYLE_COVER_BY_ID[s.id] || ""} />
                    </button>
                  ))}
                </div>
              </>
            )}
          </StudioAccordionSection>

          <StudioAccordionSection title={t("studio_acc_format")} defaultOpen testId="studio-acc-format">
            <AspectPicker value={aspect} onChange={setAspect} hasPhoto={!!photo} testIdPrefix="aspect" />
            <StudioGenerateBar
              layout="inline"
              ready={gateReady}
              busy={busy}
              onClick={generate}
              label={ctaLabel}
              busyLabel={progress > 0 ? t("studio_generating", { n: progress }) : t("studio_sending")}
              hint={gateHint}
              testId="generate-button"
              className="mt-8"
              alignHint="center"
            />
            <p className="text-[#6b6b70] text-[11px] mt-3 text-center font-['Inter_Tight']">
              {t("studio_balance")} <span className="text-[#C4B5FD] font-medium tabular-nums">{user?.is_unlimited ? "∞" : (user?.credits ?? 0)}</span> {t("credits")}
            </p>
          </StudioAccordionSection>
        </div>

        <StudioResultAnchor busy={busy} ready={Boolean(primaryResultUrl(result))} className="lg:sticky lg:top-[88px] self-start space-y-3">
          <p className="rp-editor-section-cap !text-[#6b6b70]">{t("last_result")}</p>
          <div className="rp-editor-panel overflow-hidden p-4 sm:p-5">
            <ResultPanel creation={result} loading={busy} onChange={setResult} emptyLabel={t("studio_result_next")} />
          </div>
        </StudioResultAnchor>
      </div>
    </div>
  );
}