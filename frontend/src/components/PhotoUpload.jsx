import ImageUploadZone from "./ImageUploadZone";
import { IMAGE_ACCEPT } from "../lib/imageCompress";

/**
 * Upload de foto: preview imediato (dataURL), compressão canvas em background, persistência Blob opcional.
 */
export default function PhotoUpload({
  value,
  onChange,
  accept = IMAGE_ACCEPT,
  testId = "photo-upload",
  compressOptions = {},
  compressOnSelect = false,
  onStatusChange,
}) {
  return (
    <ImageUploadZone
      value={value}
      onChange={onChange}
      accept={accept}
      testId={testId}
      layout="portrait"
      compressOptions={compressOptions}
      compressOnSelect={compressOnSelect}
      onStatusChange={onStatusChange}
    />
  );
}
