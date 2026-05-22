import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles, Camera, Sliders } from "lucide-react";
import { api, formatApiError, uploadPost } from "../../lib/api";
import { normalizeCreation, primaryResultUrl } from "../../lib/creationUrls";
import { useAuth } from "../../lib/auth";
import { usePricing } from "../../lib/PricingContext";
import { toast } from "sonner";
import ResultPanel from "../../components/ResultPanel";
import AspectPicker from "../../components/AspectPicker";
import StudioSessionShell from "../../components/studio/StudioSessionShell";
import StudioSplitLayout from "../../components/studio/StudioSplitLayout";
import StudioSection from "../../components/studio/StudioSection";
import StudioResultColumn from "../../components/studio/StudioResultColumn";
import StudioStickyCta, { StudioStickyMeta } from "../../components/studio/StudioStickyCta";
import { apiAspectRatio } from "../../lib/apiAspectRatio";
import StyleCover from "../../components/StyleCover";
import ImageUploadZone from "../../components/ImageUploadZone";
import { FALLBACK_PRO_PRESETS } from "../../lib/publicFallbacks";
import useTitle from "../../lib/useTitle";
import { useI18n } from "../../lib/i18n";

export default function Pro() {
  const { t } = useI18n();
  const errMsg = (err) => formatApiError(err, t("common_fail"));
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

  // Snap back to a real ratio if photo is removed
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

  const balance = user?.is_unlimited ? "∞" : (user?.credits ?? 0);

  return (
    <StudioSessionShell
      testId="pro-page"
      description={t("pro_empty")}
      icon={Camera}
      withStickyCta
    >
      <StudioSplitLayout
        editor={(
          <div className="rp-editor-panel overflow-hidden">
            <div className="rp-editor-panel-accent" />
            <div className="p-6 sm:p-8 space-y-10">
          <StudioSection title={t("pro_step_photo")}>
            <div className="max-w-[560px]">
              <ImageUploadZone
                value={photo}
                onChange={setPhoto}
                layout="wide"
                testId="pro-photo"
                compressOptions={{ maxSize: 2048 }}
                emptyLabel={t("pro_upload_label")}
                emptyHint={t("pro_upload_hint")}
              />
            </div>
          </StudioSection>

          <StudioSection title={t("pro_step_family")}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" data-testid="pro-cats">
              {cats.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rp-select-card text-left p-4 ${category === c ? "rp-select-card-active" : ""}`}
                  data-testid={`procat-${c}`}
                >
                  <p className={`text-[13px] font-medium font-['Inter_Tight'] mb-1 ${category === c ? "text-[#C4B5FD]" : "text-[#F4F1EA]"}`}>{CAT_LABELS[c]}</p>
                  <p className="text-[#8A8A8E] text-[11px] leading-snug">{CAT_DESC[c]}</p>
                  <p className="text-[#5A5A5E] text-[10px] font-mono uppercase tracking-wider mt-2">{t("pro_presets_count", { n: presets.filter((p) => p.category === c).length })}</p>
                </button>
              ))}
            </div>
          </StudioSection>

          <StudioSection
            title={t("pro_step_preset")}
            hint={pickedPreset ? `· ${pickedPreset.nome}` : undefined}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5" data-testid="pro-presets">
              {filtered.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPreset(p.id)}
                  className={`relative text-left rounded-xl transition-all min-h-[112px] overflow-hidden border ${
                    preset === p.id
                      ? "border-[#7C3AED] ring-1 ring-[#7C3AED]/30 bg-[rgba(124,58,237,0.06)]"
                      : "border-[rgba(244,241,234,0.08)] hover:border-[rgba(124,58,237,0.35)] bg-[#0B0B0C]/80"
                  }`}
                  data-testid={`preset-${p.id}`}
                >
                  <StyleCover
                    id={p.id}
                    title={p.nome}
                    prompt={p.prompt}
                    category={p.category}
                    eyebrow={CAT_LABELS[p.category] || p.category}
                    selected={preset === p.id}
                    compact
                  />
                </button>
              ))}
            </div>
          </StudioSection>

          <StudioSection title={t("pro_step_intensity")} hint={`${intensityLabel} · ${intensity}%`}>
            <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[rgba(244,241,234,0.08)] bg-[rgba(8,8,10,0.55)]">
              <Sliders className="w-3.5 h-3.5 text-[#5A5A5E]" />
              <input
                type="range"
                min="0"
                max="100"
                value={intensity}
                onChange={(e) => setIntensity(+e.target.value)}
                className="flex-1 accent-[#7C3AED] h-1"
                data-testid="pro-intensity"
              />
              <span className="text-[#5A5A5E] text-[11px] font-mono w-10 text-right">{intensity}%</span>
            </div>
            <div className="flex justify-between text-[10px] text-[#5A5A5E] mt-1.5 px-1 font-mono">
              <span>{t("pro_intensity_subtle")}</span>
              <span>{t("pro_intensity_balanced")}</span>
              <span>{t("pro_intensity_intense")}</span>
            </div>
          </StudioSection>

          <StudioSection title={t("pro_step_extra")} hint={`(${t("studio_styles_optional")})`}>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder={t("pro_extra_ph")}
              className="rp-editor-textarea min-h-[100px] text-[14px]"
              data-testid="pro-custom"
            />
          </StudioSection>

          <StudioSection title={t("pro_step_format")}>
            <AspectPicker value={aspect} onChange={setAspect} hasPhoto={!!photo} testIdPrefix="pro-aspect" />
          </StudioSection>
            </div>
          </div>
        )}
        result={(
          <StudioResultColumn
            label={t("last_result")}
            busy={busy}
            ready={Boolean(primaryResultUrl(result))}
          >
            <ResultPanel creation={result} loading={busy} onChange={setResult} emptyLabel={t("pro_empty_result")} />
          </StudioResultColumn>
        )}
      />

      <StudioStickyCta testId="pro-cta-bar">
        <StudioStickyMeta
          cost={cost}
          balance={balance}
          costLabel={t("tool_cost_label")}
          balanceLabel={t("tool_balance_label")}
        />
        <button
          type="button"
          onClick={generate}
          disabled={busy}
          className="rp-action-primary flex-1 sm:flex-initial sm:min-w-[280px] sm:ml-auto !w-auto sm:!w-auto"
          data-testid="pro-create"
        >
          {busy ? (
            <><Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> {t("pro_loading")}</>
          ) : (
            <><Sparkles className="w-4 h-4" strokeWidth={1.5} /> {t("pro_button")} · {cost} {t("label_credits")}</>
          )}
        </button>
      </StudioStickyCta>
    </StudioSessionShell>
  );
}
