import ImageUploadZone from "./ImageUploadZone";
import { IMAGE_ACCEPT } from "../lib/imageCompress";

/** Upload de foto no estúdio — caixa com brilho (visual original). */
export default function PhotoUpload({
  value,
  onChange,
  accept = IMAGE_ACCEPT,
  testId = "photo-upload",
  layout = "portrait",
  className = "",
  emptyLabel,
  emptyHint,
}) {
  return (
    <ImageUploadZone
      value={value}
      onChange={onChange}
      accept={accept}
      testId={testId}
      layout={layout}
      className={className}
      emptyLabel={emptyLabel}
      emptyHint={emptyHint}
    />
  );
}
