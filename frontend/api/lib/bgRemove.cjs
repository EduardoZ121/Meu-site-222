/** Remover fundo — transparente/sólido (cutout) ou cena/custom (Flux Kontext). Espelha backend/server.py */

const BG_SCENE_PROMPTS = {
  white:
    "pure white seamless studio backdrop, soft even lighting, professional product photography clean and minimal",
  studio:
    "neutral light grey studio backdrop with subtle vertical gradient, soft diffused photographic lighting",
  black:
    "pure deep matte black backdrop, dramatic rim lighting on the subject, cinematic studio mood",
  gradient:
    "soft dreamy gradient background blending lavender into peach, ethereal and minimal",
  beach:
    "sunlit tropical beach, turquoise ocean and golden sand, warm golden hour light, slight cinematic blur",
  neon:
    "dark studio with vivid magenta and cyan neon lights, cyberpunk mood, glossy reflections",
  outdoor:
    "soft natural outdoor light with blurred green foliage bokeh background, editorial vibe",
  minimal:
    "minimalist beige seamless backdrop, soft diffused light, editorial premium look",
};

function buildBgScenePrompt({ bgMode, sceneKey, bgPrompt, keepShadow, refineHair }) {
  const sceneDesc =
    bgMode === "scene"
      ? BG_SCENE_PROMPTS[sceneKey] || BG_SCENE_PROMPTS.white
      : String(bgPrompt || "").trim() || "clean professional background";

  const shadowClause = keepShadow
    ? " Keep a soft natural ground shadow under the subject."
    : "";
  const hairClause = refineHair
    ? " Preserve fine hair strands and translucent edges with perfect cutout precision."
    : "";

  return (
    "Replace ONLY the background while keeping the subject pixel-perfect identical "
    + "(same pose, same outfit, same face, same proportions, same apparent age). "
    + `New background: ${sceneDesc}. `
    + "Match subject lighting and color temperature to the new scene for a photo-real composite."
    + shadowClause
    + hairClause
  );
}

function parseBgRemoveFields(text, fields) {
  const bgMode = String(text(fields, "bg_mode", "transparent")).trim().toLowerCase() || "transparent";
  const sceneKey = String(text(fields, "scene_key", "white")).trim().toLowerCase() || "white";
  const bgPrompt = String(text(fields, "bg_prompt", "")).trim();
  const keepShadow = text(fields, "keep_shadow", "false") === "true"
    || text(fields, "keep_shadow", "") === "1";
  const refineHairRaw = text(fields, "refine_hair", "true");
  const refineHair = refineHairRaw !== "false" && refineHairRaw !== "0";
  const solidColor = String(text(fields, "solid_color", "#FFFFFF")).trim() || "#FFFFFF";
  return { bgMode, sceneKey, bgPrompt, keepShadow, refineHair, solidColor };
}

module.exports = {
  BG_SCENE_PROMPTS,
  buildBgScenePrompt,
  parseBgRemoveFields,
};
