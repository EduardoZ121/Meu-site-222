/**
 * CGI preview templates for Marketing Video.
 * These are hidden technical storyboards, not user-visible prompts.
 */

const DEFAULT_TEMPLATE_ID = "character_reveal";

function beat(time, camera, action, light, transition) {
  return { time, camera, action, light, transition };
}

const TEMPLATES = {
  character_reveal: {
    id: "character_reveal",
    labelPt: "Intro de Personagem",
    labelEn: "Character Reveal",
    descriptionPt: "Prévia CGI com entrada dramática, close-ups e pose final.",
    descriptionEn: "CGI preview with dramatic entrance, close-ups, and final hero pose.",
    cover: "from-violet-950 via-slate-950 to-black",
    accent: "Crimson-red rim light, violet smoke, black studio void",
    categoryHint: "general",
    promptCore:
      "Create a 15-second game-style CGI character preview for the person or hero subject in [Image1]. "
      + "Treat [Image1] as the identity, outfit, face, hair, body shape, and material reference. "
      + "If [Image2] exists, use it for logo, brand color, environment, or secondary reference only. "
      + "Do not copy copyrighted characters; create an original cinematic preview with similar trailer energy. "
      + "Family-safe PG advertisement — fully clothed, no violence or weapons. "
      + "High-poly 3D character render, PBR materials, animation-ready topology look, dramatic cinematic lighting, controlled camera, polished game trailer quality.",
    beats: [
      beat("0.00-0.50", "black frame, slow fade", "ambient smoke reveals floor silhouette", "single overhead rim", "bass rise"),
      beat("0.50-1.00", "low dolly forward", "feet step into frame, clothing follows reference", "floor reflection", "hard cut"),
      beat("1.00-1.50", "macro 85mm", "shoe, fabric, accessory detail from [Image1]", "thin edge light", "match cut"),
      beat("1.50-2.00", "side profile push", "hair and shoulders pass through haze", "red-violet side glow", "whip pan"),
      beat("2.00-2.50", "front medium", "head turns slightly toward camera", "eyes catch key light", "speed ramp"),
      beat("2.50-3.00", "extreme close-up", "skin texture, wet eye reflection, serious expression", "soft facial fill", "blink cut"),
      beat("3.00-3.50", "orbit 20 degrees", "character raises one hand or adjusts glove/clothing", "volumetric beams", "motion blur"),
      beat("3.50-4.00", "macro tracking", "material panels, seams, fabric texture", "PBR specular detail", "snap zoom"),
      beat("4.00-4.75", "wide low angle", "energy pulse expands from character position", "backlight flare", "impact cut"),
      beat("4.75-5.50", "top-down drop", "floor symbols or abstract UI lines form around subject", "thin neon lines", "radial wipe"),
      beat("5.50-6.25", "three-quarter close", "character stance shifts into confident hero-ready pose", "strong key/fill contrast", "cut on beat"),
      beat("6.25-7.00", "handheld micro shake", "dust and particles react to power surge", "flickering practicals", "flash cut"),
      beat("7.00-7.75", "telephoto close", "face framed by hair, emotion intensifies", "eye highlight", "slow dissolve"),
      beat("7.75-8.50", "side dolly", "coat/shirt/loose fabric swings in slow motion", "rim light streak", "whip transition"),
      beat("8.50-9.25", "wide environment", "background expands into stylized game arena", "deep atmospheric fog", "push cut"),
      beat("9.25-10.00", "macro", "logo, symbol, or clothing mark if present", "pinpoint highlight", "glitch flash"),
      beat("10.00-10.75", "fast orbit", "character rotates into final line of action", "strobing hero light", "speed ramp"),
      beat("10.75-11.50", "low-angle crane", "full body revealed as original CGI hero", "large back flare", "impact hold"),
      beat("11.50-12.50", "close-up", "final expression: calm, intense, confident", "soft key on face", "dramatic pause"),
      beat("12.50-13.50", "wide symmetrical", "character lands in final pose, particles settle", "balanced hero lighting", "logo space opens"),
      beat("13.50-15.00", "slow push on hero frame", "final brand/name/logo moment if [Image2] provides it", "premium glow", "fade out"),
    ],
  },

  restaurant_blade_chef: {
    id: "restaurant_blade_chef",
    labelPt: "Chef Blade Trailer",
    labelEn: "Chef Blade Trailer",
    descriptionPt: "Entrada no restaurante, movimentos marciais com faca, corte e prato final.",
    descriptionEn: "Restaurant entrance, stylized chef moves, cutting sequence, and final dish reveal.",
    cover: "from-amber-950 via-neutral-950 to-black",
    accent: "warm kitchen tungsten, steel reflections, smoke, fire sparks",
    categoryHint: "food",
    promptCore:
      "Create a 15-second cinematic restaurant preview for the person, chef, dish, restaurant, or food brand in [Image1]. "
      + "If [Image1] is a person, preserve identity and outfit cues; if it is food or restaurant, make it the hero subject. "
      + "Use [Image2] for logo, restaurant interior, dish reference, or brand colors. "
      + "The kitchen choreography must feel elegant, controlled, and professional — premium chef performance trailer. "
      + "Food preparation only; no threats, no aggression toward people.",
    beats: [
      beat("0.00-0.50", "dark hallway wide", "restaurant door sign glows in background", "warm tungsten spill", "fade in"),
      beat("0.50-1.00", "low tracking", "chef or hero subject walks into frame", "floor reflections", "cut on step"),
      beat("1.00-1.50", "macro 100mm", "hand reaches for kitchen knife, steel catches light", "thin blade highlight", "sound hit"),
      beat("1.50-2.00", "side dolly", "knife does one controlled flourish", "spark reflection", "whip pan"),
      beat("2.00-2.50", "medium front", "chef locks eyes with camera, calm confidence", "soft key on face", "speed ramp"),
      beat("2.50-3.00", "top-down", "ingredients arranged in styled layout", "overhead grid light", "snap cut"),
      beat("3.00-3.50", "macro", "meat/vegetable texture, moisture and grain", "warm side light", "match cut"),
      beat("3.50-4.00", "fast close", "first clean slice, precise blade motion", "steel streak", "impact cut"),
      beat("4.00-4.50", "wide kitchen", "chef performs circular slicing motion, elegant and safe", "steam columns", "motion blur"),
      beat("4.50-5.00", "insert macro", "ingredients separate cleanly in slow motion", "specular highlights", "cut on beat"),
      beat("5.00-5.75", "orbit", "chef transitions from flourish into cooking station", "fire edge glow", "whip transition"),
      beat("5.75-6.50", "pan macro", "oil hits hot pan, steam burst", "orange flare", "flash cut"),
      beat("6.50-7.25", "overhead", "ingredients land in pan in rhythmic sequence", "warm top light", "staccato cuts"),
      beat("7.25-8.00", "close profile", "chef moves with precise technique while cooking", "rim-lit smoke", "push cut"),
      beat("8.00-8.75", "macro", "sauce pour ribbon, gloss and texture", "gold highlight", "slow dissolve"),
      beat("8.75-9.50", "medium", "final toss or plating movement", "kitchen practicals", "speed ramp"),
      beat("9.50-10.25", "macro", "knife wipes clean, blade reflection shows dish", "mirror glint", "match cut"),
      beat("10.25-11.00", "hero table", "dish lands on plate, garnish falls", "spotlight pool", "impact hold"),
      beat("11.00-12.00", "slow orbit", "finished dish rotates like premium product", "steam and bokeh", "soft fade"),
      beat("12.00-13.25", "wide restaurant", "chef stands behind plated dish", "warm brand atmosphere", "crane rise"),
      beat("13.25-15.00", "centered hero card", "restaurant logo/name appears if provided by [Image2]", "gold rim glow", "fade out"),
    ],
  },

  fashion_game_intro: {
    id: "fashion_game_intro",
    labelPt: "Moda CGI Game",
    labelEn: "CGI Fashion Game",
    descriptionPt: "Folha de personagem, poses de jogo, materiais e reveal editorial.",
    descriptionEn: "Character sheet energy, game poses, materials, and editorial reveal.",
    cover: "from-zinc-950 via-stone-900 to-black",
    accent: "studio grey, fabric scans, character sheet panels, soft rim light",
    categoryHint: "fashion",
    promptCore:
      "Create a 15-second CGI fashion/game character preview using the person and outfit in [Image1]. "
      + "The video should feel like a playable character outfit reveal: material scans, front/side/back pose language, studio panels, and a final editorial hero. "
      + "Use [Image2] for optional logo, alternate outfit, palette, or brand identity. Preserve identity approximately and prioritize garment shape, colors, materials, and silhouette.",
    beats: [
      beat("0.00-0.50", "black studio fade", "thin UI scan line crosses the frame", "cool grey rim", "digital sweep"),
      beat("0.50-1.00", "wide front", "character appears in neutral stance", "softbox reveal", "hard cut"),
      beat("1.00-1.50", "side profile", "body turns 45 degrees like character sheet", "edge light", "panel wipe"),
      beat("1.50-2.00", "back view", "hair, back silhouette, clothing fit visible", "top rim", "grid transition"),
      beat("2.00-2.50", "right profile", "final turnaround angle", "controlled studio light", "match cut"),
      beat("2.50-3.00", "macro", "fabric texture and pattern from reference", "PBR material shine", "snap zoom"),
      beat("3.00-3.50", "macro", "shoe, accessory, or logo detail", "small glint", "cut on beat"),
      beat("3.50-4.00", "medium front", "pose changes from neutral to confident", "beauty key light", "speed ramp"),
      beat("4.00-4.75", "triptych layout", "front/side/back ghost panels appear behind", "studio grey panels", "wipe"),
      beat("4.75-5.50", "close-up", "face turn and hair movement", "skin detail, soft fill", "slow dissolve"),
      beat("5.50-6.25", "top-down", "outfit pieces arranged as UI inventory", "flat-lay light", "digital tick"),
      beat("6.25-7.00", "macro", "color palette swatches animate beside subject", "neutral background", "clean cut"),
      beat("7.00-7.75", "low angle", "character steps into fashion runway stance", "spotlight cone", "impact cut"),
      beat("7.75-8.50", "orbit 180", "camera circles showing silhouette", "soft rim", "motion blur"),
      beat("8.50-9.25", "medium close", "hands adjust shirt/jacket/waistband", "editorial flash", "strobe cut"),
      beat("9.25-10.00", "wide", "studio panels slide away into game-like arena", "dark gradient", "push cut"),
      beat("10.00-10.75", "full body", "final outfit pose with confidence", "balanced key/rim", "hold"),
      beat("10.75-11.50", "macro rack focus", "material labels and PBR texture feeling", "pin lights", "focus pull"),
      beat("11.50-12.50", "portrait close", "identity hero moment, cinematic face detail", "soft eye light", "slow push"),
      beat("12.50-13.50", "wide editorial", "fashion/game character card composition", "subtle volumetric haze", "title space"),
      beat("13.50-15.00", "hero frame", "brand/logo/name appears if [Image2] provides it", "premium glow", "fade out"),
    ],
  },

  product_power_trailer: {
    id: "product_power_trailer",
    labelPt: "Produto Power Trailer",
    labelEn: "Product Power Trailer",
    descriptionPt: "Produto como herói de jogo: energia, macro, ambiente e logo final.",
    descriptionEn: "Product as game hero: energy, macro, environment, and final logo.",
    cover: "from-cyan-950 via-indigo-950 to-black",
    accent: "electric cyan energy, black glass, product hero stage",
    categoryHint: "general",
    promptCore:
      "Create a 15-second cinematic game-trailer advertisement where the product or subject in [Image1] is treated like the hero character. "
      + "Use [Image2] for logo, packaging, brand colors, environment, or secondary reference. "
      + "Focus on product identity, premium macro detail, power reveal, and final logo/card. Avoid random unrelated objects; every shot must support the brand/product.",
    beats: [
      beat("0.00-0.50", "black void", "tiny brand-colored energy spark appears", "single cyan point", "bass rise"),
      beat("0.50-1.00", "macro push", "surface texture from [Image1] appears through darkness", "thin rim", "match cut"),
      beat("1.00-1.50", "low wide", "product silhouette rises on pedestal", "back flare", "impact cut"),
      beat("1.50-2.00", "macro", "logo, material, or main feature catches light", "specular sweep", "snap zoom"),
      beat("2.00-2.50", "orbit", "energy ring forms around product", "electric particles", "whip pan"),
      beat("2.50-3.00", "top-down", "environment map forms under product", "grid glow", "radial wipe"),
      beat("3.00-3.50", "close", "feature detail with moisture, metal, glass, fabric, or texture", "PBR highlights", "cut"),
      beat("3.50-4.00", "wide", "product emits pulse that changes the scene", "volumetric blast", "flash"),
      beat("4.00-4.75", "macro slow", "secondary detail from references", "shallow DOF", "focus pull"),
      beat("4.75-5.50", "dolly", "camera races along product edge", "streak lights", "speed ramp"),
      beat("5.50-6.25", "hero front", "product locks center frame", "strong key", "hold then cut"),
      beat("6.25-7.00", "insert", "brand palette particles orbit", "colored reflections", "digital sweep"),
      beat("7.00-7.75", "wide arena", "scene expands to cinematic product world", "fog and glow", "push cut"),
      beat("7.75-8.50", "macro", "tactile action: pour, open, press, unfold, shine", "realistic highlights", "impact"),
      beat("8.50-9.25", "low-angle", "product appears massive and iconic", "IMAX-style flare", "slow push"),
      beat("9.25-10.00", "top-down", "supporting elements align around it", "graphic symmetry", "wipe"),
      beat("10.00-10.75", "fast orbit", "final power build", "electric accents", "speed ramp"),
      beat("10.75-11.50", "close", "hero feature resolves clearly", "soft fill", "cut on beat"),
      beat("11.50-12.50", "wide centered", "product lands on final premium stage", "balanced glow", "impact hold"),
      beat("12.50-13.50", "slow push", "brand space opens behind or beside product", "clean backdrop", "fade text space"),
      beat("13.50-15.00", "hero card", "logo/name appears only if provided by reference", "premium final flare", "fade out"),
    ],
  },
};

