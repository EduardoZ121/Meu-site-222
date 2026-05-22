/** Map legacy PT panel values to stable ids (older saved projects). */

import { normalizeCharacter } from "./mangaStudioData";

const EXPR = {
  Normal: "normal", Feliz: "happy", Triste: "sad", Raiva: "angry", Medo: "fear",
  Vergonha: "shy", Determinado: "determined",
};
const ANGLE = {
  Frente: "front", "3/4": "three_quarter", Perfil: "profile", Costas: "back", "De cima": "top",
};
const SHOT = {
  "Close-up": "close", Médio: "medium", Longe: "wide", "Plano geral": "establishing",
};
const LIGHT = { Dia: "day", Noite: "night", Interior: "interior", "Pôr do sol": "sunset" };
const FOCUS = {
  "Personagem nítido": "character", "Cenário nítido": "scenario", Ambos: "both",
};
const BPOS = { Topo: "top", Esquerda: "left", Direita: "right", Baixo: "bottom" };
const LETTER = { Anime: "anime", "Manga clássico": "classic", Webtoon: "webtoon" };

export function migrateMangaPanel(panel) {
  if (!panel) return panel;
  return {
    ...panel,
    expression: EXPR[panel.expression] || panel.expression,
    angle: ANGLE[panel.angle] || panel.angle,
    shot: SHOT[panel.shot] || panel.shot,
    lighting: LIGHT[panel.lighting] || panel.lighting,
    focus: FOCUS[panel.focus] || panel.focus,
    balloonPos: BPOS[panel.balloonPos] || panel.balloonPos,
    letterStyle: LETTER[panel.letterStyle] || panel.letterStyle,
  };
}

export function migrateMangaProject(project) {
  if (!project) return project;
  return {
    ...project,
    characters: (project.characters || []).map(normalizeCharacter),
    panels: (project.panels || []).map(migrateMangaPanel),
  };
}
