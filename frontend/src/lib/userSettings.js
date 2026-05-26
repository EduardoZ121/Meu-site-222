import { getSavedLanguage } from "./remakepixLanguage";

const STORAGE_KEY = "rp_settings";

const DEFAULTS = {
  aspect_ratio_default: "4:5",
  lang: "en",
};

export function readUserSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const merged = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
    merged.lang = getSavedLanguage();
    return merged;
  } catch {
    return { ...DEFAULTS, lang: getSavedLanguage() };
  }
}

export function writeUserSettings(patch) {
  const next = { ...readUserSettings(), ...patch };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
