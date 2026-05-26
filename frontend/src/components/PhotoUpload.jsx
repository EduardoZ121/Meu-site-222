import StudioMediaPicker from "./studio/StudioMediaPicker";
import { IMAGE_ACCEPT } from "../lib/imageCompress";

/** Upload de foto no estúdio — preview imediato, envio preparado ao carregar em Gerar. */
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
    <StudioMediaPicker
      value={value}
      onChange={onChange}
      accept={accept}
      testId={testId}
      layout={layout}
      className={className}
      emptyLabel={emptyLabel}
      emptyHint={emptyHint}
      mediaType="image"
    />
  );
}
