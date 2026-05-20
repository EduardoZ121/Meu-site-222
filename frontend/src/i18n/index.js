import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import {
  LANGUAGE_STORAGE_KEY,
  LANG_ORDER,
} from "./languages";
import en from "./en.json";
import pt from "./pt.json";
import es from "./es.json";
import fr from "./fr.json";

function getInitialLanguage() {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && LANG_ORDER.includes(saved)) return saved;
    const legacy = localStorage.getItem("rp_lang");
    if (legacy && LANG_ORDER.includes(legacy)) return legacy;
  } catch {
    /* ignore */
  }
  return "en";
}

function persistLanguage(code) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    document.documentElement.lang = code;
  } catch {
    /* ignore */
  }
}

const lng = getInitialLanguage();
persistLanguage(lng);

i18n.use(initReactI18next).init({
  resources: { en, pt, es, fr },
  lng,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  returnEmptyString: false,
  react: { useSuspense: false },
});

i18n.on("languageChanged", (code) => {
  persistLanguage((code || "en").slice(0, 2));
});

export { LANGUAGE_STORAGE_KEY };
export default i18n;
