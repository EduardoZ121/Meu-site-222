import {
  useCallback, useEffect, useId, useRef, useState,
} from "react";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { readFileAsDataURL } from "../lib/previewDataUrl";
import { prepareImageForUpload } from "../lib/prepareImageForUpload";
import { looksLikeImageFile, IMAGE_ACCEPT } from "../lib/imageCompress";
import {
  looksLikeVideoUpload,
  validateVideoUpload,
  VIDEO_UPLOAD_ACCEPT,
} from "../lib/videoMedia";
import { MAX_IMAGE_DIRECT_BYTES } from "../lib/uploadConstants";
import { CLIENT_BUILD_ID } from "../lib/buildInfo";
import { formatHttpError } from "../lib/uploadErrors";
import {
  isBlobPersistAvailable,
  persistImageToBlobStore,
  persistVideoToBlobStore,
} from "../lib/persistImage";
import { useI18n } from "../lib/i18n";

const LAYOUT = {
  portrait: "aspect-[4/5] min-h-[200px]",
  square: "aspect-square min-h-[200px]",
  wide: "aspect-[16/10] min-h-[200px]",
  full: "aspect-[2/1] min-h-[200px]",
  video: "aspect-video min-h-[180px]",
  carousel: "aspect-[2/1] min-h-[200px]",
};

/**
 * Caixa de upload do estúdio (visual com brilho) — imagem ou vídeo.
 */
