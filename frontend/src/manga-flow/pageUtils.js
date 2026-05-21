import { buildMangaPagePrompt } from "../lib/buildMangaPrompt";
import { flowNodeToCharacter, flowNodeToScenario } from "./panelDefaults";
import { getStorySequence } from "./storyAnalysis";
import { buildPagesFromSequence } from "./pageDefaults";
import { panelConfigToApiPanel } from "./panelUtils";

export function getFlowProjectMeta(nodes, globalSettings) {
  return {
    stylePreset: globalSettings?.style || "manga",
    pageLayout: globalSettings?.pageLayout || "horizontal",
    characters: nodes
      .filter((n) => n.data?.flowType === "personagem")
      .map(flowNodeToCharacter)
      .filter(Boolean),
    scenarios: nodes
      .filter((n) => n.data?.flowType === "cenario")
      .map(flowNodeToScenario)
      .filter(Boolean),
  };
}

export function pageToApiPanels(page, getPanelConfig, orderOffset = 0) {
  return (page.slotNodeIds || [])
    .filter(Boolean)
    .map((nodeId, i) => {
      const config = getPanelConfig(nodeId);
      return panelConfigToApiPanel(config, orderOffset + i);
    });
}

export function buildPagePromptFromFlow(page, nodes, globalSettings, getPanelConfig) {
  const panels = pageToApiPanels(page, getPanelConfig);
  const project = {
    ...getFlowProjectMeta(nodes, globalSettings),
    pageLayout: page.layout,
  };
  let prompt = buildMangaPagePrompt(panels, project);
  if (page.pageNotes?.trim()) {
    prompt += `\nPage notes: ${page.pageNotes.trim()}`;
  }
  if (page.borderStyle === "webtoon") {
    prompt += "\nWebtoon vertical scroll style, full-bleed panels.";
  } else if (page.borderStyle === "bleed") {
    prompt += "\nFull bleed artwork to page edges.";
  }
  prompt += `\nGutter ${page.gutter}px, margin ${page.margin}px, reading ${page.readingOrder}.`;
  return prompt;
}

export function ensurePageState(nodes, edges, story, pageState, panels) {
  const sequence = getStorySequence(nodes, edges, story?.manualSequence);
  const layout = pageState?.defaultLayout || "horizontal";
  let items = pageState?.items || [];
  if (!items.length && sequence.length) {
    items = buildPagesFromSequence(sequence, layout);
  }
  return { sequence, items, activePageId: pageState?.activePageId || items[0]?.id || null };
}

export function nodeLabel(node) {
  if (!node) return "—";
  return node.data?.name || node.data?.text?.slice(0, 20) || node.data?.flowType || "?";
}
