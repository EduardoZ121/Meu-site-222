import { useCallback, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Upload, X } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { CLIENT_BUILD_ID } from "../../lib/buildInfo";
import { IMAGE_ACCEPT } from "../../lib/imageCompress";
import { looksLikeVideoFile } from "../../lib/imageCompress";
import {
  releaseStabilizedPreview,
  stabilizePickedImageFile,
  stabilizePickedVideoFile,
} from "../../lib/stabilizePickedFile";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const VIDEO_ACCEPT = "video/mp4,video/quicktime,.mp4,.mov";

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
  const pickGenRef = useRef(0);
  const previewMetaRef = useRef({ url: null, isBlob: false });
  const [drag, setDrag] = useState(false);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [readyWithoutPreview, setReadyWithoutPreview] = useState(false);

  const releasePreview = useCallback(() => {
    releaseStabilizedPreview(previewMetaRef.current.url, previewMetaRef.current.isBlob);
    previewMetaRef.current = { url: null, isBlob: false };
    setPreviewSrc(null);
    setReadyWithoutPreview(false);
  }, []);

  useEffect(() => {
    if (!value) releasePreview();
  }, [value, releasePreview]);

  useEffect(() => () => {
    releaseStabilizedPreview(previewMetaRef.current.url, previewMetaRef.current.isBlob);
  }, []);

  const applyPreviewUrl = useCallback((url, isBlob) => {
    releaseStabilizedPreview(previewMetaRef.current.url, previewMetaRef.current.isBlob);
    previewMetaRef.current = { url, isBlob };
    setPreviewSrc(url);
    setReadyWithoutPreview(false);
  }, []);

  const ingestImage = useCallback(async (file, resyncFromInput) => {
    if (looksLikeVideoFile(file)) {
      toast.error(t("vid_err_use_video_zone"));
      return false;
    }
    if (file.size > MAX_IMAGE_BYTES && file.size > 0) {
      toast.error(t("img_err_too_large"));
      return false;
    }

    const gen = pickGenRef.current + 1;
    pickGenRef.current = gen;
    setLoading(true);

    const quickUrl = URL.createObjectURL(file);
    applyPreviewUrl(quickUrl, true);
    onChange(file);

    const finishStable = (stable, dataUrl, previewIsBlob) => {
      if (gen !== pickGenRef.current) {
        releaseStabilizedPreview(dataUrl, previewIsBlob);
        return;
      }
      applyPreviewUrl(dataUrl, previewIsBlob);
      onChange(stable);
      setReadyWithoutPreview(false);
    };

    const tryStabilize = async (candidate) => stabilizePickedImageFile(candidate, { attempts: 6 });

    try {
      const r = await tryStabilize(file);
      finishStable(r.file, r.dataUrl, r.previewIsBlob);
      return true;
    } catch {
      const fresh = resyncFromInput?.();
      if (fresh) {
        try {
          const r = await tryStabilize(fresh);
          finishStable(r.file, r.dataUrl, r.previewIsBlob);
          return true;
        } catch {
          /* keep quick preview + raw file */
        }
      }
      if (gen === pickGenRef.current) {
        setReadyWithoutPreview(true);
        onChange(file);
      }
      return true;
    } finally {
      if (gen === pickGenRef.current) setLoading(false);
    }
  }, [applyPreviewUrl, onChange, t]);

  const ingest = useCallback(async (file, { resyncFromInput } = {}) => {
    if (!file) return false;

    if (isVideo) {
      if (!looksLikeVideo(file)) {
        toast.error(t("vid_err_invalid_type"));
        return false;
      }
      if (file.size > MAX_VIDEO_BYTES) {
        toast.error(t("vid_err_too_large"));
        return false;
      }
      const gen = pickGenRef.current + 1;
      pickGenRef.current = gen;
      setLoading(true);
      try {
        const { file: stable, objectUrl } = await stabilizePickedVideoFile(file);
        if (gen !== pickGenRef.current) {
          releaseStabilizedPreview(objectUrl, true);
          return false;
        }
        applyPreviewUrl(objectUrl, true);
        onChange(stable);
        return true;
      } catch {
        if (gen === pickGenRef.current) toast.error(t("vid_err_invalid_type"));
        return false;
      } finally {
        if (gen === pickGenRef.current) setLoading(false);
      }
    }

    return ingestImage(file, resyncFromInput);
  }, [applyPreviewUrl, ingestImage, isVideo, onChange, t]);

  const clear = useCallback(() => {
    pickGenRef.current += 1;
    releasePreview();
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [onChange, releasePreview]);

  const onPick = (e) => {
    const input = e.target;
    const f = input.files?.[0];
    if (!f) return;
    const resync = () => input.files?.[0] || null;
    void ingest(f, { resyncFromInput: resync }).then((ok) => {
      if (ok) input.value = "";
    });
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void ingest(f);
  };

  const onPaste = (e) => {
    const f = e.clipboardData?.files?.[0];
    if (f) {
      e.preventDefault();
      void ingest(f);
    }
  };

  const aspectClass = LAYOUT[layout] || LAYOUT.portrait;
  const hasFile = Boolean(value);
  const showImage = Boolean(previewSrc && !readyWithoutPreview);
  const showReadyNoPreview = hasFile && readyWithoutPreview && !loading;
  const showShell = hasFile && (showImage || showReadyNoPreview || loading);

  return (
    <div className={className} onPaste={onPaste} role="presentation" data-rp-upload-build={CLIENT_BUILD_ID} data-testid={`${testId}-wrap`}>
      <input ref={inputRef} id={inputId} type="file" accept={resolvedAccept} capture={capture} className="sr-only" onChange={onPick} data-testid={`${testId}-input`} />
      <label
        htmlFor={inputId}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDragEnter={(e) => { e.preventDefault(); setDrag(true); }}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        data-testid={testId}
        data-upload-state={showImage || showReadyNoPreview ? "ready" : loading ? "loading" : "idle"}
        className={[
          "relative block w-full cursor-pointer overflow-hidden rounded-2xl border-2 transition-all duration-200",
          aspectClass,
          showImage || showReadyNoPreview
            ? "border-solid border-emerald-500 shadow-[0_0_28px_rgba(16,185,129,0.3)] bg-black"
            : loading
              ? "border-dashed border-amber-500/70 bg-black"
              : drag
                ? "border-dashed border-[#9333EA] bg-[radial-gradient(ellipse_at_center,rgba(147,51,234,0.35),rgba(12,12,18,0.95))]"
                : "border-dashed border-[#9333EA]/55 bg-gradient-to-br from-[#14141c]/90 via-[#0e0e12] to-[#0a0a0f]",
          "min-h-[12rem]",
        ].join(" ")}
      >
        {overlay && showImage ? (
          <div className="pointer-events-none absolute inset-0 z-0">{overlay}</div>
        ) : null}

        {loading ? (
          <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-2 bg-black/60 p-4" data-testid={`${testId}-preview-loading`}>
            <Loader2 className="h-8 w-8 animate-spin text-[#c4b5fd]" aria-hidden />
            <p className="text-sm text-zinc-200">{t("upload_preparing")}</p>
          </div>
        ) : null}

        {showShell ? (
          <>
            {isVideo ? (
              <video
                src={previewSrc}
                className="relative z-[1] h-full w-full object-contain bg-black p-3 pb-12"
                controls
                playsInline
                muted
                data-testid={`${testId}-preview`}
              />
            ) : showImage ? (
              <img
                src={previewSrc}
                alt=""
                style={previewImgStyle}
                className={["relative z-[1] h-full w-full object-contain bg-black p-3 pb-12", previewImgClassName].filter(Boolean).join(" ")}
                data-testid={`${testId}-preview`}
                onError={() => {
                  if (!loading) setReadyWithoutPreview(true);
                }}
              />
            ) : showReadyNoPreview ? (
              <div
                className="relative z-[1] flex h-full min-h-[12rem] flex-col items-center justify-center gap-2 bg-black p-4 pb-14 text-center"
                data-testid={`${testId}-preview-ready`}
              >
                <CheckCircle2 className="h-10 w-10 text-emerald-400" aria-hidden />
                <p className="text-sm font-medium text-emerald-100 break-all px-2">{value?.name || t("upload_ready")}</p>
                <p className="text-xs text-zinc-400 max-w-[240px]">{t("upload_preview_optional")}</p>
              </div>
            ) : null}
            {(showImage || showReadyNoPreview) && (
              <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-2 border-t border-emerald-500/30 bg-emerald-950/90 px-3 py-2.5 backdrop-blur-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                <span className="text-sm font-medium text-emerald-100">{t("upload_ready")}</span>
              </div>
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
        ) : !loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#9333EA]/40 bg-[#9333EA]/15">
              <Upload className="h-8 w-8 text-[#c4b5fd]" strokeWidth={1.5} />
            </div>
            <p className="text-lg font-medium text-[#f4f1ea]">{drag ? t("upload_drop") : resolvedLabel}</p>
            <p className="max-w-xs text-sm text-[#8a8a8e]">{resolvedHint}</p>
          </div>
        ) : null}
      </label>
    </div>
  );
}