export default function ImageUploadZone({
  value,
  onChange,
  accept,
  testId = "image-upload-zone",
  layout = "portrait",
  className = "",
  overlay = null,
  capture = undefined,
  compressOptions = {},
  enableRemotePersist = true,
  onStatusChange,
  emptyLabel,
  emptyHint,
  previewImgStyle,
  previewImgClassName = "",
  mediaType = "image",
  disabled = false,
}) {
  const { t } = useI18n();
  const isVideo = mediaType === "video";
  const resolvedAccept = accept ?? (isVideo ? VIDEO_UPLOAD_ACCEPT : IMAGE_ACCEPT);
  const resolvedLabel = emptyLabel ?? (isVideo ? t("vid_upload_title") : t("upload_empty_label"));
  const resolvedHint = emptyHint ?? (isVideo ? t("vid_edit_video_hint") : t("upload_empty_hint"));
  const inputId = useId();
  const inputRef = useRef(null);
  const videoObjectUrlRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [persistState, setPersistState] = useState("idle");
  const lastPreparedRef = useRef(null);
  const runIdRef = useRef(0);

  const notifyStatus = useCallback((s) => {
    onStatusChange?.(s);
  }, [onStatusChange]);

  useEffect(() => {
    if (!value) {
      runIdRef.current += 1;
      if (videoObjectUrlRef.current) {
        URL.revokeObjectURL(videoObjectUrlRef.current);
        videoObjectUrlRef.current = null;
      }
      setPreviewUrl(null);
      setPreviewFailed(false);
      setPersistState("idle");
      lastPreparedRef.current = null;
      notifyStatus("idle");
      return undefined;
    }

    if (isVideo) {
      const url = URL.createObjectURL(value);
      if (videoObjectUrlRef.current) URL.revokeObjectURL(videoObjectUrlRef.current);
      videoObjectUrlRef.current = url;
      setPreviewUrl(url);
      setPreviewFailed(false);
      return () => {
        if (videoObjectUrlRef.current) {
          URL.revokeObjectURL(videoObjectUrlRef.current);
          videoObjectUrlRef.current = null;
        }
      };
    }

    let cancelled = false;
    setPreviewFailed(false);
    (async () => {
      try {
        const url = await readFileAsDataURL(value);
        if (cancelled) return;
        setPreviewUrl(url);
        setPreviewFailed(false);
      } catch {
        if (!cancelled) {
          setPreviewUrl(null);
          setPreviewFailed(true);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [value, isVideo, notifyStatus]);

  useEffect(() => () => {
    if (videoObjectUrlRef.current) {
      URL.revokeObjectURL(videoObjectUrlRef.current);
    }
  }, []);

  const runBackgroundImage = useCallback(async (rawFile, rid) => {
    setPersistState("saving");
    notifyStatus("saving");
    try {
      const prepared = await prepareImageForUpload(rawFile, {
        maxBytes: MAX_IMAGE_DIRECT_BYTES,
        maxSize: 2048,
        force: true,
        ...compressOptions,
      });
      if (rid !== runIdRef.current) return;
      lastPreparedRef.current = prepared;
      onChange(prepared);

      const blobOk = enableRemotePersist && (await isBlobPersistAvailable());
      if (!blobOk) {
        setPersistState("saved");
        notifyStatus("saved");
        return;
      }
      try {
        await persistImageToBlobStore(prepared);
        if (rid !== runIdRef.current) return;
        setPersistState("saved");
        notifyStatus("saved");
      } catch (err) {
        if (rid !== runIdRef.current) return;
        setPersistState("error");
        notifyStatus("error");
        toast.error(formatHttpError(err, t("upload_save_error")), { duration: 6000 });
      }
    } catch (err) {
      if (rid !== runIdRef.current) return;
      setPersistState("error");
      notifyStatus("error");
      toast.error(err?.message || t("upload_invalid_type"), { duration: 6000 });
    }
  }, [compressOptions, enableRemotePersist, onChange, notifyStatus, t]);

  const runBackgroundVideo = useCallback(async (rawFile, rid) => {
    setPersistState("saving");
    notifyStatus("saving");
    lastPreparedRef.current = rawFile;
    onChange(rawFile);
    if (rid !== runIdRef.current) return;
    setPersistState("saved");
    notifyStatus("saved");
  }, [onChange, notifyStatus]);

  const retryPersist = useCallback(async () => {
    const f = lastPreparedRef.current || value;
    if (!f) return;
    const rid = runIdRef.current;
    setPersistState("saving");
    notifyStatus("saving");
    const blobOk = enableRemotePersist && (await isBlobPersistAvailable());
    if (!blobOk) {
      setPersistState("saved");
      notifyStatus("saved");
      return;
    }
    try {
      if (isVideo) await persistVideoToBlobStore(f);
      else await persistImageToBlobStore(f);
      if (rid !== runIdRef.current) return;
      setPersistState("saved");
      notifyStatus("saved");
    } catch (err) {
      if (rid !== runIdRef.current) return;
      setPersistState("error");
      notifyStatus("error");
      toast.error(formatHttpError(err, t("upload_save_error")), { duration: 6000 });
    }
  }, [value, isVideo, enableRemotePersist, notifyStatus, t]);

  const ingestFile = useCallback((file) => {
    if (!file) return;

    if (isVideo) {
      const check = validateVideoUpload(file, t);
      if (!check.ok) {
        toast.error(check.message);
        return;
      }
      if (looksLikeImageFile(file) && !looksLikeVideoUpload(file)) {
        toast.error(t("vid_err_use_video_zone"));
        return;
      }
      runIdRef.current += 1;
      const rid = runIdRef.current;
      lastPreparedRef.current = null;
      setPersistState("saving");
      notifyStatus("saving");
      onChange(file);
      void runBackgroundVideo(file, rid);
      return;
    }

    if (!looksLikeImageFile(file)) {
      toast.error(t("upload_invalid_type"));
      return;
    }
    if (looksLikeVideoUpload(file)) {
      toast.error(t("vid_err_use_video_zone"));
      return;
    }
    runIdRef.current += 1;
    const rid = runIdRef.current;
    lastPreparedRef.current = null;
    setPersistState("saving");
    notifyStatus("saving");
    onChange(file);
    void runBackgroundImage(file, rid);
  }, [isVideo, runBackgroundImage, runBackgroundVideo, onChange, notifyStatus, t]);

  const clear = useCallback(() => {
    runIdRef.current += 1;
    lastPreparedRef.current = null;
    setPreviewUrl(null);
    setPreviewFailed(false);
    setPersistState("idle");
    onChange(null);
    notifyStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
  }, [onChange, notifyStatus]);

  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (f) void ingestFile(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void ingestFile(f);
  };

  const onPaste = (e) => {
    const f = e.clipboardData?.files?.[0];
    if (!f) return;
    if (isVideo ? looksLikeVideoUpload(f) : looksLikeImageFile(f)) {
      e.preventDefault();
      void ingestFile(f);
    }
  };

  const aspectClass = LAYOUT[layout] || (isVideo ? LAYOUT.video : LAYOUT.portrait);
  const savingLabel = t("upload_preparing");
  const savedLabel = isVideo ? t("vid_upload_ready") : t("upload_ready");
  const hasPreview = isVideo ? Boolean(previewUrl && value) : Boolean(previewUrl);

  return (
    <div
      className={className}
      onPaste={onPaste}
      role="presentation"
      data-rp-upload-build={CLIENT_BUILD_ID}
      data-testid={`${testId}-wrap`}
    >
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={resolvedAccept}
        capture={capture}
        className="sr-only"
        onChange={onPick}
        disabled={disabled}
        data-testid={`${testId}-input`}
      />
      <label
        htmlFor={inputId}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => { e.preventDefault(); if (!disabled) setDrag(true); }}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        data-testid={testId}
        className={[
          "relative block w-full cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-200",
          aspectClass,
          drag
            ? "border-[#9333EA] bg-[radial-gradient(ellipse_at_center,rgba(147,51,234,0.35),rgba(12,12,18,0.95))] shadow-[0_0_32px_rgba(147,51,234,0.45)]"
            : "border-[#9333EA]/55 bg-gradient-to-br from-[#14141c]/90 via-[#0e0e12] to-[#0a0a0f]",
          "min-h-[12rem]",
          disabled ? "pointer-events-none opacity-60" : "",
        ].join(" ")}
      >
        {overlay && hasPreview ? (
          <div className="pointer-events-none absolute inset-0 z-0">{overlay}</div>
        ) : null}

        {hasPreview ? (
          <>
            {isVideo ? (
              <video
                src={previewUrl}
                className="relative z-[1] h-full w-full object-contain bg-black p-3 pb-14 opacity-0 animate-[rpFadeIn_0.35s_ease-out_forwards]"
                controls
                playsInline
                muted
                data-testid={`${testId}-preview`}
              />
            ) : (
              <img
                src={previewUrl}
                alt=""
                style={previewImgStyle}
                className={[
                  "relative z-[1] h-full w-full object-contain p-3 opacity-0 animate-[rpFadeIn_0.35s_ease-out_forwards]",
                  previewImgClassName,
                ].filter(Boolean).join(" ")}
                data-testid={`${testId}-preview`}
              />
            )}
            <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-wrap gap-2">
              {persistState === "saving" && (
                <span className="rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                  {savingLabel}
                </span>
              )}
              {persistState === "saved" && (
                <span className="rounded-full bg-emerald-600/90 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                  {savedLabel}
                </span>
              )}
              {persistState === "error" && (
                <span className="rounded-full bg-red-600/95 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                  {t("upload_save_error")}
                </span>
              )}
            </div>
            {persistState === "error" && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); void retryPersist(); }}
                className="absolute bottom-3 left-3 z-20 min-h-12 min-w-[7.5rem] rounded-xl bg-[#9333EA] px-4 text-sm font-semibold text-white shadow-lg shadow-purple-900/40"
                data-testid={`${testId}-retry`}
              >
                {t("upload_retry")}
              </button>
            )}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); clear(); }}
              className="absolute right-3 top-3 z-20 flex min-h-12 min-w-12 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-md hover:bg-black/90"
              data-testid={`${testId}-clear`}
              aria-label={t("remove")}
            >
              <X className="h-5 w-5" />
            </button>
          </>
        ) : value ? (
          <div className="absolute inset-0 flex min-h-12 flex-col items-center justify-center gap-2 px-4 py-6 text-center bg-[#0c0c12]/80">
            <p className="text-zinc-200 text-sm font-medium">
              {previewFailed ? t("upload_loaded") : savingLabel}
            </p>
            {previewFailed && !isVideo && (
              <p className="text-zinc-500 text-xs max-w-[220px]">
                {t("upload_preview_unavailable")}
              </p>
            )}
            <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-wrap gap-2">
              {persistState === "saving" && (
                <span className="rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                  {savingLabel}
                </span>
              )}
              {persistState === "saved" && (
                <span className="rounded-full bg-emerald-600/90 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                  {savedLabel}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); clear(); }}
              className="absolute right-3 top-3 z-20 flex min-h-12 min-w-12 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-md hover:bg-black/90"
              data-testid={`${testId}-clear`}
              aria-label={t("remove")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="absolute inset-0 flex min-h-12 flex-col items-center justify-center gap-3 px-4 py-6 text-center">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(147,51,234,0.12),transparent_55%)]" />
            <div className="relative flex min-h-12 min-w-12 items-center justify-center rounded-2xl border border-[#9333EA]/30 bg-[#9333EA]/10 shadow-[0_0_24px_rgba(147,51,234,0.35)]">
              <Upload className="h-7 w-7 text-[#c4b5fd]" strokeWidth={1.5} />
            </div>
            <p className="relative text-lg font-light tracking-tight text-[#f4f1ea]">
              {drag ? t("upload_drop") : resolvedLabel}
            </p>
            <p className="relative max-w-xs text-sm text-[#8a8a8e]">{resolvedHint}</p>
          </div>
        )}
      </label>
      <style>
        {`
          @keyframes rpFadeIn {
            from { opacity: 0; transform: scale(0.985); }
            to { opacity: 1; transform: scale(1); }
          }
        `}
      </style>
    </div>
  );
}

export { VIDEO_VERCEL_SAFE_BYTES as VIDEO_DIRECT_MAX_BYTES } from "../lib/uploadConstants";
