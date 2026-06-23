import { useEffect, useMemo, useState } from "react";
import { Film, Sparkles } from "lucide-react";
import { formatApiError, uploadPost } from "../../lib/api";
import { dispatchBackgroundJob, ensureBackgroundSlot } from "../../lib/bgGeneration";
import { normalizeCreation, primaryResultUrl } from "../../lib/creationUrls";
import { readVideoDurationSeconds } from "../../lib/videoMedia";
import { useAuth } from "../../lib/auth";
import { usePricing } from "../../lib/PricingContext";
import { useI18n } from "../../lib/i18n";
import { computeVideoExtendCost, buildVideoExtendSurcharge } from "../../lib/videoExtendPricing";
import { pickBlobOffloadTimeoutMs } from "../../lib/uploadConstants";
import { getSurcharges } from "../../lib/creditPricing";
import { toast } from "sonner";
import ResultPanel from "../../components/ResultPanel";
import StudioResultAnchor from "../../components/StudioResultAnchor";
import StudioAccordionSection from "../../components/StudioAccordionSection";
import StudioVideoUpload from "../../components/StudioVideoUpload";
import StudioGenerateBar from "../../components/StudioGenerateBar";
import StudioGenerateCostMeta from "../../components/StudioGenerateCostMeta";
import StudioVideoUploadNotice from "../../components/studio/StudioVideoUploadNotice";
import { isPhotoUploadBusy } from "../../components/studio/StudioPhotoUploadNotice";
import PromptEnhanceToggle from "../../components/promptAssist/PromptEnhanceToggle";
import { useStudioGenerateGate } from "../../lib/useStudioGenerateGate";

const EXTEND_IDEAS = ["vid_extend_idea_1", "vid_extend_idea_2", "vid_extend_idea_3"];
const DURATIONS = [4, 6, 8, 10];
const RESOLUTIONS = [
  { v: "1080p", label: "1080p" },
  { v: "720p", label: "720p" },
];

function selectCard(active) {
  return `text-left px-4 py-3 rounded-xl border transition-all ${
    active
      ? "border-[#7C3AED] bg-gradient-to-br from-[#7C3AED]/15 to-[#7C3AED]/5 shadow-[0_0_28px_-10px_rgba(124,58,237,0.6)]"
      : "border-[#2E2E30] bg-[#0F0F12] hover:border-[#5A5A5E]"
  }`;
}

