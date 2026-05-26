import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getInitialLanguage, setSavedLanguage, LANGUAGE_STORAGE_KEY } from "../lib/remakepixLanguage.js";
import { createMergedDict } from "../lib/createMergedDict.js";
import en from "./en.json";
import pt from "./pt.json";
import es from "./es.json";
import fr from "./fr.json";

/** Inglês por defeito; só muda se o utilizador escolheu antes (remakepix_language). */
const savedLang = getInitialLanguage();

const studioLocalesByLang = createMergedDict();

/** Garante chaves do estúdio (vid_*, etc.) mesmo se o JSON estiver desatualizado. */
function withStudioLocales(bundle, lang) {
  const flat = studioLocalesByLang[lang] || studioLocalesByLang.en;
  return {
    translation: {
      ...(bundle.translation || bundle),
      ...flat,
    },
  };
}

i18n.use(initReactI18next).init({
  resources: {
    en: withStudioLocales(en, "en"),
    pt: withStudioLocales(pt, "pt"),
    es: withStudioLocales(es, "es"),
    fr: withStudioLocales(fr, "fr"),
  },
  lng: savedLang,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});

try {
  document.documentElement.lang = savedLang;
} catch {
  /* SSR / tests */
}

i18n.on("languageChanged", (lng) => {
  const code = (lng || "en").slice(0, 2);
  setSavedLanguage(code);
  try {
    document.documentElement.lang = code;
  } catch {
    /* ignore */
  }
});

export { LANGUAGE_STORAGE_KEY };
export default i18n;
