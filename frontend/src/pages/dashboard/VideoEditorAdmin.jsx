import { useEffect, useMemo, useState } from "react";
import { Clapperboard, Sparkles } from "lucide-react";
import {
  formatApiError,
  pollPrediction,
  trackPendingPrediction,
  uploadPost,
} from "../../lib/api";
import { normalizeCreation, primaryResultUrl } from "../../lib/creationUrls";
import { readVideoDurationSeconds } from "../../lib/videoMedia";
import { useAuth } from "../../lib/auth";
import { usePricing } from "../../lib/PricingContext";
import { useI18n } from "../../lib/i18n";
import { toast } from "sonner";
import ResultPanel from "../../components/ResultPanel";
import StudioResultAnchor from "../../components/StudioResultAnchor";
import ImageUploadZone from "../../components/ImageUploadZone";
import StudioVideoUpload from "../../components/StudioVideoUpload";
import StudioGenerateBar from "../../components/StudioGenerateBar";
import PromptEnhanceToggle from "../../components/promptAssist/PromptEnhanceToggle";
import { appendImproveLang, appendImprovePrompt } from "../../lib/promptEnhance";
import { useStudioGenerateGate } from "../../lib/useStudioGenerateGate";

const EDIT_IDEAS = ["vid_edit_idea_1", "vid_edit_idea_2", "vid_edit_idea_3"];
const EDIT_FIXED_DURATION = 15;
const ASPECTS = [
  { v: "auto", labelKey: "vid_edit_aspect_auto" },
  { v: "16:9", label: "16:9" },
  { v: "9:16", label: "9:16" },
  { v: "1:1", label: "1:1" },
];

function selectCard(active) {
  return `text-left px-4 py-3 rounded-xl border transition-all ${
    active
      ? "border-[#7C3AED] bg-gradient-to-br from-[#7C3AED]/15 to-[#7C3AED]/5 shadow-[0_0_28px_-10px_rgba(124,58,237,0.6)]"
      : "border-[#2E2E30] bg-[#0F0F12] hover:border-[#5A5A5E]"
  }`;
}

