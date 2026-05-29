/**
 * Manga Studio — Semantic Graph Orchestration Engine
 * Visual Graph → Semantic Parser → Narrative Tree → Hidden Prompt Composer → AI
 */

import { enrichEdgesSemantics, resolveEdgeSemantics } from "./mangaFlowSemantics";
import {
  sortPanels,
  sortPersons,
  personsForPanel,
  scenarioForPanel,
  cameraForPanel,
  speechesForPanel,
  effectsForPanel,
  objectsForPerson,
  personInteractions,
  getEdgePrompt,
  hasNodeRef,
  buildCastIdentitySection,
} from "./mangaFlowGraph";

/** Hidden semantic metadata per node type (UI + generation). */
export const NODE_SEMANTIC_PROFILES = {
  person: {
    type: "character",
    semantic_role: "actor",
    persistent_identity: true,
    maintain_reference_consistency: true,
    track_across_panels: true,
    track_across_pages: true,
    visual_memory_enabled: true,
    face_lock: true,
    outfit_lock: true,
    hairstyle_lock: true,
    body_structure_lock: true,
    reference_priority: "maximum",
  },
  scenario: {
    type: "environment",
    semantic_role: "world_anchor",
    maintain_environment_consistency: true,
    environment_memory: true,
  },
  camera: {
    type: "camera",
    semantic_role: "cinematic_direction",
    shot_type: "medium",
    angle: "eye_level",
    framing: "cinematic",
  },
  panel: {
    type: "panel",
    semantic_role: "narrative_frame",
    isolation: true,
    allow_cross_panel_bleed: false,
  },
  object: {
    type: "prop",
    semantic_role: "interactive_prop",
    persist_across_panels: true,
  },
  speech: { type: "dialogue", semantic_role: "narrative_dialogue" },
  effect: { type: "vfx", semantic_role: "visual_emphasis" },
};

export const NARRATIVE_ROLES = [
  "introduction",
  "transition",
  "dialogue",
  "action",
  "reaction",
  "close_up",
  "tension",
  "climax",
  "aftermath",
];

import { inferCharacterRelation, relationSemanticBlock, CHARACTER_RELATIONS } from "./mangaFlowRelations";

export { CHARACTER_RELATIONS, inferCharacterRelation, relationSemanticBlock };

const ANTI_PORTRAIT = [
  "NOT a centered passport photo or ID portrait.",
  "NO flat front-facing mugshot unless narrative role explicitly requires it.",
  "Use cinematic manga framing: 3/4 turn, dynamic pose, scene-directed eyelines.",
];

const ANGLE_DIRECTIVES = {
  low_angle: "Camera below — heroic, imposing.",
  high_angle: "Camera above — vulnerable, distant.",
  dutch_angle: "Tilted horizon — tension, kinetic energy.",
  birds_eye: "Top-down — spatial layout.",
  over_shoulder: "Over-the-shoulder — cinematic dialogue or action.",
  worms_eye: "Extreme low from ground.",
  eye_level: "Eye-level cinematic — still avoid flat symmetry.",
};

export function getNodeSemanticProfile(node) {
  const base = NODE_SEMANTIC_PROFILES[node?.type] || { semantic_role: "element" };
  const d = node?.data || {};
  if (node?.type === "camera") {
    return {
      ...base,
      shot_type: d.shotType || base.shot_type,
      angle: d.angle || base.angle,
      focus_target: d.focusTarget || "",
    };
  }
  if (node?.type === "person") {
    return { ...base, name: d.name || "Character" };
  }
  return base;
}

export function inferNarrativeRole(panelIndex, totalPanels, panelData = {}) {
  const explicit = panelData.narrativeRole;
  if (explicit && explicit !== "auto" && NARRATIVE_ROLES.includes(explicit)) return explicit;

  if (totalPanels <= 1) return panelData.momentDesc ? "action" : "introduction";
  if (panelIndex === 0) return "introduction";
  if (panelIndex === totalPanels - 1) return "aftermath";
  if (panelIndex === totalPanels - 2 && totalPanels >= 3) return "climax";

  const t = panelIndex / (totalPanels - 1);
  if (t < 0.35) return panelIndex % 2 === 0 ? "dialogue" : "transition";
  if (t < 0.65) return panelIndex % 2 === 0 ? "action" : "reaction";
  return panelIndex % 2 === 0 ? "tension" : "close_up";
}

