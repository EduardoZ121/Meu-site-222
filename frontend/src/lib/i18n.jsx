/**
 * Compatibility layer — app uses react-i18next (see src/i18n/index.js).
 * Existing components keep importing useI18n() from here.
 */
import { useTranslation } from "react-i18next";
import { LANG_LABELS, LANG_ORDER } from "./localeStrings.js";
import { setLanguageAndReload } from "./remakepixLanguage.js";
import { humanFallbackLabel } from "./i18nHumanFallback.js";

function format(str, vars) {
  if (!vars || typeof str !== "string") return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
}

export function useI18n() {
  const { t: i18nT, i18n } = useTranslation();

  const lang = (i18n.language || "en").split("-")[0];

  const t = (key, vars) => {
    const raw = i18nT(key, { ...vars, defaultValue: "" });
    if (raw && raw !== key) return format(raw, vars);
    // Try flat key in English fallback
    const enFallback = i18n.getResource("en", "translation", key);
    if (enFallback && typeof enFallback === "string") return format(enFallback, vars);
    // Try nested paths for known prefixes
    const prefixMap = {
      vid_: "video.",
      car_: "carousel.",
      art_: "studio.art_",
      gen_: "studio.gen_",
      pro_: "studio.pro_",
      post_: "posters.",
      set_: "settings.",
      gal_: "gallery.",
      wiz_: "wizard.wiz_",
      common_: "common.",
      upload_: "studio.upload_",
      tools_page_: "tools_grid.",
      tools_grid: "tools_grid.",
      tool_: "tools_grid.",
      manga_: "studio.manga_",
    };
    for (const [prefix, nested] of Object.entries(prefixMap)) {
      if (key.startsWith(prefix)) {
        const nestedKey = nested + key.slice(prefix.length);
        const nestedVal = i18n.getResource(lang, "translation", nestedKey)
          || i18n.getResource("en", "translation", nestedKey);
        if (nestedVal && typeof nestedVal === "string") return format(nestedVal, vars);
      }
    }
    return format(humanFallbackLabel(key, lang), vars);
  };

  return {
    lang,
    t,
    switchLang: (l) => {
      if (!LANG_ORDER.includes(l)) return;
      setLanguageAndReload(l);
    },
    langs: LANG_ORDER,
    langLabels: LANG_LABELS,
  };
}

/** No-op — i18n is initialized in src/index.js */
export function I18nProvider({ children }) {
  return children;
}
