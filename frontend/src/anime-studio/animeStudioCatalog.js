import { NODE_ICONS, NODE_LABELS } from "./types";

/** Ferramentas da sidebar — inspirado no template Kimi / spec do utilizador */
export const TOOL_CATEGORIES = [
  {
    id: "cenarios",
    label: "Cenários",
    tools: [
      { type: "cenario", preset: "Cidade", icon: "🏙️", tags: ["urban"] },
      { type: "cenario", preset: "Escola", icon: "🏫", tags: ["school"] },
      { type: "cenario", preset: "Floresta", icon: "🌲", tags: ["nature"] },
      { type: "cenario", preset: "Futurista", icon: "🚀", tags: ["sci-fi"] },
      { type: "cenario", preset: "Medieval", icon: "🏰", tags: ["fantasy"] },
      { type: "cenario", preset: "Cyberpunk", icon: "🌃", tags: ["neon"] },
    ],
  },
  {
    id: "personagens",
    label: "Personagens",
    tools: [
      { type: "personagem", preset: "Herói", role: "hero", icon: "🦸" },
      { type: "personagem", preset: "Vilão", role: "villain", icon: "😈" },
      { type: "personagem", preset: "NPC", role: "npc", icon: "👤" },
      { type: "personagem", preset: "Criatura", role: "creature", icon: "🐉" },
      { type: "personagem", preset: "Robô", role: "robot", icon: "🤖" },
    ],
  },
  {
    id: "baloes",
    label: "Balões",
    tools: [
      { type: "dialogo", preset: "Fala", speechType: "speech", icon: "💬" },
      { type: "dialogo", preset: "Pensamento", speechType: "thought", icon: "💭" },
      { type: "dialogo", preset: "Grito", speechType: "shout", icon: "📢" },
      { type: "dialogo", preset: "Narrador", speechType: "narration", icon: "📜" },
    ],
  },
  {
    id: "efeitos",
    label: "Efeitos",
    tools: [
      { type: "efeito", preset: "Aura", effectType: "radial_focus", icon: "✨" },
      { type: "efeito", preset: "Explosão", effectType: "impact", icon: "💥" },
      { type: "efeito", preset: "Energia", effectType: "speed_lines", icon: "⚡" },
      { type: "efeito", preset: "Fogo", effectType: "dramatic_shadow", icon: "🔥" },
      { type: "efeito", preset: "Relâmpago", effectType: "impact", icon: "🌩️" },
      { type: "efeito", preset: "Velocidade", effectType: "speed_lines", icon: "💨" },
    ],
  },
  {
    id: "elementos",
    label: "Elementos",
    tools: [
      { type: "texto", preset: "Texto", icon: "📝" },
      { type: "musica", preset: "Música", icon: "🎵" },
      { type: "som", preset: "Sons", icon: "🔊" },
      { type: "camera", preset: "Câmera", icon: "🎥" },
      { type: "movimento", preset: "Movimento", icon: "🎬" },
      { type: "luz", preset: "Luz", icon: "💡" },
      { type: "objeto", preset: "Objeto", icon: "📦" },
      { type: "acao", preset: "Ação", icon: "🏃" },
      { type: "transicao", preset: "Transição", icon: "➡️" },
    ],
  },
];

export const DEFAULT_SCENES = [
  { id: "scene_abertura", name: "Abertura" },
  { id: "scene_confronto", name: "Confronto" },
  { id: "scene_climax", name: "Clímax" },
  { id: "scene_final", name: "Final" },
];

export function toolLabel(tool) {
  return tool.preset || NODE_LABELS[tool.type] || tool.type;
}

export function toolDragPayload(tool) {
  return JSON.stringify({
    type: tool.type,
    preset: tool.preset,
    role: tool.role,
    speechType: tool.speechType,
    effectType: tool.effectType,
  });
}

export function parseToolDrop(data) {
  try {
    return JSON.parse(data);
  } catch {
    return { type: data };
  }
}
