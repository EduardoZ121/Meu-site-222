import { useEffect, useMemo, useRef, useState } from "react";
import { Clapperboard, Sparkles } from "lucide-react";
import {
  formatApiError,
  pollPrediction,
  uploadPost,
  uploadVideoToCloud,
} from "../../lib/api";
import { normalizeCreation, primaryResultUrl } from "../../lib/creationUrls";
import { useAuth } from "../../lib/auth";
import { isAdminUser } from "../../lib/isAdmin";
import { usePricing } from "../../lib/PricingContext";
import { useI18n } from "../../lib/i18n";
import { toast } from "sonner";
import ResultPanel from "../../components/ResultPanel";
import StudioResultAnchor from "../../components/StudioResultAnchor";
import ImageUploadZone from "../../components/ImageUploadZone";
import StudioVideoUpload, { VIDEO_DIRECT_MAX_BYTES } from "../../components/StudioVideoUpload";
import StudioGenerateBar from "../../components/StudioGenerateBar";
import { useStudioGenerateGate } from "../../lib/useStudioGenerateGate";

const EDIT_IDEAS = ["vid_edit_idea_1", "vid_edit_idea_2", "vid_edit_idea_3"];
const DURATIONS = [4, 6, 8, 10];
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
  const { t } = useI18n();
  const ideas = useMemo(() => EDIT_IDEAS.map((k) => t(k)), [t]);
  const { refresh, user } = useAuth();
  const canEdit = isAdminUser(user);
  const { costs } = usePricing();
  const cost = costs.videoEdit ?? costs.video ?? 95;

  const [video, setVideo] = useState(null);
  const [videoCloudUrl, setVideoCloudUrl] = useState(null);
  const [videoCloudBusy, setVideoCloudBusy] = useState(false);
  const [videoCloudPct, setVideoCloudPct] = useState(0);
  const [videoCloudError, setVideoCloudError] = useState(null);
  const cloudUploadGen = useRef(0);
  const [reference, setReference] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [resolution, setResolution] = useState("1080p");
  const [duration, setDuration] = useState(6);
  const [aspect, setAspect] = useState("auto");
  const [audioSetting, setAudioSetting] = useState("origin");
  const [busy, setBusy] = useState(false);
  const [uploadPhase, setUploadPhase] = useState("");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const needsCloud = video && video.size > VIDEO_DIRECT_MAX_BYTES;
  const cloudReady = !needsCloud || Boolean(videoCloudUrl);
  const { ready, hint } = useStudioGenerateGate({
    busy: busy || videoCloudBusy,
    user,
    cost,
    requireVideo: true,
    video,
    requirePrompt: true,
    prompt,
    readyOverride: Boolean(video) && prompt.trim().length >= 3 && cloudReady,
    hintOverride: videoCloudBusy
      ? (videoCloudPct > 0
        ? t("vid_upload_cloud_progress", { n: videoCloudPct })
        : t("vid_edit_cloud_uploading"))
      : (needsCloud && videoCloudError)
        ? videoCloudError
        : (needsCloud && !videoCloudUrl && !videoCloudBusy)
          ? t("vid_edit_wait_upload")
          : null,
  });

  useEffect(() => {
    if (!video || video.size <= VIDEO_DIRECT_MAX_BYTES) {
      setVideoCloudUrl(null);
      setVideoCloudError(null);
      setVideoCloudBusy(false);
      setVideoCloudPct(0);
      return undefined;
    }
    const gen = cloudUploadGen.current + 1;
    cloudUploadGen.current = gen;
    setVideoCloudUrl(null);
    setVideoCloudError(null);
    setVideoCloudBusy(true);
    setVideoCloudPct(0);

    uploadVideoToCloud(video, {
      onProgress: (pct) => {
        if (cloudUploadGen.current === gen) setVideoCloudPct(pct);
      },
    })
      .then((url) => {
        if (cloudUploadGen.current !== gen) return;
        setVideoCloudUrl(url);
        setVideoCloudError(null);
        toast.success(t("vid_upload_cloud_done"), { duration: 4000 });
      })
      .catch((err) => {
        if (cloudUploadGen.current !== gen) return;
        const msg = formatApiError(err, t("vid_upload_cloud_fail"), { context: "video_upload", t });
        setVideoCloudError(msg);
        toast.error(msg, { duration: 12000 });
      })
      .finally(() => {
        if (cloudUploadGen.current === gen) setVideoCloudBusy(false);
      });

    return () => {
      cloudUploadGen.current += 1;
    };
  }, [video, t]);

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

    if (needsCloud && !videoCloudUrl) {
      toast.error(videoCloudError || t("vid_edit_wait_upload"), { duration: 12000 });
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
      if (videoCloudUrl) {
        fd.append("video_url", videoCloudUrl);
      } else {
        fd.append("video", video);
      }
      if (reference) fd.append("reference_image", reference);

      setUploadPhase("send");
      ({ data: submitData } = await uploadPost("/generate/video-edit", fd, {
        timeout: 120_000,
        headers: { "X-Skip-Auto-Poll": "1" },
      }));

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

  if (!canEdit) {
    return (
      <p className="text-[#8A8A8E] text-sm" data-testid="video-editor-forbidden">
        {t("vid_editor_admin_only")}
      </p>
    );
  }

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
            <div className="max-w-[560px]">
              <StudioVideoUpload
                value={video}
                onChange={(f) => {
                  setVideo(f);
                  setVideoCloudUrl(null);
                  setVideoCloudError(null);
                }}
                disabled={busy || videoCloudBusy}
                testId="video-edit-source"
              />
              {needsCloud && (
                <p className={`mt-3 text-[12px] leading-relaxed ${
                  videoCloudError ? "text-red-400" : videoCloudUrl ? "text-emerald-400/90" : "text-[#A78BFA]"
                }`}>
                  {videoCloudBusy
                    ? (videoCloudPct > 0
                      ? t("vid_upload_cloud_progress", { n: videoCloudPct })
                      : t("vid_edit_cloud_uploading"))
                    : videoCloudError
                      ? videoCloudError
                      : videoCloudUrl
                        ? t("vid_upload_cloud_ready")
                        : t("vid_edit_large_hint")}
                </p>
              )}
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
            <div className="grid grid-cols-2 gap-2.5 max-w-[280px]">
              {["1080p", "720p"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setResolution(r)}
                  className={selectCard(resolution === r)}
                  data-testid={`video-edit-res-${r}`}
                >
                  <p className="text-[#F4F1EA] text-[15px] font-medium">{r}</p>
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#A78BFA] mb-3">
              {t("vid_edit_duration")}
            </p>
            <div className="grid grid-cols-4 gap-2.5 max-w-[360px]">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={selectCard(duration === d)}
                  data-testid={`video-edit-dur-${d}`}
                >
                  <p className="text-[#F4F1EA] text-[16px] font-light">{d}s</p>
                </button>
              ))}
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
              uploadPhase.startsWith("cloud")
                ? (uploadPhase.includes(":")
                  ? t("vid_upload_cloud_progress", { n: uploadPhase.split(":")[1] || "0" })
                  : t("vid_edit_cloud_uploading"))
                : uploadPhase === "processing" && progress > 0
                  ? `${t("vid_edit_processing")} (${progress}s)`
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
