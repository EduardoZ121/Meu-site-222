import { formatApiError } from "./api";
import { useI18n } from "./i18n";
import { dismissUploadToasts, showUploadError } from "./uploadToast";

/** Shared helpers for dashboard tool pages. */
export function useStudioI18n() {
  const { t, lang } = useI18n();
  const formatErr = (err) => formatApiError(err, t("common_fail"), { context: "image_upload", t });
  return {
    t,
    lang,
    errMsg: formatErr,
    errToast: (err) => showUploadError(formatErr(err)),
    clearUploadToast: dismissUploadToasts,
    needCredits: (need, have) => t("common_need_credits", { need, have }),
    generated: (n) => t("common_generated", { n }),
  };
}
