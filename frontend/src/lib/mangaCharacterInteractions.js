/**
 * Personagens — interações, diálogo e prompts de cena conjunta (Manga Studio).
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

function charVisualLock(c, label) {
  const parts = [
    `${label}: ${c.name}.`,
    c.description || c.tag || "consistent manga character design",
  ];
  if (c.consistencyLock) {
    parts.push(
      `STRICT identity lock for ${c.name}: same face, hair, outfit, proportions, art style as reference.`,
    );
  }
  return parts.join(" ");
}

/**
 * @param {object} opts
 * @param {object} opts.charA
 * @param {object} opts.charB
 * @param {object} opts.config
 * @param {object[]} [opts.extraChars]
 */
export function buildMangaInteractionPrompt({ charA, charB, config, extraChars = [] }) {
  const type = pick(MANGA_INTERACTION_TYPES, config.interactionType, MANGA_INTERACTION_TYPES[0]);
  const dist = pick(MANGA_CHAR_DISTANCES, config.distance, MANGA_CHAR_DISTANCES[1]);
  const emoA = pick(MANGA_CHAR_EMOTIONS, config.emotionA, MANGA_CHAR_EMOTIONS[0]);
  const emoB = pick(MANGA_CHAR_EMOTIONS, config.emotionB, MANGA_CHAR_EMOTIONS[0]);
  const focus = pick(MANGA_CHAR_FOCUS, config.focus, MANGA_CHAR_FOCUS[2]);
  const gazeA = pick(MANGA_CHAR_GAZE, config.gazeA, MANGA_CHAR_GAZE[0]);
  const gazeB = pick(MANGA_CHAR_GAZE, config.gazeB, MANGA_CHAR_GAZE[0]);
  const slotA = config.slotA === "right" ? "right" : "left";
  const slotB = slotA === "left" ? "right" : "left";

  const parts = [
    "Single cohesive manga/comic illustration with TWO characters interacting in ONE scene.",
    "NOT collage, NOT separate cutouts — unified composition, connected poses, shared perspective.",
    "Professional ink, expressive faces, hands anatomically correct, eyes aligned with action.",
    charVisualLock(charA, "Character A"),
    charVisualLock(charB, "Character B"),
    `Interaction: ${config.interactionLabel || type.id}. ${type.poseA} for ${charA.name}; ${type.poseB} for ${charB.name}.`,
    `Spacing: ${dist.en}.`,
    `${charA.name} positioned ${slotA} (${MANGA_CHAR_SLOT.find((s) => s.id === slotA)?.en}).`,
    `${charB.name} positioned ${slotB}.`,
    `${charA.name} emotion: ${emoA.en}; body language must match.`,
    `${charB.name} emotion: ${emoB.en}; body language must match.`,
    `${charA.name} gaze: ${gazeA.en}.`,
    `${charB.name} gaze: ${gazeB.en}.`,
    `Camera focus: ${focus.en}.`,
  ];

  extraChars.forEach((c, i) => {
    parts.push(charVisualLock(c, `Character ${i + 3}`));
    parts.push(`${c.name} participates in the group action, coherent with the main interaction.`);
  });

  const lineA = String(config.dialogueA || "").trim();
  const lineB = String(config.dialogueB || "").trim();
  if (lineA || lineB) {
    const order = config.dialogueOrder === "b_first" ? "second then first" : "first then second";
    parts.push(
      `Dialogue sequence (${order}): manga speech balloons with clear tails pointing to speakers.`,
    );
    if (lineA) {
      parts.push(
        `${charA.name} speech balloon (${slotA}): "${lineA}". Tail points to ${charA.name}'s mouth; pose matches words.`,
      );
    }
    if (lineB) {
      parts.push(
        `${charB.name} speech balloon (${slotB}): "${lineB}". Tail points to ${charB.name}'s mouth; pose matches words.`,
      );
    }
    parts.push("Characters look at each other when speaking unless gaze says otherwise.");
  }

  parts.push("Maintain outfit, hair, face identity and art style across the full image.");
  parts.push("Aspect ratio 4:5 vertical manga panel. No watermark, no UI.");
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
