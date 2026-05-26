/**
 * @deprecated Implementação legada — use StudioMediaPicker (mesma API).
 */
import StudioMediaPicker from "./studio/StudioMediaPicker";

export default function ImageUploadZone(props) {
  return <StudioMediaPicker {...props} />;
}
