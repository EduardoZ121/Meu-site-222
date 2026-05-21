/** @typedef {'personagem'|'cenario'|'objeto'|'acao'|'dialogo'|'efeito'|'transicao'} FlowNodeType */

/**
 * @typedef {Object} FlowProject
 * @property {string} id
 * @property {string} name
 * @property {import('@xyflow/react').Node[]} nodes
 * @property {import('@xyflow/react').Edge[]} edges
 * @property {Object} globalSettings
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {boolean} [tutorialDone]
 */

export const NODE_COLORS = {
  personagem: "#F97316",
  cenario: "#3B82F6",
  objeto: "#8B5CF6",
  acao: "#22C55E",
  dialogo: "#EAB308",
  efeito: "#EC4899",
  transicao: "#6B7280",
};

export const NODE_LABELS = {
  personagem: "Personagem",
  cenario: "Cenário",
  objeto: "Objeto",
  acao: "Ação / Pose",
  dialogo: "Diálogo",
  efeito: "Efeito Visual",
  transicao: "Transição",
};

export const NODE_ICONS = {
  personagem: "👤",
  cenario: "🌅",
  objeto: "📦",
  acao: "🏃",
  dialogo: "💬",
  efeito: "✨",
  transicao: "➡️",
};

export function defaultNodeData(type) {
  const base = { label: NODE_LABELS[type] || "Caixa", customColor: null };
  switch (type) {
    case "personagem":
      return {
        ...base,
        name: "Personagem",
        avatarUrl: null,
        bodyType: "athletic",
        referenceSheet: {},
        expressions: {},
        outfits: [
          { id: "casual", name: "Casual", thumb: null, isDefault: true },
          { id: "battle", name: "Batalha", thumb: null },
          { id: "formal", name: "Formal", thumb: null },
        ],
        consistencyScore: 0,
      };
    case "cenario":
      return {
        ...base,
        name: "Cenário",
        backgroundUrl: null,
        location: "",
        timeOfDay: "afternoon",
        weather: "clear",
        lightingDirection: 120,
        lightingIntensity: 0.65,
        lightingTemp: "warm",
        variants: { day: true, night: true, rain: false },
      };
    case "objeto":
      return {
        ...base,
        name: "Objeto",
        imageUrl: null,
        description: "",
        position: "hand",
        size: "medium",
      };
    case "acao":
      return {
        ...base,
        name: "Ação",
        category: "action",
        handPose: "open",
        poseImageUrl: null,
        intensity: 0.5,
      };
    case "dialogo":
      return {
        ...base,
        name: "Diálogo",
        text: "",
        speechType: "speech",
        balloonShape: "normal",
        position: "top",
        fontStyle: "anime",
      };
    case "efeito":
      return {
        ...base,
        effectType: "speed_lines",
        intensity: 0.4,
        direction: 45,
        position: "center",
      };
    case "transicao":
      return {
        ...base,
        transitionType: "cut",
        duration: "instant",
        direction: "left-to-right",
      };
    default:
      return base;
  }
}

export function edgeColor(sourceType, targetType) {
  if (sourceType === "personagem" && targetType === "acao") return NODE_COLORS.personagem;
  if (sourceType === "cenario") return NODE_COLORS.cenario;
  if (sourceType === "acao" && targetType === "dialogo") return NODE_COLORS.acao;
  if (sourceType === "dialogo" && targetType === "efeito") return NODE_COLORS.dialogo;
  if (targetType === "transicao") return NODE_COLORS.transicao;
  return "#8B5CF6";
}

export function calcGenerationCost(nodeCount, mode) {
  if (mode === "panel") return 15;
  if (mode === "page") return 40;
  if (mode === "chapter") return 150;
  if (nodeCount <= 2) return 15;
  if (nodeCount <= 8) return 40;
  return 150;
}

export function autoOutputMode(nodeCount) {
  if (nodeCount <= 2) return "panel";
  if (nodeCount <= 8) return "page";
  return "chapter";
}
