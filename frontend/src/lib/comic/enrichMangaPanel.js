/** Defaults for v2 panel/character/scenario fields (backward compatible). */

export const PANEL_DEFAULTS = {
  eyeLevel: 0,
  screenDirection: "left-to-right",
  inheritSceneLighting: true,
  handPose: "open",
  outfitId: null,
  lightingDirection: null,
  lightingIntensity: 0.72,
  lightingColorTemp: "neutral",
  weatherOverride: null,
  timeOfDayOverride: null,
  status: "draft",
  creditsCost: 15,
  backgroundSeed: null,
  balloonShape: "round",
  narration: false,
};

export const CHARACTER_DEFAULTS = {
  bodyType: "slim",
  seedBase: Math.floor(Math.random() * 999999),
  consistencyLock: true,
  outfitSlots: [],
};

export const SCENARIO_DEFAULTS = {
  timeOfDay: "afternoon",
  weather: "clear",
  lightingDirection: 135,
  lightingIntensity: 0.65,
  lightingColorTemp: "warm",
  location: "",
};

export function enrichPanel(panel) {
  if (!panel) return panel;
  return { ...PANEL_DEFAULTS, ...panel };
}

export function enrichCharacter(char) {
  if (!char) return char;
  return {
    ...CHARACTER_DEFAULTS,
    outfitSlots: char.outfitSlots || [],
    ...char,
    sheets: {
      front: null,
      profile: null,
      threeQuarter: null,
      back: null,
      expressions: {},
      ...(char.sheets || {}),
    },
  };
}

export function enrichScenario(scene) {
  if (!scene) return scene;
  return { ...SCENARIO_DEFAULTS, ...scene, location: scene.location || scene.name || "" };
}

export function enrichProject(project) {
  if (!project) return project;
  return {
    stylePreset: project.stylePreset || "manga-classic",
    tourCompleted: Boolean(project.tourCompleted),
    uiPrefs: {
      collapsedSections: {},
      viewMode: "editor",
      ...(project.uiPrefs || {}),
    },
    ...project,
    characters: (project.characters || []).map(enrichCharacter),
    scenarios: (project.scenarios || []).map(enrichScenario),
    panels: (project.panels || []).map(enrichPanel),
  };
}
