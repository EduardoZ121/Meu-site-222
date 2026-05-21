/** Configuração de painel ativo (compatível com buildMangaPanelPrompt). */

export const ASPECT_RATIOS = [
  { id: "4:5", label: "4:5 · Manga" },
  { id: "3:4", label: "3:4 · Vertical" },
  { id: "1:1", label: "1:1 · Quadrado" },
  { id: "16:9", label: "16:9 · Largo" },
  { id: "9:16", label: "9:16 · Story" },
];

export const DEFAULT_PANEL_CONFIG = {
  poseId: "talk",
  expression: "normal",
  angle: "three_quarter",
  shot: "medium",
  framing: "static",
  screenDirection: "left-to-right",
  eyeLevel: 0,
  lighting: "day",
  lightingColorTemp: "warm",
  lightingDirection: 120,
  inheritSceneLighting: true,
  focus: "both",
  handPose: "open",
  outfitId: "casual",
  balloonText: "",
  balloonType: "speech",
  balloonPos: "top",
  letterStyle: "anime",
  balloonShape: "round",
  showBalloon: true,
  effects: {
    speed_lines: false,
    impact: false,
    dramatic_shadow: false,
    radial_focus: false,
    mosaic: false,
    blood: false,
    chibi: false,
    super_deform: false,
    realism_anime: false,
  },
  aspect: "4:5",
  characterNodeId: null,
  scenarioNodeId: null,
  extraPrompt: "",
  negativePrompt: "",
  compositionNotes: "",
  consistencyLock: true,
  storyInjection: false,
  resultUrl: null,
};

export function createPanelConfigForNode(node, linked = {}) {
  const base = { ...DEFAULT_PANEL_CONFIG, characterNodeId: null, scenarioNodeId: null };
  if (!node) return base;

  const type = node.data?.flowType;
  if (type === "personagem") {
    base.characterNodeId = node.id;
    base.poseId = "talk";
  }
  if (type === "cenario") {
    base.scenarioNodeId = node.id;
    base.lighting = node.data.timeOfDay === "night" ? "night" : "day";
    base.lightingColorTemp = node.data.lightingTemp || "warm";
    base.lightingDirection = node.data.lightingDirection ?? 120;
  }
  if (type === "dialogo") {
    base.balloonText = node.data.text || "";
    base.balloonType = node.data.speechType || "speech";
    base.balloonPos = node.data.position || "top";
    base.letterStyle = node.data.fontStyle || "anime";
    base.showBalloon = true;
  }
  if (type === "acao") {
    const cat = node.data.category;
    if (cat === "fight") base.poseId = "attack";
    else if (cat === "emotional") base.expression = "sad";
    else base.poseId = "talk";
    base.handPose = node.data.handPose || "open";
    base.framing = (node.data.intensity ?? 0.5) > 0.6 ? "shake" : "static";
  }
  if (type === "efeito") {
    const et = node.data.effectType;
    if (et) {
      const map = {
        speed_lines: "speed_lines",
        impact: "impact",
        dramatic_shadow: "dramatic_shadow",
        radial_focus: "radial_focus",
        mosaic: "mosaic",
        blood: "blood",
        chibi: "chibi",
      };
      const key = map[et] || et;
      if (key in base.effects) base.effects = { ...base.effects, [key]: true };
    }
  }

  if (linked.characterNodeId) base.characterNodeId = linked.characterNodeId;
  if (linked.scenarioNodeId) base.scenarioNodeId = linked.scenarioNodeId;

  return base;
}

export function findLinkedNodes(nodeId, nodes, edges) {
  const incoming = edges.filter((e) => e.target === nodeId).map((e) => e.source);
  const out = { characterNodeId: null, scenarioNodeId: null };
  incoming.forEach((sid) => {
    const n = nodes.find((x) => x.id === sid);
    if (!n) return;
    if (n.data.flowType === "personagem") out.characterNodeId = n.id;
    if (n.data.flowType === "cenario") out.scenarioNodeId = n.id;
  });
  return out;
}

export function flowNodeToCharacter(node) {
  if (!node || node.data.flowType !== "personagem") return null;
  const d = node.data;
  return {
    id: node.id,
    name: d.name || "Personagem",
    thumb: d.avatarUrl,
    bodyType: d.bodyType,
    sheets: d.referenceSheet || {},
    expressions: d.expressions || {},
    outfits: d.outfits || [],
    consistencyScore: d.consistencyScore ?? 0,
  };
}

export function flowNodeToScenario(node) {
  if (!node || node.data.flowType !== "cenario") return null;
  const d = node.data;
  return {
    id: node.id,
    name: d.name || "Cenário",
    thumb: d.backgroundUrl,
    description: d.location || "",
    timeOfDay: d.timeOfDay,
    weather: d.weather,
    lightingDirection: d.lightingDirection,
    lightingIntensity: d.lightingIntensity,
    lightingColorTemp: d.lightingTemp,
    variants: d.variants,
  };
}
