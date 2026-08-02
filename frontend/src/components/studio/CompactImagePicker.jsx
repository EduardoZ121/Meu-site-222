import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "../../lib/i18n";
import { IMAGE_ACCEPT, looksLikeImageFile } from "../../lib/imageCompress";
import { revokeFilePreviewUrl } from "../../lib/previewDataUrl";
import { materializeUploadFile } from "../../lib/durableUploadFile";

/**
 * Seletor de imagens compacto (só um ícone + miniaturas).
 * Com 2+ imagens: etiquetas Image 1 / Image 2… para o prompt multi-ref (como no group).
 */
export default function CompactImagePicker({
  value = [],
  onChange,
  maxFiles = 5,
  disabled = false,
  testId = "compact-image-picker",
  showMultiHint = false,
}) {
  const { t } = useI18n();
  const files = useMemo(() => (Array.isArray(value) ? value.filter(Boolean) : []), [value]);
  const fingerprint = useMemo(
    () => files.map((f) => `${f.name}:${f.size}:${f.lastModified}`).join("|"),
    [files],
  );
  const inputRef = useRef(null);
  const runIdRef = useRef(0);
  const [previews, setPreviews] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!files.length) {
      setPreviews([]);
      return undefined;
    }
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach(revokeFilePreviewUrl);
  }, [fingerprint, files]);

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

  const ingest = useCallback(async (incoming) => {
    const list = Array.from(incoming || []).filter((f) => f && looksLikeImageFile(f));
    if (!list.length) return;
    const slotsLeft = maxFiles - files.length;
    if (slotsLeft <= 0) {
      toast.message(t("upload_multi_max", { n: maxFiles }));
      return;
    }
    const batch = list.slice(0, slotsLeft);
    runIdRef.current += 1;
    const rid = runIdRef.current;
    setBusy(true);
    try {
      const prepared = await Promise.all(batch.map((f) => materializeUploadFile(f)));
      if (rid !== runIdRef.current) return;
      setFiles((prev) => [...prev, ...prepared]);
      if (prepared.length > 0) {
        toast.success(t("upload_multi_added", { n: prepared.length }), { duration: 3000 });
      }
    } catch (err) {
      if (rid !== runIdRef.current) return;
      toast.error(err?.message || t("img_err_read_failed"), { duration: 6000 });
    } finally {
      if (rid === runIdRef.current) setBusy(false);
    }
  }, [files.length, maxFiles, setFiles, t]);

  const onPick = (e) => {
    void ingest(e.target.files);
    e.target.value = "";
  };

  const removeAt = (idx) => {
    const next = [...files];
    next.splice(idx, 1);
    setFiles(next);
  };

  const canAddMore = files.length < maxFiles;
  const multi = maxFiles > 1;

  return (
    <div className="flex flex-col gap-1.5 min-w-0" data-testid={`${testId}-wrap`}>
      <div className="flex items-center gap-2 flex-wrap">
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          multiple={multi}
          className="sr-only"
          disabled={disabled || busy || !canAddMore}
          onChange={onPick}
          data-testid={`${testId}-input`}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || busy || !canAddMore}
          className="mv-icon-btn"
          aria-label={t("mktvid_add_image") || "Adicionar imagem"}
          title={t("mktvid_add_image") || "Adicionar imagem"}
          data-testid={`${testId}-btn`}
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" strokeWidth={1.75} />}
        </button>

        {files.map((file, idx) => {
          const label = multi
            ? String(idx + 1)
            : t("upload_multi_main");
          const aria = multi
            ? t("upload_multi_image_n", { n: idx + 1 })
            : t("upload_multi_main");
          return (
            <div
              key={`${file?.lastModified}-${file?.size}-${idx}`}
              className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/[0.12] bg-[#141418] group"
              data-testid={`${testId}-thumb-${idx}`}
              title={aria}
            >
              {previews[idx] ? <img src={previews[idx]} alt={aria} className="h-full w-full object-cover" /> : null}
              <span
                className={`absolute bottom-0 left-0 right-0 text-white text-[7px] font-mono text-center uppercase leading-tight ${
                  idx === 0 ? "bg-[#7C3AED]" : "bg-black/75"
                }`}
              >
                {label}
              </span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/85 text-white border border-white/20"
                  aria-label={t("remove")}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
      {showMultiHint && files.length >= 2 ? (
        <p className="text-[10px] text-[#C4B5FD]/90 leading-relaxed max-w-[min(100%,28rem)]" data-testid={`${testId}-multi-hint`}>
          {t("upload_multi_combine_hint")}
        </p>
      ) : null}
    </div>
  );
}
