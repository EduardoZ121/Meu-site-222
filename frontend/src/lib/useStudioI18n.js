import { formatApiError } from "./api";
import { useI18n } from "./i18n";

/** Shared helpers for dashboard tool pages. */
export function useStudioI18n() {
  const { t, lang } = useI18n();
  return {
    t,
    lang,
    errMsg: (err) => formatApiError(err, t("common_fail")),
    needCredits: (need, have) => t("common_need_credits", { need, have }),
    generated: (n) => t("common_generated", { n }),
  };
}
