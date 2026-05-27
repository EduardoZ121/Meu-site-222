import { useMemo, useState } from "react";
import { Film, Sparkles, Wand2 } from "lucide-react";
import { formatApiError, trackPendingPrediction, uploadPost } from "../../lib/api";
import { normalizeCreation, primaryResultUrl } from "../../lib/creationUrls";
import { useAuth } from "../../lib/auth";
import { usePricing } from "../../lib/PricingContext";
import { computeVideoGenerateCost, getSurcharges } from "../../lib/creditPricing";
import { useI18n } from "../../lib/i18n";
import { toast } from "sonner";
import ResultPanel from "../../components/ResultPanel";
import StudioResultAnchor from "../../components/StudioResultAnchor";
import StudioAccordionSection from "../../components/StudioAccordionSection";
import ImageUploadZone from "../../components/ImageUploadZone";
import AspectPicker from "../../components/AspectPicker";
import StudioGenerateBar from "../../components/StudioGenerateBar";
import { apiAspectRatio } from "../../lib/apiAspectRatio";
import { usePhotoAspectDefault } from "../../lib/usePhotoAspectDefault";
import { useStudioGenerateGate } from "../../lib/useStudioGenerateGate";

const ASPECTS = ["16:9", "9:16", "1:1", "4:5"];
const IDEA_KEYS = ["vid_idea_1", "vid_idea_2", "vid_idea_3", "vid_idea_4"];

