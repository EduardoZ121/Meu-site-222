import { MANGA_PROMPT_EN } from "./mangaStudioCatalog";
import { buildCharacterDnaString, characterRefHint } from "./comic-engine/characterLock";
import { deriveBackgroundSeed, lightingPromptPhrase, resolvePanelLighting } from "./comic-engine/sceneContinuity";
import { handPromptAddendum } from "./comic-engine/handFixer";

function balloonHint(typeId) {
  if (typeId === "thought") return "thought bubble cloud";
  if (typeId === "shout") return "bold shout bubble with emphasis lines";
  if (typeId === "whisper") return "small whisper bubble, dotted outline";
  return "clean speech bubble";
}

function activeEffects(effects = {}) {
  const keys = Object.entries(effects).filter(([, v]) => v).map(([k]) => k);
  const map = {
    speed_lines: "dynamic speed lines",
    impact: "impact flash and action lines",
    dramatic_shadow: "dramatic noir shadows",
    radial_focus: "radial focus vignette on subject",
    mosaic: "censorship mosaic where needed",
    blood: "stylized blood splatter (mature)",
    chibi: "chibi super-deformed cute style",
    super_deform: "super-deformed exaggerated proportions",
    realism_anime: "blend of anime linework with semi-realistic shading",
  };
  return keys.map((k) => map[k]).filter(Boolean);
}

function en(map, key, fallback = "") {
  return (map && key && map[key]) || fallback || String(key || "");
}

/**
 * @param {object} opts
 * @param {object} opts.panel
 * @param {object|null} opts.character
 * @param {object|null} opts.scenario
 * @param {string} [opts.pageLayout]
 */
export function buildMangaPanelPrompt({ panel, character, scenario, pageLayout, stylePreset }) {
  const style = stylePreset || "manga-classic";
  const parts = [
    `[STYLE LOCK] ${style} manga/comic panel illustration, premium quality.`,
    "Professional manga/comic panel illustration, premium dark-editorial quality.",
    "Clean ink lines, screentones optional, high detail faces and hands.",
    "No watermarks, no UI chrome, single comic panel frame with border.",
  ];

  if (character) {
    parts.push(buildCharacterDnaString(character, panel.outfitId));
    parts.push(characterRefHint(character));
  }
  parts.push(
    `Pose: ${en(MANGA_PROMPT_EN.poses, panel.poseId, panel.poseId)}. Expression: ${en(MANGA_PROMPT_EN.expressions, panel.expression, panel.expression)}.`,
  );
  parts.push(handPromptAddendum(panel.poseId, panel.handPose));
  parts.push(
    `Camera angle: ${en(MANGA_PROMPT_EN.angles, panel.angle, panel.angle)}. Shot size: ${en(MANGA_PROMPT_EN.shots, panel.shot, panel.shot)}.`,
  );
  if (panel.eyeLevel != null && panel.eyeLevel !== 0) {
    parts.push(`Camera eye level ${panel.eyeLevel}° (${panel.eyeLevel < 0 ? "slightly low angle" : "slightly high angle"}).`);
  }
  parts.push(`Framing/camera move feel: ${en(MANGA_PROMPT_EN.framing, panel.framing, panel.framing)}.`);
  if (panel.screenDirection) {
    parts.push(`Character screen direction: ${panel.screenDirection} (180° rule).`);
  }

  const lighting = resolvePanelLighting(panel, scenario);
  parts.push(`[LIGHTING] ${lightingPromptPhrase(lighting)}.`);
  if (scenario) {
    parts.push(`Background/scenario: ${scenario.name}. ${scenario.description || ""}`);
  } else {
    parts.push(`Lighting preset: ${en(MANGA_PROMPT_EN.lighting, panel.lighting, panel.lighting)}.`);
  }
  parts.push(`Visual focus: ${en(MANGA_PROMPT_EN.focus, panel.focus, panel.focus)}.`);
  const bgSeed = panel.backgroundSeed ?? deriveBackgroundSeed(scenario?.id || panel.scenarioId, panel.angle);
  parts.push(`Background consistency seed ${bgSeed}.`);

  const fx = activeEffects(panel.effects);
  if (fx.length) parts.push(`Effects: ${fx.join(", ")}.`);

  const text = String(panel.balloonText || "").trim();
  if (text) {
    parts.push(
      `Include ${balloonHint(panel.balloonType)} at ${en(MANGA_PROMPT_EN.balloonPos, panel.balloonPos, panel.balloonPos)} with legible ${en(MANGA_PROMPT_EN.letterStyles, panel.letterStyle, panel.letterStyle)} lettering: "${text}".`,
    );
  }

  if (pageLayout) {
    parts.push(`Page layout context: ${pageLayout} manga page flow.`);
  }

  parts.push(`Aspect ratio target: ${panel.aspect || "4:5"}.`);
  return parts.join(" ");
}

export function buildMangaPagePrompt(panels, project) {
  const summaries = panels.map((p, i) => {
    const char = project?.characters?.find((c) => c.id === p.characterId);
    const scene = project?.scenarios?.find((s) => s.id === p.scenarioId);
    return `Panel ${i + 1}: ${buildMangaPanelPrompt({ panel: p, character: char, scenario: scene, pageLayout: project?.pageLayout })}`;
  });
  return [
    "Multi-panel manga page, cohesive style across panels, professional print quality.",
    ...summaries,
  ].join("\n");
}

export function buildMangaChapterPrompt(pages, project) {
  const pageBlocks = (pages || []).map((page, i) => {
    const panels = page.panels || [];
    const body = buildMangaPagePrompt(panels, {
      ...project,
      pageLayout: page.layout || project?.pageLayout,
    });
    return `Page ${i + 1}:\n${body}`;
  });
  return [
    "Full manga chapter sequence (5 pages), consistent characters and style throughout.",
    ...pageBlocks,
  ].join("\n\n");
}
