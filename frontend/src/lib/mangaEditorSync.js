/** Sincronização Biblioteca → Editor → Painel (Manga Studio). */

import { defaultInteractionConfig } from "./mangaCharacterInteractions";
import { emptyPanel } from "./mangaStudioData";

export function emptyEditorScene() {
  const base = emptyPanel(0);
  return {
    ...base,
    partnerCharacterId: null,
    interaction: defaultInteractionConfig(),
    duoMode: false,
    scenarioDraftId: null,
  };
}

/** Copia campos de montagem do painel para o editor. */
export function panelToEditorScene(panel) {
  if (!panel) return emptyEditorScene();
  return {
    ...emptyEditorScene(),
    characterId: panel.characterId,
    partnerCharacterId: panel.partnerCharacterId || null,
    duoMode: Boolean(panel.partnerCharacterId),
    scenarioId: panel.scenarioId,
    poseId: panel.poseId,
    expression: panel.expression,
    angle: panel.angle,
    shot: panel.shot,
    lighting: panel.lighting,
    focus: panel.focus,
    framing: panel.framing,
    balloonText: panel.balloonText,
    balloonType: panel.balloonType,
    balloonPos: panel.balloonPos,
    letterStyle: panel.letterStyle,
    effects: { ...(panel.effects || {}) },
    interaction: { ...defaultInteractionConfig(), ...(panel.interaction || {}) },
  };
}

/** Aplica cena do editor ao painel ativo. */
export function editorSceneToPanelPatch(editorScene) {
  if (!editorScene) return {};
  const ix = editorScene.interaction || defaultInteractionConfig();
  return {
    characterId: editorScene.characterId,
    partnerCharacterId: editorScene.duoMode ? editorScene.partnerCharacterId : null,
    interaction: editorScene.duoMode ? ix : null,
    scenarioId: editorScene.scenarioId,
    poseId: editorScene.poseId,
    expression: editorScene.expression,
    angle: editorScene.angle,
    shot: editorScene.shot,
    lighting: editorScene.lighting,
    focus: editorScene.focus,
    framing: editorScene.framing,
    balloonText: editorScene.balloonText,
    balloonType: editorScene.balloonType,
    balloonPos: editorScene.balloonPos,
    letterStyle: editorScene.letterStyle,
    effects: { ...(editorScene.effects || {}) },
  };
}

const POSE_FROM_IX = {
  talk: "talk",
  fight: "attack",
  walk: "run",
  chase: "run",
  hug: "talk",
  battle_anime: "attack",
  romance: "talk",
  protect: "attack",
  attack: "attack",
  team: "talk",
};

const LIGHT_FROM_SCENE = {
  morning: "day",
  afternoon: "day",
  sunset: "sunset",
  night: "night",
  dawn: "day",
};

/** Converte rascunho de cenário (biblioteca/editor) em patch do editor. */
export function draftToEditorScenePatch(draft, current = emptyEditorScene()) {
  if (!draft) return {};
  const primaryCharId = draft.characterIds?.[0] || current.characterId;
  const partnerId = draft.characterIds?.[1] || null;
  const poseId = POSE_FROM_IX[draft.interactionType] || current.poseId || "talk";
  const lighting = LIGHT_FROM_SCENE[draft.timeOfDay] || current.lighting || "day";
  return {
    scenarioId: draft.scenarioId,
    characterId: primaryCharId,
    partnerCharacterId: partnerId,
    duoMode: Boolean(partnerId && draft.characterIds?.length >= 2),
    poseId,
    lighting,
    focus: "both",
    interaction: {
      ...defaultInteractionConfig(partnerId),
      interactionType: draft.interactionType || "talk",
      partnerId,
    },
    scenarioDraftId: draft.scenarioId,
  };
}

/** Atualiza editorScene e aplica ao painel ativo (Biblioteca/Editor → Painel). */
export function mergeEditorScene(project, scenePartial, activePanelId) {
  const editorScene = {
    ...(project.editorScene || emptyEditorScene()),
    ...scenePartial,
  };
  const panelPatch = editorSceneToPanelPatch(editorScene);
  const panels = activePanelId
    ? (project.panels || []).map((p) =>
        p.id === activePanelId ? { ...p, ...panelPatch } : p,
      )
    : project.panels;
  return { editorScene, panels, panelPatch };
}
