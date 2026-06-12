import { useEffect, useMemo, useState } from "react";
import { Clapperboard, Sparkles } from "lucide-react";
import {
  formatApiError,
  uploadPost,
} from "../../lib/api";
import { dispatchBackgroundJob, ensureBackgroundSlot } from "../../lib/bgGeneration";
import { normalizeCreation, primaryResultUrl } from "../../lib/creationUrls";
import { readVideoDurationSeconds } from "../../lib/videoMedia";
import { useAuth } from "../../lib/auth";
import { usePricing } from "../../lib/PricingContext";
import { useI18n } from "../../lib/i18n";
import { computeVideoEditCost, buildVideoEditSurcharge } from "../../lib/videoEditPricing";
import {
  VIDEO_EDIT_ENGINES,
  GROK_VIDEO_EDIT_MAX_SEC,
  getVideoEditEngine,
  defaultVideoEditEngineId,
} from "../../lib/videoEditEngines";
import { VIDEO_TOOL_IDS } from "../../lib/videoModels";
import { pickBlobOffloadTimeoutMs } from "../../lib/uploadConstants";
import { getSurcharges } from "../../lib/creditPricing";
import { toast } from "sonner";
import ResultPanel from "../../components/ResultPanel";
import StudioResultAnchor from "../../components/StudioResultAnchor";
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
  const engineLocked = Boolean(preset);
  const { t, lang } = useI18n();
  const ideaKeys = EDIT_IDEAS[preset] || EDIT_IDEAS[""];
  const ideas = useMemo(() => ideaKeys.map((k) => t(k)), [t, ideaKeys]);
  const { refresh, user } = useAuth();
  const { costs, region } = usePricing();
  const surcharges = useMemo(() => getSurcharges(region), [region]);
  const videoSurcharge = useMemo(() => buildVideoEditSurcharge(region), [region]);
  const baseCost = costs.videoEdit ?? costs.video ?? 120;

  const [engineId, setEngineId] = useState(
    engineLocked ? VIDEO_TOOL_IDS.wan_edit : defaultVideoEditEngineId(),
  );
  const engine = useMemo(() => getVideoEditEngine(engineId), [engineId]);

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
  const [notifyByEmail, setNotifyByEmail] = useState(false);
  const [busy, setBusy] = useState(false);
  const [videoUploadStatus, setVideoUploadStatus] = useState("idle");
  const [uploadPhase, setUploadPhase] = useState("");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const onCreation = (e) => {
      const creation = normalizeCreation(e.detail);
      if (creation?.type !== "video" || !primaryResultUrl(creation)) return;
      setResult(creation);
      setBusy(false);
      setUploadPhase("");
      setProgress(0);
    };
    window.addEventListener("rp:creation-succeeded", onCreation);
    return () => window.removeEventListener("rp:creation-succeeded", onCreation);
  }, []);

  const cost = useMemo(() => {
    let total = computeVideoEditCost(baseCost, {
      resolution,
      duration,
      regionId: region,
      engine: engineId,
    });
    if (improve) total += surcharges.enhancePrompt ?? 5;
    return total;
  }, [baseCost, resolution, duration, improve, surcharges.enhancePrompt, region, engineId]);

  const videoUploading = isPhotoUploadBusy(videoUploadStatus);

  const cloudReady = !engine.requiresCloudUrl || Boolean(videoCloudUrl);

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

  const pickResolution = (r) => {
    setResolution(r.v);
  };

  const pickDuration = (d) => {
    setDuration(d);
  };

  const pickEngine = (id) => {
    setEngineId(id);
    if (id === VIDEO_TOOL_IDS.grok_edit) {
      setReference(null);
      setDuration(GROK_VIDEO_EDIT_MAX_SEC);
    }
  };

  const run = async () => {
    if (videoUploading) {
      toast.message(t("upload_wait_generate"), { duration: 6000 });
      return;
    }
    if (!video) {
      toast.error(t("vid_edit_err_video"));
      return;
    }
    if (engine.requiresCloudUrl && !videoCloudUrl) {
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

    setBusy(true);
    setProgress(0);
    setUploadPhase("send");
    setResult(null);
    try { ensureBackgroundSlot(); } catch { setBusy(false); setUploadPhase(""); return; }
    let submitData;
    try {
      const fd = new FormData();
      fd.append("prompt", prompt.trim());
      fd.append("resolution", resolution);
      fd.append("duration", String(engine.fixedDurationSec ?? duration));
      fd.append("aspect_ratio", aspect);
      fd.append("audio_setting", audioSetting);
      fd.append("lang", lang || "pt");
      if (preset) fd.append("video_preset", preset);
      fd.append("video_tool", engineId);
      if (improve) fd.append("improve_prompt", "1");
      if (videoCloudUrl) {
        fd.append("video_url", videoCloudUrl);
      } else if (video) {
        fd.append("video", video);
      }
      if (reference && engine.showReference) fd.append("reference_image", reference);
      if (notifyByEmail) {
        fd.append("notify_by_email", "1");
        if (user?.email) fd.append("notify_email", user.email);
      }

      ({ data: submitData } = await uploadPost("/generate/video-edit", fd, {
        timeout: 600_000,
        blobOffloadTimeoutMs: video?.size ? pickBlobOffloadTimeoutMs(video.size, true) : undefined,
        skipBlobOffload: Boolean(videoCloudUrl),
        headers: { "X-Skip-Auto-Poll": "1" },
      }));

      setUploadPhase("processing");
      dispatchBackgroundJob(submitData, {
        type: "video",
        creditsSpent: submitData.credits_spent || cost,
        label: t("vid_edit_title") || "Vídeo",
      });
      if (notifyByEmail) {
        const target = user?.email || t("vid_edit_notify_fallback");
        toast.info(t("vid_edit_notify_scheduled", { email: target }), { duration: 9000 });
      }
      await refresh();
      // Result lands in gallery + notifications when ready (also via email
      // for video edits, if the backend so chooses — opt-in via `notify_email`
      // field which we forward when present).
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
    <div className="rp-studio-card-stack min-w-0">
      {!engineLocked && (
        <StudioAccordionSection title={t("vid_edit_engine_title")} defaultOpen testId="video-edit-acc-engine">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {VIDEO_EDIT_ENGINES.map((eng) => {
              const active = engineId === eng.id;
              return (
                <button
                  key={eng.id}
                  type="button"
                  onClick={() => pickEngine(eng.id)}
                  className={selectCard(active)}
                  data-testid={`video-edit-engine-${eng.id}`}
                >
                  <p className="text-[#F4F1EA] text-[14px] font-medium">{t(eng.labelKey)}</p>
                  <p className="text-[#8A8A8E] text-[10px] mt-1 leading-snug">{t(eng.descKey)}</p>
                  <p className="text-[#A855F7] text-[10px] font-mono mt-2">{t(eng.badgeKey)}</p>
                </button>
              );
            })}
          </div>
          {engineId === VIDEO_TOOL_IDS.grok_edit && (
            <p className="text-[#6f6f76] text-[11px] mt-3 leading-snug">{t("vid_edit_grok_limits")}</p>
          )}
        </StudioAccordionSection>
      )}

      <StudioAccordionSection title={t("vid_acc_my_video")} defaultOpen testId="video-edit-acc-source">
        <p className="text-[#6f6f76] text-[11px] mb-3">
          {engineId === VIDEO_TOOL_IDS.grok_edit
            ? t("vid_edit_public_note_grok")
            : t("vid_edit_public_note")}
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

      {engine.showReference && (
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
      )}

      {engine.showResolution && (
      <StudioAccordionSection title={t("vid_edit_resolution")} defaultOpen testId="video-edit-acc-resolution">
        <div className="grid grid-cols-1 gap-2">
            {RESOLUTIONS.map((r) => {
              const extra = videoSurcharge.resolution[r.v];
              return (
                <button
                  key={r.v}
                  type="button"
                  onClick={() => pickResolution(r)}
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
      )}

      {engine.showDuration && (
      <StudioAccordionSection title={t("vid_edit_duration")} defaultOpen testId="video-edit-acc-duration">
        {engine.fixedDurationSec ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={selectCard(true)}
              data-testid={`video-edit-dur-${engine.fixedDurationSec}`}
            >
              <p className="text-[#F4F1EA] text-[16px] font-light">{engine.fixedDurationSec}s</p>
              <p className="text-[#8A8A8E] text-[10px] mt-1 leading-snug">{t("vid_edit_grok_duration_default")}</p>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {DURATIONS.map((d) => {
              const extra = videoSurcharge.duration[d];
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => pickDuration(d)}
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
        )}
      </StudioAccordionSection>
      )}

      {engine.showAspect && (
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
      )}

      {engine.showAudio && (
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
      )}

      <StudioAccordionSection title={t("vid_edit_notify") || "Notificação"} defaultOpen={false} testId="video-edit-acc-notify">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={notifyByEmail}
              onChange={(e) => setNotifyByEmail(e.target.checked)}
              disabled={!user?.email}
              className="mt-1 rounded border-[#2E2E30] bg-[#0F0F12] text-[#7C3AED] focus:ring-[#7C3AED] disabled:opacity-40"
              data-testid="video-edit-notify-email"
            />
            <span>
              <span className="block text-[#F4F1EA] text-[13px] font-medium group-hover:text-white transition-colors">
                {t("vid_edit_notify_email") || "Notificar-me por email"}
              </span>
              <span className="block text-[#8A8A8E] text-[11px] mt-0.5 leading-snug">
                {user?.email
                  ? t("vid_edit_notify_email_hint", { email: user.email })
                  : t("vid_edit_notify_no_email")}
              </span>
            </span>
          </label>
      </StudioAccordionSection>
    </div>
  );

  const resultBlock = (
    <StudioResultAnchor
      busy={busy}
      ready={Boolean(primaryResultUrl(result))}
      className="lg:sticky lg:top-[72px] self-start space-y-2"
    >
      <p className="hidden md:block text-[11px] text-[#6b6b70] uppercase tracking-wide">
        {t("vid_edit_result_label")}
      </p>
      <div className="rounded-2xl border border-white/[0.08] bg-[#141418]/90 overflow-hidden p-3">
        <ResultPanel creation={result} loading={busy} onChange={setResult} emptyLabel={t("vid_edit_result_empty")} />
      </div>
    </StudioResultAnchor>
  );

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-3 lg:gap-8" data-testid={`video-editor-${modeId}`}>
        {controls}
        {resultBlock}
      </div>
      <StudioGenerateBar
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
        blockedNotify="message"
        testId="video-edit-submit"
        icon={Clapperboard}
        costMeta={<StudioGenerateCostMeta cost={cost} user={user} />}
      />
    </>
  );
}
