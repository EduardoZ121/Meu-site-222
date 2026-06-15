import { useI18n } from "../../lib/i18n";
import MultiImageUpload from "../studio/MultiImageUpload";

const MAX = 5;

/** Marketing video — uma caixa, até 5 imagens (1ª principal, resto referências). */
export default function MarketingVideoImageGrid({ files, onChange, disabled = false }) {
  const { t } = useI18n();

  return (
    <MultiImageUpload
      value={files || []}
      onChange={(next) => onChange(next.slice(0, MAX))}
      maxFiles={MAX}
      disabled={disabled}
      testId="mktvid-upload"
      layout="wide"
      size="compact"
      emptyLabel={t("mktvid_add_image")}
      emptyHint={t("mktvid_upload_hint")}
    />
  );
}
