import { useCallback, useEffect, useMemo, useState } from "react";
import { Sparkles, Sliders } from "lucide-react";
import { api, formatApiError, uploadPost } from "../../lib/api";
import { normalizeCreation, primaryResultUrl } from "../../lib/creationUrls";
import { useAuth } from "../../lib/auth";
import { usePricing } from "../../lib/PricingContext";
import { toast } from "sonner";
import ResultPanel from "../../components/ResultPanel";
import StudioResultAnchor from "../../components/StudioResultAnchor";
import AspectPicker from "../../components/AspectPicker";
import { apiAspectRatio } from "../../lib/apiAspectRatio";
import { usePhotoAspectDefault } from "../../lib/usePhotoAspectDefault";
import StyleCover from "../../components/StyleCover";
import ImageUploadZone from "../../components/ImageUploadZone";
import { FALLBACK_PRO_PRESETS } from "../../lib/publicFallbacks";
import { proPresetCoverSrc } from "../../lib/proPresetCovers";
import useTitle from "../../lib/useTitle";
import { useI18n } from "../../lib/i18n";
import StudioGenerateBar from "../../components/StudioGenerateBar";
import StudioGenerateCostMeta from "../../components/StudioGenerateCostMeta";
import StudioCompactShell from "../../components/studio/StudioCompactShell";
import StudioInlineHeader from "../../components/studio/StudioInlineHeader";
import CollapsibleSection from "../../components/CollapsibleSection";
import StudioPhotoUploadNotice, { isPhotoUploadBusy } from "../../components/studio/StudioPhotoUploadNotice";
import { useStudioGenerateGate } from "../../lib/useStudioGenerateGate";
import { useStudioI18n } from "../../lib/useStudioI18n";

function ProStep({ title, hint, children, defaultOpen = false, helpKey }) {
  return (
    <CollapsibleSection title={title} hint={hint} defaultOpen={defaultOpen} helpKey={helpKey}>
      {children}
    </CollapsibleSection>
  );
}

