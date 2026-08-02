import { useEffect, useMemo, useState } from "react";
import { Check, Clock, Film, Ratio, Sparkles, Zap } from "lucide-react";
import { formatApiError, uploadPost } from "../../lib/api";
import { normalizeCreation, primaryResultUrl } from "../../lib/creationUrls";
import { useAuth } from "../../lib/auth";
import { usePricing } from "../../lib/PricingContext";
import PromptEnhanceToggle from "../../components/promptAssist/PromptEnhanceToggle";
import { getSurcharges } from "../../lib/creditPricing";
import { computeVideoToolCost, getVideoToolMeta } from "../../lib/videoModels";
import { useI18n } from "../../lib/i18n";
import { toast } from "sonner";
import CompactImagePicker from "../../components/studio/CompactImagePicker";
import GenerationBubble from "../../components/studio/GenerationBubble";
import SettingCard from "../../components/studio/SettingCard";
import SettingModal from "../../components/studio/SettingModal";
import AspectPicker from "../../components/AspectPicker";
import StudioGenerateBar from "../../components/StudioGenerateBar";
import StudioGenerateCostMeta from "../../components/StudioGenerateCostMeta";
import { apiAspectRatio } from "../../lib/apiAspectRatio";
import { usePhotoAspectDefault } from "../../lib/usePhotoAspectDefault";
import { useStudioGenerateGate } from "../../lib/useStudioGenerateGate";
import { primaryStudioPhoto } from "../../lib/studioFormData";
import { clampPrompt } from "../../lib/promptLimits";

const ASPECTS = ["16:9", "9:16", "1:1", "4:5"];

const PRESET_IDEAS = {
  marketing: ["vid_mkt_idea_1", "vid_mkt_idea_2", "vid_mkt_idea_3"],
  fun: ["vid_fun_idea_1", "vid_fun_idea_2", "vid_fun_idea_3"],
};

const DEFAULT_IDEAS = ["vid_idea_1", "vid_idea_2", "vid_idea_3", "vid_idea_4"];

function selectCard(active) {
  return `text-left px-3 py-2.5 rounded-xl border transition-all ${
    active
      ? "border-[#7C3AED] bg-gradient-to-br from-[#7C3AED]/15 to-[#7C3AED]/5"
      : "border-[#2E2E30] bg-[#0F0F12] hover:border-[#5A5A5E]"
  }`;
}

