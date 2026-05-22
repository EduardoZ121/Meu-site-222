/**
 * Personagens — interações, diálogo e prompts de cena conjunta (Manga Studio).
 * Geração com Qwen Image Edit 2511 + 2 fotos de referência (identidade preservada).
 */

export const MANGA_INTERACTION_TYPES = [
  { id: "talk", poseA: "conversational open gesture, relaxed stance", poseB: "listening attentively, slight lean toward partner" },
  { id: "fight", poseA: "dynamic combat strike pose, aggressive guard", poseB: "blocking or counter-attack, mirrored combat tension" },
  { id: "hug", poseA: "arms open embracing", poseB: "reciprocating warm embrace, bodies close" },
  { id: "walk", poseA: "walking side by side mid-step", poseB: "matching pace, casual stride together" },
  { id: "chase", poseA: "running forward urgently", poseB: "pursuing or fleeing with dynamic motion lines" },
  { id: "team", poseA: "hero team stance shoulder to shoulder", poseB: "united squad pose, cooperative energy" },
  { id: "battle_anime", poseA: "anime battle aura, power-up stance", poseB: "opposing battle aura, clashing energy" },
  { id: "romance", poseA: "tender close approach, soft expression", poseB: "shy or reciprocating romantic gaze, gentle proximity" },
  { id: "protect", poseA: "shielding stance in front of partner", poseB: "protected behind, grateful or surprised" },
  { id: "attack", poseA: "lunging attack motion", poseB: "defensive recoil or evasion" },
];

export const MANGA_CHAR_DISTANCES = [
  { id: "close", en: "very close, intimate spacing" },
  { id: "medium", en: "natural conversational distance" },
  { id: "far", en: "wider gap, dramatic separation" },
];

export const MANGA_CHAR_SLOT = [
  { id: "left", en: "on the left side of frame" },
  { id: "right", en: "on the right side of frame" },
];

export const MANGA_CHAR_EMOTIONS = [
  { id: "neutral", en: "neutral calm expression" },
  { id: "happy", en: "happy bright expression" },
  { id: "sad", en: "sad downcast eyes, slumped posture" },
  { id: "angry", en: "angry intense eyes, aggressive body language" },
  { id: "fear", en: "fearful wide eyes, tense shoulders" },
  { id: "love", en: "soft romantic expression, gentle eyes" },
  { id: "determined", en: "determined focused gaze, firm stance" },
];

export const MANGA_CHAR_FOCUS = [
  { id: "char_a", en: "primary focus on first character" },
  { id: "char_b", en: "primary focus on second character" },
  { id: "both", en: "equal focus on both characters" },
];

export const MANGA_CHAR_GAZE = [
  { id: "partner", en: "looking directly at the other character" },
  { id: "camera", en: "looking toward the viewer" },
  { id: "scene", en: "looking toward background or action off-frame" },
  { id: "profile", en: "profile view, side glance" },
  { id: "back", en: "from behind or over-shoulder toward partner" },
];

export const MANGA_RELATION_TYPES = [
  "ally",
  "rival",
  "romance",
  "family",
  "mentor",
  "team",
];

function pick(map, id, fallback) {
  return map.find((x) => x.id === id) || fallback;
}

/**
 * Prompt otimizado para Qwen multi-image (1ª foto = charA, 2ª foto = charB).
 */
export function buildMangaInteractionPrompt({ charA, charB, config }) {
  const type = pick(MANGA_INTERACTION_TYPES, config.interactionType, MANGA_INTERACTION_TYPES[0]);
  const dist = pick(MANGA_CHAR_DISTANCES, config.distance, MANGA_CHAR_DISTANCES[1]);
  const emoA = pick(MANGA_CHAR_EMOTIONS, config.emotionA, MANGA_CHAR_EMOTIONS[0]);
  const emoB = pick(MANGA_CHAR_EMOTIONS, config.emotionB, MANGA_CHAR_EMOTIONS[0]);
  const focus = pick(MANGA_CHAR_FOCUS, config.focus, MANGA_CHAR_FOCUS[2]);
  const gazeA = pick(MANGA_CHAR_GAZE, config.gazeA, MANGA_CHAR_GAZE[0]);
  const gazeB = pick(MANGA_CHAR_GAZE, config.gazeB, MANGA_CHAR_GAZE[0]);
  const slotA = config.slotA === "right" ? "right" : "left";
  const slotB = slotA === "left" ? "right" : "left";

  const descA = charA.description || charA.tag || "";
  const descB = charB.description || charB.tag || "";

  const parts = [
    "Edit and combine the TWO reference photos into ONE unified manga/comic panel illustration.",
    "CRITICAL IDENTITY RULES: Do NOT swap faces. Do NOT invent new people. Each person must match their reference photo exactly — same face shape, eyes, nose, mouth, hair color, hair style, skin tone, age, and outfit.",
    `FIRST reference image = ${charA.name}${descA ? ` (${descA})` : ""}. Place this exact person on the ${slotA} of the frame.`,
    `SECOND reference image = ${charB.name}${descB ? ` (${descB})` : ""}. Place this exact person on the ${slotB} of the frame.`,
    "Single cohesive scene — NOT a collage, NOT side-by-side reference sheets — one integrated manga panel with connected poses and shared lighting.",
    `Interaction type: ${config.interactionLabel || type.id}.`,
    `${charA.name}: ${type.poseA}. Emotion: ${emoA.en}. Gaze: ${gazeA.en}.`,
    `${charB.name}: ${type.poseB}. Emotion: ${emoB.en}. Gaze: ${gazeB.en}.`,
    `Physical spacing between them: ${dist.en}.`,
    `Visual focus: ${focus.en}.`,
    "Bodies must face each other appropriately for the action; hands and limbs anatomically correct.",
  ];

  const lineA = String(config.dialogueA || "").trim();
  const lineB = String(config.dialogueB || "").trim();
  if (lineA || lineB) {
    parts.push("Include manga speech balloons with tails pointing to the correct speaker's mouth.");
    if (lineA) parts.push(`${charA.name} says: "${lineA}"`);
    if (lineB) parts.push(`${charB.name} says: "${lineB}"`);
    parts.push("When speaking, characters look at each other unless gaze direction says otherwise.");
  }

  parts.push(
    "Professional manga ink style, screentones optional, 4:5 vertical panel, no watermark, no UI chrome.",
  );
  return parts.join(" ");
}

export function defaultInteractionConfig(partnerId = null) {
  return {
    partnerId,
    interactionType: "talk",
    slotA: "left",
    distance: "medium",
    emotionA: "neutral",
    emotionB: "neutral",
    focus: "both",
    gazeA: "partner",
    gazeB: "partner",
    dialogueA: "",
    dialogueB: "",
    dialogueOrder: "a_first",
    groupCharIds: [],
  };
}

export function emptySavedInteraction(partial = {}) {
  return {
    id: `ix_${Date.now().toString(36)}`,
    partnerId: null,
    partnerName: "",
    interactionType: "talk",
    config: defaultInteractionConfig(),
    resultThumb: null,
    createdAt: new Date().toISOString(),
    ...partial,
  };
}
