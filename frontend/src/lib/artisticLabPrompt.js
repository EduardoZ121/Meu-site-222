/**
 * Universal artistic-style identity lock.
 *
 * Solves the "the person looks older / different" problem when applying any
 * artistic style (anime, cartoon, classic painting, digital, etc.) to an
 * uploaded photo. Inspired by Perchance-style edit pipelines: the chosen
 * style becomes a *treatment* layer, never a subject replacement.
 *
 * Categories are mapped to either a PHOTOREAL lock (style preserves real
 * photography) or a STYLIZED lock (style translates the same person into
 * an illustrated form without changing identity, age, body, or features).
 */

const STYLIZED_CATEGORIES = new Set([
  "anime_manga",
  "cartoon",
  "illustration",
  "digital",
  "classic",
  "modern",
  "fantasy",
  "vintage",
]);

const PHOTOREAL_CATEGORIES = new Set(["photography"]);

/* -------------------------------------------------------------------------- */
/* IDENTITY LOCKS                                                             */
/* -------------------------------------------------------------------------- */

const PHOTOREAL_LOCK = [
  "CRITICAL PHOTOREAL EDIT — read before any other instruction:",
  "• Edit ONLY the provided reference photo. Do NOT replace the person.",
  "• Preserve the EXACT same identity: same face shape, eyes, nose, lips, jawline, cheekbones, ears, skin tone, ethnicity, gender, hair color, hair style, hairline, eyebrows, freckles/moles, scars and any distinctive features visible in the reference.",
  "• Preserve the EXACT apparent AGE — never make the subject older, never add wrinkles, sagging skin, gray hair, age spots, deeper lines or aged features. Never de-age either: keep the apparent age identical to the reference.",
  "• Preserve the body: same height, weight, build, muscle definition, posture and proportions. Do NOT slim, bulk, stretch, shrink or reshape.",
  "• Preserve the pose, hands, camera angle and framing of the reference unless the user explicitly requests a change.",
  "• Apply ONLY the photographic style treatment listed below (lighting, lens, color grade, mood) — every other pixel of identity must stay consistent with the reference.",
].join("\n");

const STYLIZED_LOCK = (categoryLabel) =>
  [
    `CRITICAL STYLIZED EDIT (${categoryLabel}) — read before any other instruction:`,
    "• Translate the SAME PERSON from the reference photo into the chosen art style. This is a stylization of a real individual, NOT generation of a new generic character.",
    "• Preserve identity through the style: keep the same face shape, eye shape and color, nose and lip silhouette, hairline, hair color, hair style, ethnicity, gender and any distinctive marks (freckles, moles, scars, glasses, accessories).",
    "• Preserve the EXACT apparent AGE — if the reference is young, keep them young; if mature, keep them mature. NEVER add wrinkles, gray hair, sagging skin, age spots or aged features. NEVER de-age either.",
    "• Preserve body proportions and build (height, weight, muscle, posture). Do NOT slim, bulk, stretch or distort.",
    "• Preserve pose, gaze direction, hand position and camera framing unless the user explicitly requests a change.",
    "• Apply the chosen style ONLY as a visual treatment layer (line work, shading, palette, render technique). The underlying person must remain instantly recognizable as the reference subject.",
    "• FORBIDDEN: face swap, generic anime/cartoon faces, default model features, random age progression, body reshape, ethnicity change, hair color change, gender change.",
  ].join("\n");

const AI_LAB_LOCK = [
  "CRITICAL AI LAB EDIT — read before any other instruction:",
  "• Edit ONLY the provided reference photo. Keep the EXACT same person.",
  "• Preserve identity: face, facial features, eyes, nose, lips, skin tone, ethnicity, apparent age, hair color and style, body shape, muscle definition, proportions, pose, hands and camera angle.",
  "• Do NOT age, de-age, slim, bulk or reshape the subject. Do NOT change identity.",
  "• Apply ONLY the specific changes listed below; every other pixel must stay consistent with the reference.",
].join("\n");

const CATEGORY_LABELS = {
  anime_manga: "Anime & Manga stylization",
  cartoon: "Cartoon & 3D stylization",
  illustration: "Illustration & Comic stylization",
  digital: "Digital & Sci-Fi stylization",
  classic: "Classical painting stylization",
  modern: "Modern design stylization",
  fantasy: "Fantasy & Epic stylization",
  vintage: "Vintage & Retro stylization",
};

/* -------------------------------------------------------------------------- */
/* PUBLIC BUILDERS                                                            */
/* -------------------------------------------------------------------------- */

export function pickIdentityLock({ styleCat, isAiLab = false }) {
  if (isAiLab) return AI_LAB_LOCK;
  if (PHOTOREAL_CATEGORIES.has(styleCat)) return PHOTOREAL_LOCK;
  if (STYLIZED_CATEGORIES.has(styleCat)) {
    return STYLIZED_LOCK(CATEGORY_LABELS[styleCat] || "stylized illustration");
  }
  // Default safe path — also a stylization lock for unknown categories.
  return STYLIZED_LOCK("artistic stylization");
}

/**
 * Universal artistic edit prompt — used WHENEVER a photo is uploaded,
 * regardless of style category. This is the new robust path.
 */
export function buildArtisticEditPrompt({
  userPrompt = "",
  styleSuffix = "",
  styleCat = "",
  isAiLab = false,
  extras = [],
  isPhotography = false,
}) {
  const lock = pickIdentityLock({ styleCat, isAiLab });
  const parts = [lock];

  const trimmed = String(userPrompt || "").trim();
  if (trimmed) {
    parts.push(
      `User-requested changes (apply EXACTLY, highest priority over style — but never violate the identity lock above): ${trimmed}`,
    );
  }

  if (styleSuffix) {
    const treatmentLabel = isPhotography
      ? "Photographic style treatment ONLY (lighting / lens / color grade / mood — never alter face, age, body or identity)"
      : "Art style treatment ONLY (line work / shading / palette / render technique — never alter face, age, body or identity)";
    parts.push(`${treatmentLabel}: ${styleSuffix}.`);
  }

  for (const extra of extras) {
    if (extra) parts.push(extra);
  }

  parts.push(
    isPhotography
      ? "Ultra high quality photorealistic output, professional photography finish, natural skin texture, cohesive visual recipe, 8K detail where applicable."
      : "Ultra high quality stylized illustration, cohesive artistic finish, clean rendering, the person remains immediately recognizable as the reference subject.",
  );

  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

/* -------------------------------------------------------------------------- */
/* TEXT-ONLY PROMPT (no photo)                                                */
/* -------------------------------------------------------------------------- */

export function buildArtisticTextPrompt({
  userPrompt = "",
  styleSuffix = "",
  extras = [],
}) {
  const parts = [];
  const trimmed = String(userPrompt || "").trim();
  if (trimmed) parts.push(trimmed);
  if (styleSuffix) parts.push(styleSuffix);
  for (const extra of extras) {
    if (extra) parts.push(extra);
  }
  parts.push(
    "Ultra high quality, professional art direction, cohesive visual recipe, 8K detail where applicable.",
  );
  return parts.filter(Boolean).join(". ").replace(/\.\s*\./g, ".");
}
