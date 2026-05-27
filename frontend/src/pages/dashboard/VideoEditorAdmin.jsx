import { useEffect, useMemo, useState } from "react";
import { Clapperboard, Lock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
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
import { hasStudioPremium } from "../../lib/studioPremium";
import {
  computeVideoEditCost,
  isPremiumDuration,
  SURCHARGE,
} from "../../lib/videoEditPricing";
import { toast } from "sonner";
import ResultPanel from "../../components/ResultPanel";
import StudioResultAnchor from "../../components/StudioResultAnchor";
import StudioAccordionSection from "../../components/StudioAccordionSection";
import ImageUploadZone from "../../components/ImageUploadZone";
import StudioVideoUpload from "../../components/StudioVideoUpload";
import StudioGenerateBar from "../../components/StudioGenerateBar";
import PromptEnhanceToggle from "../../components/promptAssist/PromptEnhanceToggle";
import { useStudioGenerateGate } from "../../lib/useStudioGenerateGate";

const EDIT_IDEAS = ["vid_edit_idea_1", "vid_edit_idea_2", "vid_edit_idea_3"];
const DURATIONS = [4, 6, 8, 10];
const RESOLUTIONS = [
  { v: "original", labelKey: "vid_res_original", premium: false },
  { v: "1080p", label: "1080p", premium: true },
  { v: "720p", label: "720p", premium: true },
];
const ASPECTS = [
  { v: "auto", labelKey: "vid_edit_aspect_auto" },
  { v: "16:9", label: "16:9" },
  { v: "9:16", label: "9:16" },
  { v: "1:1", label: "1:1" },
];

function selectCard(active, locked = false) {
  return `text-left px-4 py-3 rounded-xl border transition-all ${
    locked
      ? "border-[#2E2E30]/80 bg-[#0B0B0C] opacity-75"
      : active
        ? "border-[#7C3AED] bg-gradient-to-br from-[#7C3AED]/15 to-[#7C3AED]/5 shadow-[0_0_28px_-10px_rgba(124,58,237,0.6)]"
        : "border-[#2E2E30] bg-[#0F0F12] hover:border-[#5A5A5E]"
  }`;
}

export default function VideoEditorAdmin() {
  const { t, lang } = useI18n();
  const ideas = useMemo(() => EDIT_IDEAS.map((k) => t(k)), [t]);
  const { refresh, user } = useAuth();
  const { costs } = usePricing();
  const baseCost = costs.videoEdit ?? costs.video ?? 95;
  const premium = hasStudioPremium(user);

  const [video, setVideo] = useState(null);
  const [sourceDurationSec, setSourceDurationSec] = useState(0);
  const [reference, setReference] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [resolution, setResolution] = useState("original");
  const [duration, setDuration] = useState(6);
  const [improve, setImprove] = useState(false);
  const [aspect, setAspect] = useState("auto");
  const [audioSetting, setAudioSetting] = useState("origin");
  const [busy, setBusy] = useState(false);
  const [uploadPhase, setUploadPhase] = useState("");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const cost = useMemo(
    () => computeVideoEditCost(baseCost, { resolution, duration }),
    [baseCost, resolution, duration],
  );

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

  const premiumLocked = () => {
    toast.info(t("studio_plus_locked_toast"), {
      action: {
        label: t("studio_plus_cta"),
        onClick: () => { window.location.href = "/app/billing"; },
      },
    });
  };

  const pickResolution = (r) => {
    if (r.premium && !premium) {
      premiumLocked();
      return;
    }
    setResolution(r.v);
  };

  const pickDuration = (d) => {
    if (isPremiumDuration(d) && !premium) {
      premiumLocked();
      return;
    }
    setDuration(d);
  };

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
      fd.append("resolution", resolution);
      fd.append("duration", String(duration));
      fd.append("aspect_ratio", aspect);
      fd.append("audio_setting", audioSetting);
      fd.append("lang", lang || "pt");
      if (improve && premium) fd.append("improve_prompt", "1");
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

  const controls = (
    <div className="space-y-4 min-w-0">
      {!premium && (
        <div className="rounded-xl border border-[#FACC15]/30 bg-[#FACC15]/8 px-3 py-2.5 text-[11px] text-[#FDE68A] leading-relaxed">
          {t("studio_plus_video_banner")}{" "}
          <Link to="/app/billing" className="text-white underline underline-offset-2 font-medium">
            {t("studio_plus_cta")}
          </Link>
        </div>
      )}

      <StudioAccordionSection title={t("vid_acc_my_video")} defaultOpen testId="video-edit-acc-source">
        <p className="text-[#6f6f76] text-[11px] mb-3">
          {t("vid_edit_eta_hint", { min: eta.min, max: eta.max })}
        </p>
        <StudioVideoUpload
          value={video}
          onChange={setVideo}
          disabled={busy}
          maxDurationSec={10}
          testId="video-edit-source"
        />
      </StudioAccordionSection>

      <StudioAccordionSection title={t("vid_edit_prompt_label")} defaultOpen testId="video-edit-acc-prompt">
          <div className="flex items-baseline justify-end mb-3 -mt-1">
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
              locked={!premium}
              onLockedClick={premiumLocked}
              testId="video-edit-improve"
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
      </StudioAccordionSection>

      <StudioAccordionSection title={t("vid_edit_ref_label")} defaultOpen={false} testId="video-edit-acc-ref">
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
      </StudioAccordionSection>

      <StudioAccordionSection title={t("vid_edit_resolution")} defaultOpen testId="video-edit-acc-resolution">
        <div className="grid grid-cols-1 gap-2">
            {RESOLUTIONS.map((r) => {
              const locked = r.premium && !premium;
              const extra = SURCHARGE.resolution[r.v];
              return (
                <button
                  key={r.v}
                  type="button"
                  onClick={() => pickResolution(r)}
                  className={selectCard(resolution === r.v, locked)}
                  data-testid={`video-edit-res-${r.v}`}
                >
                  <p className="text-[#F4F1EA] text-[14px] font-medium flex items-center gap-1.5">
                    {r.labelKey ? t(r.labelKey) : r.label}
                    {locked && <Lock className="w-3 h-3 text-[#FACC15]" />}
                  </p>
                  {r.labelKey && (
                    <p className="text-[#8A8A8E] text-[10px] mt-1">{t("vid_res_original_hint")}</p>
                  )}
                  {extra > 0 && (
                    <p className="text-[#A855F7] text-[10px] font-mono mt-1">+{extra} {t("credits")}</p>
                  )}
                </button>
              );
            })}
          </div>
      </StudioAccordionSection>

      <StudioAccordionSection title={t("vid_edit_duration")} defaultOpen testId="video-edit-acc-duration">
        <div className="grid grid-cols-2 gap-2">
            {DURATIONS.map((d) => {
              const locked = isPremiumDuration(d) && !premium;
              const extra = SURCHARGE.duration[d];
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => pickDuration(d)}
                  className={selectCard(duration === d, locked)}
                  data-testid={`video-edit-dur-${d}`}
                >
                  <p className="text-[#F4F1EA] text-[16px] font-light flex items-center gap-1">
                    {d}s
                    {locked && <Lock className="w-3 h-3 text-[#FACC15]" />}
                  </p>
                  {extra > 0 && (
                    <p className="text-[#A855F7] text-[10px] font-mono mt-1">+{extra}</p>
                  )}
                </button>
              );
            })}
          </div>
      </StudioAccordionSection>

      <StudioAccordionSection title={t("vid_edit_aspect")} defaultOpen={false} testId="video-edit-acc-aspect">
        <div className="grid grid-cols-2 gap-2">
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
      </StudioAccordionSection>

      <StudioAccordionSection title={t("vid_edit_audio")} defaultOpen={false} testId="video-edit-acc-audio">
        <div className="grid grid-cols-1 gap-2">
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
      </StudioAccordionSection>

      <StudioAccordionSection title={t("vid_acc_generate")} defaultOpen testId="video-edit-acc-generate">
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
      <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED]">
        {t("vid_edit_result_label")}
      </p>
      <div className="rp-editor-panel overflow-hidden p-3 sm:p-4">
        <ResultPanel creation={result} loading={busy} onChange={setResult} emptyLabel={t("vid_edit_result_empty")} />
      </div>
    </StudioResultAnchor>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-10" data-testid="video-editor-admin">
      {controls}
      {resultBlock}
    </div>
  );
}