export default function VideoExtend({ category }) {
  const modeId = category?.id || "extend";
  const { t, lang } = useI18n();
  const ideas = useMemo(() => EXTEND_IDEAS.map((k) => t(k)), [t]);
  const { refresh, user } = useAuth();
  const { region } = usePricing();
  const surcharges = useMemo(() => getSurcharges(region), [region]);
  const videoSurcharge = useMemo(() => buildVideoExtendSurcharge(region), [region]);

  const [video, setVideo] = useState(null);
  const [videoCloudUrl, setVideoCloudUrl] = useState(null);
  const [sourceDurationSec, setSourceDurationSec] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [resolution, setResolution] = useState("1080p");
  const [duration, setDuration] = useState(6);
  const [improve, setImprove] = useState(false);
  const [notifyByEmail, setNotifyByEmail] = useState(false);
  const [busy, setBusy] = useState(false);
  const [videoUploadStatus, setVideoUploadStatus] = useState("idle");
  const [videoCloudProgress, setVideoCloudProgress] = useState(null);
  const [uploadPhase, setUploadPhase] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    const onCreation = (e) => {
      const creation = normalizeCreation(e.detail);
      if (creation?.type !== "video" || !primaryResultUrl(creation)) return;
      setResult(creation);
      setBusy(false);
      setUploadPhase("");
    };
    window.addEventListener("rp:creation-succeeded", onCreation);
    return () => window.removeEventListener("rp:creation-succeeded", onCreation);
  }, []);

  const cost = useMemo(() => {
    let total = computeVideoExtendCost({ resolution, duration, regionId: region });
    if (improve) total += surcharges.enhancePrompt ?? 5;
    return total;
  }, [resolution, duration, improve, surcharges.enhancePrompt, region]);

  const videoUploading = isPhotoUploadBusy(videoUploadStatus);
  const cloudReady = Boolean(videoCloudUrl);

  const { ready, hint } = useStudioGenerateGate({
    busy,
    user,
    cost,
    requireVideo: true,
    video,
    requirePrompt: true,
    prompt,
    uploading: videoUploading,
    readyOverride: cloudReady ? undefined : false,
    hintOverride: !cloudReady && video ? t("vid_edit_cloud_required") : undefined,
  });

  const eta = useMemo(() => {
    if (!sourceDurationSec) return { min: 3, max: 10 };
    if (sourceDurationSec <= 5) return { min: 4, max: 10 };
    return { min: 6, max: 14 };
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
    if (videoUploading) {
      toast.message(t("upload_wait_generate"), { duration: 6000 });
      return;
    }
    if (!video) {
      toast.error(t("vid_edit_err_video"));
      return;
    }
    if (!videoCloudUrl) {
      toast.error(t("vid_edit_cloud_required"));
      return;
    }
    if (prompt.trim().length < 3) {
      toast.error(t("vid_extend_err_short"));
      return;
    }
    if ((user?.credits ?? 0) < cost && !user?.is_unlimited) {
      toast.error(t("vid_err_credits", { need: cost, have: user?.credits ?? 0 }));
      return;
    }

    setBusy(true);
    setUploadPhase("send");
    setResult(null);
    try { ensureBackgroundSlot(); } catch { setBusy(false); setUploadPhase(""); return; }
    let submitData;
    try {
      const fd = new FormData();
      fd.append("prompt", prompt.trim());
      fd.append("resolution", resolution);
      fd.append("duration", String(duration));
      fd.append("lang", lang || "pt");
      if (improve) fd.append("improve_prompt", "1");
      if (videoCloudUrl) {
        fd.append("video_url", videoCloudUrl);
      } else {
        fd.append("video", video);
      }
      if (notifyByEmail) {
        fd.append("notify_by_email", "1");
        if (user?.email) fd.append("notify_email", user.email);
      }

      ({ data: submitData } = await uploadPost("/generate/video-extend", fd, {
        timeout: 600_000,
        blobOffloadTimeoutMs: video?.size ? pickBlobOffloadTimeoutMs(video.size, true) : undefined,
        skipBlobOffload: Boolean(videoCloudUrl),
        headers: { "X-Skip-Auto-Poll": "1" },
      }));

      setUploadPhase("processing");
      dispatchBackgroundJob(submitData, {
        type: "video",
        creditsSpent: submitData.credits_spent || cost,
        label: t("vid_extend_title"),
      });
      if (notifyByEmail && user?.email) {
        toast.info(t("vid_edit_notify_scheduled", { email: user.email }), { duration: 9000 });
      }
      await refresh();
    } catch (err) {
      toast.error(formatApiError(err, t("vid_extend_fail"), { context: "video_upload", t }), { duration: 12000 });
      if (err?.refunded && submitData?.credits_spent) {
        try { await refresh(); } catch { /* ignore */ }
      }
    } finally {
      setBusy(false);
      setUploadPhase("");
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-3 lg:gap-8" data-testid={`video-extend-${modeId}`}>
        <div className="rp-studio-card-stack min-w-0">
          <StudioAccordionSection title={t("vid_extend_source_label")} defaultOpen testId="video-extend-acc-source">
            <p className="text-[#6f6f76] text-[11px] mb-3">{t("vid_extend_source_hint")}</p>
            <p className="text-[#6f6f76] text-[11px] mb-3">
              {t("vid_edit_eta_hint", { min: eta.min, max: eta.max })}
            </p>
            <StudioVideoUpload
              value={video}
              onChange={(f) => { setVideo(f); if (!f) setVideoCloudUrl(null); }}
              onCloudUrlChange={setVideoCloudUrl}
              onCloudProgressChange={setVideoCloudProgress}
              onStatusChange={setVideoUploadStatus}
              disabled={busy}
              maxDurationSec={10}
              requireCloudUrl
              testId="video-extend-source"
            />
            <StudioVideoUploadNotice
              status={videoUploadStatus}
              progress={videoCloudProgress}
              className="mt-3"
            />
          </StudioAccordionSection>

          <StudioAccordionSection title={t("vid_extend_prompt_label")} defaultOpen testId="video-extend-acc-prompt">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, 800))}
              rows={3}
              placeholder={t("vid_extend_prompt_placeholder")}
              className="rp-editor-textarea rp-editor-textarea--compact min-h-[88px]"
              data-testid="video-extend-prompt"
            />
            <div className="mt-3">
              <PromptEnhanceToggle
                checked={improve}
                onChange={setImprove}
                testId="video-extend-improve"
                cost={surcharges.enhancePrompt ?? 5}
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

          <StudioAccordionSection title={t("vid_extend_extra_label")} defaultOpen testId="video-extend-acc-duration">
            <p className="text-[#8A8A8E] text-[12px] mb-3">{t("vid_extend_extra_hint")}</p>
            <div className="grid grid-cols-2 gap-2">
              {DURATIONS.map((d) => {
                const extra = videoSurcharge.duration[d];
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={selectCard(duration === d)}
                    data-testid={`video-extend-dur-${d}`}
                  >
                    <p className="text-[#F4F1EA] text-[16px] font-light">+{d}s</p>
                    {extra > 0 && (
                      <p className="text-[#A855F7] text-[10px] font-mono mt-1">+{extra} {t("credits")}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </StudioAccordionSection>

          <StudioAccordionSection title={t("vid_edit_resolution")} defaultOpen testId="video-extend-acc-resolution">
            <div className="grid grid-cols-2 gap-2">
              {RESOLUTIONS.map((r) => {
                const extra = videoSurcharge.resolution[r.v];
                return (
                  <button
                    key={r.v}
                    type="button"
                    onClick={() => setResolution(r.v)}
                    className={selectCard(resolution === r.v)}
                    data-testid={`video-extend-res-${r.v}`}
                  >
                    <p className="text-[#F4F1EA] text-[14px] font-medium">{r.label}</p>
                    {extra > 0 && (
                      <p className="text-[#A855F7] text-[10px] font-mono mt-1">+{extra} {t("credits")}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </StudioAccordionSection>

          <StudioAccordionSection title={t("vid_edit_notify")} defaultOpen={false} testId="video-extend-acc-notify">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={notifyByEmail}
                onChange={(e) => setNotifyByEmail(e.target.checked)}
                disabled={!user?.email}
                className="mt-1 rounded border-[#2E2E30] bg-[#0F0F12] text-[#7C3AED] focus:ring-[#7C3AED] disabled:opacity-40"
                data-testid="video-extend-notify-email"
              />
              <span>
                <span className="block text-[#F4F1EA] text-[13px] font-medium">{t("vid_edit_notify_email")}</span>
                <span className="block text-[#8A8A8E] text-[11px] mt-0.5 leading-snug">
                  {user?.email
                    ? t("vid_edit_notify_email_hint", { email: user.email })
                    : t("vid_edit_notify_no_email")}
                </span>
              </span>
            </label>
          </StudioAccordionSection>
        </div>

        <StudioResultAnchor
          busy={busy}
          ready={Boolean(primaryResultUrl(result))}
          className="lg:sticky lg:top-[72px] self-start space-y-2"
        >
          <p className="hidden md:block text-[11px] text-[#6b6b70] uppercase tracking-wide">
            {t("vid_extend_result_label")}
          </p>
          <div className="rounded-2xl border border-white/[0.08] bg-[#141418]/90 overflow-hidden p-3">
            <ResultPanel
              creation={result}
              loading={busy}
              onChange={setResult}
              emptyLabel={t("vid_extend_result_empty")}
            />
          </div>
        </StudioResultAnchor>
      </div>

      <StudioGenerateBar
        ready={ready}
        busy={busy}
        onClick={run}
        label={t("vid_extend_btn", { n: cost })}
        busyLabel={uploadPhase === "processing" ? t("vid_edit_processing") : t("vid_rendering")}
        hint={hint}
        cost={cost}
        blockedNotify="message"
        testId="video-extend-submit"
        costMeta={<StudioGenerateCostMeta cost={cost} user={user} />}
        icon={Film}
      />
    </>
  );
}
