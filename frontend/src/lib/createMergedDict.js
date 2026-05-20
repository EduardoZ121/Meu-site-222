/** Builds flat translation maps for all languages (legacy merge pipeline). */

import { mergeLocaleStrings } from "./localeStrings";
import { I18N_BASE_DICT } from "./i18nBaseDict";

export function createMergedDict() {
  const dict = {
    pt: { ...I18N_BASE_DICT.pt },
    en: { ...I18N_BASE_DICT.en },
    es: { ...I18N_BASE_DICT.es },
    fr: { ...I18N_BASE_DICT.fr },
  };
  mergeLocaleStrings(dict);
  return dict;
}