export default function VideoGenerate({ mode = "text" }) {
  const { t } = useI18n();
  const ideas = useMemo(() => IDEA_KEYS.map((k) => t(k)), [t]);
  const DURATIONS = useMemo(() => [
    { v: 4, label: "4s", desc: t("vid_dur_short") },
    { v: 6, label: "6s", desc: t("vid_dur_standard") },
    { v: 8, label: "8s", desc: t("vid_dur_cinematic") },
  ], [t]);
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
  const isImageMode = mode === "image";
  const [duration, setDuration] = useState(6);
  const [motion, setMotion] = useState("cinematic");
  const [photo, setPhoto] = useState(null);
  const [aspect, setAspect] = usePhotoAspectDefault(photo, "16:9", "match");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const cost = useMemo(
    () => computeVideoGenerateCost(costs, surcharges, { duration }),
    [costs, surcharges, duration],
  );
  const { ready, hint } = useStudioGenerateGate({
    busy,
    user,
    cost,
    requirePrompt: true,
    prompt,
    requirePhoto: isImageMode,
    photo,
  });

  const generate = async () => {
    if (!ready) {
      if (prompt.trim().length < 3) toast.error(t("vid_err_short"));
      else if (isImageMode && !photo) {
        toast.error(t("vid_need_image_mode"));
      } else if ((user?.credits ?? 0) < cost && !user?.is_unlimited) {
        toast.error(t("vid_err_credits", { need: cost, have: user?.credits ?? 0 }));
      }
      return;
    }
    setBusy(true); setResult(null);
    try {
      const fd = new FormData();
      const composed = `${prompt.trim()} — motion style: ${motion}, duration: ${duration}s`;
      fd.append("prompt", composed);
      fd.append("duration", String(duration));
      fd.append("aspect_ratio", apiAspectRatio(aspect, { model: "video", hasPhoto: !!photo }));
      if (photo) fd.append("photo", photo);
      const { data } = await uploadPost("/generate/video", fd, { timeout: 300000 });
      if (data?.prediction_id && !primaryResultUrl(data?.creation)) {
        trackPendingPrediction(data.prediction_id, {
          credits_spent: data.credits_spent || cost,
          type: "video",
        });
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

  const controls = (
    <div className="space-y-4 min-w-0">
      {isImageMode && (
        <StudioAccordionSection title={t("vid_step_frame")} defaultOpen testId={`video-${mode}-acc-frame`}>
          <ImageUploadZone
            value={photo}
            onChange={setPhoto}
            layout="video"
            mediaType="image"
            testId={`video-${mode}-photo`}
            emptyLabel={t("vid_start_label")}
            emptyHint={t("upload_drop")}
          />
        </StudioAccordionSection>
      )}

      <StudioAccordionSection title={t("vid_step_prompt")} defaultOpen testId={`video-${mode}-acc-prompt`}>
        <div className="flex items-baseline justify-end mb-3 -mt-1">
          <span className="text-[#5A5A5E] text-[11px] font-mono">{prompt.length}/600</span>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value.slice(0, 600))}
          rows={4}
          placeholder={t("vid_prompt_placeholder")}
          className="rp-editor-textarea min-h-[110px]"
          data-testid={`video-${mode}-prompt`}
        />
        <div className="flex flex-wrap gap-2 mt-3">
          {ideas.map((idea) => (
            <button
              key={idea}
              type="button"
              onClick={() => setPrompt(idea)}
              className="rp-pill max-w-full !justify-start !normal-case !tracking-normal !font-['Inter_Tight'] !text-[12px] !font-normal"
              data-testid={`video-${mode}-idea`}
            >
              <Sparkles className="w-3 h-3 shrink-0" /> {idea.slice(0, 32)}{idea.length > 32 ? "…" : ""}
            </button>
          ))}
        </div>
      </StudioAccordionSection>

      <StudioAccordionSection title={t("vid_step_format")} defaultOpen testId={`video-${mode}-acc-format`}>
        <AspectPicker
          value={aspect}
          onChange={setAspect}
          options={ASPECTS}
          hasPhoto={!!photo}
          columns="grid grid-cols-2 gap-2.5"
          testIdPrefix={`vid-${mode}-ar`}
        />
      </StudioAccordionSection>

      <StudioAccordionSection title={t("vid_step_duration")} defaultOpen testId={`video-${mode}-acc-duration`}>
        <div className="grid grid-cols-3 gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.v}
              type="button"
              onClick={() => setDuration(d.v)}
              data-testid={`vid-${mode}-dur-${d.v}`}
              className={`text-left px-3 py-2.5 rounded-xl border transition-all ${
                duration === d.v
                  ? "border-[#7C3AED] bg-gradient-to-br from-[#7C3AED]/15 to-[#7C3AED]/5"
                  : "border-[#2E2E30] bg-[#0F0F12] hover:border-[#5A5A5E]"
              }`}
            >
              <p className="text-[#F4F1EA] text-[16px] font-light">{d.label}</p>
              <p className="text-[#8A8A8E] text-[10px]">{d.desc}</p>
            </button>
          ))}
        </div>
      </StudioAccordionSection>

      <StudioAccordionSection title={t("vid_step_motion")} defaultOpen={false} testId={`video-${mode}-acc-motion`}>
        <div className="grid grid-cols-2 gap-2">
          {MOTIONS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMotion(m.id)}
              data-testid={`vid-${mode}-motion-${m.id}`}
              className={`text-left px-3 py-2.5 rounded-xl border transition-all ${
                motion === m.id
                  ? "border-[#7C3AED] bg-gradient-to-br from-[#7C3AED]/15 to-[#7C3AED]/5"
                  : "border-[#2E2E30] bg-[#0F0F12] hover:border-[#5A5A5E]"
              }`}
            >
              <p className="text-[#F4F1EA] text-[13px] font-medium">{m.label}</p>
              <p className="text-[#8A8A8E] text-[10px] mt-0.5">{m.desc}</p>
            </button>
          ))}
        </div>
      </StudioAccordionSection>

      <StudioAccordionSection title={t("vid_acc_generate")} defaultOpen testId={`video-${mode}-acc-generate`}>
        <StudioGenerateBar
          layout="inline"
          ready={ready}
          busy={busy}
          onClick={generate}
          label={t("vid_render_btn", { n: cost })}
          busyLabel={t("vid_rendering")}
          hint={hint}
          testId={`video-${mode}-generate`}
          icon={Film}
          alignHint="center"
        />
        <p className="text-[#5A5A5E] text-[11px] mt-3 text-center font-mono uppercase tracking-[0.14em]">
          {t("vid_balance", { n: user?.is_unlimited ? "∞" : (user?.credits ?? 0) })}
        </p>
      </StudioAccordionSection>
    </div>
  );

  const resultBlock = (
    <StudioResultAnchor
      busy={busy}
      ready={Boolean(primaryResultUrl(result))}
      className="lg:sticky lg:top-[88px] self-start space-y-3"
    >
      <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED]">{t("last_result")}</p>
      <div className="rp-editor-panel overflow-hidden p-3 sm:p-4">
        {result ? (
          <ResultPanel creation={result} loading={busy} onChange={setResult} emptyLabel={t("vid_loading")} />
        ) : (
          <div className="rounded-xl border border-[#2E2E30] bg-gradient-to-br from-[#13131A] to-[#0B0B0C] aspect-video flex flex-col items-center justify-center gap-2 p-4">
            <Wand2 className="w-5 h-5 text-[#C4B5FD]" strokeWidth={1.5} />
            <p className="text-[#8A8A8E] text-[12px] text-center">{t("vid_empty_preview")}</p>
            <p className="text-[#5A5A5E] text-[10px] font-mono uppercase tracking-[0.12em]">{aspect} · {duration}s</p>
          </div>
        )}
      </div>
    </StudioResultAnchor>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-10" data-testid={`video-generate-panel-${mode}`}>
      {controls}
      {resultBlock}
    </div>
  );
}