const NARRATIVE_ROLE_DIRECTIVES = {
  introduction: "Establish scene, setting and characters; wide or medium establishing energy.",
  transition: "Bridge moment — movement, location shift or time pass; clear change from prior panel.",
  dialogue: "Dialogue-forward staging; speech bubbles space; faces readable but not passport shots.",
  action: "Peak physical action; dynamic pose, motion FX, strong diagonals.",
  reaction: "Emotional reaction shot; expression focus, consequences of prior beat.",
  close_up: "Tight facial or detail framing; intensity on eyes or key object.",
  tension: "Suspense beat — held pose, dramatic shadow, before release.",
  climax: "Highest dramatic peak on this page; maximum visual impact.",
  aftermath: "Resolution or quiet beat; wind-down composition, consequence visible.",
};

function formatCameraState(cameraNode, personNames = []) {
  if (!cameraNode) {
    return {
      shot: "medium",
      angle: "eye_level",
      directive: "Cinematic manga framing with dynamic composition.",
      antiPortrait: ANTI_PORTRAIT,
    };
  }
  const d = cameraNode.data || {};
  const shot = (d.shotType || "medium").replace(/_/g, " ");
  const angle = (d.angle || "eye_level").replace(/_/g, " ");
  const focus = d.focusTarget || (personNames[0] || "subject");
  return {
    shot,
    angle,
    focus,
    directive: [
      `Apply ${shot} shot, ${angle}.`,
      ANGLE_DIRECTIVES[d.angle] || ANGLE_DIRECTIVES.eye_level,
      `Compositional focus: ${focus}.`,
      ...ANTI_PORTRAIT,
    ].join(" "),
  };
}

function enrichCharacterNode(person, panelId, nodes, edges, refSlotByNodeId) {
  const d = person.data || {};
  const profile = getNodeSemanticProfile(person);
  const name = d.name || "Character";
  const slot = refSlotByNodeId.get(person.id);
  return {
    nodeId: person.id,
    name,
    profile,
    refSlot: slot || null,
    pose: (d.pose || "standing").replace(/_/g, " "),
    emotion: (d.emotion || "normal").replace(/_/g, " "),
    outfit: d.clothing || "",
    action: d.actionDesc || "",
    panelLink: getEdgePrompt(person.id, panelId, edges, nodes),
    objects: objectsForPerson(person.id, nodes, edges).map((o) => ({
      name: o.data?.name || "object",
      instruction: getEdgePrompt(person.id, o.id, edges, nodes),
    })),
    identityLock: slot
      ? `Reference image ${slot} ONLY — face, hair, skin, body, outfit locked.`
      : hasNodeRef(person)
        ? "Use uploaded reference identity — no random substitution."
        : null,
  };
}

/**
 * Build isolated context per panel (no cross-panel contamination).
 */