export default function Pro() {
  const { t } = useI18n();
  const { errToast, clearUploadToast } = useStudioI18n();
  useTitle(t("pro_page_title"));
  const { refresh, user } = useAuth();
  const { costs } = usePricing();
  const CAT_LABELS = {
    realism: t("pro_cat_realism"),
    mood: t("pro_cat_mood"),
    enhance: t("pro_cat_enhance"),
  };
  const CAT_DESC = {
    realism: t("pro_cat_realism_desc"),
    mood: t("pro_cat_mood_desc"),
    enhance: t("pro_cat_enhance_desc"),
  };
  const [presets, setPresets] = useState([]);
  const [category, setCategory] = useState("realism");
  const [preset, setPreset] = useState("ultra_real");
  const [photo, setPhoto] = useState(null);
  const [aspect, setAspect] = usePhotoAspectDefault(photo, "4:5", "4:5");
  const [intensity, setIntensity] = useState(55);
  const [customPrompt, setCustomPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [photoUploadStatus, setPhotoUploadStatus] = useState("idle");
  const cost = costs.pro;
  const photoUploading = isPhotoUploadBusy(photoUploadStatus);

  useEffect(() => {
    api.get("/public/pro-presets")
      .then((r) => setPresets(r.data.presets?.length ? r.data.presets : FALLBACK_PRO_PRESETS))
      .catch(() => setPresets(FALLBACK_PRO_PRESETS));
  }, []);

  const cats = ["realism", "mood", "enhance"];
  const filtered = useMemo(() => presets.filter((p) => p.category === category), [presets, category]);
  const pickedPreset = presets.find((p) => p.id === preset);

  const intensityLabel = intensity < 34
    ? t("pro_intensity_subtle")
    : intensity > 66
      ? t("pro_intensity_intense")
      : t("pro_intensity_balanced");

  const { ready, hint } = useStudioGenerateGate({
    busy,
    user,
    cost,
    requirePhoto: true,
    photo,
    requirePreset: true,
    preset,
    uploading: photoUploading,
  });

  const generate = useCallback(async () => {
    if (photoUploading) {
      toast.message(t("upload_wait_generate"), { duration: 6000 });
      return;
    }
    if (!photo) { toast.error(t("pro_upload_photo")); return; }
    if (!preset) { toast.error(t("pro_pick_preset")); return; }
    clearUploadToast();
    setBusy(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append("photo", photo);
      fd.append("preset_id", preset);
      fd.append("aspect_ratio", apiAspectRatio(aspect, {
        model: "pro",
        hasPhoto: aspect === "match",
      }));
      fd.append("extra_prompt", customPrompt.trim());
      fd.append("intensity", String(intensity));
      const { data } = await uploadPost("/generate/pro", fd, { timeout: 180000 });
      const creation = normalizeCreation(data?.creation);
      if (!primaryResultUrl(creation)) throw new Error(t("pro_no_result"));
      setResult(creation);
      toast.success(t("pro_success", { n: creation?.credits_spent ?? cost }));
      await refresh();
    } catch (err) {
      errToast(err);
    } finally { setBusy(false); }
  }, [
    photoUploading,
    photo,
    preset,
    clearUploadToast,
    aspect,
    customPrompt,
    intensity,
    cost,
    refresh,
    t,
    errToast,
  ]);

  return (
    <StudioCompactShell testId="pro-page" maxWidth="1400px" className="pb-4 md:pb-8">
      <StudioInlineHeader
        eyebrow={t("pro_cap")}
        title={`${t("pro_title_a")} ${t("pro_title_b")}${t("pro_title_dot")}`}
        description={t("pro_empty")}
        testId="pro-header"
        helpKey="help_page_pro"
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-3 xl:gap-8">
        <div className="rp-studio-card-stack">
            <ProStep title={t("pro_step_photo")} hint={t("pro_upload_hint")} defaultOpen helpKey="help_sec_upload">
              <div className="max-w-[560px]">
                <ImageUploadZone
                  value={photo}
                  onChange={setPhoto}
                  onStatusChange={setPhotoUploadStatus}
                  layout="wide"
                  testId="pro-photo"
                  compressOptions={{ maxSize: 2048 }}
                  emptyLabel={t("upload_drop")}
                  emptyHint={t("pro_upload_hint")}
                />
              </div>
            </ProStep>

            <ProStep title={t("pro_step_family")} helpKey="help_sec_presets">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5" data-testid="pro-cats">
                {cats.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`rp-select-card text-left p-3.5 ${category === c ? "rp-select-card-active" : ""}`}
                    data-testid={`procat-${c}`}
                  >
                    <p className={`text-[13px] font-semibold font-['Inter_Tight'] mb-0.5 ${category === c ? "text-[#C4B5FD]" : "text-[#F4F1EA]"}`}>
                      {CAT_LABELS[c]}
                    </p>
                    <p className="text-[#8A8A8E] text-[11px] leading-snug">{CAT_DESC[c]}</p>
                    <p className="text-[#5A5A5E] text-[10px] font-mono uppercase tracking-wider mt-1.5">
                      {t("pro_presets_count", { n: presets.filter((p) => p.category === c).length })}
                    </p>
                  </button>
                ))}
              </div>
            </ProStep>

            <ProStep
              title={t("pro_step_preset")}
              hint={pickedPreset ? pickedPreset.nome : undefined}
              helpKey="help_sec_presets"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" data-testid="pro-presets">
                {filtered.map((p) => {
                  const active = preset === p.id;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setPreset(p.id)}
                      className={`pro-preset-card ${active ? "pro-preset-card--active" : ""}`}
                      data-testid={`preset-${p.id}`}
                    >
                      <StyleCover
                        id={p.id}
                        title={p.nome}
                        prompt={p.prompt}
                        category={p.category}
                        eyebrow={CAT_LABELS[p.category] || p.category}
                        selected={active}
                        compact
                        coverSrc={proPresetCoverSrc(p.id)}
                        className="pro-preset-card__cover"
                      />
                    </button>
                  );
                })}
              </div>
            </ProStep>

            <ProStep title={t("pro_step_intensity")} helpKey="help_sec_intensity">
              <div
                className="pro-intensity-track max-w-[520px]"
                style={{ "--pro-intensity-pct": `${intensity}%` }}
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 text-[#8A8A8E]">
                    <Sliders className="w-4 h-4 text-purple-400/80" strokeWidth={1.75} />
                    <span className="text-[11px] font-mono uppercase tracking-[0.12em]">{t("pro_step_intensity")}</span>
                  </div>
                  <span className="text-[#E9D5FF] text-sm font-semibold font-['Inter_Tight'] tabular-nums">
                    {intensityLabel} · {intensity}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={intensity}
                  onChange={(e) => setIntensity(+e.target.value)}
                  className="pro-intensity-range"
                  data-testid="pro-intensity"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={intensity}
                />
                <div className="flex justify-between text-[10px] text-zinc-600 mt-2.5 px-0.5 font-mono uppercase tracking-[0.1em]">
                  <span>{t("pro_intensity_subtle")}</span>
                  <span>{t("pro_intensity_balanced")}</span>
                  <span>{t("pro_intensity_intense")}</span>
                </div>
              </div>
            </ProStep>

            <ProStep title={`${t("pro_step_extra")} (${t("studio_styles_optional")})`} helpKey="help_sec_custom_prompt">
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={3}
                maxLength={300}
                placeholder={t("pro_extra_ph")}
                className="rp-editor-textarea rp-editor-textarea--compact min-h-[88px] max-w-[560px]"
                data-testid="pro-custom"
              />
            </ProStep>

            <ProStep title={t("pro_step_format")} helpKey="help_sec_format">
              <div className="max-w-[560px]">
                <AspectPicker
                  value={aspect}
                  onChange={setAspect}
                  hasPhoto={!!photo}
                  testIdPrefix="pro-aspect"
                  premium
                />
              </div>
            </ProStep>
        </div>

        <StudioResultAnchor busy={busy} ready={Boolean(primaryResultUrl(result))} className="xl:sticky xl:top-[72px] self-start space-y-2">
          <p className="hidden md:block text-[11px] text-[#6b6b70] uppercase tracking-wide">{t("last_result")}</p>
          <div className="rounded-2xl border border-white/[0.08] bg-[#141418]/90 overflow-hidden p-3">
            <ResultPanel creation={result} loading={busy} onChange={setResult} emptyLabel={t("pro_empty_result")} />
          </div>
        </StudioResultAnchor>
      </div>

      <StudioPhotoUploadNotice status={photoUploadStatus} className="mb-2 mt-2" />

      <StudioGenerateBar
        variant="pro"
        ready={ready}
        busy={busy}
        onClick={generate}
        label={`${t("pro_button")} · ${cost} ${t("label_credits")}`}
        busyLabel={t("pro_loading")}
        hint={hint}
        blockedNotify={photoUploading ? "message" : "error"}
        testId="pro-create"
        costMeta={<StudioGenerateCostMeta cost={cost} user={user} />}
      />
    </StudioCompactShell>
  );
}
