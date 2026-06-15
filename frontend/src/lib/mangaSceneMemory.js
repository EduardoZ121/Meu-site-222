/**
 * Manga Scene Memory — persistent narrative state + hidden node prompts.
 *
 * Builds an invisible intelligence layer between the visual graph and the
 * AI prompt: scene state, narrative memory, emotional arc, hidden directives.
 *
 * Pure helper — no UI changes, no node schema changes. Consumed by the
 * orchestrator and prompt builders.
 */

import { getCharacterIdentityTag } from "./mangaCharacterRef";
import { hiddenPromptsForNode } from "./mangaFlowPromptLibrary";

/* -------------------------------------------------------------------------- */
/* HIDDEN PROMPTS PER NODE                                                    */
/* -------------------------------------------------------------------------- */

const PERSON_HIDDEN = `Hidden identity directive: maintain EXACT visual identity for this character across all panels and pages. Same face, same hair color and style, same skin tone, same body type, same outfit, same accessories. This is a recurring PRIMARY character — never reinvent.`;

const SUPPORT_HIDDEN = `Hidden identity directive: SECONDARY (support) character with its OWN independent identity. Has separate face, hair, skin, body and outfit from any primary. Appears in the scene next to the primary character but never blends with them. Reference image is bound to slot 2 — never reuse for any other character. Same persistence rules: face/hair/skin/outfit locked across all panels.`;

const SCENARIO_HIDDEN = `Hidden environment directive: this location stays consistent across the scene. Architecture, lighting, color palette, time-of-day and mood persist between panels unless the story explicitly transitions to another scenario node.`;

const CAMERA_HIDDEN = `Hidden cinematography directive: this camera is authoritative — it overrides any default front portrait. Apply its shot size, angle and perspective literally; body orientation must follow it. Characters act inside the scene, never pose.`;

const OBJECT_HIDDEN = `Hidden prop directive: this object persists with its owner. When the linked character appears, the object appears physically connected (in hand, on belt, worn) — not floating decoration.`;

const SPEECH_HIDDEN = `Hidden dialogue directive: this line is spoken by the linked character. Speech bubble tail points to their mouth. The character's expression and gaze must match the line's emotion.`;

const EFFECT_HIDDEN = `Hidden VFX directive: this effect impacts or surrounds the linked character/panel — integrate it into the composition, not as a sticker.`;

const PANEL_HIDDEN = `Hidden panel directive: this panel is a sealed narrative beat. Only its linked cast appears, only its linked scenario is its setting, and its composition is unique among the page (different shot, angle, distance, pose from every other panel).`;

export function buildHiddenNodePrompt(node) {
  if (!node) return "";
  const d = node.data || {};
  const name = (d.name && String(d.name).trim()) || node.type;
  switch (node.type) {
    case "person": {
      const tag = getCharacterIdentityTag(node);
      return `${name} [${tag}] (PRIMARY) — ${PERSON_HIDDEN}`;
    }
    case "support": {
      const tag = getCharacterIdentityTag(node);
      return `${name} [${tag}] (SUPPORT) — ${SUPPORT_HIDDEN}`;
    }
    case "scenario":
      return `${name} — ${SCENARIO_HIDDEN}`;
    case "camera": {
      const shot = (d.shotType || "medium").replace(/_/g, " ");
      const angle = (d.angle || "eye_level").replace(/_/g, " ");
      return `${name} (${shot}, ${angle}) — ${CAMERA_HIDDEN}`;
    }
    case "object":
      return `${name} — ${OBJECT_HIDDEN}`;
    case "speech":
      return `${name} — ${SPEECH_HIDDEN}`;
    case "effect":
      return `${name} — ${EFFECT_HIDDEN}`;
    case "panel":
      return `${name} — ${PANEL_HIDDEN}`;
    default:
      return "";
  }
}

function optionHiddenSuffix(node) {
  const opts = hiddenPromptsForNode(node);
  if (!opts.length) return "";
  return ` Option locks: ${opts.join(" ")}`;
}

export function buildHiddenNodePromptWithOptions(node) {
  const base = buildHiddenNodePrompt(node);
  const suffix = optionHiddenSuffix(node);
  if (!base && !suffix) return "";
  return `${base}${suffix}`.trim();
}