export function buildPanelContexts(nodes, edges, refSlots = []) {
  const panels = sortPanels(nodes);
  const refMap = new Map();
  for (const s of refSlots || []) {
    if (s.node?.id) refMap.set(s.node.id, s.slot);
  }

  const contexts = [];
  let continuationSummary = "";

  panels.forEach((panel, index) => {
    const d = panel.data || {};
    const persons = personsForPanel(panel.id, nodes, edges);
    const scenario = scenarioForPanel(panel.id, nodes, edges);
    const camera = cameraForPanel(panel.id, nodes, edges);
    const narrativeRole = inferNarrativeRole(index, panels.length, d);

    const activeCharacters = persons.map((p) =>
      enrichCharacterNode(p, panel.id, nodes, edges, refMap),
    );

    const ctx = {
      panelId: panel.id,
      panelIndex: index,
      panelTotal: panels.length,
      name: d.name || `Panel ${index + 1}`,
      narrative_role: narrativeRole,
      narrative_directive: NARRATIVE_ROLE_DIRECTIVES[narrativeRole] || "",
      momentDesc: d.momentDesc || d.promptOverride || "",
      isolation_rules: [
        "This panel is a sealed narrative container.",
        "Only listed characters appear here — no cast from other panels.",
        "Do not duplicate the same pose/shot as adjacent panels.",
      ],
      continuation_memory: continuationSummary || null,
      active_characters: activeCharacters,
      active_environment: scenario
        ? {
            name: scenario.data?.name || "Environment",
            description: [
              scenario.data?.description,
              scenario.data?.timeOfDay,
              scenario.data?.weather,
              scenario.data?.mood,
            ]
              .filter(Boolean)
              .join(" · "),
            profile: getNodeSemanticProfile(scenario),
          }
        : null,
      camera_state: formatCameraState(
        camera,
        activeCharacters.map((c) => c.name),
      ),
      speeches: speechesForPanel(panel.id, nodes, edges).map((s) => s.data?.text).filter(Boolean),
      effects: effectsForPanel(panel.id, nodes, edges).map(
        (fx) => (fx.data?.effectType || "motion").replace(/_/g, " "),
      ),
    };

    const beatShort = ctx.momentDesc || ctx.narrative_role;
    continuationSummary = continuationSummary
      ? `${continuationSummary} → Panel ${index + 1}: ${beatShort}`
      : `Panel ${index + 1}: ${beatShort}`;

    contexts.push(ctx);
  });

  return contexts;
}

export function buildComicSheetSpec(nodes, edges, context = {}, refSlots = []) {
  const semanticEdges = enrichEdgesSemantics(edges, nodes);
  const panelContexts = buildPanelContexts(nodes, semanticEdges, refSlots);
  const cast = sortPersons(nodes).map((p) => ({
    ...enrichCharacterNode(p, p.id, nodes, semanticEdges, new Map(
      (refSlots || []).filter((s) => s.node?.id).map((s) => [s.node.id, s.slot]),
    )),
    profile: getNodeSemanticProfile(p),
  }));

  return {
    type: "comic_sheet",
    version: 1,
    panel_count: panelContexts.length,
    panels: panelContexts,
    global_cast: cast,
    story: {
      synopsis: context.storySynopsis || "",
      pageBeat: context.pageBeat || "",
      priorPages: context.priorPagesSummary || "",
    },
    interactions: personInteractions(nodes, semanticEdges),
    continuity_rules: [
      "Generate ONE complete manga page / comic sheet with distinct panels.",
      "Each panel shows a DIFFERENT story beat — never four identical copies.",
      "Maintain character identity across all panels from reference slots.",
      "Environment and lighting stay coherent unless the story changes setting.",
      "Read panels left-to-right, top-to-bottom for narrative order.",
    ],
    semanticEdges,
  };
}

function renderPanelContextBlock(ctx) {
  const lines = [];
  lines.push(`#### PANEL ${ctx.panelIndex + 1}/${ctx.panelTotal} — ${ctx.name} [${ctx.narrative_role}]`);
  lines.push(`Narrative role: ${ctx.narrative_directive}`);
  if (ctx.momentDesc) lines.push(`Beat: ${ctx.momentDesc}`);
  if (ctx.continuation_memory) lines.push(`Continuity from prior: ${ctx.continuation_memory}`);
  lines.push(`Camera: ${ctx.camera_state.directive}`);

  if (ctx.active_environment) {
    lines.push(`Environment: ${ctx.active_environment.name} — ${ctx.active_environment.description || "use graph-linked setting"}.`);
  }

  if (ctx.active_characters.length) {
    lines.push("Characters (THIS panel only):");
    ctx.active_characters.forEach((c) => {
      lines.push(`  - ${c.name}${c.refSlot ? ` [ref image ${c.refSlot}]` : ""}: ${c.pose}, ${c.emotion}.`);
      if (c.outfit) lines.push(`    Outfit: ${c.outfit}`);
      if (c.panelLink) lines.push(`    Link: ${c.panelLink}`);
      if (c.identityLock) lines.push(`    ${c.identityLock}`);
      c.objects.forEach((o) => {
        if (o.instruction) lines.push(`    Object ${o.name}: ${o.instruction}`);
      });
    });
  } else {
    lines.push("Characters: none linked — environment/transition only; NO random people.");
  }

  ctx.speeches.forEach((t) => lines.push(`Dialogue: "${t}"`));
  if (ctx.effects.length) lines.push(`FX: ${ctx.effects.join(", ")}`);
  lines.push("ISOLATION: Do not import action, cast or background from other panels.");
  lines.push("");
  return lines.join("\n");
}

