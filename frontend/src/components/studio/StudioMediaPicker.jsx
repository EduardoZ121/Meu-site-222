import { useCallback, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, FileImage, Upload, X } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { CLIENT_BUILD_ID } from "../../lib/buildInfo";

/**
 * StudioMediaPicker — FAST VERSION
 *
 * Preview: URL.createObjectURL (instant, no file reading)
 * Compression: NONE (server handles with sharp)
 * Result: instant preview, no loading, no "preparing" messages
 */

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
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
  const [drag, setDrag] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewBroken, setPreviewBroken] = useState(false);

  // Preview: URL.createObjectURL is INSTANT — no file reading needed
  useEffect(() => {
    if (!value) {
      setPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
      setPreviewBroken(false);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return url; });
    setPreviewBroken(false);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const ingest = useCallback((file) => {
    if (!file) return;

    if (isVideo) {
      if (!looksLikeVideo(file)) { toast.error(t("vid_err_invalid_type")); return; }
      if (file.size > MAX_VIDEO_BYTES) { toast.error(t("vid_err_too_large")); return; }
      onChange(file);
      return;
    }

    if (looksLikeVideo(file)) { toast.error(t("vid_err_use_video_zone")); return; }
    if (!looksLikeImage(file)) { toast.error(t("img_err_invalid_type")); return; }
    if (file.size > MAX_IMAGE_BYTES) { toast.error(t("img_err_too_large")); return; }

    // Accept immediately. No compression, no processing.
    // Server handles HEIF→JPEG, compression, rotation with sharp.
    onChange(file);
  }, [isVideo, onChange, t]);

  const clear = useCallback(() => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [onChange]);

  const onPick = (e) => { const f = e.target.files?.[0]; if (f) ingest(f); };
  const onDrop = (e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) ingest(f); };
  const onPaste = (e) => { const f = e.clipboardData?.files?.[0]; if (f) { e.preventDefault(); ingest(f); } };

  const aspectClass = LAYOUT[layout] || LAYOUT.portrait;
  const hasFile = Boolean(value && previewUrl);

  return (
    <div className={className} onPaste={onPaste} role="presentation" data-rp-upload-build={CLIENT_BUILD_ID} data-testid={`${testId}-wrap`}>
      <input ref={inputRef} id={inputId} type="file" accept={resolvedAccept} capture={capture} className="sr-only" onChange={onPick} data-testid={`${testId}-input`} />
      <label
        htmlFor={inputId} tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
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
            : drag ? "border-[#a855f7] bg-[#16101f] border-solid"
              : "border-dashed border-[#6b5b80]/80 bg-[#0c0c12] hover:border-[#9333EA]/70",
          "min-h-[12rem]",
        ].join(" ")}
      >
        {overlay && hasFile ? <div className="pointer-events-none absolute inset-0 z-0">{overlay}</div> : null}

        {hasFile ? (
          <>
            {isVideo ? (
              <video src={previewUrl} className="relative z-[1] h-full w-full object-contain bg-black p-2 pb-14" controls playsInline muted data-testid={`${testId}-preview`} />
            ) : previewBroken ? (
              <div className="relative z-[1] flex h-full w-full flex-col items-center justify-center gap-2 bg-[#0a120e] p-4 pb-14 text-center" data-testid={`${testId}-preview-fallback`}>
                <FileImage className="h-12 w-12 text-emerald-400/80" strokeWidth={1.5} />
                <p className="text-sm font-medium text-emerald-100 break-all">{value?.name || "image"}</p>
                <p className="text-xs text-emerald-200/70">{t("upload_preview_unavailable") || "Preview unavailable — file will still be used"}</p>
              </div>
            ) : (
              <img src={previewUrl} alt="" style={previewImgStyle}
                className={["relative z-[1] h-full w-full object-contain p-2 pb-14", previewImgClassName].filter(Boolean).join(" ")}
                data-testid={`${testId}-preview`}
                onError={() => setPreviewBroken(true)} />
            )}
            <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-2 border-t border-emerald-500/30 bg-emerald-950/90 px-3 py-2.5 backdrop-blur-sm" data-testid={`${testId}-ready-bar`}>
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
              <span className="text-sm font-medium text-emerald-100">{t("upload_ready")}</span>
            </div>
            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); clear(); }}
              className="absolute right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/80 text-white ring-1 ring-white/10 hover:bg-black"
              data-testid={`${testId}-clear`} aria-label={t("remove")}>
              <X className="h-5 w-5" />
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#9333EA]/40 bg-[#9333EA]/15">
              <Upload className="h-8 w-8 text-[#c4b5fd]" strokeWidth={1.5} />
            </div>
            <p className="text-lg font-medium text-[#f4f1ea]">{drag ? t("upload_drop") : resolvedLabel}</p>
            <p className="max-w-xs text-sm text-[#8a8a8e]">{resolvedHint}</p>
          </div>
        )}
      </label>
    </div>
  );
}
