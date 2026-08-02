import { useCallback, useEffect, useMemo, useState } from "react";
import { Ratio, Sliders, Sparkles, Check, MessageSquare, Gauge } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, uploadPost } from "../../lib/api";
import { normalizeCreation, primaryResultUrl } from "../../lib/creationUrls";
import { useAuth } from "../../lib/auth";
import { usePricing } from "../../lib/PricingContext";
import { toast } from "sonner";
import AspectPicker from "../../components/AspectPicker";
import { apiAspectRatio } from "../../lib/apiAspectRatio";
import { usePhotoAspectDefault, ASPECT_MATCH } from "../../lib/usePhotoAspectDefault";
import StyleCover from "../../components/StyleCover";
import CompactImagePicker from "../../components/studio/CompactImagePicker";
import GenerationBubble from "../../components/studio/GenerationBubble";
import SettingCard from "../../components/studio/SettingCard";
import SettingModal from "../../components/studio/SettingModal";
import { FALLBACK_PRO_PRESETS } from "../../lib/publicFallbacks";
import { proPresetCoverSrc } from "../../lib/proPresetCovers";
import useTitle from "../../lib/useTitle";
import { useI18n } from "../../lib/i18n";
import StudioGenerateBar from "../../components/StudioGenerateBar";
import StudioGenerateCostMeta from "../../components/StudioGenerateCostMeta";
import StudioCompactShell from "../../components/studio/StudioCompactShell";
import StudioInlineHeader from "../../components/studio/StudioInlineHeader";
import { useStudioGenerateGate } from "../../lib/useStudioGenerateGate";
import { PROMPT_MAX_LENGTH } from "../../lib/promptLimits";
import { appendStudioPhotos, primaryStudioPhoto } from "../../lib/studioFormData";
import { useStudioI18n } from "../../lib/useStudioI18n";
import StudioHelpTip from "../../components/studio/StudioHelpTip";
import { applyGenerationSurcharges, getSurcharges } from "../../lib/creditPricing";
import { useStudioSessionBack } from "../../lib/useStudioSessionBack";

