import { useCallback, useEffect, useId, useRef, useState } from "react";
import { CheckCircle2, Upload, X } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { CLIENT_BUILD_ID } from "../../lib/buildInfo";
import { IMAGE_ACCEPT } from "../../lib/imageCompress";
import { revokeFilePreviewUrl } from "../../lib/previewDataUrl";
import { materializeUploadFile } from "../../lib/durableUploadFile";
import { toast } from "sonner";

const LAYOUT = {
  portrait: "aspect-[4/5] min-h-[200px]",
  square: "aspect-square min-h-[200px]",
  wide: "aspect-[16/10] min-h-[200px]",
  full: "aspect-[2/1] min-h-[200px]",
};

/**
 * Escolha de foto instantânea — zero rede ao pick.
 * O envio faz-se em Gerar (POST multipart); o servidor converte HEIC/JPEG.
 */
export default function InstantPhotoUpload({
  value,
  onChange,
  accept = IMAGE_ACCEPT,
  testId = "instant-photo-upload",
  layout = "portrait",
  className = "",
  capture = undefined,
  emptyLabel,
  emptyHint,
}) {
  const { t } = useI18n();
  const resolvedLabel = emptyLabel ?? t("upload_empty_label");
  const resolvedHint = emptyHint ?? t("upload_empty_hint");
  const inputId = useId();
  const inputRef = useRef(null);
  const previewRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const releasePreview = useCallback(() => {
    revokeFilePreviewUrl(previewRef.current);
    previewRef.current = null;
    setPreviewUrl(null);
  }, []);

  useEffect(() => {
    if (!value) {
      releasePreview();
      return undefined;
    }
    const prev = previewRef.current;
    const url = URL.createObjectURL(value);
    previewRef.current = url;
    setPreviewUrl(url);
    if (prev) revokeFilePreviewUrl(prev);
    return undefined;
  }, [value, releasePreview]);

  // Final cleanup on unmount
  useEffect(() => {
    return () => {
      revokeFilePreviewUrl(previewRef.current);
      previewRef.current = null;
    };
  }, []);

  const pick = useCallback(async (file) => {
    if (!file) return;
    try {
      const durable = await materializeUploadFile(file);
      onChange(durable);
    } catch (err) {
      toast.error(err?.message || t("img_err_read_failed"), { duration: 6000 });
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [onChange, t]);

  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (f) void pick(f);
  };

  const clear = useCallback(() => {
    releasePreview();
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [onChange, releasePreview]);

  const aspectClass = LAYOUT[layout] || LAYOUT.portrait;
  const hasFile = Boolean(value);

  return (
    <div className={className} data-rp-upload-build={CLIENT_BUILD_ID} data-testid={`${testId}-wrap`}>
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
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) void pick(f);
        }}
        data-testid={testId}
        data-upload-state={hasFile ? "ready" : "idle"}
        className={[
          "relative block w-full cursor-pointer overflow-hidden rounded-2xl border-2 transition-all duration-200",
          aspectClass,
          hasFile
            ? "border-solid border-emerald-500 shadow-[0_0_28px_rgba(16,185,129,0.3)] bg-black"
            : drag
              ? "border-dashed border-[#9333EA]"
              : "border-dashed border-[#9333EA]/55 bg-[#0c0c12]",
          "min-h-[12rem]",
        ].join(" ")}
      >
        {hasFile && previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt=""
              className="relative z-[1] h-full w-full object-contain bg-black p-3 pb-14"
              data-testid={`${testId}-preview`}
            />
            <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-2 border-t border-emerald-500/30 bg-emerald-950/90 px-3 py-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
              <span className="text-sm font-medium text-emerald-100">{t("upload_ready")}</span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); clear(); }}
              className="absolute right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/80 text-white"
              data-testid={`${testId}-clear`}
              aria-label={t("remove")}
            >
              <X className="h-5 w-5" />
            </button>
          </>
        ) : hasFile ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 pb-14 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" aria-hidden />
            <p className="text-sm text-emerald-100 break-all">{value?.name}</p>
            <p className="text-xs text-zinc-400">{t("upload_preview_optional")}</p>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#9333EA]/40 bg-[#9333EA]/15">
              <Upload className="h-8 w-8 text-[#c4b5fd]" strokeWidth={1.5} />
            </div>
            <p className="text-lg font-medium text-[#f4f1ea]">{resolvedLabel}</p>
            <p className="max-w-xs text-sm text-[#8a8a8e]">{resolvedHint}</p>
          </div>
        )}
      </label>
    </div>
  );
}
