import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Clapperboard, ChevronDown } from "lucide-react";
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
import ImageUploadZone from "../../components/ImageUploadZone";
import StudioVideoUpload from "../../components/StudioVideoUpload";
import StudioGenerateBar from "../../components/StudioGenerateBar";
import StudioGenerateCostMeta from "../../components/StudioGenerateCostMeta";
import StudioVideoUploadNotice from "../../components/studio/StudioVideoUploadNotice";
import { isPhotoUploadBusy } from "../../components/studio/StudioPhotoUploadNotice";
import PromptEnhanceToggle from "../../components/promptAssist/PromptEnhanceToggle";
import { useStudioGenerateGate } from "../../lib/useStudioGenerateGate";
import VideoEditModeTabs from "../../components/video/VideoEditModeTabs";
import VideoEditTemplatePanel from "../../components/video/VideoEditTemplatePanel";
import { findVideoEditMode, resolveEditMode } from "../../lib/videoEditCatalog";

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

function chipClass(active) {
  return [
    "px-3 py-2 rounded-lg border text-[12px] font-medium transition-all",
    active
      ? "border-[#7C3AED] bg-[#7C3AED]/15 text-[#F4F1EA]"
      : "border-[#2E2E30] bg-[#0A0A0C] text-[#8A8A8E] hover:border-[#5A5A5E]",
  ].join(" ");
}

function EditPanel({ title, hint, children, testId }) {
  return (
    <section
      className="rounded-xl md:rounded-2xl border border-[#2E2E30] bg-[#0F0F12] p-3 md:p-5"
      data-testid={testId}
    >
      <h3 className="text-[#F4F1EA] text-[13px] md:text-[14px] font-medium font-['Inter_Tight'] mb-0.5">{title}</h3>
      {hint ? (
        <p className="hidden sm:block text-[#6f6f76] text-[11px] mb-2 md:mb-3 leading-relaxed">{hint}</p>
      ) : null}
      {children}
    </section>
  );
}

