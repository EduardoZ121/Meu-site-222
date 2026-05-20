import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getInitialLanguage, setSavedLanguage, LANGUAGE_STORAGE_KEY } from "../lib/remakepixLanguage";
import en from "./en.json";
import pt from "./pt.json";
import es from "./es.json";
import fr from "./fr.json";

const savedLang = getInitialLanguage();

i18n.use(initReactI18next).init({
  resources: { en, pt, es, fr },
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
