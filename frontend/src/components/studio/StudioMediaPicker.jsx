import {
  useCallback, useEffect, useId, useRef, useState,
} from "react";
import { toast } from "sonner";
import { CheckCircle2, Upload, X } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { CLIENT_BUILD_ID } from "../../lib/buildInfo";
import { setPreviewFromFile, revokePreviewUrl } from "../../lib/studioUpload/mediaPreview";
import {
  compressImage,
  looksLikeImageFile,
  looksLikeVideoFile,
  IMAGE_ACCEPT,
  VIDEO_ACCEPT,
} from "../../lib/imageCompress";
import {
  looksLikeImageUpload,
  looksLikeVideoUpload,
  validateVideoUpload,
} from "../../lib/videoMedia";
import { MAX_IMAGE_DIRECT_BYTES, MAX_IMAGE_PICKER_BYTES } from "../../lib/uploadConstants";

const LAYOUT = {
  portrait: "aspect-[4/5] min-h-[200px]",
  square: "aspect-square min-h-[200px]",
  wide: "aspect-[16/10] min-h-[200px]",
  full: "aspect-[2/1] min-h-[200px]",
  video: "aspect-video min-h-[180px]",
  carousel: "aspect-[2/1] min-h-[200px]",
};

/**
 * Upload do estúdio v4 — visual distinto, preview imediato, pronto para Gerar sem “guardar”.
 */
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
  const previewStore = useRef({ current: null, key: "" });
  const [drag, setDrag] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const syncPreview = useCallback((file) => {
    const url = setPreviewFromFile(file || null, previewStore.current);
    setPreviewUrl(url);
  }, []);

  useEffect(() => () => {
    revokePreviewUrl(previewStore.current);
    previewStore.current = null;
  }, []);

  useEffect(() => {
    syncPreview(value || null);
  }, [value, syncPreview]);

  const ingest = useCallback(async (file) => {
    if (!file) return;
    if (isVideo) {
      const check = validateVideoUpload(file, t);
      if (!check.ok) {
        toast.error(check.message);
        return;
      }
      onChange(file);
      return;
    }

    // --- Image flow: validate type first, then AUTO-COMPRESS before size check ---
    if (looksLikeVideoUpload(file)) {
      toast.error(t("vid_err_use_video_zone"));
      return;
    }
    if (!looksLikeImageFile(file) && !looksLikeImageUpload(file)) {
      toast.error(t("img_err_invalid_type"));
      return;
    }

    // Phone cameras often deliver 8–20 MB photos. Auto-shrink so the user
    // never sees a "imagem muito grande" toast just for taking a high-res
    // picture. compressImage shows its own loading/success toast.
    let workFile = file;
    if (file.size > MAX_IMAGE_DIRECT_BYTES) {
      try {
        workFile = await compressImage(file, {
          maxBytes: MAX_IMAGE_DIRECT_BYTES,
          maxBytesIOS: MAX_IMAGE_DIRECT_BYTES,
        });
      } catch {
        // compression failure → fall through with original; size check below decides.
      }
    }

    if (workFile.size > MAX_IMAGE_PICKER_BYTES) {
      toast.error(t("img_err_too_large"));
      return;
    }

    onChange(workFile);
  }, [isVideo, onChange, t]);

  const clear = useCallback(() => {
    syncPreview(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [onChange, syncPreview]);

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
    if (f && (isVideo ? looksLikeVideoFile(f) : looksLikeImageFile(f))) {
      e.preventDefault();
      ingest(f);
    }
  };

  const aspectClass = LAYOUT[layout] || LAYOUT.portrait;
  const hasFile = Boolean(value && previewUrl);

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
          "relative block w-full cursor-pointer overflow-hidden rounded-2xl border-2 transition-all duration-200",
          aspectClass,
          hasFile
            ? "border-emerald-500/90 bg-[#0a120e] shadow-[0_0_0_1px_rgba(16,185,129,0.35),0_12px_40px_rgba(0,0,0,0.45)]"
            : drag
              ? "border-[#a855f7] bg-[#16101f] border-solid"
              : "border-dashed border-[#6b5b80]/80 bg-[#0c0c12] hover:border-[#9333EA]/70",
          "min-h-[12rem]",
        ].join(" ")}
      >
        {overlay && hasFile ? (
          <div className="pointer-events-none absolute inset-0 z-0">{overlay}</div>
        ) : null}

        {hasFile ? (
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