export default function VideoEditorAdmin() {
  const { t, lang } = useI18n();
  const ideas = useMemo(() => EDIT_IDEAS.map((k) => t(k)), [t]);
  const { refresh, user } = useAuth();
  const { costs } = usePricing();
  const cost = costs.videoEdit ?? costs.video ?? 95;

  const [video, setVideo] = useState(null);
  const [sourceDurationSec, setSourceDurationSec] = useState(0);
  const [reference, setReference] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [improve, setImprove] = useState(false);
  const [aspect, setAspect] = useState("auto");
  const [audioSetting, setAudioSetting] = useState("origin");
  const [busy, setBusy] = useState(false);
  const [uploadPhase, setUploadPhase] = useState("");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const { ready, hint } = useStudioGenerateGate({
    busy,
    user,
    cost,
    requireVideo: true,
    video,
    requirePrompt: true,
    prompt,
    readyOverride: Boolean(video) && prompt.trim().length >= 3,
  });

  const eta = useMemo(() => {
    if (!sourceDurationSec) return { min: 3, max: 8 };
    if (sourceDurationSec <= 5) return { min: 2, max: 6 };
    if (sourceDurationSec <= 10) return { min: 4, max: 9 };
    return { min: 6, max: 12 };
  }, [sourceDurationSec]);

  useEffect(() => {
    let mounted = true;
    if (!video) {
      setSourceDurationSec(0);
      return undefined;
    }
    readVideoDurationSeconds(video)
      .then((s) => {
        if (mounted) setSourceDurationSec(Math.max(0, Math.round(s)));
      })
      .catch(() => {
        if (mounted) setSourceDurationSec(0);
      });
    return () => { mounted = false; };
  }, [video]);

  const run = async () => {
    if (!video) {
      toast.error(t("vid_edit_err_video"));
      return;
    }
    if (prompt.trim().length < 3) {
      toast.error(t("vid_edit_err_short"));
      return;
    }
    if ((user?.credits ?? 0) < cost && !user?.is_unlimited) {
      toast.error(t("vid_err_credits", { need: cost, have: user?.credits ?? 0 }));
      return;
    }

    setBusy(true);
    setProgress(0);
    setUploadPhase("send");
    setResult(null);
    let submitData;
    try {
      const fd = new FormData();
      fd.append("prompt", prompt.trim());
      fd.append("resolution", "1080p");
      fd.append("duration", String(EDIT_FIXED_DURATION));
      fd.append("aspect_ratio", aspect);
      fd.append("audio_setting", audioSetting);
      appendImproveLang(fd, lang);
      appendImprovePrompt(fd, improve);
      fd.append("video", video);
      if (reference) fd.append("reference_image", reference);

      ({ data: submitData } = await uploadPost("/generate/video-edit", fd, {
        timeout: 600_000,
        headers: { "X-Skip-Auto-Poll": "1" },
      }));

      trackPendingPrediction(submitData.prediction_id, {
        credits_spent: submitData.credits_spent || cost,
        type: "video",
      });
      setUploadPhase("processing");
      const data = await pollPrediction(submitData.prediction_id, {
        timeoutMs: 600_000,
        credits_spent: submitData.credits_spent || cost,
        type: "video",
        onTick: (sec) => setProgress(sec),
      });

      const creation = normalizeCreation(data?.creation);
      if (!primaryResultUrl(creation)) throw new Error(t("vid_no_result"));
      setResult(creation);
      toast.success(t("vid_edit_success", { n: creation?.credits_spent ?? cost }));
      await refresh();
    } catch (err) {
      toast.error(formatApiError(err, t("vid_edit_fail"), { context: "video_upload", t }), { duration: 12000 });
      if (err?.refunded && submitData?.credits_spent) {
        try { await refresh(); } catch { /* ignore */ }
      }
    } finally {
      setBusy(false);
      setUploadPhase("");
      setProgress(0);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10" data-testid="video-editor-admin">
      <div className="rp-editor-panel overflow-hidden">
        <div className="rp-editor-panel-accent" />
        <div className="p-6 sm:p-8 space-y-10">
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#A78BFA] mb-2">
              {t("vid_edit_video_label")}
            </p>
            <p className="text-[#8A8A8E] text-[13px] mb-4 leading-relaxed max-w-[560px]">
              {t("vid_edit_desc")}
            </p>
            <p className="text-[#6f6f76] text-[12px] mb-4 max-w-[560px]">
              {t("vid_edit_eta_hint", { min: eta.min, max: eta.max })}
            </p>
            <div className="max-w-[560px]">
              <StudioVideoUpload
                value={video}
                onChange={setVideo}
                disabled={busy}
                maxDurationSec={15}
                testId="video-edit-source"
              />
            </div>
          </section>

          <section>
            <div className="flex items-baseline justify-between mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#A78BFA]">
                {t("vid_edit_prompt_label")}
              </p>
              <span className="text-[#5A5A5E] text-[11px] font-mono">{prompt.length}/800</span>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, 800))}
              rows={5}
              placeholder={t("vid_edit_prompt_placeholder")}
              className="rp-editor-textarea min-h-[140px]"
              data-testid="video-edit-prompt"
            />
            <div className="mt-3">
              <PromptEnhanceToggle
                checked={improve}
                onChange={setImprove}
                testId="video-edit-improve"
                premiumSoon
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {ideas.map((idea) => (
                <button
                  key={idea}
                  type="button"
                  onClick={() => setPrompt(idea)}
                  className="rp-pill max-w-full !justify-start !normal-case !tracking-normal !font-['Inter_Tight'] !text-[12px] !font-normal"
                >
                  <Sparkles className="w-3 h-3 shrink-0" /> {idea}
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#A78BFA] mb-3">
              {t("vid_edit_ref_label")}
            </p>
            <p className="text-[#8A8A8E] text-[13px] mb-4">{t("vid_edit_ref_hint")}</p>
            <div className="max-w-[280px]">
              <ImageUploadZone
                value={reference}
                onChange={setReference}
                layout="square"
                enableRemotePersist={false}
                testId="video-edit-reference"
                emptyLabel={t("upload_drop")}
                emptyHint={t("upload_empty_hint")}
              />
            </div>
          </section>

          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#A78BFA] mb-3">
              {t("vid_edit_resolution")}
            </p>
            <div className="max-w-[360px] rounded-xl border border-[#7C3AED]/35 bg-gradient-to-br from-[#7C3AED]/12 to-[#0F0F12] px-4 py-3">
              <p className="text-[#F4F1EA] text-[15px] font-medium">{t("vid_quality_original")}</p>
              <p className="text-[#8A8A8E] text-[11px] mt-1">{t("vid_quality_original_hint")}</p>
            </div>
          </section>

          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#A78BFA] mb-3">
              {t("vid_edit_duration")}
            </p>
            <div className="max-w-[360px] rounded-xl border border-[#7C3AED]/35 bg-gradient-to-br from-[#7C3AED]/12 to-[#0F0F12] px-4 py-3">
              <p className="text-[#F4F1EA] text-[16px] font-light">15s</p>
              <p className="text-[#8A8A8E] text-[11px] mt-1">{t("vid_duration_fixed_hint")}</p>
            </div>
          </section>

          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#A78BFA] mb-3">
              {t("vid_edit_aspect")}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {ASPECTS.map((a) => (
                <button
                  key={a.v}
                  type="button"
                  onClick={() => setAspect(a.v)}
                  className={selectCard(aspect === a.v)}
                  data-testid={`video-edit-ar-${a.v}`}
                >
                  <p className="text-[#F4F1EA] text-[13px] font-medium">
                    {a.labelKey ? t(a.labelKey) : a.label}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#A78BFA] mb-3">
              {t("vid_edit_audio")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-[480px]">
              <button
                type="button"
                onClick={() => setAudioSetting("origin")}
                className={selectCard(audioSetting === "origin")}
                data-testid="video-edit-audio-origin"
              >
                <p className="text-[#F4F1EA] text-[13px] font-medium">{t("vid_edit_audio_origin")}</p>
              </button>
              <button
                type="button"
                onClick={() => setAudioSetting("auto")}
                className={selectCard(audioSetting === "auto")}
                data-testid="video-edit-audio-auto"
              >
                <p className="text-[#F4F1EA] text-[13px] font-medium">{t("vid_edit_audio_auto")}</p>
              </button>
            </div>
          </section>

          <StudioGenerateBar
            layout="inline"
            ready={ready}
            busy={busy}
            onClick={run}
            label={t("vid_edit_btn", { n: cost })}
            busyLabel={
              uploadPhase === "processing" && progress > 0
                ? `${t("vid_edit_processing")} (${progress}s)`
                : uploadPhase === "processing"
                  ? t("vid_edit_processing_eta", { min: eta.min, max: eta.max })
                  : t("vid_edit_processing")
            }
            hint={hint}
            testId="video-edit-submit"
            icon={Clapperboard}
          />
          <p className="text-[#5A5A5E] text-[11px] mt-3 font-mono uppercase tracking-[0.14em]">
            {t("vid_balance", { n: user?.is_unlimited ? "∞" : (user?.credits ?? 0) })}
          </p>
        </div>
      </div>

      <StudioResultAnchor busy={busy} ready={Boolean(primaryResultUrl(result))} className="lg:sticky lg:top-[88px] self-start">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#A78BFA] mb-4">
          {t("vid_edit_result_label")}
        </p>
        <ResultPanel creation={result} loading={busy} onChange={setResult} emptyLabel={t("vid_edit_result_empty")} />
      </StudioResultAnchor>
    </div>
  );
}
