/**
 * Gera famílias + JSON de templates IG (PDF Novos prompts).
 * Run: node scripts/gen-poster-pdf-release.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PDF_RELEASE_CATALOG } from "./poster-pdf-release-catalog.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const DUAL_PREFIX =
  "Use the uploaded reference image as the identity source. Replace ONLY the original models with the uploaded person(s) while preserving the exact composition, pose, facial orientation, camera distance, crop, typography placement, and graphic design layout.\n\n";

const SINGLE_PREFIX =
  "Use the uploaded reference image as the identity source. Replace ONLY the original model with the uploaded person while preserving the exact composition, pose, facial angle, framing, typography placement, and poster structure.\n\n";

const VARIANT_STYLES = [
  {
    key: "classic",
    title: "Classic",
    labelKeySuffix: "classic",
    gradientShift: 0,
    suffix: "",
  },
  {
    key: "cinematic",
    title: "Cinematic",
    labelKeySuffix: "cinematic",
    gradientShift: 1,
    suffix:
      "Variant: cinematic filmic contrast, gentle grain, deeper shadows, premium editorial finish.",
  },
  {
    key: "vibrant",
    title: "Vibrant",
    labelKeySuffix: "vibrant",
    gradientShift: 2,
    suffix:
      "Variant: slightly boosted saturation on accents, energetic glow on typography edges, high-impact social feed look.",
  },
  {
    key: "minimal",
    title: "Minimal",
    labelKeySuffix: "minimal",
    gradientShift: 3,
    suffix:
      "Variant: cleaner negative space, refined typography spacing, quieter background texture, gallery-poster calm.",
  },
  {
    key: "editorial",
    title: "Editorial",
    labelKeySuffix: "editorial",
    gradientShift: 4,
    suffix:
      "Variant: magazine editorial polish, subtle print texture, fashion-forward lighting, premium art direction.",
  },
];

function slug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function buildPrompt(item, bodyExtra = "") {
  const prefix = item.requiresDualPhoto ? DUAL_PREFIX : SINGLE_PREFIX;
  const body = `${item.body}${bodyExtra ? `\n${bodyExtra}` : ""}`;
  return `${prefix}${body}`.trim();
}

function shiftGradient(base, idx) {
  if (!idx) return base;
  const hues = [
    base,
    base.replace(/#7C3AED/gi, "#2563EB").replace(/#22C55E/gi, "#06B6D4"),
    base.replace(/0%,/g, "8%,").replace(/100%\)/g, "92%)"),
    base.replace(/#0B0B0C/gi, "#18181B"),
    base.replace(/55%/g, "62%").replace(/48%/g, "54%"),
  ];
  return hues[idx % hues.length] || base;
}

const PDF_RELEASE_FAMILIES = PDF_RELEASE_CATALOG.map((item) => {
  const styleCount = VARIANT_STYLES.length;
  const subtagDual = item.requiresDualPhoto ? "2 fotos · " : "";
  return {
    id: item.id,
    category: item.category,
    label: item.label,
    subtag: item.subtag || `${subtagDual}${styleCount} estilos · IG ref`,
    requiresDualPhoto: Boolean(item.requiresDualPhoto),
    variants: VARIANT_STYLES.map((style) => ({
      key: style.key,
      title: style.key === "classic" ? item.label : `${item.label} · ${style.title}`,
      labelKey: `post_style_${slug(item.id)}_${style.labelKeySuffix}`,
      gradient: shiftGradient(item.gradient, style.gradientShift),
      placeholders: [...item.placeholders],
      replacements: { ...item.replacements },
      optional: [],
      productTemplate: false,
      requiresDualPhoto: Boolean(item.requiresDualPhoto),
      prompt: buildPrompt(item, style.suffix),
    })),
  };
});

function buildPdfReleaseTemplates() {
  return PDF_RELEASE_FAMILIES.map((family) => {
    const first = family.variants[0];
    return {
      id: family.id,
      source_id: family.id,
      familyId: family.id,
      styleVariants: true,
      category: family.category,
      label: family.label,
      subtag: family.subtag,
      requiresDualPhoto: Boolean(family.requiresDualPhoto),
      productTemplate: false,
      placeholders: first.placeholders,
      optional: first.optional || [],
      replacements: { ...first.replacements },
      prompt: first.prompt,
      aspect: "4:5",
    };
  });
}

const jsOut = `/**
 * Pôsteres IG — prompts do PDF Novos prompts (identidade + composição ref).
 * AUTO-GENERATED — edit scripts/poster-pdf-release-catalog.mjs + re-run gen-poster-pdf-release.mjs
 */
export const PDF_RELEASE_FAMILIES = ${JSON.stringify(PDF_RELEASE_FAMILIES, null, 2)};

export function buildPdfReleaseTemplates() {
  return PDF_RELEASE_FAMILIES.map((family) => {
    const first = family.variants[0];
    return {
      id: family.id,
      source_id: family.id,
      familyId: family.id,
      styleVariants: true,
      category: family.category,
      label: family.label,
      subtag: family.subtag,
      requiresDualPhoto: Boolean(family.requiresDualPhoto),
      productTemplate: false,
      placeholders: first.placeholders,
      optional: first.optional || [],
      replacements: { ...first.replacements },
      prompt: first.prompt,
      aspect: "4:5",
    };
  });
}

export function registerPdfReleaseStyleVariants(registerFn) {
  for (const family of PDF_RELEASE_FAMILIES) {
    registerFn(
      family.id,
      family.variants.map((v) => ({
        variantKey: v.key,
        label: v.title,
        labelKey: v.labelKey,
        gradient: v.gradient,
        prompt: v.prompt,
        placeholders: v.placeholders,
        replacements: { ...v.replacements },
        optional: v.optional || [],
        productTemplate: false,
        requiresDualPhoto: Boolean(v.requiresDualPhoto),
      })),
    );
  }
}

export function isPosterDualPhotoTemplate(template) {
  return Boolean(template?.requiresDualPhoto);
}
`;

fs.writeFileSync(path.join(root, "src/lib/posterPdfReleaseFamilies.js"), jsOut);
fs.writeFileSync(
  path.join(root, "api/lib/posterPdfReleaseTemplatesData.json"),
  JSON.stringify(buildPdfReleaseTemplates(), null, 2),
);

const variantTotal = PDF_RELEASE_FAMILIES.reduce((n, f) => n + f.variants.length, 0);
console.log(
  `Generated posterPdfReleaseFamilies.js (${PDF_RELEASE_FAMILIES.length} families, ${variantTotal} variants)`,
);
