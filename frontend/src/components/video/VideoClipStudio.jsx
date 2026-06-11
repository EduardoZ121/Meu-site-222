import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Scissors, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "../../lib/i18n";
import { MAX_VIDEO_UPLOAD_BYTES } from "../../lib/videoMedia";
import {
  clampClipRange,
  DEFAULT_CLIP_SEC,
  formatVideoClock,
  formatVideoSizeMb,
  MIN_CLIP_SEC,
  readVideoMeta,
  suggestClipWindow,
  trimVideoClip,
} from "../../lib/videoClipTrim";

export default function VideoClipStudio({
  file,
  onClose,
  onComplete,
  maxClipSec = 10,
  minClipSec = MIN_CLIP_SEC,
  preferredClipSec = DEFAULT_CLIP_SEC,
  maxOutputBytes = MAX_VIDEO_UPLOAD_BYTES,
  testId = "video-clip-studio",
}) {
  const { t } = useI18n();
  const videoRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [meta, setMeta] = useState(null);
  const [startSec, setStartSec] = useState(0);
  const [clipSec, setClipSec] = useState(preferredClipSec);
  const [suggestReason, setSuggestReason] = useState("");
  const [analyzing, setAnalyzing] = useState(true);
  const [trimming, setTrimming] = useState(false);
  const [trimProgress, setTrimProgress] = useState(0);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);

  const totalSec = meta?.duration || 0;
  const endSec = startSec + clipSec;

  const range = useMemo(
    () => clampClipRange(totalSec, startSec, clipSec, { minClipSec, maxClipSec }),
    [totalSec, startSec, clipSec, minClipSec, maxClipSec],
  );

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    let mounted = true;
    setAnalyzing(true);
    setAnalyzeProgress(0);
    void (async () => {
      try {
        const suggestion = await suggestClipWindow(file, {
          maxClipSec,
          preferredClipSec,
          minClipSec,
          onProgress: (p) => {
            if (mounted) setAnalyzeProgress(Math.round(p * 100));
          },
        });
        if (!mounted) return;
        setMeta(suggestion.meta);
        setStartSec(suggestion.startSec);
        setClipSec(suggestion.clipSec);
        setSuggestReason(suggestion.reason);
      } catch {
        if (!mounted) return;
        try {
          const m = await readVideoMeta(file);
          if (!mounted) return;
          setMeta(m);
          const c = clampClipRange(m.duration, 0, preferredClipSec, { minClipSec, maxClipSec });
          setStartSec(c.startSec);
          setClipSec(c.clipSec);
          setSuggestReason("start");
        } catch {
          toast.error(t("vid_clip_analyze_fail"));
          onClose?.();
        }
      } finally {
        if (mounted) setAnalyzing(false);
      }
    })();
    return () => { mounted = false; };
  }, [file, maxClipSec, minClipSec, preferredClipSec, onClose, t]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !previewUrl || analyzing) return undefined;
    const sync = () => {
      if (v.currentTime < startSec || v.currentTime >= endSec - 0.05) {
        v.currentTime = startSec;
      }
    };
    v.addEventListener("timeupdate", sync);
    return () => v.removeEventListener("timeupdate", sync);
  }, [previewUrl, analyzing, startSec, endSec]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || analyzing) return;
    v.currentTime = startSec;
  }, [startSec, analyzing]);

  const suggestLabel = useMemo(() => {
    if (suggestReason === "motion") return t("vid_clip_suggest_motion");
    if (suggestReason === "full") return t("vid_clip_suggest_full");
    return t("vid_clip_suggest_start");
  }, [suggestReason, t]);

  const applySuggestion = useCallback(async () => {
    setAnalyzing(true);
    try {
      const suggestion = await suggestClipWindow(file, {
        maxClipSec,
        preferredClipSec,
        minClipSec,
      });
      setStartSec(suggestion.startSec);
      setClipSec(suggestion.clipSec);
      setSuggestReason(suggestion.reason);
      toast.message(t("vid_clip_suggest_applied"));
    } catch {
      toast.error(t("vid_clip_analyze_fail"));
    } finally {
      setAnalyzing(false);
    }
  }, [file, maxClipSec, minClipSec, preferredClipSec, t]);

  const confirmTrim = useCallback(async () => {
    setTrimming(true);
    setTrimProgress(0);
    try {
      const trimmed = await trimVideoClip(
        file,
        range.startSec,
        range.endSec,
        { onProgress: setTrimProgress },
      );
      if (trimmed.size > maxOutputBytes) {
        toast.error(t("vid_clip_still_large", {
          size: formatVideoSizeMb(trimmed.size).replace(" MB", ""),
          max: Math.round(maxOutputBytes / (1024 * 1024)),
        }), { duration: 12000 });
        return;
      }
      onComplete?.(trimmed);
      toast.success(t("vid_clip_ready"));
    } catch {
      toast.error(t("vid_clip_trim_fail"), { duration: 10000 });
    } finally {
      setTrimming(false);
      setTrimProgress(0);
    }
  }, [file, maxOutputBytes, onComplete, range.endSec, range.startSec, t]);

  const maxStart = Math.max(0, totalSec - minClipSec);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${testId}-title`}
      data-testid={testId}
    >
      <div className="w-full max-w-2xl max-h-[96vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-[#2E2E30] bg-[#0B0B0C] shadow-[0_0_60px_-12px_rgba(124,58,237,0.45)]">
        <div className="flex items-start justify-between gap-3 border-b border-[#2E2E30] px-4 sm:px-6 py-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A855F7]">
              {t("vid_clip_eyebrow")}
            </p>
            <h2 id={`${testId}-title`} className="text-lg font-semibold text-[#F4F1EA] mt-1">
              {t("vid_clip_title")}
            </h2>
            <p className="text-[13px] text-[#8A8A8E] mt-1 leading-snug">
              {t("vid_clip_sub")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={trimming}
            className="shrink-0 rounded-full p-2 text-[#8A8A8E] hover:bg-[#1a1a22] hover:text-white"
            aria-label={t("common_close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          {meta ? (
            <div className="flex flex-wrap gap-2 text-[11px] font-mono text-[#9CA3AF]">
              <span className="rounded-md bg-[#14141c] px-2 py-1 border border-[#2E2E30]">
                {t("vid_clip_detected")}: {formatVideoClock(meta.duration)} · {formatVideoSizeMb(meta.size)}
              </span>
              <span className="rounded-md bg-[#14141c] px-2 py-1 border border-[#2E2E30]">
                {t("vid_clip_limit")}: {minClipSec}–{maxClipSec}s · max {Math.round(maxOutputBytes / (1024 * 1024))} MB
              </span>
            </div>
          ) : null}

          <div className="relative overflow-hidden rounded-xl border border-[#2E2E30] bg-black aspect-video">
            {previewUrl ? (
              <video
                ref={videoRef}
                src={previewUrl}
                className="h-full w-full object-contain"
                controls={!trimming}
                playsInline
                muted
                loop
                data-testid={`${testId}-preview`}
              />
            ) : null}
            {(analyzing || trimming) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/75">
                <Loader2 className="h-8 w-8 animate-spin text-[#A855F7]" />
                <p className="text-sm text-[#F4F1EA]">
                  {trimming ? t("vid_clip_trimming") : t("vid_clip_analyzing")}
                  {(trimming ? trimProgress : analyzeProgress) > 0
                    ? ` ${trimming ? trimProgress : analyzeProgress}%`
                    : ""}
                </p>
              </div>
            )}
          </div>

          {!analyzing && totalSec > 0 ? (
            <>
              <div className="rounded-xl border border-[#7C3AED]/30 bg-[#7C3AED]/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0">
                  <Sparkles className="h-4 w-4 text-[#C4B5FD] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[13px] font-medium text-[#F4F1EA]">{suggestLabel}</p>
                    <p className="text-[11px] text-[#A78BFA] mt-0.5 font-mono">
                      {formatVideoClock(range.startSec)} → {formatVideoClock(range.endSec)} ({range.clipSec.toFixed(1)}s)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void applySuggestion()}
                  disabled={trimming}
                  className="shrink-0 rounded-lg border border-[#9333EA]/50 px-3 py-2 text-[12px] font-semibold text-[#E9D5FF] hover:bg-[#9333EA]/20"
                  data-testid={`${testId}-resuggest`}
                >
                  {t("vid_clip_resuggest")}
                </button>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-[12px] font-medium text-[#C4B5FD]">
                    {t("vid_clip_start")}: {formatVideoClock(startSec)}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={maxStart}
                    step={0.1}
                    value={startSec}
                    disabled={trimming}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      const c = clampClipRange(totalSec, next, clipSec, { minClipSec, maxClipSec });
                      setStartSec(c.startSec);
                      setClipSec(c.clipSec);
                    }}
                    className="mt-2 w-full accent-[#9333EA]"
                    data-testid={`${testId}-start`}
                  />
                </label>

                <label className="block">
                  <span className="text-[12px] font-medium text-[#C4B5FD]">
                    {t("vid_clip_length")}: {range.clipSec.toFixed(1)}s
                  </span>
                  <input
                    type="range"
                    min={minClipSec}
                    max={Math.min(maxClipSec, totalSec || maxClipSec)}
                    step={0.1}
                    value={clipSec}
                    disabled={trimming}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      const c = clampClipRange(totalSec, startSec, next, { minClipSec, maxClipSec });
                      setStartSec(c.startSec);
                      setClipSec(c.clipSec);
                    }}
                    className="mt-2 w-full accent-[#9333EA]"
                    data-testid={`${testId}-length`}
                  />
                </label>
              </div>
            </>
          ) : null}
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 border-t border-[#2E2E30] px-4 sm:px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={trimming}
            className="rounded-xl border border-[#2E2E30] px-4 py-3 text-sm text-[#8A8A8E] hover:bg-[#14141c]"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={() => void confirmTrim()}
            disabled={analyzing || trimming || !totalSec}
            className="rp-action-primary rp-action-primary--ready flex-1 sm:flex-none sm:min-w-[220px]"
            data-testid={`${testId}-confirm`}
          >
            {trimming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("vid_clip_trimming")}
              </>
            ) : (
              <>
                <Scissors className="h-4 w-4" />
                {t("vid_clip_confirm")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