function localizeTemplate(tpl, lang = "pt", includeBeats = false) {
  const l = String(lang || "pt").slice(0, 2).toLowerCase();
  const out = {
    id: tpl.id,
    label: l === "en" ? tpl.labelEn : tpl.labelPt,
    description: l === "en" ? tpl.descriptionEn : tpl.descriptionPt,
    cover: tpl.cover,
    accent: tpl.accent,
    category_hint: tpl.categoryHint,
  };
  if (includeBeats) out.beats = tpl.beats;
  return out;
}

function listCgiTemplates(lang = "pt", opts = {}) {
  return Object.values(TEMPLATES).map((tpl) => localizeTemplate(tpl, lang, Boolean(opts.includeBeats)));
}

function getCgiTemplate(id) {
  const key = String(id || "").trim();
  return TEMPLATES[key] || TEMPLATES[DEFAULT_TEMPLATE_ID];
}

function isValidCgiTemplateId(id) {
  return Boolean(TEMPLATES[String(id || "").trim()]);
}

function compactBeat(b, idx) {
  return `${idx + 1}. ${b.time}: ${b.camera}; ${b.action}; ${b.light}; ${b.transition}.`;
}

function selectBeatsForPrompt(beats, max = 10) {
  if (!Array.isArray(beats) || beats.length <= max) return beats || [];
  const headCount = Math.ceil(max * 0.65);
  const tailCount = max - headCount;
  return [...beats.slice(0, headCount), ...beats.slice(-tailCount)];
}

