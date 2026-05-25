import {
  useCallback, useEffect, useId, useRef, useState,
} from "react";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { readFileAsDataURL, revokeFilePreviewUrl } from "../lib/previewDataUrl";
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
 * Upload com preview imediato (dataURL), compressão canvas em background,
 * persistência opcional no Blob, estados visuais e reenvio.
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
  const [persistState, setPersistState] = useState("idle"); // idle | saving | saved | error
  const lastPreparedRef = useRef(null);
  const runIdRef = useRef(0);
  const blobPreviewRef = useRef(null);

  const notifyStatus = useCallback((s) => {
    onStatusChange?.(s);
  }, [onStatusChange]);

  useEffect(() => {
    if (!value) {
      runIdRef.current += 1;
      revokeFilePreviewUrl(blobPreviewRef.current);
      blobPreviewRef.current = null;
      setPreviewUrl(null);
      setPreviewFailed(false);
      setPersistState("idle");
      lastPreparedRef.current = null;
      notifyStatus("idle");
      return undefined;
    }
    let cancelled = false;
    setPreviewFailed(false);
    if (isVideo) {
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);
      notifyStatus("ready");
      return () => {
        cancelled = true;
        URL.revokeObjectURL(url);
      };
    }
    (async () => {
      try {
        const url = await readFileAsDataURL(value);
        if (cancelled) return;
        revokeFilePreviewUrl(blobPreviewRef.current);
        blobPreviewRef.current = null;
        setPreviewUrl(url);
        setPreviewFailed(false);
      } catch {
        if (cancelled) return;
        try {
          revokeFilePreviewUrl(blobPreviewRef.current);
          const blobUrl = URL.createObjectURL(value);
          blobPreviewRef.current = blobUrl;
          setPreviewUrl(blobUrl);
          setPreviewFailed(false);
        } catch {
          setPreviewUrl(null);
          setPreviewFailed(true);
        }
      }
    })();
    return () => {
      cancelled = true;
      revokeFilePreviewUrl(blobPreviewRef.current);
      blobPreviewRef.current = null;
    };
  }, [value, notifyStatus, isVideo]);

  const runBackground = useCallback(async (rawFile, rid) => {
    setPersistState("saving");
    notifyStatus("saving");
    const prepared = await compressImageNeverFail(rawFile, compressOptions);
    if (rid !== runIdRef.current) return;
    lastPreparedRef.current = prepared;
    onChange(prepared);

    const blobOk = enableRemotePersist && (await isBlobPersistAvailable());
    if (!blobOk) {
      if (rid !== runIdRef.current) return;
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
      notifyStatus("ready");
      toast.error(
        formatHttpError(err, t("upload_err_cloud"), { context: "image_upload", t }),
        { duration: 6000 },
      );
      console.warn("[ImageUploadZone] persist", err);
    }
  }, [compressOptions, enableRemotePersist, onChange, notifyStatus, t]);

  const runVideoBackground = useCallback(async (rawFile, rid) => {
    setPersistState("saving");
    notifyStatus("saving");
    lastPreparedRef.current = rawFile;
    const blobOk = enableRemotePersist && (await isBlobPersistAvailable());
    if (!blobOk) {
      if (rid !== runIdRef.current) return;
      setPersistState("saved");
      notifyStatus("saved");
      return;
    }
    try {
      await persistVideoToBlobStore(rawFile);
      if (rid !== runIdRef.current) return;
      setPersistState("saved");
      notifyStatus("saved");
    } catch (err) {
      if (rid !== runIdRef.current) return;
      setPersistState("saved");
      notifyStatus("ready");
      toast.error(
        formatHttpError(err, t("upload_err_cloud"), { context: "video_upload", t }),
        { duration: 6000 },
      );
      console.warn("[ImageUploadZone] video persist", err);
    }
  }, [enableRemotePersist, notifyStatus, t]);

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
      // Vídeo: preview imediato; upload para Blob só no envio (uploadPost), não bloquear o botão Gerar.
      setPersistState("saved");
      notifyStatus("ready");
      if (enableRemotePersist && file.size > VIDEO_VERCEL_SAFE_BYTES) {
        const rid = runIdRef.current;
        void runVideoBackground(file, rid);
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
    lastPreparedRef.current = null;
    setPersistState("saving");
    notifyStatus("saving");
    onChange(file);
    void runBackground(file, rid);
  }, [isVideo, runBackground, runVideoBackground, onChange, notifyStatus, t, enableRemotePersist]);

  const clear = useCallback(() => {
    runIdRef.current += 1;
    revokeFilePreviewUrl(blobPreviewRef.current);
    blobPreviewRef.current = null;
    lastPreparedRef.current = null;
    setPreviewUrl(null);
    setPreviewFailed(false);
    setPersistState("idle");
    onChange(null);
    notifyStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
  }, [onChange, notifyStatus]);

  const retryPersist = useCallback(async () => {
    const f = lastPreparedRef.current || value;
    if (!f) return;
    const rid = runIdRef.current;
    if (isVideo) {
      void runVideoBackground(f, rid);
      return;
    }
    setPersistState("saving");
    notifyStatus("saving");
    const blobOk = enableRemotePersist && (await isBlobPersistAvailable());
    if (!blobOk) {
      setPersistState("saved");
      notifyStatus("saved");
      return;
    }
    try {
      await persistImageToBlobStore(f);
      if (rid !== runIdRef.current) return;
      setPersistState("saved");
      notifyStatus("saved");
    } catch (err) {
      if (rid !== runIdRef.current) return;
      setPersistState("saved");
      notifyStatus("ready");
      toast.error(
        formatHttpError(err, t("upload_err_cloud"), { context: "image_upload", t }),
        { duration: 6000 },
      );
      console.warn("[ImageUploadZone] retry persist", err);
    }
  }, [value, isVideo, runVideoBackground, enableRemotePersist, notifyStatus, t]);

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
              />
            )}
            <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-wrap gap-2">
              {persistState === "saving" && (
                <span className="rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                  A guardar...
                </span>
              )}
              {persistState === "saved" && (
                <span className="rounded-full bg-emerald-600/90 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                  Guardado ✓
                </span>
              )}
              {persistState === "error" && (
                <span className="rounded-full bg-red-600/95 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                  Erro ao guardar
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
                Reenviar
              </button>
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
            <p className="text-zinc-200 text-sm font-medium">
              {previewFailed ? t("upload_loaded") : t("upload_preparing")}
            </p>
            {previewFailed && (
              <p className="text-zinc-500 text-xs max-w-[220px]">
                {t("upload_err_preview")}
              </p>
            )}
            <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-wrap gap-2">
              {persistState === "saving" && (
                <span className="rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                  A guardar...
                </span>
              )}
              {persistState === "saved" && (
                <span className="rounded-full bg-emerald-600/90 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                  Guardado ✓
                </span>
              )}
              {persistState === "error" && (
                <span className="rounded-full bg-red-600/95 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                  Erro ao guardar
                </span>
              )}
            </div>
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