/* -------------------------------------------------------------------------- */
/* EMOTIONAL ARC + ACTION FLOW                                                */
/* -------------------------------------------------------------------------- */

const EMOTION_MAP = {
  normal: { tone: "neutral", weight: 0 },
  happy: { tone: "uplifting", weight: 1 },
  sad: { tone: "melancholic", weight: -1 },
  angry: { tone: "intense", weight: 2 },
  fear: { tone: "tense", weight: 1 },
  shy: { tone: "soft", weight: 0 },
  determined: { tone: "driven", weight: 2 },
  surprised: { tone: "shocked", weight: 1 },
  love: { tone: "intimate", weight: 0 },
};

function emotionOf(d) {
  if (!d) return "normal";
  return String(d.emotion || "normal").toLowerCase();
}

function deriveEmotionalTone(activeCharacters) {
  if (!activeCharacters?.length) return null;
  const tones = activeCharacters
    .map((c) => EMOTION_MAP[c.emotion?.replace(/\s+/g, "_")] || EMOTION_MAP.normal)
    .filter(Boolean);
  if (!tones.length) return null;
  const weight = tones.reduce((s, t) => s + t.weight, 0);
  if (weight >= 2) return "intense / dramatic";
  if (weight === 1) return "rising / charged";
  if (weight === 0) return "balanced / observant";
  if (weight === -1) return "subdued / reflective";
  return "heavy / melancholic";
}

/* -------------------------------------------------------------------------- */
/* SCENE STATE                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Build a persistent SceneState object — narrative memory the AI must respect.
 * @param {object[]} panelContexts  output of buildPanelContexts
 * @param {object[]} nodes          full graph nodes
 */
export function buildSceneState(panelContexts = [], nodes = []) {
  const activeCharacters = new Map();
  const environments = new Map();
  const cameras = [];
  const objects = new Map();
  const emotionalArc = [];
  const actionFlow = [];

  panelContexts.forEach((ctx, idx) => {
    ctx.active_characters?.forEach((c) => {
      const prev = activeCharacters.get(c.nodeId) || { name: c.name, outfits: new Set(), poses: new Set(), refSlot: c.refSlot, firstPanel: idx + 1 };
      if (c.outfit) prev.outfits.add(c.outfit);
      if (c.pose) prev.poses.add(c.pose);
      prev.lastPanel = idx + 1;
      activeCharacters.set(c.nodeId, prev);
    });
    if (ctx.active_environment) {
      const env = environments.get(ctx.active_environment.name) || {
        name: ctx.active_environment.name,
        description: ctx.active_environment.description,
        firstPanel: idx + 1,
      };
      env.lastPanel = idx + 1;
      environments.set(env.name, env);
    }
    if (ctx.camera_state) {
      cameras.push({ panel: idx + 1, shot: ctx.camera_state.shot, angle: ctx.camera_state.angle });
    }
    ctx.active_characters?.forEach((c) => {
      c.objects?.forEach((o) => {
        const ob = objects.get(o.name) || { name: o.name, owners: new Set(), firstPanel: idx + 1 };
        ob.owners.add(c.name);
        ob.lastPanel = idx + 1;
        objects.set(o.name, ob);
      });
    });
    emotionalArc.push({
      panel: idx + 1,
      role: ctx.narrative_role,
      tone: deriveEmotionalTone(ctx.active_characters) || "balanced",
    });
    actionFlow.push({
      panel: idx + 1,
      beat: ctx.momentDesc || ctx.narrative_directive || ctx.narrative_role,
    });
  });

  return {
    activeCharacters: [...activeCharacters.values()].map((c) => ({
      ...c,
      outfits: [...c.outfits],
      poses: [...c.poses],
    })),
    activeEnvironments: [...environments.values()],
    cameraStates: cameras,
    objectState: [...objects.values()].map((o) => ({ ...o, owners: [...o.owners] })),
    emotionalArc,
    actionFlow,
    visualConsistency: {
      locked: true,
      rules: [
        "Same face, hair, skin and outfit for each character across every panel and page.",
        "Same architecture, lighting and color palette for each environment across panels.",
        "Recurring objects keep their shape, color and ownership.",
        "Style remains identical (no swap between manga / anime color / realistic / 3D).",
      ],
    },
  };
}

