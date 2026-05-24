import { useMemo, useState } from "react";
import { Clapperboard, Loader2, Sparkles } from "lucide-react";
import { formatApiError, isBlobUploadEnabled, uploadPost } from "../../lib/api";
import { isS3VideoUploadAvailable } from "../../lib/s3VideoUpload";
import { normalizeCreation, primaryResultUrl } from "../../lib/creationUrls";
import { useAuth } from "../../lib/auth";
import { usePricing } from "../../lib/PricingContext";
import { useI18n } from "../../lib/i18n";
import { toast } from "sonner";
import ResultPanel from "../../components/ResultPanel";
import StudioResultAnchor from "../../components/StudioResultAnchor";
import ImageUploadZone from "../../components/ImageUploadZone";
import StudioVideoUpload, { VIDEO_DIRECT_MAX_BYTES } from "../../components/StudioVideoUpload";

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
  const { costs } = usePricing();
  const cost = costs.videoEdit ?? costs.video ?? 95;

  const [video, setVideo] = useState(null);
  const [reference, setReference] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [resolution, setResolution] = useState("1080p");
  const [duration, setDuration] = useState(6);
  const [aspect, setAspect] = useState("auto");
  const [audioSetting, setAudioSetting] = useState("origin");
  const [busy, setBusy] = useState(false);
  const [uploadPhase, setUploadPhase] = useState("");
  const [result, setResult] = useState(null);

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

    const needsCloud = video.size > VIDEO_DIRECT_MAX_BYTES;
    if (needsCloud) {
      const [blobOk, s3ok] = await Promise.all([
        isBlobUploadEnabled(),
        isS3VideoUploadAvailable(),
      ]);
      if (!blobOk && !s3ok) {
        toast.error(t("vid_edit_cloud_required"), { duration: 12000 });
        return;
      }
    }

    setBusy(true);
    setUploadPhase(needsCloud ? "cloud" : "send");
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("prompt", prompt.trim());
      fd.append("resolution", resolution);
      fd.append("duration", String(duration));
      fd.append("aspect_ratio", aspect);
      fd.append("audio_setting", audioSetting);
      fd.append("video", video);
      if (reference) fd.append("reference_image", reference);

      const { data } = await uploadPost("/generate/video-edit", fd, {
        timeout: needsCloud ? 300_000 : 120_000,
        pollTimeoutMs: 600_000,
        blobOffloadTimeoutMs: needsCloud ? 180_000 : 55_000,
        skipBlobOffload: !needsCloud,
      });
      const creation = normalizeCreation(data?.creation);
      if (!primaryResultUrl(creation)) throw new Error(t("vid_no_result"));
      setResult(creation);
      toast.success(t("vid_edit_success", { n: creation?.credits_spent ?? cost }));
      await refresh();
    } catch (err) {
      toast.error(formatApiError(err, t("vid_edit_fail")), { duration: 12000 });
    } finally {
      setBusy(false);
      setUploadPhase("");
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
            <div className="max-w-[560px]">
              <StudioVideoUpload
                value={video}
                onChange={setVideo}
                disabled={busy}
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

          <div>
            <button
              type="button"
              onClick={run}
              disabled={busy}
              className="rp-action-primary w-full sm:w-auto sm:min-w-[280px] disabled:opacity-40"
              data-testid="video-edit-submit"
            >
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                  {uploadPhase === "cloud" ? t("vid_edit_cloud_uploading") : t("vid_edit_processing")}
                </>
              ) : (
                <><Clapperboard className="w-4 h-4" strokeWidth={1.5} /> {t("vid_edit_btn", { n: cost })}</>
              )}
            </button>
            <p className="text-[#5A5A5E] text-[11px] mt-3 font-mono uppercase tracking-[0.14em]">
              {t("vid_balance", { n: user?.is_unlimited ? "∞" : (user?.credits ?? 0) })}
            </p>
          </div>
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
