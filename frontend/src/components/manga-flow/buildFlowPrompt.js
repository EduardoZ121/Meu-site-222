/** Builds a detailed AI image prompt from the flow canvas nodes + edges.
 *  Includes strong character reference instructions when ref images exist. */

import { buildReferenceSlotPromptSection, sortNodesForRefs } from "../../lib/mangaGenerationRefs";
import { buildSemanticGraphSection } from "../../lib/mangaFlowSemantics";
import { buildPagePromptFromFlow, shouldUseGraphPrompt } from "./buildFlowPagePrompt";
import { shouldUseComicSheetMode } from "../../lib/mangaFlowOrchestrator";
import { resolveEdgeSemantics } from "../../lib/mangaFlowSemantics";
import { buildSceneGraphSummary } from "../../lib/mangaFlowGraph";

export function buildPromptFromFlow(nodes, edges) {
  if (!nodes.length) return "// No cards on canvas. Add characters, scenarios and objects to generate a prompt.";

  const byType = {};
  for (const n of nodes) {
    if (!byType[n.type]) byType[n.type] = [];
    byType[n.type].push(n);
  }

  const lines = [];
  const hasRef = (n) => Boolean(n.data?.refImageUrl || n.data?.refPersistUrl || n.data?.refImage);
  const hasAnyRef = nodes.some(hasRef);
  const personRefs = sortNodesForRefs(byType.person || []).filter(hasRef);
  const sceneRefs = sortNodesForRefs(byType.scenario || []).filter(hasRef);
  const objectRefs = sortNodesForRefs(byType.object || []).filter(hasRef);

  lines.push("=== MANGA PANEL — AI IMAGE PROMPT ===\n");

  // Scene-graph binding rules go FIRST: the user's connections control everything.
  if (edges?.length) {
    const sceneGraphBlock = buildSceneGraphSummary(nodes, edges);
    if (sceneGraphBlock) {
      lines.push(sceneGraphBlock);
    }
  }

  // ── COMPOSITION ──
  if (byType.panel?.length) {
    lines.push("## COMPOSITION / PAGE LAYOUT");
    byType.panel.forEach((n, i) => {
      const d = n.data;
      lines.push(`Panel ${i + 1}: ${(d.panelSize || "medium").replace(/_/g, " ")} ${d.format || "rectangle"} panel, ${d.borderStyle || "thin"} borders.`);
      if (d.promptOverride) lines.push(`  ↳ ${d.promptOverride}`);
    });
    lines.push("");
  }

  // ── CAMERA ──
  if (byType.camera?.length) {
    lines.push("## CAMERA / FRAMING");
    byType.camera.forEach((n) => {
      const d = n.data;
      lines.push(`Shot: ${(d.shotType || "medium").replace(/_/g, " ")}, angle: ${(d.angle || "eye level").replace(/_/g, " ")}${d.focusTarget ? `, focus on: ${d.focusTarget}` : ""}.`);
    });
    lines.push("");
  }

  // ── SCENARIO ──
  if (byType.scenario?.length) {
    lines.push("## SCENARIO / BACKGROUND");
    byType.scenario.forEach((n) => {
      const d = n.data;
      const parts = [];
      if (d.name) parts.push(d.name);
      parts.push(`${d.timeOfDay || "day"}, ${d.weather || "clear"} weather`);
      if (d.mood && d.mood !== "neutral") parts.push(`${d.mood} mood`);
      if (d.lighting && d.lighting !== "bright") parts.push(`${d.lighting} lighting`);
      if (d.description) parts.push(d.description);
      if (d.ambientFx && d.ambientFx !== "none") parts.push(`ambient: ${d.ambientFx.replace(/_/g, " ")}`);
      lines.push(`Background: ${parts.join(", ")}.`);
      if (d.bgLayerDesc) lines.push(`  Far BG: ${d.bgLayerDesc}`);
      if (d.mgLayerDesc) lines.push(`  Midground: ${d.mgLayerDesc}`);
      if (d.fgLayerDesc) lines.push(`  Foreground: ${d.fgLayerDesc}`);
      if (d.promptOverride) lines.push(`  ↳ ${d.promptOverride}`);
    });
    lines.push("");
  }

  // ── CHARACTERS ──
  if (byType.person?.length) {
    lines.push("## CHARACTERS");
    byType.person.forEach((n, i) => {
      const d = n.data;
      const name = d.name || `Character ${i + 1}`;
      const pose = (d.pose || "standing").replace(/_/g, " ");
      const emotion = (d.emotion || "normal").replace(/_/g, " ");
      const angle = d.cameraAngle ? d.cameraAngle.replace(/_/g, " ") : "medium shot";

      lines.push(`### ${name}`);
      lines.push(`- Body pose: ${pose} (the character MUST be in this exact pose, not just standing)`);
      lines.push(`- Facial expression: ${emotion}`);
      lines.push(`- Camera framing: ${angle} — NOT a flat front-facing portrait; body turned with the scene.`);
      if (d.clothing) lines.push(`- Outfit: ${d.clothing}`);
      if (d.actionDesc) lines.push(`- Action: ${d.actionDesc}`);
      if (d.layer && d.layer !== "midground") lines.push(`- Layer depth: ${d.layer}`);

      // Check what this character is connected to
      const charEdges = edges.filter(e => e.source === n.id || e.target === n.id);
      charEdges.forEach(e => {
        const otherId = e.source === n.id ? e.target : e.source;
        const other = nodes.find(nd => nd.id === otherId);
        if (other?.type === "object" && e.data?.prompt) {
          lines.push(`- HOLDING/USING: ${other.data?.name || "object"} — ${e.data.prompt}. The ${other.data?.name || "object"} must be clearly visible in the character's hands or near them.`);
        }
        if (other?.type === "scenario" && e.data?.prompt) {
          lines.push(`- LOCATION: ${e.data.prompt} in ${other.data?.name || "the scene"}`);
        }
        if (other?.type === "person" && e.data?.prompt) {
          lines.push(`- INTERACTION with ${other.data?.name || "other character"}: ${e.data.prompt}`);
        }
      });

      if (d.speech) lines.push(`- [${(d.speechType || "speech").toUpperCase()} BUBBLE]: "${d.speech}"`);
      if (d.promptOverride) lines.push(`- OVERRIDE: ${d.promptOverride}`);
      lines.push("");
    });
  }

  // ── OBJECTS ──
  if (byType.object?.length) {
    lines.push("## OBJECTS (must be clearly visible in the scene)");
    byType.object.forEach((n) => {
      const d = n.data;
      const name = d.name || "Object";
      const parts = [name];
      if (d.size && d.size !== "medium") parts.push(`${d.size} size`);
      if (d.state && d.state !== "normal") parts.push(d.state.replace(/_/g, " "));
      if (d.description) parts.push(d.description);

      // Check who holds this object
      const objEdges = edges.filter(e => e.source === n.id || e.target === n.id);
      const holder = objEdges.find(e => {
        const otherId = e.source === n.id ? e.target : e.source;
        const other = nodes.find(nd => nd.id === otherId);
        return other?.type === "person";
      });
      if (holder) {
        const holderId = holder.source === n.id ? holder.target : holder.source;
        const holderNode = nodes.find(nd => nd.id === holderId);
        parts.push(`held/used by ${holderNode?.data?.name || "character"}`);
        if (holder.data?.prompt) parts.push(`(${holder.data.prompt})`);
      }

      lines.push(`${name}: ${parts.join(", ")}.`);
      lines.push(`  IMPORTANT: This object must be clearly rendered and visible, not just implied.`);
      if (d.promptOverride) lines.push(`  ↳ ${d.promptOverride}`);
    });
    lines.push("");
  }

  // ── EFFECTS ──
  if (byType.effect?.length) {
    lines.push("## VISUAL EFFECTS");
    byType.effect.forEach((n) => {
      const d = n.data;
      lines.push(`Effect: ${(d.effectType || "motion lines").replace(/_/g, " ")}, ${d.intensity || "medium"} intensity${d.color && d.color !== "#FFFFFF" ? `, color ${d.color}` : ""}.`);
    });
    lines.push("");
  }

  // ── DIALOGUE ──
  if (byType.speech?.length) {
    lines.push("## DIALOGUE");
    byType.speech.forEach((n) => {
      const d = n.data;
      if (d.text) lines.push(`[${(d.bubbleType || "speech").toUpperCase()}${d.style && d.style !== "normal" ? ` / ${d.style}` : ""}, tail ${d.tailDirection || "left"}]: "${d.text}"`);
    });
    lines.push("");
  }

  if (edges.length) {
    const semanticBlock = buildSemanticGraphSection(nodes, edges);
    if (semanticBlock) {
      lines.push(semanticBlock);
    } else {
      lines.push("## GRAPH CONNECTIONS");
      edges.forEach((e) => {
        const r = resolveEdgeSemantics(e, nodes);
        let line = `${r.label} [${r.connectionType}]: ${r.aiInstruction}`;
        if (e.data?.condition?.value) {
          line += ` [CONDITION: if ${e.data.condition.field} ${e.data.condition.op} "${e.data.condition.value}"]`;
        }
        lines.push(line);
      });
      lines.push("");
    }
  }

  // ══ CHARACTER REFERENCE INSTRUCTIONS (CRITICAL FOR AI) ══
  if (personRefs.length) {
    lines.push("## ⚠ CHARACTER REFERENCE — STRICT IDENTITY LOCK");
    lines.push("CRITICAL: The following characters have reference images attached.");
    lines.push("The AI MUST preserve exact identity from the reference:");
    lines.push("");
    personRefs.forEach((n, idx) => {
      const d = n.data;
      const name = d.name || "Character";
      const slotHint = personRefs.length > 1 ? ` (maps to reference Image ${idx + 1} in API)` : "";
      lines.push(`### ${name} — REFERENCE IMAGE PROVIDED${slotHint}`);
      lines.push(`- Use the EXACT SAME character from the reference image.`);
      lines.push(`- IDENTICAL face: same facial features, same eye shape, same eye color, same nose, same lips.`);
      lines.push(`- IDENTICAL hairstyle: same hair color, same hair length, same hair style, do NOT change hair.`);
      lines.push(`- IDENTICAL body: same body proportions, same body type, same skin tone.`);
      lines.push(`- IDENTICAL outfit: ${d.clothing || "same clothing as shown in reference"}.`);
      lines.push(`- Strong character reference consistency. IP-Adapter / character reference weight: HIGH.`);
      lines.push(`- Do NOT change, modify, or reimagine the character's appearance.`);
      if (d.refInstructions) {
        lines.push(`- USER INSTRUCTIONS: ${d.refInstructions}`);
      }
      lines.push("");
    });
  }

  // ── SCENARIO REFERENCE ──
  if (sceneRefs.length) {
    lines.push("## SCENARIO REFERENCE IMAGES");
    sceneRefs.forEach((n, idx) => {
      const d = n.data;
      const slotHint = sceneRefs.length > 1 ? ` (reference Image ${idx + 1} if sent to API)` : "";
      lines.push(`${d.name || "Scenario"}${slotHint}: Use the reference image as strong visual guide.`);
      lines.push(`  Match the style, lighting, color palette, architecture and atmosphere from the reference.`);
      if (d.refInstructions) lines.push(`  USER INSTRUCTIONS: ${d.refInstructions}`);
    });
    lines.push("");
  }

  // ── OBJECT REFERENCE ──
  if (objectRefs.length) {
    lines.push("## OBJECT REFERENCE IMAGES");
    objectRefs.forEach((n) => {
      const d = n.data;
      lines.push(`${d.name || "Object"}: Use the reference as visual guide for shape, color and details.`);
      if (d.refInstructions) lines.push(`  USER INSTRUCTIONS: ${d.refInstructions}`);
    });
    lines.push("");
  }

  // ── STYLE ──
  lines.push("## STYLE");
  lines.push("Japanese manga, high contrast black and white ink, professional panel composition,");
  lines.push("dynamic angles, expressive characters, screen tones for shading.");
  if (hasAnyRef) {
    lines.push("");
    lines.push("IMPORTANT: When reference images are provided, character consistency is the #1 priority.");
    lines.push("Face, body, hair and clothing must be pixel-perfect identical to the reference.");
    lines.push("Only pose, expression and camera angle should change — NOT the character's identity.");
  }

  return lines.join("\n");
}


