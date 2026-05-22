/** @typedef {'personagem'|'cenario'|'objeto'|'acao'|'dialogo'|'efeito'|'transicao'|'texto'|'musica'|'som'|'camera'|'movimento'|'luz'} FlowNodeType */

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
  texto: "#06B6D4",
  musica: "#A855F7",
  som: "#14B8A6",
  camera: "#E11D48",
  movimento: "#0EA5E9",
  luz: "#FBBF24",
};

export const NODE_LABELS = {
  personagem: "Personagem",
  cenario: "Cenário",
  objeto: "Objeto",
  acao: "Ação / Pose",
  dialogo: "Diálogo",
  efeito: "Efeito Visual",
  transicao: "Transição",
  texto: "Texto",
  musica: "Música",
  som: "Som",
  camera: "Câmera",
  movimento: "Movimento",
  luz: "Luz",
};

export const NODE_ICONS = {
  personagem: "👤",
  cenario: "🌅",
  objeto: "📦",
  acao: "🏃",
  dialogo: "💬",
  efeito: "✨",
  transicao: "➡️",
  texto: "📝",
  musica: "🎵",
  som: "🔊",
  camera: "🎥",
  movimento: "🎬",
  luz: "💡",
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
    case "texto":
      return { ...base, name: "Texto", content: "", color: "#E9D5FF", fontSize: "md" };
    case "musica":
      return { ...base, name: "Música", track: "", mood: "epic", volume: 0.7 };
    case "som":
      return { ...base, name: "SFX", soundId: "impact", volume: 0.8 };
    case "camera":
      return { ...base, name: "Câmera", shot: "medium", movement: "static", angle: "eye" };
    case "movimento":
      return { ...base, name: "Movimento", path: "linear", speed: 0.5 };
    case "luz":
      return { ...base, name: "Luz", color: "#FDE68A", intensity: 0.65, direction: 120 };
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