function sanitizeCreativeAngle(angle) {
  return String(angle || "")
    .replace(/\b(sensual|sexy|nude|naked|erotic|provocative|intimate)\b/gi, "premium")
    .slice(0, 200)
    .trim();
}

function buildCgiPreviewPrompt({
  templateId,
  imageCount = 1,
  productLabel = "",
  creativeAngle = "",
  visualStylePrompt = "",
}) {
  const tpl = getCgiTemplate(templateId);
  const label = String(productLabel || "").trim() || "the subject in [Image1]";
  const refs = imageCount > 1
    ? "Use [Image2] and later reference images for logo, brand colors, environment, materials, and secondary visual identity. "
    : "";
  const beats = selectBeatsForPrompt(tpl.beats).map(compactBeat).join("\n");
  const style = visualStylePrompt ? `\n\nExtra visual direction: ${visualStylePrompt}` : "";
  const angle = sanitizeCreativeAngle(creativeAngle)
    ? `\n\nCreative emphasis from image analysis: ${sanitizeCreativeAngle(creativeAngle)}`
    : "";
  const prompt = [
    tpl.promptCore,
    `Main subject label: ${label}.`,
    refs,
    "Follow this exact technical storyboard. Keep continuity, identity, outfit/product consistency, and cinematic pacing. Avoid random scene changes.",
    beats,
    "Final frame: clean hero composition with brand/logo only if visible in references. No unrelated text, no watermarks.",
    style,
    angle,
  ].filter(Boolean).join("\n\n").trim();

  return {
    templateId: tpl.id,
    prompt,
    storyboard: `${tpl.labelEn}: ${tpl.descriptionEn}`,
    adminStoryboard: tpl.beats,
    categoryHint: tpl.categoryHint,
  };
}

module.exports = {
  DEFAULT_TEMPLATE_ID,
  TEMPLATES,
  listCgiTemplates,
  getCgiTemplate,
  isValidCgiTemplateId,
  buildCgiPreviewPrompt,
};