export default function Pro() {
  const { t } = useI18n();
  const { errToast, clearUploadToast } = useStudioI18n();
  useTitle(t("pro_page_title"));
  const navigate = useNavigate();
  const { refresh, user } = useAuth();
  const { costs, region } = usePricing();

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
  const [photos, setPhotos] = useState([]);
  const photo = primaryStudioPhoto(photos);
  const [aspect, setAspect] = usePhotoAspectDefault(photos, "4:5", "4:5");
  const [intensity, setIntensity] = useState(55);
  const [hdQuality, setHdQuality] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [openKey, setOpenKey] = useState(null);
  const openModal = (key) => setOpenKey(key);
  const closeModal = () => setOpenKey(null);
  const surcharges = useMemo(() => getSurcharges(region), [region]);
  const cost = useMemo(
    () => applyGenerationSurcharges(costs.pro, surcharges, { hdQuality, hdMode: "image" }),
    [costs.pro, surcharges, hdQuality],
  );

  useStudioSessionBack(() => navigate("/app/tools"));

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

  const generate = useCallback(async () => {
    if (!photo) { toast.error(t("pro_upload_photo")); return; }
    if (!preset) { toast.error(t("pro_pick_preset")); return; }
    clearUploadToast();
    setBusy(true);
    setResult(null);
    try {
      const fd = new FormData();
      appendStudioPhotos(fd, photos);
      fd.append("preset_id", preset);
      fd.append("aspect_ratio", apiAspectRatio(aspect, {
        model: "pro",
        hasPhoto: aspect === "match" || aspect === ASPECT_MATCH,
      }));
      fd.append("extra_prompt", customPrompt.trim());
      fd.append("intensity", String(intensity));
      if (hdQuality) fd.append("hd_quality", "1");
      const { data } = await uploadPost("/generate/pro", fd, { timeout: 180000 });
      const creation = normalizeCreation(data?.creation);
      if (!primaryResultUrl(creation)) throw new Error(t("pro_no_result"));
      setResult(creation);
      toast.success(t("pro_success", { n: creation?.credits_spent ?? cost }));
      await refresh();
    } catch (err) {
      errToast(err);
    } finally {
      setBusy(false);
    }
  }, [
    photo,
    photos,
    preset,
    clearUploadToast,
    aspect,
    customPrompt,
    intensity,
    hdQuality,
    cost,
    refresh,
    t,
    errToast,
  ]);

  const aspectLabel = (aspect === "match" || aspect === ASPECT_MATCH)
    ? (t("aspect_original") || t("aspect_match") || t("pro_match_photo"))
    : String(aspect || "4:5").toUpperCase();
  const presetLabel = pickedPreset?.nome || t("pro_pick_preset");
  const intensityValue = `${intensityLabel} · ${intensity}%`;
  const qualityLabel = hdQuality ? "HD" : (t("quality_standard"));
  const extraLabel = customPrompt.trim()
    ? customPrompt.trim().slice(0, 42) + (customPrompt.trim().length > 42 ? "…" : "")
    : (t("studio_styles_optional"));

  const modalTitle = {
    format: t("pro_step_format"),
    preset: t("pro_presets"),
    intensity: t("pro_intensity"),
    quality: t("studio_hd_quality"),
    extra: t("pro_step_extra"),
  }[openKey] || "";

  const selectPreset = (id) => {
    setPreset(id);
    closeModal();
  };

  return (
    <StudioCompactShell testId="pro-page" maxWidth="720px" className="pb-8">
      <StudioInlineHeader
        eyebrow={t("pro_cap")}
        title={`${t("pro_title_a")} ${t("pro_title_b")}${t("pro_title_dot")}`}
        description={t("pro_empty")}
        testId="pro-header"
        helpKey="help_page_pro"
      />

      <div className="space-y-2.5">
        <div className="rounded-2xl border border-white/[0.08] bg-[#141418]/80 p-3 md:p-4">
          <p className="text-[#9CA3AF] text-[12px] leading-relaxed mb-3">
            {t("pro_upload_hint")}
          </p>
          <CompactImagePicker value={photos} onChange={setPhotos} maxFiles={5} testId="pro-photo" />
        </div>

        <div className="mv-setting-grid">
          <SettingCard
            icon={Ratio}
            label={t("pro_step_format")}
            value={aspectLabel}
            onOpen={() => openModal("format")}
            testId="pro-card-format"
            helpKey="help_sec_format"
          />
          <SettingCard
            icon={Sparkles}
            label={t("pro_presets")}
            value={presetLabel}
            onOpen={() => openModal("preset")}
            testId="pro-card-preset"
            helpKey="help_sec_presets"
          />
        </div>

        <div className="mv-setting-grid">
          <SettingCard
            icon={Sliders}
            label={t("pro_intensity")}
            value={intensityValue}
            onOpen={() => openModal("intensity")}
            testId="pro-card-intensity"
            helpKey="help_sec_intensity"
          />
          <SettingCard
            icon={Gauge}
            label={t("studio_hd_quality")}
            value={qualityLabel}
            onOpen={() => openModal("quality")}
            testId="pro-card-quality"
            helpKey="help_ctrl_hd_quality"
          />
        </div>
        <SettingCard
          icon={MessageSquare}
          label={t("pro_step_extra")}
          value={extraLabel}
          onOpen={() => openModal("extra")}
          testId="pro-card-extra"
          helpKey="help_sec_custom_prompt"
        />

        <div className="mv-setting-card mv-setting-card--static">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-end">
            <StudioGenerateBar
              layout="inline"
              ready={ready}
              busy={busy}
              onClick={generate}
              label={`${t("pro_button")} · ${cost} ${t("label_credits")}`}
              busyLabel={t("pro_loading")}
              hint={hint}
              cost={cost}
              testId="pro-create"
              buttonClassName="rp-gen-btn-inline w-full sm:w-auto"
            />
          </div>
          <div className="mt-2 pt-2 border-t border-white/[0.06]">
            <StudioGenerateCostMeta cost={cost} user={user} />
          </div>
        </div>
      </div>

      <SettingModal open={openKey === "format"} title={modalTitle} onClose={closeModal}>
        <AspectPicker
          value={aspect}
          onChange={setAspect}
          hasPhoto={!!photo}
          testIdPrefix="pro-aspect"
          premium
        />
        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="pro-format-confirm">
          <Check className="w-4 h-4" /> {t("confirm")}
        </button>
      </SettingModal>

      <SettingModal open={openKey === "preset"} title={modalTitle} onClose={closeModal}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4" data-testid="pro-cats">
          {cats.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setCategory(c)}
              className={`rp-select-card text-left p-3 ${category === c ? "rp-select-card-active" : ""}`}
              data-testid={`procat-${c}`}
            >
              <p className={`text-[12px] font-semibold font-display mb-0.5 ${category === c ? "text-[#C4B5FD]" : "text-[#F4F1EA]"}`}>
                {CAT_LABELS[c]}
              </p>
              <p className="text-[#8A8A8E] text-[10px] leading-snug line-clamp-2">{CAT_DESC[c]}</p>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[46vh] overflow-y-auto overscroll-contain pr-0.5" data-testid="pro-presets">
          {filtered.map((p) => {
            const active = preset === p.id;
            return (
              <button
                type="button"
                key={p.id}
                onClick={() => selectPreset(p.id)}
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
        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="pro-preset-confirm">
          <Check className="w-4 h-4" /> {t("confirm")}
        </button>
      </SettingModal>

      <SettingModal open={openKey === "intensity"} title={modalTitle} onClose={closeModal}>
        <div
          className="pro-intensity-track"
          style={{ "--pro-intensity-pct": `${intensity}%` }}
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#8A8A8E]">
              {t("pro_step_intensity")}
            </span>
            <span className="text-[#E9D5FF] text-sm font-semibold font-display tabular-nums">
              {intensityLabel} · {intensity}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            onInput={(e) => setIntensity(Number(e.target.value))}
            className="pro-intensity-range"
            data-testid="pro-intensity"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={intensity}
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {[25, 55, 85].map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setIntensity(n)}
                className={`mktvid-chip text-[11px] ${intensity === n ? "mktvid-chip-active" : ""}`}
                data-testid={`pro-intensity-preset-${n}`}
              >
                {n}%
              </button>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-zinc-600 mt-2.5 px-0.5 font-mono uppercase tracking-[0.1em]">
            <span>{t("pro_intensity_subtle")}</span>
            <span>{t("pro_intensity_balanced")}</span>
            <span>{t("pro_intensity_intense")}</span>
          </div>
        </div>
        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="pro-intensity-confirm">
          <Check className="w-4 h-4" /> {t("confirm")}
        </button>
      </SettingModal>

      <SettingModal open={openKey === "quality"} title={modalTitle} onClose={closeModal}>
        <div className="mv-picker__chips">
          <button type="button" onClick={() => setHdQuality(false)} className={`mktvid-chip ${!hdQuality ? "mktvid-chip-active" : ""}`} data-testid="pro-quality-standard">
            {t("quality_standard")}
          </button>
          <button type="button" onClick={() => setHdQuality(true)} className={`mktvid-chip ${hdQuality ? "mktvid-chip-active" : ""}`} data-testid="pro-quality-hd">
            HD <span className="text-[#A855F7] font-mono text-[10px] ml-1">+{surcharges.hdImage ?? 8}</span>
          </button>
        </div>
        <div className="mt-2"><StudioHelpTip helpKey="help_ctrl_hd_quality" testId="pro-hd-quality-help" size="lg" /></div>
        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="pro-quality-confirm">
          <Check className="w-4 h-4" /> {t("confirm")}
        </button>
      </SettingModal>

      <SettingModal open={openKey === "extra"} title={modalTitle} onClose={closeModal}>
        <p className="text-[#8A8A8E] text-[12px] mb-3 leading-relaxed">
          {t("studio_styles_optional")} — {t("pro_extra_ph")}
        </p>
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          rows={4}
          maxLength={PROMPT_MAX_LENGTH}
          placeholder={t("pro_extra_ph")}
          className="rp-editor-textarea rp-editor-textarea--compact min-h-[100px] w-full"
          data-testid="pro-custom"
        />
        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="pro-extra-confirm">
          <Check className="w-4 h-4" /> {t("confirm")}
        </button>
      </SettingModal>

      <GenerationBubble busy={busy} result={result} onChange={setResult} />
    </StudioCompactShell>
  );
}
