import ImageUploadZone, { VIDEO_DIRECT_MAX_BYTES } from "./ImageUploadZone";
import { useI18n } from "../lib/i18n";

export { VIDEO_DIRECT_MAX_BYTES };

/**
 * Vídeo-to-vídeo — mesma caixa com brilho que as fotos (ImageUploadZone).
 */
export default function StudioVideoUpload({
  value,
  onChange,
  testId = "studio-video-upload",
  disabled = false,
  emptyLabel,
  emptyHint,
  className = "",
  maxDurationSec = 15,
}) {
  const { t } = useI18n();
  return (
    <ImageUploadZone
      value={value}
      onChange={onChange}
      mediaType="video"
      layout="video"
      testId={testId}
      className={className}
      disabled={disabled}
      enableRemotePersist
      emptyLabel={emptyLabel ?? t("vid_upload_title")}
      emptyHint={emptyHint ?? t("vid_edit_video_hint")}
      maxVideoDurationSec={maxDurationSec}
    />
  );
}
