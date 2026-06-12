import { useEffect, useMemo, useState } from "react";
import { Clapperboard, Sparkles } from "lucide-react";
import {
  formatApiError,
  uploadPost,
} from "../../lib/api";
import { dispatchBackgroundJob, ensureBackgroundSlot } from "../../lib/bgGeneration";
import { readVideoDurationSeconds } from "../../lib/videoMedia";
import { useAuth } from "../../lib/auth";
import { usePricing } from "../../lib/PricingContext";
import { useI18n } from "../../lib/i18n";
import { computeVideoEditCost, buildVideoEditSurcharge } from "../../lib/videoEditPricing";
import { WAN_VIDEO_EDIT } from "../../lib/videoEditEngines";
import { VIDEO_TOOL_IDS } from "../../lib/videoModels";
import { pickBlobOffloadTimeoutMs } from "../../lib/uploadConstants";
import { getSurcharges } from "../../lib/creditPricing";
import { toast } from "sonner";
import StudioAccordionSection from "../../components/StudioAccordionSection";
import ImageUploadZone from "../../components/ImageUploadZone";
import StudioVideoUpload from "../../components/StudioVideoUpload";
import StudioGenerateBar from "../../components/StudioGenerateBar";
import StudioGenerateCostMeta from "../../components/StudioGenerateCostMeta";
import StudioPhotoUploadNotice from "../../components/studio/StudioPhotoUploadNotice";
import { isPhotoUploadBusy } from "../../components/studio/StudioPhotoUploadNotice";
import PromptEnhanceToggle from "../../components/promptAssist/PromptEnhanceToggle";
import { useStudioGenerateGate } from "../../lib/useStudioGenerateGate";

const EDIT_IDEAS = {
  "": ["vid_edit_idea_1", "vid_edit_idea_2", "vid_edit_idea_3"],
  background: ["vid_bg_idea_1", "vid_bg_idea_2", "vid_bg_idea_3"],
  outfit: ["vid_outfit_idea_1", "vid_outfit_idea_2", "vid_outfit_idea_3"],
  restyle: ["vid_restyle_idea_1", "vid_restyle_idea_2", "vid_restyle_idea_3"],
};
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

function selectCard(active) {
  return `text-left px-4 py-3 rounded-xl border transition-all ${
    active
      ? "border-[#7C3AED] bg-gradient-to-br from-[#7C3AED]/15 to-[#7C3AED]/5 shadow-[0_0_28px_-10px_rgba(124,58,237,0.6)]"
      : "border-[#2E2E30] bg-[#0F0F12] hover:border-[#5A5A5E]"
  }`;
}

