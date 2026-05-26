/**
 * Cenários conectáveis — configuração, influência visual e composição (edição na biblioteca).
 * A geração final usa estes dados no Painel (panelSceneDraft).
 */

export const SCENE_TYPES = [
  { id: "exterior", en: "outdoor exterior environment" },
  { id: "interior", en: "interior indoor room" },
  { id: "cyberpunk", en: "cyberpunk dystopian city streets" },
  { id: "school", en: "anime school campus" },
  { id: "city_anime", en: "anime city street with shops and signs" },
  { id: "forest", en: "lush forest nature" },
  { id: "bedroom", en: "cozy bedroom interior" },
  { id: "cafe", en: "cafeteria or coffee shop" },
  { id: "ruins", en: "ancient ruins or destroyed buildings" },
  { id: "post_apocalyptic", en: "post-apocalyptic wasteland" },
  { id: "scifi", en: "science fiction futuristic environment" },
];

export const SCENE_WEATHER = [
  { id: "sun", en: "clear sunny weather", fx: "warm sunlight, soft shadows" },
  { id: "rain", en: "rainy weather", fx: "wet ground reflections, cool blue lighting, rain drops" },
  { id: "fog", en: "dense fog", fx: "atmospheric haze, muted contrast, depth layers" },
  { id: "snow", en: "snowfall", fx: "cold palette, snow particles, soft diffuse light" },
  { id: "storm", en: "stormy sky", fx: "dramatic clouds, wind, high contrast flashes" },
  { id: "neon_night", en: "neon night rain", fx: "neon reflections on wet pavement, magenta cyan glow" },
];

export const SCENE_LIGHTING = [
  { id: "natural", en: "natural realistic lighting" },
  { id: "cinematic", en: "cinematic film lighting with rim light" },
  { id: "anime", en: "anime cel-shaded lighting" },
  { id: "dramatic", en: "dramatic high contrast lighting" },
  { id: "dark", en: "dark moody low-key lighting" },
  { id: "soft", en: "soft diffused gentle lighting" },
];

export const SCENE_TIME = [
  { id: "morning", en: "early morning golden light" },
  { id: "afternoon", en: "bright afternoon" },
  { id: "sunset", en: "sunset warm orange sky" },
  { id: "night", en: "night time dark sky" },
  { id: "dawn", en: "dawn blue hour" },
];

/** Interações possíveis ligadas ao cenário (ids alinhados com personagens quando aplicável). */
export const SCENE_INTERACTIONS = [
  "talk",
  "fight",
  "walk",
  "chase",
  "hug",
  "battle_anime",
  "romance",
  "protect",
  "attack",
  "train",
  "group",
  "joint_pose",
];

export const SCENE_CHAR_POSITIONS = [
  { id: "left", en: "left side of frame" },
  { id: "right", en: "right side of frame" },
  { id: "center", en: "center of frame" },
  { id: "back", en: "background depth" },
  { id: "front", en: "foreground emphasis" },
];

export const SCENE_DISTANCES = [
  { id: "close", en: "close spacing" },
  { id: "medium", en: "medium distance" },
  { id: "far", en: "far apart" },
];

export const SCENE_FORMATIONS = [
  { id: "side_by_side", en: "standing side by side" },
  { id: "face_to_face", en: "facing each other" },
  { id: "circle", en: "group circle formation" },
  { id: "chase", en: "chase pursuit formation" },
  { id: "battle", en: "combat confrontation formation" },
];

export function defaultScenarioConfig() {
  return {
    sceneType: "city_anime",
    weather: "sun",
    lightingStyle: "anime",
    timeOfDay: "afternoon",
    connectedCharacterIds: [],
    enabledInteractions: ["talk", "walk", "fight"],
    activeInteraction: "talk",
    positioning: {
      distance: "medium",
      formation: "side_by_side",
      slots: {},
    },
  };
}

export function emptySavedComposition(partial = {}) {
  return {
    id: `comp_${Date.now().toString(36)}`,
    label: "",
    createdAt: new Date().toISOString(),
    ...partial,
  };
}

function pick(list, id, fallback) {
  return list.find((x) => x.id === id) || fallback || list[0];
}

/** Influência automática de ambiente (para prompt do painel). */
export function buildSceneEnvironmentInfluence(scenario) {
  const cfg = scenario?.sceneConfig || defaultScenarioConfig();
  const type = pick(SCENE_TYPES, cfg.sceneType, SCENE_TYPES[4]);
  const weather = pick(SCENE_WEATHER, cfg.weather, SCENE_WEATHER[0]);
  const light = pick(SCENE_LIGHTING, cfg.lightingStyle, SCENE_LIGHTING[2]);
  const time = pick(SCENE_TIME, cfg.timeOfDay, SCENE_TIME[1]);
  const parts = [
    `Environment type: ${type.en}.`,
    `Weather: ${weather.en}. ${weather.fx || ""}`,
    `Lighting style: ${light.en}.`,
    `Time of day: ${time.en}.`,
    scenario?.description ? `Scene notes: ${scenario.description}.` : "",
    "Characters must share the same environment lighting, shadows, reflections and atmosphere — integrated into the scene, not pasted on top.",
  ];
  return parts.filter(Boolean).join(" ");
}

/**
 * Snapshot completo para o Painel gerar depois (sem API na biblioteca).
 */
export function buildPanelSceneDraft({ scenario, characters, characterIds }) {
  const cfg = scenario?.sceneConfig || defaultScenarioConfig();
  const ids = characterIds?.length ? characterIds : cfg.connectedCharacterIds || [];
  const chars = ids
    .map((id) => characters.find((c) => c.id === id))
    .filter(Boolean);

  return {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    characterIds: ids,
    characterNames: chars.map((c) => c.name),
    interactionType: cfg.activeInteraction,
    enabledInteractions: [...(cfg.enabledInteractions || [])],
    sceneType: cfg.sceneType,
    weather: cfg.weather,
    lightingStyle: cfg.lightingStyle,
    timeOfDay: cfg.timeOfDay,
    positioning: { ...cfg.positioning },
    environmentPrompt: buildSceneEnvironmentInfluence(scenario),
    scenarioThumb: scenario.thumb || null,
    savedAt: new Date().toISOString(),
  };
}

export function buildCompositionPromptPreview(draft, characters) {
  if (!draft) return "";
  const names = draft.characterNames?.join(" + ") || "";
  const interaction = draft.interactionType || "talk";
  return [
    `Manga panel in scenario "${draft.scenarioName}".`,
    `Characters: ${names}.`,
    `Interaction: ${interaction}. Formation: ${draft.positioning?.formation}.`,
    draft.environmentPrompt,
  ].join(" ");
}
