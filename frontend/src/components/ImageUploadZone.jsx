import {
  useCallback, useEffect, useId, useRef, useState,
} from "react";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { revokeFilePreviewUrl } from "../lib/previewDataUrl";
import { prepareImageForUpload } from "../lib/prepareImageForUpload";
import { looksLikeImageFile, IMAGE_ACCEPT } from "../lib/imageCompress";
import {
  looksLikeVideoUpload,
  readVideoDurationSeconds,
  validateVideoUpload,
  VIDEO_UPLOAD_ACCEPT,
  VIDEO_VERCEL_SAFE_BYTES,
  MAX_VIDEO_UPLOAD_BYTES,
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
import { materializeUploadFile } from "../lib/durableUploadFile";
import MultiImageUpload from "./studio/MultiImageUpload";

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
function SingleImageUploadZone({
  value,
  onChange,
  accept,
  testId = "image-upload-zone",
  layout = "portrait",
  className = "",
  overlay = null,
  capture = undefined,
  compressOptions = {},
  /** Vercel Blob ao escolher ficheiro — só vídeo-to-vídeo; fotos enviam no Gerar. */
  enableRemotePersist = false,
  onStatusChange,
  emptyLabel,
  emptyHint,
  previewImgStyle,
  previewImgClassName = "",
  mediaType = "image",
  maxVideoDurationSec = null,
  maxVideoBytes = MAX_VIDEO_UPLOAD_BYTES,
  disabled = false,
  /** When true, onChange fires only after prepare (avoids double-callback races in Manga Flow). */
  notifyOnPreparedOnly = false,
  /** Comprime no pick (lento no telemóvel). Por defeito falso — servidor comprime no Gerar. */
  prepareOnPick = false,
  /** Vídeo gerido pelo pai (StudioVideoUpload) — não marcar caixa verde antes da nuvem. */
  videoDeferReadyState = false,
  forceUploadReady = null,
  forceUploadBusy = null,
}) {
  const { t } = useI18n();
  const isVideo = mediaType === "video";
  const resolvedAccept = accept ?? (isVideo ? VIDEO_UPLOAD_ACCEPT : IMAGE_ACCEPT);
  const resolvedLabel = emptyLabel ?? (isVideo ? t("vid_upload_title") : t("upload_empty_label"));
  const resolvedHint = emptyHint ?? (isVideo ? t("vid_edit_video_hint") : t("upload_empty_hint"));
  const inputId = useId();
  const inputRef = useRef(null);
  const mediaObjectUrlRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewImgError, setPreviewImgError] = useState(false);
  const [persistState, setPersistState] = useState("idle");
  const [rejectMessage, setRejectMessage] = useState(null);
  const lastPreparedRef = useRef(null);
  const runIdRef = useRef(0);

  const notifyStatus = useCallback((s) => {
    onStatusChange?.(s);
  }, [onStatusChange]);

  useEffect(() => {
    if (!value) {
      runIdRef.current += 1;
      setPreviewUrl((prev) => {
        revokeFilePreviewUrl(prev);
        mediaObjectUrlRef.current = null;
        return null;
      });
      setPreviewImgError(false);
      setPersistState("idle");
      lastPreparedRef.current = null;
      notifyStatus("idle");
      setRejectMessage(null);
      return undefined;
    }

    const url = URL.createObjectURL(value);
    mediaObjectUrlRef.current = url;
    setPreviewUrl((prev) => {
      revokeFilePreviewUrl(prev);
      return url;
    });
    setPreviewImgError(false);
    return () => revokeFilePreviewUrl(url);
  }, [value, notifyStatus]);

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

      if (!enableRemotePersist) {
        setPersistState("saved");
        notifyStatus("saved");
        return;
      }
      const blobOk = await isBlobPersistAvailable();
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
        setPersistState("saved");
        notifyStatus("saved");
        console.warn("[upload] blob copy failed (generate still works):", err);
      }
    } catch (err) {
      if (rid !== runIdRef.current) return;
      setPersistState("error");
      notifyStatus("error");
      toast.error(t("img_err_read_failed"), { duration: 6000 });
    }
  }, [compressOptions, enableRemotePersist, onChange, notifyStatus, t]);

  const runBackgroundVideo = useCallback(async (rawFile, rid) => {
    lastPreparedRef.current = rawFile;
    if (rid !== runIdRef.current) return;
    if (videoDeferReadyState) {
      setPersistState("saving");
      notifyStatus("saving");
      return;
    }
    setPersistState("saved");
    notifyStatus("saved");

    if (!enableRemotePersist || rawFile.size <= VIDEO_VERCEL_SAFE_BYTES) return;

    void (async () => {
      const blobOk = await isBlobPersistAvailable();
      if (!blobOk || rid !== runIdRef.current) return;
      try {
        await persistVideoToBlobStore(rawFile);
      } catch (err) {
        console.warn("[video upload] optional cloud copy failed:", err);
      }
    })();
  }, [enableRemotePersist, notifyStatus, videoDeferReadyState]);

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

  const ingestFile = useCallback(async (file) => {
    if (!file) return;

    if (isVideo) {
      const check = validateVideoUpload(file, t, { maxBytes: maxVideoBytes });
      if (!check.ok) {
        setRejectMessage(check.message);
        toast.error(check.message, { duration: 12000 });
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
      setRejectMessage(null);
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

      if (Number.isFinite(maxVideoDurationSec) && maxVideoDurationSec > 0) {
        void readVideoDurationSeconds(file, { timeoutMs: 6000 })
          .then((dur) => {
            if (dur > maxVideoDurationSec) {
              const msg = t("vid_err_too_long", { n: Math.round(maxVideoDurationSec) });
              setRejectMessage(msg);
              toast.error(msg, { duration: 12000 });
              if (rid !== runIdRef.current) return;
              runIdRef.current += 1;
              lastPreparedRef.current = null;
              setPersistState("idle");
              notifyStatus("idle");
              onChange(null);
              if (inputRef.current) inputRef.current.value = "";
            }
          })
          .catch(() => {
            /* HEVC/MOV: preview stays; server validates on generate */
          });
      }
      return;
    }

    if (!looksLikeImageFile(file)) {
      toast.error(t("img_err_read_failed"));
      return;
    }
    if (looksLikeVideoUpload(file)) {
      toast.error(t("vid_err_use_video_zone"));
      return;
    }
    runIdRef.current += 1;
    const rid = runIdRef.current;
    lastPreparedRef.current = file;

    if (!prepareOnPick) {
      setPersistState("saving");
      notifyStatus("saving");
      try {
        const durable = await materializeUploadFile(file);
        if (rid !== runIdRef.current) return;
        lastPreparedRef.current = durable;
        if (!notifyOnPreparedOnly) onChange(durable);
        setPersistState("saved");
        notifyStatus("saved");
      } catch (err) {
        if (rid !== runIdRef.current) return;
        setPersistState("error");
        notifyStatus("error");
        toast.error(err?.message || t("img_err_read_failed"), { duration: 6000 });
        if (inputRef.current) inputRef.current.value = "";
      }
      return;
    }

    setPersistState("saving");
    notifyStatus("saving");
    if (!notifyOnPreparedOnly) onChange(file);
    void runBackgroundImage(file, rid);
  }, [
    isVideo,
    maxVideoDurationSec,
    runBackgroundImage,
    runBackgroundVideo,
    onChange,
    notifyStatus,
    notifyOnPreparedOnly,
    prepareOnPick,
    maxVideoBytes,
    t,
  ]);

  const clear = useCallback(() => {
    runIdRef.current += 1;
    lastPreparedRef.current = null;
    revokeFilePreviewUrl(mediaObjectUrlRef.current);
    mediaObjectUrlRef.current = null;
    setPreviewUrl(null);
    setPreviewImgError(false);
    setPersistState("idle");
    onChange(null);
    notifyStatus("idle");
    setRejectMessage(null);
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
  const uploadBusy = forceUploadBusy != null ? forceUploadBusy : persistState === "saving";
  const uploadReady = forceUploadReady != null ? forceUploadReady : persistState === "saved" && Boolean(value);
  const hasPreview = Boolean(previewUrl && value);
  const showPreviewShell = Boolean(value) && (hasPreview || uploadBusy || previewImgError);

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
          "relative block w-full cursor-pointer overflow-hidden rounded-2xl border-2 transition-all duration-200",
          aspectClass,
          uploadReady
            ? "border-solid border-emerald-500 shadow-[0_0_28px_rgba(16,185,129,0.3)] bg-gradient-to-br from-[#14141c]/90 via-[#0e0e12] to-[#0a0a0f]"
            : uploadBusy
              ? "border-dashed border-amber-500/70 bg-gradient-to-br from-[#14141c]/90 via-[#0e0e12] to-[#0a0a0f]"
              :           drag
                ? "border-dashed border-[#9333EA] bg-[radial-gradient(ellipse_at_center,rgba(147,51,234,0.35),rgba(12,12,18,0.95))] shadow-[0_0_32px_rgba(147,51,234,0.45)]"
                : rejectMessage
                  ? "border-dashed border-red-500/80 bg-gradient-to-br from-red-950/40 via-[#0e0e12] to-[#0a0a0f] shadow-[0_0_28px_-8px_rgba(239,68,68,0.45)]"
                  : "border-dashed border-[#9333EA]/55 bg-gradient-to-br from-[#14141c]/90 via-[#0e0e12] to-[#0a0a0f]",
          "min-h-[12rem]",
          disabled ? "pointer-events-none opacity-60" : "",
        ].join(" ")}
        data-upload-state={uploadReady ? "ready" : uploadBusy ? "saving" : "idle"}
      >
        {overlay && showPreviewShell ? (
          <div className="pointer-events-none absolute inset-0 z-0">{overlay}</div>
        ) : null}

        {showPreviewShell ? (
          <>
            {isVideo ? (
              <video
                src={previewUrl}
                className="relative z-[1] h-full w-full object-contain bg-black p-3 pb-14"
                controls
                playsInline
                muted
                data-testid={`${testId}-preview`}
                onError={() => setPreviewImgError(true)}
              />
            ) : (
              <>
                <img
                  src={previewUrl}
                  alt=""
                  style={previewImgStyle}
                  className={[
                    "relative z-[1] h-full w-full object-contain p-3",
                    previewImgClassName,
                    previewImgError && uploadBusy ? "opacity-0" : "",
                  ].filter(Boolean).join(" ")}
                  data-testid={`${testId}-preview`}
                  onLoad={() => setPreviewImgError(false)}
                  onError={() => setPreviewImgError(true)}
                />
                {previewImgError && uploadBusy && (
                  <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2 bg-black/90 px-4 text-center">
                    <p className="text-sm font-medium text-zinc-200">{savingLabel}</p>
                    <p className="text-xs text-zinc-500 max-w-[220px]">{t("upload_empty_hint")}</p>
                  </div>
                )}
              </>
            )}
            {previewImgError && isVideo && (
              <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2 bg-black/90 px-4 text-center pb-12">
                <p className="text-sm font-medium text-zinc-200">{value?.name || t("vid_upload_title")}</p>
                <p className="text-xs text-zinc-500 max-w-[240px]">{t("vid_preview_codec_hint")}</p>
              </div>
            )}
            {uploadBusy && (
              <span className="pointer-events-none absolute bottom-2 left-2 z-20 rounded-md bg-black/75 px-2 py-1 text-[10px] font-medium text-white/90 backdrop-blur-sm">
                {savingLabel}
              </span>
            )}
            {persistState === "error" && (
              <span className="pointer-events-none absolute bottom-2 left-2 z-20 rounded-md bg-red-600/90 px-2 py-1 text-[10px] font-medium text-white">
                {t("upload_save_error")}
              </span>
            )}
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
            {rejectMessage ? (
              <p
                role="alert"
                className="relative z-10 max-w-sm rounded-xl border border-red-500/50 bg-red-950/70 px-4 py-3 text-sm font-medium text-red-100"
                data-testid={`${testId}-reject`}
              >
                {rejectMessage}
              </p>
            ) : null}
            {isVideo ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!disabled) inputRef.current?.click();
                }}
                className="relative z-10 mt-1 min-h-11 rounded-xl border border-[#9333EA]/50 bg-[#9333EA]/20 px-5 text-sm font-semibold text-[#e9d5ff] shadow-[0_0_20px_-8px_rgba(147,51,234,0.6)] hover:bg-[#9333EA]/30"
                data-testid={`${testId}-choose`}
              >
                {t("vid_upload_choose")}
              </button>
            ) : null}
          </div>
        )}
      </label>
    </div>
  );
}

export default function ImageUploadZone({
  multiple = false,
  maxFiles = 5,
  mediaType = "image",
  value,
  onChange,
  accept,
  testId,
  layout,
  className,
  disabled,
  emptyLabel,
  emptyHint,
  onStatusChange,
  ...rest
}) {
  if (multiple && mediaType !== "video") {
    return (
      <MultiImageUpload
        value={Array.isArray(value) ? value : value ? [value] : []}
        onChange={onChange}
        maxFiles={maxFiles}
        accept={accept ?? IMAGE_ACCEPT}
        testId={testId}
        layout={layout}
        className={className}
        disabled={disabled}
        emptyLabel={emptyLabel}
        emptyHint={emptyHint}
        onStatusChange={onStatusChange}
      />
    );
  }
  return (
    <SingleImageUploadZone
      value={value}
      onChange={onChange}
      accept={accept}
      testId={testId}
      layout={layout}
      className={className}
      disabled={disabled}
      emptyLabel={emptyLabel}
      emptyHint={emptyHint}
      onStatusChange={onStatusChange}
      mediaType={mediaType}
      {...rest}
    />
  );
}

export { VIDEO_VERCEL_SAFE_BYTES as VIDEO_DIRECT_MAX_BYTES } from "../lib/uploadConstants";
