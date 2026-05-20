/** MANGA STUDIO — panel defaults (stable ids; labels via mangaStudioCatalog + t()). */

export const PANEL_ASPECTS = ["4:5", "1:1", "3:4", "16:9"];

export function uid(prefix = "m") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function emptyPanel(order = 0) {
  return {
    id: uid("panel"),
    order,
    aspect: "4:5",
    characterId: null,
    poseId: "talk",
    expression: "normal",
    angle: "front",
    shot: "medium",
    scenarioId: null,
    lighting: "day",
    focus: "both",
    framing: "static",
    balloonText: "",
    balloonType: "speech",
    balloonPos: "top",
    letterStyle: "anime",
    effects: {},
    resultUrl: null,
  };
}

export function emptyCharacter(name = "") {
  return {
    id: uid("char"),
    name: name || "",
    tag: "",
    thumb: null,
    description: "",
    sheets: { front: null, profile: null, back: null, expressions: [] },
  };
}

export function emptyScenario(name = "") {
  return {
    id: uid("scene"),
    name: name || "",
    thumb: null,
    description: "",
    variants: { day: null, night: null, interior: null },
  };
}

export function defaultProject() {
  return createNewProject("Project 1");
}

export function createNewProject(name = "Project 1") {
  const panel = emptyPanel(0);
  return {
    id: uid("proj"),
    name,
    updatedAt: new Date().toISOString(),
    pageLayout: "vertical",
    characters: [],
    scenarios: [],
    panels: [panel],
  };
}

/** @deprecated Use getMangaStudioCatalog(t) from mangaStudioCatalog.js */
export const MANGA_POSES = [];
export const MANGA_EXPRESSIONS = [];
export const MANGA_ANGLES = [];
export const MANGA_SHOTS = [];
export const MANGA_LIGHTING = [];
export const MANGA_FOCUS = [];
export const MANGA_FRAMING = [];
export const MANGA_BALLOON_TYPES = [];
export const MANGA_BALLOON_POS = [];
export const MANGA_LETTER_STYLES = [];
export const MANGA_EFFECTS = [];
export const MANGA_ELEMENTS = { effects: [], expressions: [], objects: [] };
export const PAGE_LAYOUTS = [];
