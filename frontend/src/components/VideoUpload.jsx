import ImageUploadZone from "./ImageUploadZone";
import { useI18n } from "../lib/i18n";

/** Upload de vídeo — mesma caixa visual que PhotoUpload / Pro (layout wide). */
export default function VideoUpload({
  value,
  onChange,
  testId = "video-upload",
  onStatusChange,
  emptyHint,
}) {
  const { t } = useI18n();
  return (
    <ImageUploadZone
      mediaType="video"
      value={value}
      onChange={onChange}
      testId={testId}
      layout="wide"
      onStatusChange={onStatusChange}
      emptyLabel={t("upload_drop")}
      emptyHint={emptyHint ?? t("vid_edit_video_hint")}
    />
  );
}
