import { useCallback, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, FileImage, Loader2, Upload, X } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { CLIENT_BUILD_ID } from "../../lib/buildInfo";
import { prepareImageForUpload } from "../../lib/prepareImageForUpload";
import { readFileAsDataURL } from "../../lib/previewDataUrl";
import { MAX_IMAGE_DIRECT_BYTES } from "../../lib/uploadConstants";

/**
 * Upload do estúdio — como antes do Blob para fotos:
 * comprimir ao escolher → preview estável (data URL) → POST directo ao /api.
 */

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB

const IMAGE_ACCEPT = "image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.heic,.heif";
const VIDEO_ACCEPT = "video/mp4,video/quicktime,.mp4,.mov";

function looksLikeImage(file) {
  if (!file) return false;
  if ((file.type || "").startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif)$/i.test(file.name || "");
}

function looksLikeVideo(file) {
  if (!file) return false;
  if ((file.type || "").startsWith("video/")) return true;
  return /\.(mp4|mov|webm)$/i.test(file.name || "");
}

const LAYOUT = {
  portrait: "aspect-[4/5] min-h-[200px]",
  square: "aspect-square min-h-[200px]",
  wide: "aspect-[16/10] min-h-[200px]",
  full: "aspect-[2/1] min-h-[200px]",
  video: "aspect-video min-h-[180px]",
  carousel: "aspect-[2/1] min-h-[200px]",
};

