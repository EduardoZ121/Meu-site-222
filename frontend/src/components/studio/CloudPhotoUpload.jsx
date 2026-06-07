import { useCallback, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Upload, X } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { CLIENT_BUILD_ID } from "../../lib/buildInfo";
import { IMAGE_ACCEPT } from "../../lib/imageCompress";
import { uploadPickedPhotoToCloud } from "../../lib/uploadPickedPhoto";

const LAYOUT = {
  portrait: "aspect-[4/5] min-h-[200px]",
  square: "aspect-square min-h-[200px]",
  wide: "aspect-[16/10] min-h-[200px]",
  full: "aspect-[2/1] min-h-[200px]",
};

/**
 * Gerar / estúdio — envia a foto ao servidor logo ao escolher; preview por HTTPS.
 * O Gerar usa photo_url (não depende de ler bytes no telemóvel).
 */
export default function CloudPhotoUpload({
  value,
  onChange,
  accept = IMAGE_ACCEPT,
  testId = "cloud-photo-upload",
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
  const genRef = useRef(0);
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasPhoto = Boolean(value);

  const uploadFile = useCallback(async (file) => {
    if (!file) return false;
    if (file.size > 12 * 1024 * 1024 && file.size > 0) {
      toast.error(t("img_err_too_large"));
      return false;
    }

    const gen = genRef.current + 1;
    genRef.current = gen;
    setLoading(true);

    try {
      const url = await uploadPickedPhotoToCloud(file, {
        onProgress: (pct) => {
          if (gen === genRef.current && Number.isFinite(pct)) {
            /* loading UI only */
          }
        },
      });
      if (gen !== genRef.current) return false;
      onChange(url);
      return true;
    } catch (err) {
      if (gen === genRef.current) {
        const msg = err?.message || t("img_err_read_failed");
        toast.error(msg);
      }
      return false;
    } finally {
      if (gen === genRef.current) setLoading(false);
    }
  }, [onChange, t]);

  const onPick = (e) => {
    const input = e.target;
    const f = input.files?.[0];
    if (!f) return;
    void uploadFile(f).then((ok) => {
      if (ok) input.value = "";
    });
  };

  const clear = () => {
    genRef.current += 1;
    setLoading(false);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const aspectClass = LAYOUT[layout] || LAYOUT.portrait;

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
          if (f) void uploadFile(f);
        }}
        data-testid={testId}
        data-upload-state={hasPhoto ? "ready" : loading ? "loading" : "idle"}
        className={[
          "relative block w-full cursor-pointer overflow-hidden rounded-2xl border-2 transition-all duration-200",
          aspectClass,
          hasPhoto
            ? "border-solid border-emerald-500 shadow-[0_0_28px_rgba(16,185,129,0.3)] bg-black"
            : loading
              ? "border-dashed border-amber-500/70 bg-black"
              : drag
                ? "border-dashed border-[#9333EA]"
                : "border-dashed border-[#9333EA]/55 bg-[#0c0c12]",
          "min-h-[12rem]",
        ].join(" ")}
      >
        {loading && (
          <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-2 bg-black/85 p-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#c4b5fd]" aria-hidden />
            <p className="text-sm text-zinc-200">{t("upload_cloud_saving")}</p>
          </div>
        )}

        {hasPhoto && !loading ? (
          <>
            <img
              src={value}
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
        ) : !loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#9333EA]/40 bg-[#9333EA]/15">
              <Upload className="h-8 w-8 text-[#c4b5fd]" strokeWidth={1.5} />
            </div>
            <p className="text-lg font-medium text-[#f4f1ea]">{resolvedLabel}</p>
            <p className="max-w-xs text-sm text-[#8a8a8e]">{resolvedHint}</p>
          </div>
        ) : null}
      </label>
    </div>
  );
}
