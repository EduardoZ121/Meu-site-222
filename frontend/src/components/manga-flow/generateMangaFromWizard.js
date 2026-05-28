/** Generates manga pages/cards/edges from wizard answers */

import { uid } from "./mangaFlowData";

const NODE_COLORS = {
  person: { bg: "rgba(147,51,234,0.15)", border: "#9333EA" },
  scenario: { bg: "rgba(20,184,166,0.15)", border: "#14B8A6" },
  object: { bg: "rgba(250,204,21,0.15)", border: "#FACC15" },
};

const NODE_DEFAULTS = {
  person: {
    name: "",
    pose: "standing",
    emotion: "normal",
    speech: "",
    speechType: "speech",
    clothing: "",
    refImage: null,
    refImageUrl: null,
  },
  scenario: {
    name: "",
    timeOfDay: "day",
    weather: "clear",
    mood: "neutral",
    description: "",
    refImage: null,
    refImageUrl: null,
  },
  object: {
    name: "",
    description: "",
    size: "medium",
    refImage: null,
    refImageUrl: null,
  },
};

function makeNode(type, x, y, overrides = {}) {
  const flowType = ["person", "scenario", "object"].includes(type) ? type : "object";
  const data = { ...NODE_DEFAULTS[flowType], _color: NODE_COLORS[flowType], ...overrides };
  if (type === "panel") {
    data.name = overrides.name || "Panel";
    data.description = `Size: ${overrides.panelSize || "medium"}, format: ${overrides.format || "rectangle"}`;
    data.size = overrides.panelSize === "small" ? "small" : overrides.panelSize === "large" ? "large" : "medium";
  } else if (type === "speech") {
    data.name = "Speech bubble";
    data.description = overrides.text || "";
  } else if (type === "effect") {
    data.name = `SFX: ${overrides.effectType || "impact"}`;
    data.description = `Intensity: ${overrides.intensity || "medium"}`;
  } else if (type === "camera") {
    data.name = `Camera: ${overrides.shotType || "medium"}`;
    data.description = `Angle: ${overrides.angle || "eye_level"}, focus: ${overrides.focusTarget || ""}`;
  }
  return {
    id: uid(flowType.slice(0, 4)),
    type: flowType,
    position: { x, y },
    data,
  };
}

