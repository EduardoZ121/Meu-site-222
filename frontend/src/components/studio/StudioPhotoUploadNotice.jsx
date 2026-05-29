import { Loader2 } from "lucide-react";
import { useI18n } from "../../lib/i18n";

/** Estados de `ImageUploadZone` via `onStatusChange`. */
export function isPhotoUploadBusy(status) {
  return status === "saving";
}

/**
 * Aviso quando a foto ainda está a comprimir / enviar para a nuvem.
 * Evita cliques em Gerar sem feedback.
 */
export default function StudioPhotoUploadNotice({ status, className = "" }) {
  const { t } = useI18n();
  if (!isPhotoUploadBusy(status)) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "flex items-start gap-3 rounded-xl border border-amber-500/40",
        "bg-gradient-to-r from-amber-500/12 via-amber-600/8 to-transparent",
        "px-4 py-3 shadow-[0_0_24px_-12px_rgba(251,191,36,0.35)]",
        className,
      ].join(" ")}
      data-testid="studio-upload-loading-notice"
    >
      <Loader2 className="w-4 h-4 shrink-0 animate-spin text-amber-300 mt-0.5" aria-hidden />
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-amber-50 font-['Inter_Tight']">
          {t("upload_image_loading_title")}
        </p>
        <p className="text-[11px] text-amber-200/85 mt-0.5 leading-snug">
          {t("upload_wait_generate")}
        </p>
      </div>
    </div>
  );
}
