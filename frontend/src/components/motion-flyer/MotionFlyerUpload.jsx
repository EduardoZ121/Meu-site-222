import { useI18n } from "../../lib/i18n";
import MultiImageUpload from "../studio/MultiImageUpload";

/** Motion flyer — upload único do flyer estático. */
export default function MotionFlyerUpload({ file, onChange, disabled = false }) {
  const { t } = useI18n();
  const files = file ? [file] : [];

  return (
    <MultiImageUpload
      value={files}
      onChange={(next) => onChange(next[0] || null)}
      maxFiles={1}
      disabled={disabled}
      testId="mfly-upload"
      layout="wide"
      size="compact"
      emptyLabel={t("mfly_add_image")}
      emptyHint={t("mfly_upload_hint")}
    />
  );
}
