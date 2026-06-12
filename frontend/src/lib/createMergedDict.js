/** Builds flat translation maps for all languages (legacy merge pipeline). */

import { mergeLocaleStrings } from "./localeStrings.js";
import { I18N_BASE_DICT } from "./i18nBaseDict.js";
import { LANDING_I18N } from "./landingI18n.js";

export function createMergedDict() {
  const dict = {
    pt: { ...I18N_BASE_DICT.pt, ...LANDING_I18N.pt },
    en: { ...I18N_BASE_DICT.en, ...LANDING_I18N.en },
    es: { ...I18N_BASE_DICT.es, ...LANDING_I18N.en },
    fr: { ...I18N_BASE_DICT.fr, ...LANDING_I18N.en },
  };
  mergeLocaleStrings(dict);
  return dict;
}
