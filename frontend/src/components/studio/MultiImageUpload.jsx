import {
  useCallback, useEffect, useId, useMemo, useRef, useState,
} from "react";
import { CheckCircle2, ImagePlus, Star, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "../../lib/i18n";
import { CLIENT_BUILD_ID } from "../../lib/buildInfo";
import { IMAGE_ACCEPT, looksLikeImageFile } from "../../lib/imageCompress";
import { revokeFilePreviewUrl } from "../../lib/previewDataUrl";
import { materializeUploadFile } from "../../lib/durableUploadFile";

const LAYOUT = {
  portrait: "aspect-[4/5] min-h-[200px]",
  square: "aspect-square min-h-[200px]",
  wide: "aspect-[16/10] min-h-[200px]",
  full: "aspect-[2/1] min-h-[200px]",
};

const COMPACT = {
  portrait: "aspect-[4/5] min-h-[7.5rem] max-h-[9.5rem]",
  square: "aspect-square min-h-[7.5rem] max-h-[9.5rem]",
  wide: "aspect-[2/1] min-h-[6.5rem] max-h-[8.5rem]",
  full: "aspect-[2/1] min-h-[6.5rem] max-h-[8.5rem]",
};

const DEFAULT_MAX = 5;

/**
 * Uma caixa de upload — clica para escolher várias imagens de uma vez (estilo Grok).
 * Índice 0 = imagem principal; restantes = referências.
 */
export default function MultiImageUpload({
  value = [],
  onChange,
  maxFiles = DEFAULT_MAX,
  accept = IMAGE_ACCEPT,
  testId = "multi-image-upload",
  layout = "portrait",
  size = "default",
  className = "",
  disabled = false,
  emptyLabel,
  emptyHint,
  onStatusChange,
}) {
  const { t } = useI18n();
  const files = useMemo(
    () => (Array.isArray(value) ? value.filter(Boolean) : []),
    [value],
  );
  const fileFingerprint = useMemo(
    () => files.map((f) => `${f.name}:${f.size}:${f.lastModified}`).join("|"),
    [files],
  );
  const inputId = useId();
  const inputRef = useRef(null);
  const runIdRef = useRef(0);
  const [drag, setDrag] = useState(false);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [busy, setBusy] = useState(false);

  const resolvedLabel = emptyLabel ?? t("upload_empty_label");
  const resolvedHint = emptyHint ?? t("upload_multi_hint", { n: maxFiles });

  const notifyStatus = useCallback((s) => {
    onStatusChange?.(s);
  }, [onStatusChange]);

  useEffect(() => {
    if (!files.length) {
      setPreviewUrls([]);
      return undefined;
    }
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
    return () => {
      urls.forEach(revokeFilePreviewUrl);
    };
  }, [fileFingerprint, files]);

  const setFiles = useCallback((next) => {
    if (typeof next === "function") {
      onChange((prev) => {
        const current = Array.isArray(prev) ? prev.filter(Boolean) : [];
        return next(current).slice(0, maxFiles);
      });
      return;
    }
    onChange(next.slice(0, maxFiles));
  }, [maxFiles, onChange]);

  const ingestList = useCallback(async (incoming) => {
    const list = Array.from(incoming || []).filter((f) => f && looksLikeImageFile(f));
    if (!list.length) return;

    const slotsLeft = maxFiles - files.length;
    if (slotsLeft <= 0) {
      toast.message(t("upload_multi_max", { n: maxFiles }));
      return;
    }

    const batch = list.slice(0, slotsLeft);
    if (list.length > slotsLeft) {
      toast.message(t("upload_multi_max", { n: maxFiles }));
    }

    runIdRef.current += 1;
    const rid = runIdRef.current;
    setBusy(true);
    notifyStatus("saving");

    try {
      const prepared = await Promise.all(batch.map((f) => materializeUploadFile(f)));
      if (rid !== runIdRef.current) return;
      setFiles((prev) => [...prev, ...prepared]);
      notifyStatus("saved");
      if (prepared.length > 0) {
        toast.success(t("upload_multi_added", { n: prepared.length }), { duration: 4000 });
      }
    } catch (err) {
      if (rid !== runIdRef.current) return;
      notifyStatus("error");
      toast.error(err?.message || t("img_err_read_failed"), { duration: 6000 });
    } finally {
      if (rid === runIdRef.current) setBusy(false);
    }
  }, [maxFiles, notifyStatus, setFiles, t]);

  const removeAt = (idx) => {
    const next = [...files];
    next.splice(idx, 1);
    setFiles(next);
    if (!next.length) notifyStatus("idle");
  };

  const clearAll = () => {
    runIdRef.current += 1;
    setFiles([]);
    notifyStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
  };

  const onPick = (e) => {
    void ingestList(e.target.files);
    e.target.value = "";
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    if (disabled || busy) return;
    void ingestList(e.dataTransfer?.files);
  };

  const onPaste = (e) => {
    const pasted = Array.from(e.clipboardData?.files || []).filter(looksLikeImageFile);
    if (!pasted.length) return;
    e.preventDefault();
    void ingestList(pasted);
  };

  const aspectClass = (size === "compact" ? COMPACT : LAYOUT)[layout] || LAYOUT.portrait;
  const isCompact = size === "compact";
  const hasFiles = files.length > 0;
  const canAddMore = files.length < maxFiles;
  const mainPreview = previewUrls[0];

  return (
    <div
      className={className}
      onPaste={onPaste}
      role="presentation"
      data-rp-upload-build={CLIENT_BUILD_ID}
      data-testid={`${testId}-wrap`}
    >
      {hasFiles && (
        <div
          className="mb-3 flex flex-wrap gap-2"
          data-testid={`${testId}-thumbs`}
        >
          {files.map((file, idx) => (
            <div
              key={`${file?.lastModified}-${file?.size}-${idx}`}
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-white/[0.12] bg-[#141418] group sm:h-16 sm:w-16"
              data-testid={`${testId}-thumb-${idx}`}
            >
              {previewUrls[idx] ? (
                <img src={previewUrls[idx]} alt="" className="h-full w-full object-cover" />
              ) : null}
              <span className={`absolute bottom-0 left-0 right-0 px-1 py-0.5 text-center text-[9px] font-mono uppercase tracking-wide ${
                idx === 0 ? "bg-[#7C3AED] text-white" : "bg-black/80 text-[#C4B5FD]"
              }`}
              >
                {idx === 0 ? t("upload_multi_main") : t("upload_multi_ref")}
              </span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/80 text-white"
                  aria-label={t("remove")}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple
        className="sr-only"
        disabled={disabled || busy || !canAddMore}
        onChange={onPick}
        data-testid={`${testId}-input`}
      />

      <label
        htmlFor={inputId}
        tabIndex={disabled || !canAddMore ? -1 : 0}
        onKeyDown={(e) => {
          if (disabled || !canAddMore) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => { e.preventDefault(); if (!disabled && canAddMore) setDrag(true); }}
        onDragOver={(e) => { e.preventDefault(); if (!disabled && canAddMore) setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        data-testid={testId}
        data-upload-state={hasFiles ? "ready" : busy ? "saving" : "idle"}
        className={[
          "relative block w-full cursor-pointer overflow-hidden rounded-2xl border-2 transition-all duration-200",
          aspectClass,
          hasFiles
            ? "border-solid border-emerald-500 shadow-[0_0_28px_rgba(16,185,129,0.3)] bg-black"
            : busy
              ? "border-dashed border-amber-500/70 bg-[#0c0c12]"
              : drag
                ? "border-dashed border-[#9333EA] bg-[radial-gradient(ellipse_at_center,rgba(147,51,234,0.35),rgba(12,12,18,0.95))]"
                : "border-dashed border-[#9333EA]/55 bg-[#0c0c12]",
          "min-h-[12rem]",
          isCompact ? "!min-h-0" : "",
          disabled ? "pointer-events-none opacity-60" : "",
          !canAddMore && !hasFiles ? "opacity-60" : "",
        ].join(" ")}
      >
        {hasFiles && mainPreview ? (
          <>
            <img
              src={mainPreview}
              alt=""
              className="relative z-[1] h-full w-full object-contain bg-black p-3 pb-14"
              data-testid={`${testId}-preview-main`}
            />
            <span className="absolute top-3 left-3 z-20 inline-flex items-center gap-1 rounded-md bg-[#7C3AED]/90 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide text-white">
              <Star className="h-3 w-3" />
              {t("upload_multi_main")}
            </span>
            <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-2 border-t border-emerald-500/30 bg-emerald-950/90 px-3 py-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
              <span className="text-sm font-medium text-emerald-100">
                {t("upload_multi_ready", { n: files.length, max: maxFiles })}
              </span>
            </div>
            {canAddMore && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                className="absolute bottom-14 left-1/2 z-20 -translate-x-1/2 rounded-lg border border-[#9333EA]/50 bg-black/75 px-3 py-1.5 text-[11px] font-medium text-[#C4B5FD] backdrop-blur-sm hover:bg-[#9333EA]/20"
                data-testid={`${testId}-add-more`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <ImagePlus className="h-3.5 w-3.5" />
                  {t("upload_multi_add")}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); clearAll(); }}
              className="absolute right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/80 text-white"
              data-testid={`${testId}-clear-all`}
              aria-label={t("remove")}
            >
              <X className="h-5 w-5" />
            </button>
          </>
        ) : (
          <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 py-4 text-center ${isCompact ? "gap-1.5" : "gap-3"}`}>
            <div className={`flex items-center justify-center rounded-xl border border-[#9333EA]/40 bg-[#9333EA]/15 ${isCompact ? "h-10 w-10" : "h-14 w-14 rounded-2xl"}`}>
              <Upload className={`text-[#c4b5fd] ${isCompact ? "h-5 w-5" : "h-8 w-8"}`} strokeWidth={1.5} />
            </div>
            <p className={`font-medium text-[#f4f1ea] ${isCompact ? "text-sm" : "text-lg"}`}>{resolvedLabel}</p>
            {!isCompact && (
              <p className="max-w-sm text-sm text-[#8a8a8e] leading-relaxed">{resolvedHint}</p>
            )}
            {busy && (
              <p className="text-xs text-amber-300/90">{t("upload_preparing")}</p>
            )}
          </div>
        )}
      </label>

      {files.length >= 2 && (
        <p className="mt-2 text-[11px] text-[#C4B5FD]/90 leading-relaxed">{t("upload_multi_combine_hint")}</p>
      )}
    </div>
  );
}