function makeEdge(sourceId, targetId, prompt) {
  return {
    id: `e_${sourceId}_${targetId}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    source: sourceId,
    target: targetId,
    type: "smoothstep",
    animated: true,
    data: { prompt },
    label: prompt ? (prompt.length > 28 ? `${prompt.slice(0, 26)}…` : prompt) : "",
    labelStyle: { fill: "#C4B5FD", fontSize: 11, fontFamily: "'Inter Tight', sans-serif" },
    labelBgStyle: { fill: "#111118", fillOpacity: 0.92 },
    labelBgPadding: [6, 4],
    labelBgBorderRadius: 6,
  };
}

const PANEL_LAYOUTS = {
  1: [{ x: 40, y: 30, size: "full_page", format: "rectangle" }],
  2: [
    { x: 40, y: 30, size: "large", format: "wide" },
    { x: 40, y: 300, size: "large", format: "wide" },
  ],
  3: [
    { x: 40, y: 30, size: "medium", format: "rectangle" },
    { x: 300, y: 30, size: "medium", format: "rectangle" },
    { x: 40, y: 300, size: "large", format: "wide" },
  ],
  4: [
    { x: 40, y: 30, size: "medium", format: "rectangle" },
    { x: 300, y: 30, size: "medium", format: "rectangle" },
    { x: 40, y: 280, size: "medium", format: "rectangle" },
    { x: 300, y: 280, size: "medium", format: "rectangle" },
  ],
  6: [
    { x: 40, y: 20, size: "medium", format: "rectangle" },
    { x: 280, y: 20, size: "medium", format: "rectangle" },
    { x: 40, y: 200, size: "small", format: "wide" },
    { x: 280, y: 200, size: "small", format: "rectangle" },
    { x: 40, y: 360, size: "medium", format: "rectangle" },
    { x: 280, y: 360, size: "medium", format: "rectangle" },
  ],
};

const GENRE_ACTIONS = {
  action: ["fighting fiercely", "dodging an attack", "powering up", "running at full speed", "clash of weapons"],
  romance: ["blushing while looking away", "reaching for their hand", "standing close together", "sharing an umbrella"],
  horror: ["trembling with fear", "running in panic", "staring at something horrifying", "hiding in the shadows"],
  adventure: ["exploring a new place", "discovering a treasure", "climbing a mountain", "crossing a bridge"],
  slice_of_life: ["eating lunch together", "walking home from school", "studying at a desk", "laughing together"],
  fantasy: ["casting a spell", "riding a dragon", "entering a magical portal", "holding an enchanted weapon"],
  comedy: ["falling comically", "making a funny face", "chasing each other", "shocked reaction"],
  drama: ["crying alone", "arguing intensely", "looking at old photos", "standing in the rain"],
};

const EMOTION_MAP = {
  epic: "determined",
  dark: "serious",
  cute: "happy",
  humor: "surprised",
  dramatic: "sad",
  romantic: "blushing",
  tense: "scared",
  cheerful: "happy",
};

const STYLE_POSES = {
  shonen: ["fighting", "running", "jumping", "standing"],
  shojo: ["standing", "sitting", "walking", "looking back"],
  seinen: ["standing", "leaning", "sitting", "crouching"],
  disney: ["standing", "waving", "jumping"],
  ghibli: ["standing", "walking", "sitting"],
  dark: ["crouching", "standing", "leaning"],
  realistic: ["standing", "walking", "sitting"],
  retro: ["standing", "pointing", "running"],
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateMangaFromWizard(answers) {
  const {
    format = "manga",
    pageCount = 4,
    mainStyle = "shonen",
    genre = "action",
    synopsis = "",
    tone = "epic",
    characters = [],
    location = "",
    era = "",
    climate = "",
  } = answers;

  const numPages = Math.min(Math.max(1, Number(pageCount) || 4), 20);
  const panelsPerPage = format === "webtoon" ? 3 : format === "graphic_novel" ? 3 : 4;
  const panelLayout = PANEL_LAYOUTS[panelsPerPage] || PANEL_LAYOUTS[4];
  const genreActions = GENRE_ACTIONS[genre] || GENRE_ACTIONS.action;
  const defaultEmotion = EMOTION_MAP[tone] || "normal";
  const stylePoses = STYLE_POSES[mainStyle] || STYLE_POSES.shonen;

  const pages = [];

  for (let p = 0; p < numPages; p++) {
    const pageId = uid("pg");
    const pageName = `Page ${p + 1}`;
    const nodes = [];
    const edges = [];

    const panelNodes = panelLayout.map((layout, i) => {
      const node = makeNode("panel", layout.x, layout.y, {
        panelSize: layout.size,
        format: layout.format,
        name: `Panel ${i + 1}`,
      });
      nodes.push(node);
      return node;
    });

    const sceneNode = makeNode("scenario", 560, 60, {
      name: location || "Scene",
      timeOfDay: p === 0 ? "day" : p === numPages - 1 ? "sunset" : pickRandom(["day", "night", "sunset", "dawn"]),
      weather: climate || "clear",
      mood: tone || "neutral",
      description: era ? `${era} setting. ${synopsis ? synopsis.slice(0, 80) : ""}` : synopsis?.slice(0, 120) || "",
    });
    nodes.push(sceneNode);

    const charNodes = [];
    const charsForPage = characters.length ? characters : [{ name: "Protagonist", appearance: "", personality: "" }];
    const maxChars = Math.min(charsForPage.length, 3);

    for (let c = 0; c < maxChars; c++) {
      const char = charsForPage[c];
      const yPos = 180 + c * 180;
      const charNode = makeNode("person", 560, yPos, {
        name: char.name || `Character ${c + 1}`,
        pose: pickRandom(stylePoses),
        emotion: c === 0 ? defaultEmotion : pickRandom(["normal", "happy", "surprised", defaultEmotion]),
        clothing: char.appearance || "",
        speech: c === 0 && p === 0 ? "..." : "",
      });
      nodes.push(charNode);
      charNodes.push(charNode);

      edges.push(makeEdge(charNode.id, sceneNode.id, c === 0 ? "Standing in the scene" : "Also present here"));

      if (panelNodes[c]) {
        edges.push(makeEdge(charNode.id, panelNodes[c].id, "Featured in this panel"));
      }
    }

    if (charNodes.length >= 2) {
      const action = pickRandom(genreActions);
      edges.push(makeEdge(charNodes[0].id, charNodes[1].id, action));

      const speechNode = makeNode("speech", 800, 180, {
        text: p === 0 ? "..." : pickRandom(["!", "...", "Hey!", "No way!"]),
        bubbleType: "speech",
        style: "normal",
      });
      nodes.push(speechNode);
      edges.push(makeEdge(charNodes[0].id, speechNode.id, "Saying this"));
    }

    if (genre === "action" || genre === "fantasy") {
      if (p % 2 === 1) {
        const fxNode = makeNode("effect", 800, 380, {
          effectType: genre === "action" ? pickRandom(["impact", "speed_lines", "explosion"]) : pickRandom(["sparkle", "aura", "glow"]),
          intensity: "strong",
        });
        nodes.push(fxNode);
        if (charNodes[0]) edges.push(makeEdge(fxNode.id, charNodes[0].id, "Surrounding the character"));
      }
    }

    if (p === 0 || p === numPages - 1) {
      const camNode = makeNode("camera", 800, 60, {
        shotType: p === 0 ? "establishing" : "close_up",
        angle: p === 0 ? "high_angle" : "eye_level",
        focusTarget: charNodes[0]?.data?.name || "Main character",
      });
      nodes.push(camNode);
      if (charNodes[0]) edges.push(makeEdge(camNode.id, charNodes[0].id, "Focusing on this character"));
    }

    pages.push({ id: pageId, name: pageName, nodes, edges });
  }

  return { pages };
}