export default function VideoEditorAdmin({ category }) {
  const preset = category?.preset || "";
  const modeId = category?.id || "edit";
  const engine = WAN_VIDEO_EDIT;
  const { t, lang } = useI18n();
  const ideaKeys = EDIT_IDEAS[preset] || EDIT_IDEAS[""];
  const ideas = useMemo(() => ideaKeys.map((k) => t(k)), [t, ideaKeys]);
  const { refresh, user } = useAuth();
  const { costs, region } = usePricing();
  const surcharges = useMemo(() => getSurcharges(region), [region]);
  const videoSurcharge = useMemo(() => buildVideoEditSurcharge(region), [region]);
  const baseCost = costs.videoEdit ?? costs.video ?? 100;

  const [video, setVideo] = useState(null);
  const [videoCloudUrl, setVideoCloudUrl] = useState(null);
  const [sourceDurationSec, setSourceDurationSec] = useState(0);
  const [reference, setReference] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [resolution, setResolution] = useState("original");
  const [duration, setDuration] = useState(6);
  const [improve, setImprove] = useState(false);
  const [aspect, setAspect] = useState("auto");
  const [audioSetting, setAudioSetting] = useState("origin");
  const [busy, setBusy] = useState(false);
  const [videoUploadStatus, setVideoUploadStatus] = useState("idle");
  const [uploadPhase, setUploadPhase] = useState("");

  const cost = useMemo(() => {
    let total = computeVideoEditCost(baseCost, {
      resolution,
      duration,
      regionId: region,
    });
    if (improve) total += surcharges.enhancePrompt ?? 5;
    return total;
  }, [baseCost, resolution, duration, improve, surcharges.enhancePrompt, region]);

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
    if (!sourceDurationSec) return { min: 3, max: 8 };
    if (sourceDurationSec <= 5) return { min: 3, max: 7 };
    if (sourceDurationSec <= 10) return { min: 4, max: 8 };
    return { min: 5, max: 10 };
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
      toast.error(t("vid_edit_err_short"));
      return;
    }
    if ((user?.credits ?? 0) < cost && !user?.is_unlimited) {
      toast.error(t("vid_err_credits", { need: cost, have: user?.credits ?? 0 }));
      return;
    }
    if (!user?.email) {
      toast.error(t("vid_edit_notify_no_email"));
      return;
    }

    setBusy(true);
    setUploadPhase("send");
    try { ensureBackgroundSlot(); } catch { setBusy(false); setUploadPhase(""); return; }
    let submitData;
    try {
      const fd = new FormData();
      fd.append("prompt", prompt.trim());
      fd.append("resolution", resolution);
      fd.append("duration", String(duration));
      fd.append("aspect_ratio", aspect);
      fd.append("audio_setting", audioSetting);
      fd.append("lang", lang || "pt");
      if (preset) fd.append("video_preset", preset);
      fd.append("video_tool", VIDEO_TOOL_IDS.wan_edit);
      if (improve) fd.append("improve_prompt", "1");
      fd.append("video_url", videoCloudUrl);
      if (reference) fd.append("reference_image", reference);
      fd.append("notify_by_email", "1");
      fd.append("notify_email", user.email);

      ({ data: submitData } = await uploadPost("/generate/video-edit", fd, {
        timeout: 600_000,
        blobOffloadTimeoutMs: video?.size ? pickBlobOffloadTimeoutMs(video.size, true) : undefined,
        skipBlobOffload: true,
        headers: { "X-Skip-Auto-Poll": "1" },
      }));

      dispatchBackgroundJob(submitData, {
        type: "video",
        creditsSpent: submitData.credits_spent || cost,
        label: t("vid_edit_title") || "Vídeo",
      });
      toast.info(
        t("vid_edit_queued_email", {
          email: user.email,
          min: eta.min,
          max: eta.max,
        }),
        { duration: 12000 },
      );
      await refresh();
    } catch (err) {
      toast.error(formatApiError(err, t("vid_edit_fail"), { context: "video_upload", t }), { duration: 12000 });
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
      <div className="min-w-0 max-w-3xl" data-testid={`video-editor-${modeId}`}>
        <div className="rp-studio-card-stack min-w-0">
          <StudioAccordionSection title={t("vid_acc_my_video")} defaultOpen testId="video-edit-acc-source">
            <p className="text-[#6f6f76] text-[11px] mb-3 leading-snug">
              {t("vid_edit_public_note_email")}
            </p>
            <p className="text-[#6f6f76] text-[11px] mb-3">
              {t("vid_edit_eta_hint", { min: eta.min, max: eta.max })}
            </p>
            <StudioVideoUpload
              value={video}
              onChange={(f) => { setVideo(f); if (!f) setVideoCloudUrl(null); }}
              onCloudUrlChange={setVideoCloudUrl}
              onStatusChange={setVideoUploadStatus}
              disabled={busy}
              maxDurationSec={engine.maxDurationSec}
              requireCloudUrl={engine.requiresCloudUrl}
              testId="video-edit-source"
            />
            <StudioPhotoUploadNotice status={videoUploadStatus} className="mt-3" />
          </StudioAccordionSection>

          <StudioAccordionSection
            title={t("vid_edit_prompt_label")}
            defaultOpen
            testId="video-edit-acc-prompt"
            helpKey="help_sec_video_edit_prompt"
          >
            <div className="flex items-baseline justify-end mb-3">
              <span className="text-[#5A5A5E] text-[11px] font-mono">{prompt.length}/800</span>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, 800))}
              rows={3}
              placeholder={t("vid_edit_prompt_placeholder")}
              className="rp-editor-textarea rp-editor-textarea--compact min-h-[88px]"
              data-testid="video-edit-prompt"
            />
            <div className="mt-3">
              <PromptEnhanceToggle
                checked={improve}
                onChange={setImprove}
                locked={false}
                onLockedClick={undefined}
                testId="video-edit-improve"
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
                const extra = videoSurcharge.resolution[r.v];
                return (
                  <button
                    key={r.v}
                    type="button"
                    onClick={() => setResolution(r.v)}
                    className={selectCard(resolution === r.v)}
                    data-testid={`video-edit-res-${r.v}`}
                  >
                    <p className="text-[#F4F1EA] text-[14px] font-medium flex items-center gap-1.5">
                      {r.labelKey ? t(r.labelKey) : r.label}
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
                const extra = videoSurcharge.duration[d];
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={selectCard(duration === d)}
                    data-testid={`video-edit-dur-${d}`}
                  >
                    <p className="text-[#F4F1EA] text-[16px] font-light flex items-center gap-1">
                      {d}s
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
        </div>
      </div>
      <StudioGenerateBar
        ready={ready && Boolean(user?.email)}
        busy={busy}
        onClick={run}
        label={t("vid_edit_btn", { n: cost })}
        busyLabel={
          uploadPhase === "send"
            ? t("vid_edit_uploading")
            : t("vid_edit_processing")
        }
        hint={!user?.email ? t("vid_edit_notify_no_email") : hint}
        blockedNotify="message"
        testId="video-edit-submit"
        icon={Clapperboard}
        costMeta={<StudioGenerateCostMeta cost={cost} user={user} />}
      />
    </>
  );
}
