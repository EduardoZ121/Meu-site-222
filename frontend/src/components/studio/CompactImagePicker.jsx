import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "../../lib/i18n";
import { IMAGE_ACCEPT, looksLikeImageFile } from "../../lib/imageCompress";
import { revokeFilePreviewUrl } from "../../lib/previewDataUrl";
import { materializeUploadFile } from "../../lib/durableUploadFile";

/**
 * Seletor de imagens compacto (só um ícone + miniaturas).
 * Substitui a caixa grande de upload: a pessoa clica no ícone e escolhe as imagens.
 */
export default function CompactImagePicker({
  value = [],
  onChange,
  maxFiles = 5,
  disabled = false,
  testId = "compact-image-picker",
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

  return (
    <div className="flex items-center gap-2 flex-wrap" data-testid={`${testId}-wrap`}>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
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

      {files.map((file, idx) => (
        <div
          key={`${file?.lastModified}-${file?.size}-${idx}`}
          className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/[0.12] bg-[#141418] group"
          data-testid={`${testId}-thumb-${idx}`}
        >
          {previews[idx] ? <img src={previews[idx]} alt="" className="h-full w-full object-cover" /> : null}
          {idx === 0 && (
            <span className="absolute bottom-0 left-0 right-0 bg-[#7C3AED] text-white text-[7px] font-mono text-center uppercase leading-tight">
              {t("upload_multi_main")}
            </span>
          )}
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
      ))}
    </div>
  );
}