/**
 * Compose the full hidden + structured prompt from orchestration.
 */
export function composeOrchestratedPrompt(sheet, refSlots = [], nodes = []) {
  const lines = [];
  lines.push("=== COMIC SHEET — SEMANTIC ORCHESTRATION ENGINE ===");
  lines.push("");
  lines.push("OUTPUT: ONE unified manga page (comic sheet) with multiple DISTINCT panels.");
  lines.push("FORBIDDEN: splitting one image into identical panels; passport portraits; random NPCs.");
  lines.push("");

  sheet.continuity_rules.forEach((r) => lines.push(`• ${r}`));
  lines.push("");

  if (sheet.story.synopsis) {
    lines.push("## STORY CONTEXT");
    lines.push(sheet.story.synopsis.slice(0, 600));
    if (sheet.story.priorPages) lines.push(`Prior pages: ${sheet.story.priorPages}`);
    if (sheet.story.pageBeat) lines.push(`This page: ${sheet.story.pageBeat}`);
    lines.push("");
  }

  const castNodes = sortPersons(nodes);
  if (castNodes.length) {
    lines.push(buildCastIdentitySection(castNodes, refSlots));
  }

  if (sheet.interactions?.length) {
    lines.push("## CHARACTER INTERACTIONS (graph-mandated)");
    sheet.interactions.forEach((x) => lines.push(`- ${x.a} ↔ ${x.b}: ${x.text}`));
    lines.push("");
  }

  if (sheet.panel_count >= 2) {
    lines.push("## COMIC SHEET LAYOUT — SEQUENTIAL PANELS");
    lines.push("Draw a professional manga page with clear panel gutters/borders.");
    lines.push("Each section below is a SEPARATE panel with unique content:\n");
    sheet.panels.forEach((ctx) => lines.push(renderPanelContextBlock(ctx)));
  } else if (sheet.panel_count === 1) {
    lines.push("## SINGLE PANEL SCENE\n");
    lines.push(renderPanelContextBlock(sheet.panels[0]));
  }

  lines.push("## IDENTITY & REFERENCE ORCHESTRATION");
  lines.push("- Reference slot 1 and 2 map to specific characters — never cross-assign faces.");
  lines.push("- Secondary characters are NOT generic extras — use graph cast only.");
  lines.push("- Track outfit, hair and face across every panel on this sheet.");
  lines.push("");

  return lines.join("\n");
}

/**
 * Main entry: parse graph → comic sheet → hidden prompt.
 */
export function orchestrateMangaGeneration(nodes, edges, context = {}, refSlots = []) {
  const sheet = buildComicSheetSpec(nodes, edges, context, refSlots);
  const hiddenPrompt = composeOrchestratedPrompt(sheet, refSlots, nodes);
  const isComicSheet = sheet.panel_count >= 2;

  return {
    sheet,
    hiddenPrompt,
    panelContexts: sheet.panels,
    semanticEdges: sheet.semanticEdges,
    isComicSheet,
    mode: isComicSheet ? "comic_sheet" : sheet.panel_count === 1 ? "single_panel" : "scene",
  };
}

export function shouldUseComicSheetMode(nodes) {
  return sortPanels(nodes).length >= 2;
}
