/** Artistic studio catalog — labels from data (labelEn) + legacy keys. */

import {
  ARTISTIC_STYLE_CATEGORIES,
  ARTISTIC_STUDIO_STYLES,
  ARTISTIC_EFFECT_SECTIONS,
  filterArtisticCategories,
  filterArtisticStyles,
} from "./artisticStudioData";

export const ARTISTIC_LABELS = { en: {}, pt: {} };

export function artLabel(lang, key, fallback = "") {
  const pack = ARTISTIC_LABELS[lang] || ARTISTIC_LABELS.en;
  return pack[key] ?? ARTISTIC_LABELS.en[key] ?? fallback;
}

function preferEnglish(lang) {
  return lang !== "pt";
}

function pickLabel(item, lang) {
  if (preferEnglish(lang)) return item.labelEn || item.label;
  return item.label;
}

function pickDesc(item, lang) {
  if (preferEnglish(lang)) return item.descEn || item.desc || "";
  return item.desc || "";
}

export function localizeArtisticCatalog(lang, { includeNsfw = false } = {}) {
  const categories = filterArtisticCategories(ARTISTIC_STYLE_CATEGORIES, includeNsfw).map((c) => ({
    ...c,
    label: pickLabel(c, lang),
  }));

  const styles = filterArtisticStyles(ARTISTIC_STUDIO_STYLES, includeNsfw).map((s) => ({
    ...s,
    label: pickLabel(s, lang),
    desc: pickDesc(s, lang),
  }));

  const sections = ARTISTIC_EFFECT_SECTIONS.map((sec) => ({
    ...sec,
    title: preferEnglish(lang) ? sec.titleEn || sec.title : sec.title,
    options: sec.options.map((o) => ({
      ...o,
      label: pickLabel(o, lang),
    })),
  }));

  return { categories, styles, sections };
}

export function countStylesInCategory(styles, catId) {
  return styles.filter((s) => s.cat === catId).length;
}
