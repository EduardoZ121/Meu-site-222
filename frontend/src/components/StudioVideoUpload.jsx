import { AlertCircle, X } from "lucide-react";
import { useI18n } from "../lib/i18n";
import VideoUploader, { VIDEO_DIRECT_MAX_BYTES } from "./video/VideoUploader";

export { VIDEO_DIRECT_MAX_BYTES };

function formatBytes(n) {
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Upload de vídeo (video-to-video): escolher ficheiro → pré-visualizar localmente.
 * Envio para nuvem (Blob ou S3) só ao carregar em Gerar.
 */
export default function StudioVideoUpload({
  value,
  onChange,
  testId = "studio-video-upload",
  disabled = false,
}) {
  const { t } = useI18n();

  const clearBtn = value ? (
    <button
      type="button"
      onClick={() => onChange(null)}
      disabled={disabled}
      className="studio-video-upload__clear"
      aria-label={t("vid_upload_remove")}
      data-testid={`${testId}-clear`}
    >
      <X className="w-4 h-4" />
    </button>
  ) : null;

  const needsCloud = value && value.size > VIDEO_DIRECT_MAX_BYTES;

  const footer = value ? (
    <div className="studio-video-upload__meta">
      <p className="studio-video-upload__filename">{value.name}</p>
      <p className="studio-video-upload__stats">
        {formatBytes(value.size)}
      </p>
      {needsCloud ? (
        <p className="studio-video-upload__cloud-note flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#A78BFA]" />
          <span>{t("vid_edit_large_hint")}</span>
        </p>
      ) : (
        <p className="studio-video-upload__ready">{t("vid_upload_ready")}</p>
      )}
    </div>
  ) : null;

  return (
    <VideoUploader
      value={value}
      onChange={onChange}
      testId={testId}
      disabled={disabled}
      previewExtra={clearBtn}
      footer={footer}
    />
  );
}