/* -------------------------------------------------------------------------- */
/* RENDER SCENE STATE INTO PROMPT                                             */
/* -------------------------------------------------------------------------- */

export function renderSceneStateBlock(state) {
  if (!state) return "";
  const lines = ["## SCENE MEMORY — PERSISTENT STATE (must be obeyed across every panel)"];

  if (state.activeCharacters.length) {
    lines.push("Active cast (locked identity through whole sequence):");
    state.activeCharacters.forEach((c) => {
      const outfit = c.outfits.length ? `outfit: ${c.outfits.join(" / ")}` : "outfit from reference";
      const ref = c.refSlot ? ` [ref image ${c.refSlot}]` : "";
      lines.push(`  - ${c.name}${ref} | panels ${c.firstPanel}→${c.lastPanel} | ${outfit}`);
    });
  }
  if (state.activeEnvironments.length) {
    lines.push("Active environments (persist between panels):");
    state.activeEnvironments.forEach((e) => {
      lines.push(`  - ${e.name} | panels ${e.firstPanel}→${e.lastPanel}${e.description ? ` — ${e.description}` : ""}`);
    });
  }
  if (state.objectState.length) {
    lines.push("Persistent objects:");
    state.objectState.forEach((o) => {
      lines.push(`  - ${o.name} carried by ${o.owners.join(", ")} (panels ${o.firstPanel}→${o.lastPanel})`);
    });
  }
  if (state.cameraStates.length) {
    lines.push("Camera flow across the page (each panel UNIQUE):");
    state.cameraStates.forEach((c) => {
      lines.push(`  - Panel ${c.panel}: ${c.shot} / ${c.angle}`);
    });
  }
  if (state.emotionalArc.length) {
    lines.push("Emotional arc (must evolve, never flat):");
    state.emotionalArc.forEach((e) => {
      lines.push(`  - Panel ${e.panel} [${e.role}]: ${e.tone}`);
    });
  }
  if (state.actionFlow.length) {
    lines.push("Action flow (chronological — do not reorder, do not duplicate):");
    state.actionFlow.forEach((a) => {
      lines.push(`  - Panel ${a.panel}: ${a.beat}`);
    });
  }
  lines.push("");
  lines.push("Visual consistency lock:");
  state.visualConsistency.rules.forEach((r) => lines.push(`  • ${r}`));
  lines.push("");
  return lines.join("\n");
}

/* -------------------------------------------------------------------------- */
/* HIDDEN NODE PROMPTS BLOCK                                                  */
/* -------------------------------------------------------------------------- */

export function renderHiddenNodePromptsBlock(nodes = []) {
  const blocks = [];
  for (const n of nodes) {
    const p = buildHiddenNodePromptWithOptions(n);
    if (p) blocks.push(`- ${p}`);
  }
  if (!blocks.length) return "";
  return [
    "## HIDDEN NODE DIRECTIVES (auto-generated, must be obeyed)",
    "Every graph element produces an invisible rule below. The AI cannot skip these.",
    "",
    ...blocks,
    "",
  ].join("\n");
}

/* -------------------------------------------------------------------------- */
/* PRIORITY BLOCK                                                             */
/* -------------------------------------------------------------------------- */

export const PRIORITY_BLOCK = [
  "## CONTEXT PRIORITY (resolve in this order if any conflict)",
  "1. CHARACTER IDENTITY & REFERENCES (highest) — never swap faces, never invent NPCs, never alter outfit/hair.",
  "2. VISUAL CONSISTENCY across panels — keep style, palette, line quality identical through the sequence.",
  "3. SCENARIO / ENVIRONMENT — backgrounds and lighting persist; no random location swap.",
  "4. CAMERA / FRAMING — apply connected camera literally; body direction follows it.",
  "5. EMOTIONAL TONE — match expressions to dialogue and arc.",
  "6. NARRATIVE FLOW — panels advance the story in order, no duplicate beats.",
  "",
].join("\n");