const STYLE_PROMPTS = {
  manga: "Japanese manga style, high contrast black and white ink, screen tones, expressive linework",
  comic: "Western comic book style, bold outlines, dynamic composition, halftone shading",
  anime: "Anime illustration style, clean lines, vibrant colors, detailed eyes",
  disney: "Disney/Pixar 3D cartoon style, soft shading, expressive features, polished render",
  realistic: "Photorealistic style, detailed textures, natural lighting, cinematic composition",
  ghibli: "Studio Ghibli watercolor style, soft colors, dreamy atmosphere, detailed backgrounds",
  webtoon: "Korean webtoon style, clean digital art, soft shading, vertical composition",
  retro: "Retro 80s/90s manga aesthetic, classic screentone, vintage ink feel",
};

const SUB_STYLE_PROMPTS = {
  bw: "black and white, no color, ink only",
  color: "full color, rich palette",
  lineart: "detailed lineart, clean precise lines, no fill",
  screentone: "classic screentone shading, manga halftone patterns",
  watercolor: "watercolor rendering, soft wet edges, paint texture",
  cel: "cel-shaded, flat colors with hard shadow edges",
};

const QUALITY_PROMPTS = {
  low: "draft quality",
  medium: "good quality, detailed",
  high: "high quality, highly detailed, sharp",
  ultra: "masterpiece, best quality, ultra-detailed, 8K resolution, extremely sharp, professional",
};

