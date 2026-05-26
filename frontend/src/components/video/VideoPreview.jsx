import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Film } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { analyzeVideoPreview } from "../../lib/videoPreview";

function formatDuration(sec) {
  if (!Number.isFinite(sec) || sec <= 0) return "";
  const s = Math.round(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}:${String(r).padStart(2, "0")}` : `${r}s`;
}

/**
 * Pré-visualização de vídeo com deteção HEVC / codec e thumbnail de fallback.
 */
export default function VideoPreview({
  file,
  testId = "video-preview",
  onMeta,
  onPreviewState,
  className = "studio-video-upload__preview",
}) {
  const { t } = useI18n();
  const videoRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [thumbUrl, setThumbUrl] = useState(null);
  const [meta, setMeta] = useState({ duration: 0, width: 0, height: 0 });
  const [playFailed, setPlayFailed] = useState(false);

  const analysis = file ? analyzeVideoPreview(file) : null;
  const showPlayer = Boolean(previewUrl && analysis?.canPreview && !playFailed);
  const showHevcWarning = Boolean(file && (analysis?.likelyHevc || playFailed));
  const showThumbOnly = Boolean(file && (!showPlayer || analysis?.showThumbnailOnly));

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setThumbUrl(null);
      setMeta({ duration: 0, width: 0, height: 0 });
      setPlayFailed(false);
      onMeta?.({ duration: 0, width: 0, height: 0 });
      onPreviewState?.({ ok: true, hevc: false, failed: false });
      return undefined;
    }
    setPlayFailed(false);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setThumbUrl(null);

    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.preload = "metadata";
    v.src = url;

    const captureThumb = () => {
      try {
        const w = v.videoWidth || 320;
        const h = v.videoHeight || 180;
        if (!w || !h) return;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(v, 0, 0, w, h);
        setThumbUrl(canvas.toDataURL("image/jpeg", 0.82));
      } catch {
        /* CORS / codec — ignorar */
      }
    };

    const onMetaLoaded = () => {
      const next = {
        duration: v.duration || 0,
        width: v.videoWidth || 0,
        height: v.videoHeight || 0,
      };
      setMeta(next);
      onMeta?.(next);
      if (v.videoWidth > 0) captureThumb();
    };

    v.addEventListener("loadedmetadata", onMetaLoaded);
    v.addEventListener("loadeddata", captureThumb);

    return () => {
      v.removeEventListener("loadedmetadata", onMetaLoaded);
      v.removeEventListener("loadeddata", captureThumb);
      URL.revokeObjectURL(url);
    };
  }, [file, onMeta, onPreviewState]);

  useEffect(() => {
    if (!file) return;
    const failed = playFailed || (!analysis?.canPreview && !meta.duration);
    const hevc = Boolean(analysis?.likelyHevc);
    onPreviewState?.({ ok: !failed, hevc, failed: playFailed });
  }, [file, playFailed, analysis, meta.duration, onPreviewState]);

  const onLoadedMetadata = useCallback((e) => {
    const v = e.currentTarget;
    setPlayFailed(false);
    const next = {
      duration: v.duration || 0,
      width: v.videoWidth || 0,
      height: v.videoHeight || 0,
    };
    setMeta(next);
    onMeta?.(next);
  }, [onMeta]);

  const onPreviewError = useCallback(() => {
    setPlayFailed(true);
  }, []);

  if (!file) return null;

  return (
    <>
      {showPlayer ? (
        <video
          ref={videoRef}
          src={previewUrl}
          className={className}
          controls
          playsInline
          muted
          onLoadedMetadata={onLoadedMetadata}
          onError={onPreviewError}
          data-testid={`${testId}-player`}
        />
      ) : (
        <div
          className={`${className} studio-video-upload__preview--thumb`}
          data-testid={`${testId}-thumb`}
        >
          {thumbUrl ? (
            <img src={thumbUrl} alt="" className="w-full h-full object-contain" />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 h-full min-h-[120px] text-[#8A8A8E]">
              <Film className="w-8 h-8 text-[#C4B5FD]" strokeWidth={1.5} />
              <span className="text-[12px] px-4 text-center">{file.name}</span>
            </div>
          )}
        </div>
      )}
      {showHevcWarning ? (
        <p className="studio-video-upload__cloud-note flex items-start gap-2 mt-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#FACC15]" />
          <span>
            {analysis?.likelyHevc ? t("vid_preview_hevc") : t("vid_preview_failed")}
          </span>
        </p>
      ) : null}
      {showThumbOnly && meta.duration > 0 ? (
        <p className="text-[11px] text-[#6b6b70] mt-1">
          {formatDuration(meta.duration)}
          {meta.width > 0 ? ` · ${meta.width}×${meta.height}` : ""}
        </p>
      ) : null}
    </>
  );
}