export default function StudioMediaPicker({
  value,
  onChange,
  accept,
  testId = "studio-media-picker",
  layout = "portrait",
  className = "",
  overlay = null,
  capture = undefined,
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
  const videoObjectUrlRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewBroken, setPreviewBroken] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!value) {
      if (videoObjectUrlRef.current) {
        URL.revokeObjectURL(videoObjectUrlRef.current);
        videoObjectUrlRef.current = null;
      }
      setPreviewUrl(null);
      setPreviewBroken(false);
      return undefined;
    }
    if (isVideo) {
      const url = URL.createObjectURL(value);
      if (videoObjectUrlRef.current) URL.revokeObjectURL(videoObjectUrlRef.current);
      videoObjectUrlRef.current = url;
      setPreviewUrl(url);
      setPreviewBroken(false);
      return () => {
        if (videoObjectUrlRef.current) {
          URL.revokeObjectURL(videoObjectUrlRef.current);
          videoObjectUrlRef.current = null;
        }
      };
    }
    (async () => {
      try {
        const dataUrl = await readFileAsDataURL(value);
        if (!cancelled) {
          setPreviewUrl(dataUrl);
          setPreviewBroken(!dataUrl);
        }
      } catch {
        if (!cancelled) setPreviewBroken(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value, isVideo]);

  useEffect(() => () => {
    if (videoObjectUrlRef.current) {
      URL.revokeObjectURL(videoObjectUrlRef.current);
    }
  }, []);

  const ingest = useCallback(async (file) => {
    if (!file) return;

    if (isVideo) {
      if (!looksLikeVideo(file)) {
        toast.error(t("vid_err_invalid_type"));
        return;
      }
      if (file.size > MAX_VIDEO_BYTES) {
        toast.error(t("vid_err_too_large"));
        return;
      }
      onChange(file);
      return;
    }

    if (looksLikeVideo(file)) {
      toast.error(t("vid_err_use_video_zone"));
      return;
    }
    if (!looksLikeImage(file)) {
      toast.error(t("img_err_invalid_type"));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(t("img_err_too_large"));
      return;
    }

    setPreparing(true);
    try {
      const ready = await prepareImageForUpload(file, {
        maxBytes: MAX_IMAGE_DIRECT_BYTES,
        maxSize: 2048,
        force: true,
      });
      onChange(ready);
      const mb = (ready.size / (1024 * 1024)).toFixed(1);
      if (ready.size > 3_200_000) {
        toast.warning(t("upload_heic_hint"), { duration: 10000 });
      } else {
        toast.success(t("upload_loaded_size", { size: `${mb} MB` }), { duration: 2500 });
      }
    } catch (err) {
      toast.error(err?.message || t("img_err_invalid_type"));
    } finally {
      setPreparing(false);
    }
  }, [isVideo, onChange, t]);

  const clear = useCallback(() => {
    setPreviewUrl(null);
    setPreviewBroken(false);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [onChange]);

  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (f) ingest(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) ingest(f);
  };

  const onPaste = (e) => {
    const f = e.clipboardData?.files?.[0];
    if (f) {
      e.preventDefault();
      ingest(f);
    }
  };

  const aspectClass = LAYOUT[layout] || LAYOUT.portrait;
  const hasFile = Boolean(value);

  return (
    <div
      className={className}
      onPaste={onPaste}
      role="presentation"
      data-rp-upload-build={CLIENT_BUILD_ID}
      data-testid={`${testId}-wrap`}
    >
      <p
        className="mb-1 text-center text-[10px] font-mono text-[#6b7280]"
        data-testid={`${testId}-build-tag`}
        aria-hidden
      >
        upload v
        {CLIENT_BUILD_ID.replace("upload-", "")}
      </p>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={resolvedAccept}
        capture={capture}
        className="sr-only"
        onChange={onPick}
        disabled={preparing}
        data-testid={`${testId}-input`}
      />
      <label
        htmlFor={inputId}
        tabIndex={0}
        onKeyDown={(e) => {
          if (preparing) return;
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
          "relative block w-full cursor-pointer overflow-hidden rounded-2xl border-2 transition-all duration-200",
          aspectClass,
          hasFile
            ? "border-emerald-500/90 bg-[#0a120e] shadow-[0_0_0_1px_rgba(16,185,129,0.35),0_12px_40px_rgba(0,0,0,0.45)]"
            : drag
              ? "border-[#a855f7] bg-[#16101f] border-solid"
              : "border-dashed border-[#6b5b80]/80 bg-[#0c0c12] hover:border-[#9333EA]/70",
          preparing ? "pointer-events-none opacity-90" : "",
          "min-h-[12rem]",
        ].join(" ")}
      >
        {preparing ? (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-black/75">
            <Loader2 className="h-9 w-9 animate-spin text-[#c4b5fd]" aria-hidden />
            <p className="text-sm text-[#f4f1ea]">{t("upload_preparing")}</p>
          </div>
        ) : null}

        {overlay && hasFile ? (
          <div className="pointer-events-none absolute inset-0 z-0">{overlay}</div>
        ) : null}

        {hasFile && !previewUrl && !isVideo ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a120e]">
            <p className="text-sm text-[#8a8a8e]">{t("upload_preparing")}</p>
          </div>
        ) : null}

        {hasFile && (isVideo ? Boolean(previewUrl) : (previewUrl || previewBroken)) ? (
          <>
            {isVideo ? (
              <video
                src={previewUrl}
                className="relative z-[1] h-full w-full object-contain bg-black p-2 pb-14"
                controls
                playsInline
                muted
                data-testid={`${testId}-preview`}
              />
            ) : previewBroken ? (
              <div
                className="relative z-[1] flex h-full w-full flex-col items-center justify-center gap-2 bg-[#0a120e] p-4 pb-14 text-center"
                data-testid={`${testId}-preview-fallback`}
              >
                <FileImage className="h-12 w-12 text-emerald-400/80" strokeWidth={1.5} />
                <p className="text-sm font-medium text-emerald-100 break-all">
                  {value?.name || "image"}
                </p>
                <p className="text-xs text-emerald-200/70">
                  {t("upload_preview_unavailable")}
                </p>
              </div>
            ) : (
              <img
                src={previewUrl}
                alt=""
                style={previewImgStyle}
                className={[
                  "relative z-[1] h-full w-full object-contain p-2 pb-14",
                  previewImgClassName,
                ].filter(Boolean).join(" ")}
                data-testid={`${testId}-preview`}
                onError={() => setPreviewBroken(true)}
              />
            )}
            <div
              className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-2 border-t border-emerald-500/30 bg-emerald-950/90 px-3 py-2.5 backdrop-blur-sm"
              data-testid={`${testId}-ready-bar`}
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
              <span className="text-sm font-medium text-emerald-100">
                {t("upload_ready")}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); clear(); }}
              className="absolute right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/80 text-white ring-1 ring-white/10 hover:bg-black"
              data-testid={`${testId}-clear`}
              aria-label={t("remove")}
            >
              <X className="h-5 w-5" />
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#9333EA]/40 bg-[#9333EA]/15">
              <Upload className="h-8 w-8 text-[#c4b5fd]" strokeWidth={1.5} />
            </div>
            <p className="text-lg font-medium text-[#f4f1ea]">
              {drag ? t("upload_drop") : resolvedLabel}
            </p>
            <p className="max-w-xs text-sm text-[#8a8a8e]">{resolvedHint}</p>
          </div>
        )}
      </label>
    </div>
  );
}
