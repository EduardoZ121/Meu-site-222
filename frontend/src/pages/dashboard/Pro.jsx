import { useEffect, useMemo, useState } from "react";
import { Sparkles, Camera, Sliders } from "lucide-react";
import { api, formatApiError, uploadPost } from "../../lib/api";
import { normalizeCreation, primaryResultUrl } from "../../lib/creationUrls";
import { useAuth } from "../../lib/auth";
import { usePricing } from "../../lib/PricingContext";
import { toast } from "sonner";
import ResultPanel from "../../components/ResultPanel";
import StudioResultAnchor from "../../components/StudioResultAnchor";
import AspectPicker from "../../components/AspectPicker";
import { apiAspectRatio } from "../../lib/apiAspectRatio";
import StyleCover from "../../components/StyleCover";
import ImageUploadZone from "../../components/ImageUploadZone";
import { FALLBACK_PRO_PRESETS } from "../../lib/publicFallbacks";
import useTitle from "../../lib/useTitle";
import { useI18n } from "../../lib/i18n";
import StudioGenerateBar from "../../components/StudioGenerateBar";
import StudioGenerateCostMeta from "../../components/StudioGenerateCostMeta";
import { useStudioGenerateGate } from "../../lib/useStudioGenerateGate";

function ProStep({ step, title, hint, children }) {
  return (
    <section className="border-b border-white/[0.05] pb-7 last:border-0 last:pb-0">
      <div className="flex gap-3.5 mb-4">
        <span className="pro-step-num" aria-hidden>{step}</span>
        <div className="min-w-0 pt-0.5">
          <h2 className="pro-step-title">{title}</h2>
          {hint ? <p className="pro-step-hint">{hint}</p> : null}
        </div>
      </div>
      <div className="pl-[calc(2.25rem+0.875rem)] sm:pl-[calc(2.25rem+1rem)]">{children}</div>
    </section>
  );
}

export default function Pro() {
  const { t } = useI18n();
  const errMsg = (err) => formatApiError(err, t("common_fail"), { context: "image_upload", t });
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
  const [aspect, setAspect] = useState("match");
  const [photo, setPhoto] = useState(null);
  const [intensity, setIntensity] = useState(70);
  const [customPrompt, setCustomPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const cost = costs.pro;

  useEffect(() => {
    if (!photo && aspect === "match") setAspect("4:5");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo]);

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
  });

  const generate = async () => {
    if (!photo) { toast.error(t("pro_upload_photo")); return; }
    if (!preset) { toast.error(t("pro_pick_preset")); return; }
    setBusy(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append("photo", photo);
      fd.append("preset_id", preset);
      fd.append("aspect_ratio", apiAspectRatio(aspect, { model: "pro", hasPhoto: !!photo }));
      fd.append("extra_prompt", customPrompt.trim());
      fd.append("intensity", String(intensity));
      const { data } = await uploadPost("/generate/pro", fd, { timeout: 180000 });
      const creation = normalizeCreation(data?.creation);
      if (!primaryResultUrl(creation)) throw new Error(t("pro_no_result"));
      setResult(creation);
      toast.success(t("pro_success", { n: creation?.credits_spent ?? cost }));
      await refresh();
    } catch (err) {
      toast.error(errMsg(err), { duration: 8000 });
    } finally { setBusy(false); }
  };

  return (
    <div className="rp-studio-shell max-w-[1400px] mx-auto pb-28" data-testid="pro-page">
      <header className="mb-6 pb-5 border-b border-[rgba(244,241,234,0.06)]">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-[rgba(124,58,237,0.14)] border border-[rgba(124,58,237,0.28)] flex items-center justify-center">
            <Camera className="w-4 h-4 text-[#C4B5FD]" strokeWidth={1.5} />
          </div>
          <p className="rp-editor-section-cap !text-[#a89bc9] !mb-0">{t("pro_cap")}</p>
        </div>
        <h1 className="rp-studio-page-title mb-2 text-[2rem] sm:text-[2.75rem] font-['Inter_Tight']">
          {t("pro_title_a")} <span className="italic text-[#d4c4f7]">{t("pro_title_b")}</span>{t("pro_title_dot")}
        </h1>
        <p className="rp-studio-page-desc text-[14px] max-w-[640px]">{t("pro_empty")}</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 xl:gap-8">
        <div className="rp-editor-panel overflow-hidden">
          <div className="rp-editor-panel-accent" />
          <div className="p-5 sm:p-7 space-y-7">
            <ProStep step="1" title={t("pro_step_photo")} hint={t("pro_upload_hint")}>
              <div className="max-w-[560px]">
                <ImageUploadZone
                  value={photo}
                  onChange={setPhoto}
                  layout="wide"
                  testId="pro-photo"
                  compressOptions={{ maxSize: 2048 }}
                  emptyLabel={t("upload_drop")}
                  emptyHint={t("pro_upload_hint")}
                />
              </div>
            </ProStep>

            <ProStep step="2" title={t("pro_step_family")}>
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
              step="3"
              title={t("pro_step_preset")}
              hint={pickedPreset ? pickedPreset.nome : undefined}
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
                      />
                    </button>
                  );
                })}
              </div>
            </ProStep>

            <ProStep step="4" title={t("pro_step_intensity")}>
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

            <ProStep
              step="5"
              title={`${t("pro_step_extra")} (${t("studio_styles_optional")})`}
            >
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={3}
                maxLength={300}
                placeholder={t("pro_extra_ph")}
                className="rp-editor-textarea min-h-[88px] text-[14px] max-w-[560px]"
                data-testid="pro-custom"
              />
            </ProStep>

            <ProStep step="6" title={t("pro_step_format")}>
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
        </div>

        <StudioResultAnchor busy={busy} ready={Boolean(primaryResultUrl(result))} className="xl:sticky xl:top-[80px] self-start space-y-2">
          <p className="rp-editor-section-cap !text-[#6b6b70] !mb-2">{t("last_result")}</p>
          <div className="rp-editor-panel overflow-hidden p-4">
            <ResultPanel creation={result} loading={busy} onChange={setResult} emptyLabel={t("pro_empty_result")} />
          </div>
        </StudioResultAnchor>
      </div>

      <StudioGenerateBar
        variant="pro"
        ready={ready}
        busy={busy}
        onClick={generate}
        label={`${t("pro_button")} · ${cost} ${t("label_credits")}`}
        busyLabel={t("pro_loading")}
        hint={hint}
        testId="pro-create"
        costMeta={<StudioGenerateCostMeta cost={cost} user={user} />}
      />
    </div>
  );
}
