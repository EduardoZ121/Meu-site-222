import {
  useCallback, useEffect, useId, useRef, useState,
} from "react";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { readFileAsDataURL } from "../lib/previewDataUrl";
import { prepareImageForUpload } from "../lib/prepareImageForUpload";
import { looksLikeImageFile, IMAGE_ACCEPT } from "../lib/imageCompress";
import { MAX_IMAGE_DIRECT_BYTES } from "../lib/uploadConstants";
import { CLIENT_BUILD_ID } from "../lib/buildInfo";
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
 * Caixa de upload do estúdio (visual original com brilho atrás do ícone).
 * Preview imediato → comprimir em background → POST directo ao Gerar (sem Blob/AWS).
 */
export default function ImageUploadZone({
  value,
  onChange,
  accept = IMAGE_ACCEPT,
  testId = "image-upload-zone",
  layout = "portrait",
  className = "",
  overlay = null,
  capture = undefined,
  compressOptions = {},
  enableRemotePersist = false,
  onStatusChange,
  emptyLabel,
  emptyHint,
  previewImgStyle,
  previewImgClassName = "",
}) {
  const { t } = useI18n();
  const resolvedLabel = emptyLabel ?? t("upload_empty_label");
  const resolvedHint = emptyHint ?? t("upload_empty_hint");
  const inputId = useId();
  const inputRef = useRef(null);
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
      setPreviewUrl(null);
      setPreviewFailed(false);
      setPersistState("idle");
      lastPreparedRef.current = null;
      notifyStatus("idle");
      return undefined;
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
  }, [value, notifyStatus]);

  const runBackground = useCallback(async (rawFile, rid) => {
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
      setPersistState("saved");
      notifyStatus("saved");
    } catch (err) {
      if (rid !== runIdRef.current) return;
      setPersistState("error");
      notifyStatus("error");
      toast.error(err?.message || t("upload_invalid_type"), { duration: 6000 });
    }
    if (enableRemotePersist) {
      console.warn("[ImageUploadZone] enableRemotePersist ignorado — Blob desligado.");
    }
  }, [compressOptions, enableRemotePersist, onChange, notifyStatus, t]);

  const ingestFile = useCallback((file) => {
    if (!file || !looksLikeImageFile(file)) {
      toast.error(t("upload_invalid_type"));
      return;
    }
    runIdRef.current += 1;
    const rid = runIdRef.current;
    lastPreparedRef.current = null;
    setPersistState("saving");
    notifyStatus("saving");
    onChange(file);
    void runBackground(file, rid);
  }, [runBackground, onChange, notifyStatus, t]);

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
    const items = e.clipboardData?.files;
    const f = items?.[0];
    if (f && looksLikeImageFile(f)) {
      e.preventDefault();
      void ingestFile(f);
    }
  };

  const aspectClass = LAYOUT[layout] || LAYOUT.portrait;
  const savingLabel = t("upload_preparing");
  const savedLabel = t("upload_ready");

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
        accept={accept}
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
          </>
        ) : value ? (
          <div className="absolute inset-0 flex min-h-12 flex-col items-center justify-center gap-2 px-4 py-6 text-center bg-[#0c0c12]/80">
            <p className="text-zinc-200 text-sm font-medium">
              {previewFailed ? t("upload_loaded") : savingLabel}
            </p>
            {previewFailed && (
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
