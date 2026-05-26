/**
 * Fallback legível quando a chave falta no JSON — nunca mostrar o ID cru.
 * Valores espelham sharedStudioLocales (EN + PT).
 */
import { mergeSharedStudioLocales } from "./sharedStudioLocales.js";

function pickStudioStrings(lang) {
  const dict = { en: {}, pt: {}, es: {}, fr: {} };
  mergeSharedStudioLocales(dict);
  return dict[lang] || dict.en;
}

const EN = pickStudioStrings("en");
const PT = pickStudioStrings("pt");

/** @param {string} key */
export function humanFallbackLabel(key, lang = "en") {
  const code = (lang || "en").split("-")[0];
  const table = code === "pt" ? PT : EN;
  const v = table[key];
  if (typeof v === "string" && v.trim()) return v;
  if (code !== "en") {
    const en = EN[key];
    if (typeof en === "string" && en.trim()) return en;
  }
  return humanizeKey(key);
}

/** Converte vid_edit_desc → "Edit desc", car_generating → "Generating" como último recurso */
function humanizeKey(key) {
  if (!key || typeof key !== "string") return "";
  const stripped = key
    .replace(/^(vid|img|upload|tool|studio|common|car|art|gen|pro|post|wiz|sug|set|gal|fav|bill|prof|ref|adm|manga|inpaint)_/i, "")
    .replace(/_/g, " ")
    .trim();
  if (!stripped) return key;
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}
