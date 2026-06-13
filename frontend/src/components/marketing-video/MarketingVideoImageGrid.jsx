import { useCallback, useRef, useState } from "react";
import { ImagePlus, Star, X } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { IMAGE_ACCEPT } from "../../lib/imageCompress";

const MAX = 6;

/**
 * Multi-image upload (1–6). Index 0 = main product image.
 */
export default function MarketingVideoImageGrid({ files, onChange, disabled = false }) {
  const { t } = useI18n();
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const setFiles = useCallback((next) => {
    onChange(next.slice(0, MAX));
  }, [onChange]);

  const addFiles = useCallback((incoming) => {
    const list = Array.from(incoming || []).filter((f) => f && f.type?.startsWith("image/"));
    if (!list.length) return;
    setFiles([...(files || []), ...list].slice(0, MAX));
  }, [files, setFiles]);

  const removeAt = (idx) => {
    const next = [...(files || [])];
    next.splice(idx, 1);
    setFiles(next);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    if (disabled) return;
    addFiles(e.dataTransfer?.files);
  };

  const slots = Array.from({ length: MAX }, (_, i) => files?.[i] || null);

  return (
    <div className="space-y-3" data-testid="mktvid-upload-grid">
      <div
        className={`grid grid-cols-2 sm:grid-cols-3 gap-3 ${drag ? "ring-2 ring-[#7C3AED]/50 rounded-xl" : ""}`}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
      >
        {slots.map((file, idx) => (
          <div
            key={idx}
            className="relative aspect-[4/5] rounded-xl border border-white/[0.08] bg-[#141418] overflow-hidden group"
            data-testid={`mktvid-slot-${idx}`}
          >
            {file ? (
              <>
                <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wide ${
                  idx === 0
                    ? "bg-[#7C3AED]/90 text-white"
                    : "bg-black/60 text-[#C4B5FD]"
                }`}
                >
                  {idx === 0 ? (
                    <span className="inline-flex items-center gap-1"><Star className="w-3 h-3" />{t("mktvid_main_badge")}</span>
                  ) : t("mktvid_ref_badge")}
                </span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeAt(idx)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                disabled={disabled || (files?.length || 0) >= MAX}
                onClick={() => inputRef.current?.click()}
                className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#8A8A8E] hover:text-[#C4B5FD] hover:bg-white/[0.03] transition-colors disabled:opacity-40"
              >
                <ImagePlus className="w-6 h-6" strokeWidth={1.5} />
                <span className="text-[11px]">{t("mktvid_add_image")}</span>
              </button>
            )}
          </div>
        ))}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <p className="text-[12px] text-[#8A8A8E] leading-relaxed">{t("mktvid_upload_hint")}</p>
    </div>
  );
}