const LIGHTING_PROMPTS = {
  natural: "natural daylight",
  dramatic: "dramatic lighting, deep shadows, strong highlights",
  soft: "soft diffused lighting",
  neon: "neon lighting, glowing edges, cyberpunk feel",
  cinematic: "cinematic lighting, film-like color grading",
  candlelight: "warm candlelight, golden tones",
  moonlight: "cool moonlight, blue tones, night atmosphere",
};

function appendFinalStyleSections(lines, settings, nodes) {
  const { model, quality, aspect, style, subStyle, detailLevel, lighting, mood, extraInstructions } = settings;

  lines.push("");
  lines.push("## STYLE");
  if (STYLE_PROMPTS[style]) lines.push(STYLE_PROMPTS[style] + ".");
  if (SUB_STYLE_PROMPTS[subStyle]) lines.push("Rendering: " + SUB_STYLE_PROMPTS[subStyle] + ".");
  if (detailLevel === "extreme") lines.push("Extremely detailed, every line and texture visible, production-quality artwork.");
  else if (detailLevel === "high") lines.push("Highly detailed artwork, clean professional finish.");
  if (LIGHTING_PROMPTS[lighting]) lines.push("Lighting: " + LIGHTING_PROMPTS[lighting] + ".");
  if (mood) lines.push("Mood: " + mood + " atmosphere.");
  if (aspect) lines.push("Aspect ratio: " + aspect + ".");

  if (extraInstructions?.trim()) {
    lines.push("");
    lines.push("## ADDITIONAL INSTRUCTIONS");
    lines.push(extraInstructions.trim());
  }

  const hasRefs = nodes.some(
    (n) => n.data?.refImageUrl || n.data?.refPersistUrl || n.data?.refImage,
  );
  if (hasRefs) {
    lines.push("");
    lines.push("## CHARACTER REFERENCE CONSISTENCY");
    lines.push("Preserve exact identity from reference images in every panel; vary pose and camera only.");
  }

  if (model === "flux") {
    lines.push("");
    lines.push("Optimized for: Flux model (high consistency, detailed output).");
  }

  lines.push("");
  lines.push("Negative: blurry, low quality, deformed, bad anatomy, extra fingers, duplicate panels with identical content, symmetric front-facing portrait pose, watermark, signature.");
}