export default function VideoEditorAdmin({ category }) {
  const engine = WAN_VIDEO_EDIT;
  const { t, lang } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = resolveEditMode(
    searchParams.get("mode") || category?.preset || "vfx",
  );
  const [editModeId, setEditModeId] = useState(initialMode);
  const editMode = useMemo(() => findVideoEditMode(editModeId), [editModeId]);
  const preset = editMode.preset;

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
  const [videoCloudProgress, setVideoCloudProgress] = useState(null);
  const [uploadPhase, setUploadPhase] = useState("");
  const [selectedTplId, setSelectedTplId] = useState(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const setMode = useCallback((modeId) => {
    setEditModeId(modeId);
    setSelectedTplId(null);
    setPrompt("");
    setSearchParams({ mode: modeId }, { replace: true });
  }, [setSearchParams]);

  const handleTemplateSelect = useCallback((tpl) => {
    setSelectedTplId(tpl.id);
    setPrompt(tpl.prompt.slice(0, 800));
  }, []);

  useEffect(() => {
    const fromUrl = resolveEditMode(searchParams.get("mode") || "");
    if (fromUrl !== editModeId) setEditModeId(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
        if (!mounted) return;
        const sec = Math.max(0, Math.round(s));
        setSourceDurationSec(sec);
        if (sec > 0) {
          const cap = Math.min(10, sec);
          setDuration((prev) => {
            if (prev <= cap) return prev;
            const allowed = DURATIONS.filter((d) => d <= cap);
            return allowed.length ? allowed[allowed.length - 1] : 4;
          });
        }
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
        label: t("vid_v2v_title") || "Vídeo",
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

  const modeNotice = preset === "outfit"
    ? t("vid_outfit_pose_notice")
    : preset === "vfx"
      ? t("vid_vfx_notice")
      : null;

  return (
    <>
      <div className="min-w-0" data-testid="video-editor-v2v">
        <VideoEditModeTabs modeId={editModeId} onChange={setMode} disabled={busy} />

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)] gap-3 md:gap-5 xl:gap-6 items-start">
          {/* Templates primeiro no telemóvel; coluna direita no desktop */}
          <div className="min-w-0 order-1 xl:order-2 xl:sticky xl:top-4 xl:max-h-[calc(100vh-1.5rem)] xl:overflow-y-auto">
            <VideoEditTemplatePanel
              modeId={editModeId}
              selectedId={selectedTplId}
              onSelect={handleTemplateSelect}
              disabled={busy}
            />
          </div>

          <div className="space-y-3 md:space-y-4 min-w-0 order-2 xl:order-1">
            <EditPanel
              title={t("vid_v2v_step_video")}
              hint={t("vid_v2v_video_hint")}
              testId="video-edit-panel-source"
            >
              <StudioVideoUpload
                value={video}
                onChange={(f) => { setVideo(f); if (!f) setVideoCloudUrl(null); }}
                onCloudUrlChange={setVideoCloudUrl}
                onCloudProgressChange={setVideoCloudProgress}
                onStatusChange={setVideoUploadStatus}
                disabled={busy}
                maxDurationSec={engine.maxDurationSec}
                requireCloudUrl={engine.requiresCloudUrl}
                testId="video-edit-source"
              />
              <StudioVideoUploadNotice
                status={videoUploadStatus}
                progress={videoCloudProgress}
                className="mt-3"
              />
              <p className="text-[#5A5A5E] text-[10px] mt-2">
                {t("vid_edit_eta_hint", { min: eta.min, max: eta.max })}
              </p>
            </EditPanel>

            <EditPanel
              title={t("vid_v2v_step_reference")}
              hint={t("vid_v2v_reference_hint")}
              testId="video-edit-panel-reference"
            >
              <div className="max-w-[240px]">
                <ImageUploadZone
                  value={reference}
                  onChange={setReference}
                  layout="square"
                  enableRemotePersist={false}
                  testId="video-edit-reference"
                  emptyLabel={t("vid_v2v_ref_empty")}
                  emptyHint={t("upload_empty_hint")}
                />
              </div>
            </EditPanel>

            <EditPanel
              title={t("vid_v2v_step_prompt")}
              hint={t("vid_v2v_prompt_hint")}
              testId="video-edit-panel-prompt"
            >
              {modeNotice && (
                <p className="mb-3 rounded-lg border border-violet-500/25 bg-violet-500/10 px-3 py-2 text-[11px] text-[#C4B5FD] leading-relaxed">
                  {modeNotice}
                </p>
              )}
              <div className="flex justify-end mb-2">
                <span className="text-[#5A5A5E] text-[11px] font-mono">{prompt.length}/800</span>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value.slice(0, 800));
                  setSelectedTplId(null);
                }}
                rows={4}
                placeholder={t("vid_edit_prompt_placeholder")}
                className="rp-editor-textarea rp-editor-textarea--compact min-h-[100px] w-full"
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
            </EditPanel>

            <div className="rounded-2xl border border-[#2E2E30] bg-[#0F0F12] overflow-hidden">
              <button
                type="button"
                onClick={() => setAdvancedOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-[#141418] transition-colors"
                data-testid="video-edit-advanced-toggle"
              >
                <span className="text-[#F4F1EA] text-[13px] font-medium">{t("vid_v2v_advanced")}</span>
                <ChevronDown className={`w-4 h-4 text-[#8A8A8E] transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
              </button>
              {advancedOpen && (
                <div className="px-4 pb-4 space-y-4 border-t border-[#2E2E30] pt-4">
                  <div>
                    <p className="text-[#8A8A8E] text-[11px] mb-2 uppercase tracking-wider">{t("vid_edit_resolution")}</p>
                    <div className="flex flex-wrap gap-2">
                      {RESOLUTIONS.map((r) => {
                        const extra = videoSurcharge.resolution[r.v];
                        return (
                          <button
                            key={r.v}
                            type="button"
                            onClick={() => setResolution(r.v)}
                            className={chipClass(resolution === r.v)}
                            data-testid={`video-edit-res-${r.v}`}
                          >
                            {r.labelKey ? t(r.labelKey) : r.label}
                            {extra > 0 ? ` +${extra}` : ""}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-[#8A8A8E] text-[11px] mb-2 uppercase tracking-wider">{t("vid_edit_duration")}</p>
                    <div className="flex flex-wrap gap-2">
                      {DURATIONS.map((d) => {
                        const extra = videoSurcharge.duration[d];
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setDuration(d)}
                            className={chipClass(duration === d)}
                            data-testid={`video-edit-dur-${d}`}
                          >
                            {d}s{extra > 0 ? ` +${extra}` : ""}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-[#8A8A8E] text-[11px] mb-2 uppercase tracking-wider">{t("vid_edit_aspect")}</p>
                    <div className="flex flex-wrap gap-2">
                      {ASPECTS.map((a) => (
                        <button
                          key={a.v}
                          type="button"
                          onClick={() => setAspect(a.v)}
                          className={chipClass(aspect === a.v)}
                          data-testid={`video-edit-ar-${a.v}`}
                        >
                          {a.labelKey ? t(a.labelKey) : a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[#8A8A8E] text-[11px] mb-2 uppercase tracking-wider">{t("vid_edit_audio")}</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setAudioSetting("origin")}
                        className={chipClass(audioSetting === "origin")}
                        data-testid="video-edit-audio-origin"
                      >
                        {t("vid_edit_audio_origin")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAudioSetting("auto")}
                        className={chipClass(audioSetting === "auto")}
                        data-testid="video-edit-audio-auto"
                      >
                        {t("vid_edit_audio_auto")}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <StudioGenerateBar
        ready={ready}
        busy={busy}
        onClick={run}
        label={t("vid_edit_btn", { n: cost })}
        busyLabel={
          uploadPhase === "send"
            ? t("vid_edit_uploading")
            : t("vid_edit_processing")
        }
        hint={!user?.email && user ? t("vid_edit_notify_no_email") : hint}
        blockedNotify="message"
        cost={cost}
        testId="video-edit-submit"
        icon={Clapperboard}
        costMeta={<StudioGenerateCostMeta cost={cost} user={user} />}
      />
    </>
  );
}
