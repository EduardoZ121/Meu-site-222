import {
  useCallback, useEffect, useId, useRef, useState,
} from "react";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { attachFileObjectPreview, revokeFilePreviewUrl } from "../lib/previewDataUrl";
import { compressImageNeverFail } from "../lib/canvasCompress";
import {
  isBlobPersistAvailable,
  persistImageToBlobStore,
  persistVideoToBlobStore,
} from "../lib/persistImage";
import { formatHttpError } from "../lib/uploadErrors";
import {
  looksLikeImageFile,
  looksLikeVideoFile,
  IMAGE_ACCEPT,
  VIDEO_ACCEPT,
} from "../lib/imageCompress";
import { validateImageUpload, validateVideoUpload } from "../lib/videoMedia";
import { VIDEO_VERCEL_SAFE_BYTES } from "../lib/videoCloudLimits";
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
 * Upload: preview imediato (object URL estável), compressão opcional só se compressOnSelect.
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
  compressOnSelect = false,
  enableRemotePersist = false,
  onStatusChange,
  emptyLabel,
  emptyHint,
  previewImgStyle,
  previewImgClassName = "",
  mediaType = "image",
}) {
  const { t } = useI18n();
  const isVideo = mediaType === "video";
  const resolvedAccept = accept ?? (isVideo ? VIDEO_ACCEPT : IMAGE_ACCEPT);
  const resolvedLabel = emptyLabel ?? t("upload_empty_label");
  const resolvedHint = emptyHint ?? (isVideo ? t("vid_edit_video_hint") : t("upload_empty_hint"));
  const inputId = useId();
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const lastPreparedRef = useRef(null);
  const runIdRef = useRef(0);
  const previewObjectUrlRef = useRef(null);

  const notifyStatus = useCallback((s) => {
    onStatusChange?.(s);
  }, [onStatusChange]);

  const syncPreview = useCallback((file) => {
    try {
      const url = attachFileObjectPreview(file, previewObjectUrlRef);
      setPreviewUrl(url);
      setPreviewFailed(!file || !url);
      return Boolean(url);
    } catch {
      setPreviewUrl(null);
      setPreviewFailed(Boolean(file));
      return false;
    }
  }, []);

  useEffect(() => () => {
    revokeFilePreviewUrl(previewObjectUrlRef.current);
    previewObjectUrlRef.current = null;
  }, []);

  useEffect(() => {
    if (!value) {
      runIdRef.current += 1;
      syncPreview(null);
      lastPreparedRef.current = null;
      notifyStatus("idle");
      return;
    }
    syncPreview(value);
    notifyStatus("ready");
  }, [value, notifyStatus, syncPreview]);

  const runBackground = useCallback(async (rawFile, rid) => {
    const prepared = await compressImageNeverFail(rawFile, compressOptions);
    if (rid !== runIdRef.current) return;
    lastPreparedRef.current = prepared;
    syncPreview(prepared);
    onChange(prepared);
  }, [compressOptions, onChange, syncPreview]);

  const runVideoBackground = useCallback(async (rawFile, rid) => {
    lastPreparedRef.current = rawFile;
    if (!enableRemotePersist) return;
    const blobOk = await isBlobPersistAvailable();
    if (!blobOk || rid !== runIdRef.current) return;
    try {
      await persistVideoToBlobStore(rawFile);
    } catch (err) {
      if (rid !== runIdRef.current) return;
      toast.error(
        formatHttpError(err, t("upload_err_cloud"), { context: "video_upload", t }),
        { duration: 5000 },
      );
      console.warn("[ImageUploadZone] video persist", err);
    }
  }, [enableRemotePersist, t]);

  const ingestFile = useCallback((file) => {
    if (isVideo) {
      const check = validateVideoUpload(file, t);
      if (!check.ok) {
        toast.error(check.message);
        return;
      }
      runIdRef.current += 1;
      lastPreparedRef.current = file;
      onChange(file);
      notifyStatus("ready");
      if (enableRemotePersist && file.size > VIDEO_VERCEL_SAFE_BYTES) {
        void runVideoBackground(file, runIdRef.current);
      }
      return;
    }
    const imgCheck = validateImageUpload(file, t);
    if (!imgCheck.ok) {
      toast.error(imgCheck.message);
      return;
    }
    if (!looksLikeImageFile(file)) {
      toast.error(t("img_err_invalid_type"));
      return;
    }
    runIdRef.current += 1;
    const rid = runIdRef.current;
    lastPreparedRef.current = file;
    syncPreview(file);
    onChange(file);
    notifyStatus("ready");
    if (compressOnSelect) {
      void runBackground(file, rid);
    }
  }, [
    isVideo,
    runBackground,
    runVideoBackground,
    onChange,
    notifyStatus,
    syncPreview,
    t,
    enableRemotePersist,
    compressOnSelect,
  ]);

  const clear = useCallback(() => {
    runIdRef.current += 1;
    syncPreview(null);
    lastPreparedRef.current = null;
    onChange(null);
    notifyStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
  }, [onChange, notifyStatus, syncPreview]);

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
    const items = e.clipboardData?.files;
    const f = items?.[0];
    if (f && (isVideo ? looksLikeVideoFile(f) : looksLikeImageFile(f))) {
      e.preventDefault();
      void ingestFile(f);
    }
  };

  const aspectClass = LAYOUT[layout] || LAYOUT.portrait;

  return (
    <div
      className={className}
      onPaste={onPaste}
      role="presentation"
    >
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={resolvedAccept}
        capture={capture}
        className="sr-only"
        onChange={onPick}
        data-testid={`${testId}-input`}
      />
      <label
        htmlFor={inputId}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => { e.preventDefault(); setDrag(true); }}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
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
        ].join(" ")}
      >
        {overlay && previewUrl ? (
          <div className="pointer-events-none absolute inset-0 z-0">{overlay}</div>
        ) : null}

        {previewUrl ? (
          <>
            {isVideo ? (
              <video
                src={previewUrl}
                className="relative z-[1] h-full w-full object-contain p-3 opacity-0 animate-[rpFadeIn_0.35s_ease-out_forwards] bg-black"
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
                onError={() => setPreviewFailed(true)}
              />
            )}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); clear(); }}
              className="absolute right-3 top-3 z-20 flex min-h-12 min-w-12 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-md hover:bg-black/90"
              data-testid={`${testId}-clear`}
              aria-label="Remover"
            >
              <X className="h-5 w-5" />
            </button>
          </>
        ) : value ? (
          <div className="absolute inset-0 flex min-h-12 flex-col items-center justify-center gap-2 px-4 py-6 text-center bg-[#0c0c12]/80">
            <p className="text-zinc-200 text-sm font-medium">{t("upload_loaded")}</p>
            {previewFailed && (
              <p className="text-zinc-500 text-xs max-w-[240px]">
                {t("upload_err_preview")}
              </p>
            )}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); clear(); }}
              className="absolute right-3 top-3 z-20 flex min-h-12 min-w-12 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-md hover:bg-black/90"
              data-testid={`${testId}-clear`}
              aria-label="Remover"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="absolute inset-0 flex min-h-12 flex-col items-center justify-center gap-3 px-4 py-6 text-center">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(147,51,234,0.12),transparent_55%)]" />
            <div className="relative flex min-h-12 min-w-12 items-center justify-center rounded-2xl border border-[#9333EA]/30 bg-[#9333EA]/10">
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
