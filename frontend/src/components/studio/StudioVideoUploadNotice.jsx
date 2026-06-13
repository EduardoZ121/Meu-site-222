import { Loader2 } from "lucide-react";
import { useI18n } from "../../lib/i18n";

/** Mostra aviso de upload de vídeo (não usar StudioPhotoUploadNotice em páginas de vídeo). */
export default function StudioVideoUploadNotice({ status, progress, className = "" }) {
  const { t } = useI18n();
  if (status !== "saving") return null;

  const pct = Number(progress);
  const detail = Number.isFinite(pct) && pct >= 0
    ? t("vid_cloud_upload_progress", { n: pct })
    : t("vid_cloud_upload_start");

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
      data-testid="studio-video-upload-notice"
    >
      <Loader2 className="w-4 h-4 shrink-0 animate-spin text-amber-300 mt-0.5" aria-hidden />
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-amber-50 font-['Inter_Tight']">
          {t("vid_upload_busy_title")}
        </p>
        <p className="text-[11px] text-amber-200/85 mt-0.5 leading-snug">{detail}</p>
      </div>
    </div>
  );
}
