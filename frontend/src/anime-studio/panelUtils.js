import { buildMangaPanelPrompt } from "../lib/buildMangaPrompt";
import {
  createPanelConfigForNode,
  findLinkedNodes,
  flowNodeToCharacter,
  flowNodeToScenario,
} from "./panelDefaults";
import { getStorySequence } from "./storyAnalysis";

export function getPanelSequence(nodes, edges, story) {
  return getStorySequence(nodes, edges, story?.manualSequence);
}

export function ensurePanelConfigs(sequence, nodes, edges, existing = {}) {
  const next = { ...existing };
  sequence.forEach((node) => {
    if (!next[node.id]) {
      const linked = findLinkedNodes(node.id, nodes, edges);
      next[node.id] = createPanelConfigForNode(node, linked);
    }
  });
  return next;
}

export function panelConfigToApiPanel(config, order = 0) {
  return {
    order,
    poseId: config.poseId,
    expression: config.expression,
    angle: config.angle,
    shot: config.shot,
    framing: config.framing,
    screenDirection: config.screenDirection,
    eyeLevel: config.eyeLevel,
    lighting: config.lighting,
    lightingColorTemp: config.lightingColorTemp,
    lightingDirection: config.lightingDirection,
    inheritSceneLighting: config.inheritSceneLighting,
    focus: config.focus,
    handPose: config.handPose,
    outfitId: config.outfitId,
    balloonText: config.showBalloon ? config.balloonText : "",
    balloonType: config.balloonType,
    balloonPos: config.balloonPos,
    letterStyle: config.letterStyle,
    effects: config.effects,
    aspect: config.aspect,
    characterId: config.characterNodeId,
    scenarioId: config.scenarioNodeId,
    extraPrompt: config.extraPrompt,
    negativePrompt: config.negativePrompt,
    storyInjection: config.storyInjection,
    resultUrl: config.resultUrl,
  };
}

export function buildPanelPromptFromFlow(config, nodes, globalSettings = {}) {
  const charNode = nodes.find((n) => n.id === config.characterNodeId);
  const sceneNode = nodes.find((n) => n.id === config.scenarioNodeId);
  const panel = panelConfigToApiPanel(config);
  let prompt = buildMangaPanelPrompt({
    panel,
    character: flowNodeToCharacter(charNode),
    scenario: flowNodeToScenario(sceneNode),
    stylePreset: globalSettings.style || "manga",
  });
  if (config.extraPrompt?.trim()) prompt += ` ${config.extraPrompt.trim()}`;
  if (config.compositionNotes?.trim()) prompt += ` Composition: ${config.compositionNotes.trim()}.`;
  if (config.negativePrompt?.trim()) prompt += ` Avoid: ${config.negativePrompt.trim()}.`;
  return prompt;
}

export function syncPanelFromFlowNode(nodeId, nodes, edges, current) {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return current;
  const linked = findLinkedNodes(nodeId, nodes, edges);
  const fresh = createPanelConfigForNode(node, linked);
  return {
    ...fresh,
    ...current,
    characterNodeId: current.characterNodeId ?? fresh.characterNodeId,
    scenarioNodeId: current.scenarioNodeId ?? fresh.scenarioNodeId,
    balloonText: current.balloonText || fresh.balloonText,
  };
}