export default function VideoGenerate({ category }) {
  const { t, lang } = useI18n();
  const toolMeta = getVideoToolMeta(category?.tool);
  const modeId = category?.id || "text-marketing";
  const tool = category?.tool || "kling_turbo";
  const preset = category?.preset || "";

  const ideaKeys = PRESET_IDEAS[preset] || DEFAULT_IDEAS;
  const ideas = useMemo(() => ideaKeys.map((k) => t(k)), [t, ideaKeys]);

  const needsImage = toolMeta.needsImage;
  const optionalImage = toolMeta.optionalImage;
  const optionalReference = toolMeta.optionalReference;
  const allowsTest = toolMeta.testMode;

  const DURATIONS = useMemo(() => {
    const durs = toolMeta.durations || [5, 10];
    return durs.map((v) => ({
      v,
      label: `${v}s`,
      desc: v >= 10 ? t("vid_dur_cinematic") : v >= 8 ? t("vid_dur_cinematic") : t("vid_dur_standard"),
    }));
  }, [toolMeta.durations, t]);

  const MOTIONS = useMemo(() => [
    { id: "cinematic", label: "Cinematic", desc: t("vid_motion_cinematic_desc") },
    { id: "dynamic", label: t("vid_motion_dynamic"), desc: t("vid_motion_dynamic_desc") },
    { id: "smooth", label: t("vid_motion_smooth"), desc: t("vid_motion_smooth_desc") },
    { id: "static", label: t("vid_motion_static"), desc: t("vid_motion_static_desc") },
  ], [t]);

  const { refresh, user } = useAuth();
  const { costs, region } = usePricing();
  const surcharges = useMemo(() => getSurcharges(region), [region]);

  const [prompt, setPrompt] = useState("");
  const [improve, setImprove] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [duration, setDuration] = useState(toolMeta.defaultDuration || 6);
  const [motion, setMotion] = useState("cinematic");
  const [photos, setPhotos] = useState([]);
  const photo = primaryStudioPhoto(photos);
  const [refPhotos, setRefPhotos] = useState([]);
  const reference = primaryStudioPhoto(refPhotos);
  const [aspect, setAspect] = usePhotoAspectDefault(photo, "16:9", "match");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [openKey, setOpenKey] = useState(null);
  const openModal = (key) => setOpenKey(key);
  const closeModal = () => setOpenKey(null);

  const isGrok = tool === "grok";
  const showMotion = isGrok;

  useEffect(() => {
    const onCreation = (e) => {
      const creation = normalizeCreation(e.detail);
      if (creation?.type !== "video" || !primaryResultUrl(creation)) return;
      setResult(creation);
      setBusy(false);
    };
    window.addEventListener("rp:creation-succeeded", onCreation);
    return () => window.removeEventListener("rp:creation-succeeded", onCreation);
  }, []);

  const cost = useMemo(() => {
    const base = computeVideoToolCost(costs, surcharges, tool, {
      duration: testMode ? 4 : duration,
      testMode,
      hasPhoto: Boolean(photo),
    });
    if (testMode || !improve) return base;
    return base + (surcharges.enhancePrompt ?? 5);
  }, [costs, surcharges, duration, tool, testMode, improve, photo]);

  const testPreviewCost = useMemo(
    () => computeVideoToolCost(costs, surcharges, tool, {
      duration: 4,
      testMode: true,
      hasPhoto: Boolean(photo),
    }),
    [costs, surcharges, tool, photo],
  );

  const { ready, hint } = useStudioGenerateGate({
    busy,
    user,
    cost,
    requirePrompt: true,
    prompt,
    requirePhoto: needsImage,
    photo,
  });

  const aspectLabel = aspect === "match" ? t("aspect_match") || "Auto" : aspect;
  const durationLabel = `${testMode ? 4 : duration}s`;
  const motionLabel = MOTIONS.find((m) => m.id === motion)?.label || motion;
  const referenceLabel = reference ? reference.name?.slice(0, 24) || t("vid_elements_ref") : t("studio_optional");

  const modalTitle = {
    format: t("vid_step_format"),
    duration: t("vid_step_duration"),
    motion: t("vid_step_motion"),
    reference: t("vid_elements_ref"),
  }[openKey] || "";

  const generate = async () => {
    if (!ready) {
      if (prompt.trim().length < 3) toast.error(t("vid_err_short"));
      else if (needsImage && !photo) toast.error(t("vid_need_image_mode"));
      else if ((user?.credits ?? 0) < cost && !user?.is_unlimited) {
        toast.error(t("vid_err_credits", { need: cost, have: user?.credits ?? 0 }));
      }
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const fd = new FormData();
      const effectiveDuration = testMode ? 4 : duration;
      let composed = prompt.trim();
      if (showMotion) {
        composed = `${composed} — motion style: ${motion}, duration: ${effectiveDuration}s`;
      }
      fd.append("prompt", composed);
      fd.append("duration", String(effectiveDuration));
      fd.append("lang", lang || "en");
      fd.append("video_tool", tool);
      if (preset) fd.append("video_preset", preset);
      if (improve) fd.append("improve_prompt", "1");
      if (testMode && allowsTest) fd.append("test_mode", "1");
      fd.append("aspect_ratio", apiAspectRatio(aspect, {
        model: isGrok ? "video" : "standard",
        hasPhoto: aspect === "match",
      }));
      if (photo) fd.append("photo", photo);
      if (reference) fd.append("reference_image", reference);
      const { data } = await uploadPost("/generate/video", fd, { timeout: 600_000 });
      if (data?.deferred) {
        await refresh().catch(() => {});
        return;
      }
      const creation = normalizeCreation(data?.creation);
      if (!primaryResultUrl(creation)) throw new Error(t("vid_no_result"));
      setResult(creation);
      toast.success(t("vid_success", { n: creation?.credits_spent ?? cost }));
      await refresh();
    } catch (err) {
      toast.error(formatApiError(err, t("vid_fail"), { context: "video_upload", t }), { duration: 9000 });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="space-y-2.5" data-testid={`video-generate-panel-${modeId}`}>
        {(needsImage || optionalImage) && (
          <div className="rounded-2xl border border-white/[0.08] bg-[#141418]/80 p-3 md:p-4">
            <p className="text-[#9CA3AF] text-[12px] leading-relaxed mb-3">
              {optionalReference ? t("vid_elements_subject") : t("vid_step_frame")}
            </p>
            <CompactImagePicker
              value={photos}
              onChange={setPhotos}
              maxFiles={1}
              testId={`video-${modeId}-photo`}
            />
            {category?.id === "image" && !testMode && (
              <p className="text-[#C4B5FD] text-[11px] font-mono mt-3">
                {t("vid_image_price_hint", { n: costs.videoImage ?? 150 })}
              </p>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-white/[0.08] bg-[#141418]/80 p-3 md:p-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(clampPrompt(e.target.value))}
            rows={3}
            placeholder={t("vid_prompt_placeholder")}
            className="rp-editor-textarea rp-editor-textarea--compact min-h-[88px] w-full"
            data-testid={`video-${modeId}-prompt`}
          />
          <div className="flex items-center justify-end mt-2">
            <span className="text-[#5A5A5E] text-[11px] font-mono">{prompt.length}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {ideas.map((idea) => (
              <button
                key={idea}
                type="button"
                onClick={() => setPrompt(idea)}
                className="rp-pill max-w-full !justify-start !normal-case !tracking-normal !font-display !text-[12px] !font-normal"
                data-testid={`video-${modeId}-idea`}
              >
                <Sparkles className="w-3 h-3 shrink-0" /> {idea.slice(0, 32)}{idea.length > 32 ? "…" : ""}
              </button>
            ))}
          </div>
        </div>

        <div className="mv-setting-grid">
          <SettingCard
            icon={Ratio}
            label={t("vid_step_format")}
            value={aspectLabel}
            onOpen={() => openModal("format")}
            testId={`video-${modeId}-card-format`}
            helpKey="help_sec_format"
          />
          {DURATIONS.length > 1 && (
            <SettingCard
              icon={Clock}
              label={t("vid_step_duration")}
              value={durationLabel}
              onOpen={() => openModal("duration")}
              testId={`video-${modeId}-card-duration`}
              helpKey="help_sec_vid_duration"
            />
          )}
        </div>

        {showMotion && (
          <SettingCard
            icon={Zap}
            label={t("vid_step_motion")}
            value={motionLabel}
            onOpen={() => openModal("motion")}
            testId={`video-${modeId}-card-motion`}
            helpKey="help_sec_vid_motion"
          />
        )}

        {optionalReference && (
          <SettingCard
            icon={Film}
            label={t("vid_elements_ref")}
            value={referenceLabel}
            onOpen={() => openModal("reference")}
            testId={`video-${modeId}-card-reference`}
            helpKey="help_sec_vid_reference"
          />
        )}

        <div className="mv-setting-card mv-setting-card--static">
          <div className="flex flex-col gap-2.5">
            <PromptEnhanceToggle
              checked={improve && !testMode}
              onChange={setImprove}
              locked={testMode}
              testId={`video-${modeId}-enhance`}
              cost={surcharges.enhancePrompt ?? 5}
            />
            {allowsTest && (
              <label className="inline-flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={testMode}
                  onChange={(e) => {
                    setTestMode(e.target.checked);
                    if (e.target.checked) setImprove(false);
                  }}
                  className="accent-[#7C3AED] w-3.5 h-3.5 rounded border-[#2E2E30]"
                  data-testid={`video-${modeId}-test-mode`}
                />
                <span className="text-[#8A8A8E] text-[12px] font-display group-hover:text-[#b5b5ba] transition-colors">
                  {t("vid_test_mode")}{" "}
                  <span className="text-[#A78BFA] font-mono text-[10px]">
                    {testPreviewCost} {t("credits")}
                  </span>
                </span>
              </label>
            )}
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-end mt-3">
            <StudioGenerateBar
              layout="inline"
              ready={ready}
              busy={busy}
              onClick={generate}
              label={t("vid_render_btn", { n: cost })}
              busyLabel={t("vid_rendering")}
              hint={hint}
              cost={cost}
              blockedNotify="message"
              testId={`video-${modeId}-generate`}
              icon={Film}
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
          options={ASPECTS}
          hasPhoto={!!photo}
          columns="grid grid-cols-2 gap-2.5"
          testIdPrefix={`vid-${modeId}-ar`}
        />
        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid={`video-${modeId}-format-confirm`}>
          <Check className="w-4 h-4" /> {t("confirm")}
        </button>
      </SettingModal>

      <SettingModal open={openKey === "duration"} title={modalTitle} onClose={closeModal}>
        <div className="grid gap-2 grid-cols-3">
          {DURATIONS.map((d) => (
            <button
              key={d.v}
              type="button"
              onClick={() => setDuration(d.v)}
              data-testid={`vid-${modeId}-dur-${d.v}`}
              className={selectCard(duration === d.v)}
            >
              <p className="text-[#F4F1EA] text-[16px] font-light">{d.label}</p>
              {d.desc ? <p className="text-[#8A8A8E] text-[10px]">{d.desc}</p> : null}
            </button>
          ))}
        </div>
        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid={`video-${modeId}-duration-confirm`}>
          <Check className="w-4 h-4" /> {t("confirm")}
        </button>
      </SettingModal>

      <SettingModal open={openKey === "motion"} title={modalTitle} onClose={closeModal}>
        <div className="grid grid-cols-2 gap-2">
          {MOTIONS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMotion(m.id)}
              data-testid={`vid-${modeId}-motion-${m.id}`}
              className={selectCard(motion === m.id)}
            >
              <p className="text-[#F4F1EA] text-[13px] font-medium">{m.label}</p>
              <p className="text-[#8A8A8E] text-[10px] mt-0.5">{m.desc}</p>
            </button>
          ))}
        </div>
        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid={`video-${modeId}-motion-confirm`}>
          <Check className="w-4 h-4" /> {t("confirm")}
        </button>
      </SettingModal>

      <SettingModal open={openKey === "reference"} title={modalTitle} onClose={closeModal}>
        <p className="text-[#8A8A8E] text-[13px] mb-4">{t("vid_elements_ref_hint")}</p>
        <CompactImagePicker
          value={refPhotos}
          onChange={setRefPhotos}
          maxFiles={1}
          testId={`video-${modeId}-reference`}
        />
        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid={`video-${modeId}-reference-confirm`}>
          <Check className="w-4 h-4" /> {t("confirm")}
        </button>
      </SettingModal>

      <GenerationBubble busy={busy} result={result} onChange={setResult} />
    </>
  );
}