/**
 * Multi-panel page prompt + generation settings.
 */
export function buildFinalPagePrompt(nodes, edges, settings = {}) {
  const { model, quality, aspect, style, pageContext = {}, refSlots } = settings;
  const pageBody = buildPagePromptFromFlow(nodes, edges, pageContext, refSlots);
  if (!pageBody) return buildFinalPrompt(nodes, edges, settings);

  const lines = [];
  lines.push(QUALITY_PROMPTS[quality] || QUALITY_PROMPTS.high);
  if (shouldUseComicSheetMode(nodes)) {
    lines.push(
      "COMIC SHEET MODE: Generate ONE complete manga page with multiple DISTINCT sequential panels in a single image.",
    );
    lines.push("Each panel must show different action, pose and framing — never duplicate the same shot.");
  } else {
    lines.push("Professional multi-panel manga page, print-ready, distinct story beats per frame.");
  }
  lines.push("");

  if (refSlots?.length) {
    const slotSection = buildReferenceSlotPromptSection(refSlots);
    if (slotSection) lines.push(slotSection);
  }

  lines.push(pageBody);
  appendFinalStyleSections(lines, settings, nodes);
  return lines.join("\n");
}

export function countPanelNodes(nodes) {
  return (nodes || []).filter((n) => n.type === "panel").length;
}

/**
 * Builds the FINAL prompt for AI generation, combining canvas data with generation settings.
 */
export function buildFinalPrompt(nodes, edges, settings = {}) {
  const { model, quality, aspect, style, subStyle, detailLevel, lighting, mood, extraInstructions, refSlots, pageContext = {} } = settings;

  const lines = [];
  lines.push(QUALITY_PROMPTS[quality] || QUALITY_PROMPTS.high);
  lines.push("");

  if (refSlots?.length) {
    const slotSection = buildReferenceSlotPromptSection(refSlots);
    if (slotSection) lines.push(slotSection);
  }

  if (shouldUseGraphPrompt(nodes, edges)) {
    const graphBody = buildPagePromptFromFlow(nodes, edges, pageContext, refSlots);
    if (graphBody) lines.push(graphBody);
  } else {
    const canvasPrompt = buildPromptFromFlow(nodes, edges);
    const canvasLines = canvasPrompt.split("\n");
    const styleIdx = canvasLines.findIndex((l) => l.startsWith("## STYLE"));
    const contentLines = styleIdx >= 0 ? canvasLines.slice(0, styleIdx) : canvasLines;
    lines.push(contentLines.join("\n"));
  }

  appendFinalStyleSections(lines, settings, nodes);
  return lines.join("\n");
}
