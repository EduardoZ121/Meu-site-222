/**
 * Manga Studio — Semantic Graph Orchestration Engine
 * Visual Graph → Semantic Parser → Narrative Tree → Hidden Prompt Composer → AI
 */

import { enrichEdgesSemantics, resolveEdgeSemantics } from "./mangaFlowSemantics";
import {
  buildSceneState,
  renderSceneStateBlock,
  renderHiddenNodePromptsBlock,
  PRIORITY_BLOCK,
} from "./mangaSceneMemory";
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
import { hiddenPromptsForNode } from "./mangaFlowPromptLibrary";

/** Hidden semantic metadata per node type (UI + generation). */
export const NODE_SEMANTIC_PROFILES = {
  person: {
    type: "character",
    semantic_role: "primary_actor",
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
  support: {
    type: "character",
    semantic_role: "secondary_actor",
    character_role: "support",
    persistent_identity: true,
    maintain_reference_consistency: true,
    independent_identity_from_primary: true,
    track_across_panels: true,
    track_across_pages: true,
    visual_memory_enabled: true,
    face_lock: true,
    outfit_lock: true,
    hairstyle_lock: true,
    body_structure_lock: true,
    reference_priority: "high",
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
  "NO flat front-facing mugshot unless the camera is explicitly front_view AND the beat requires it.",
  "Characters MUST NOT pose for the camera — they must act inside the scene (walking, fighting, talking, reacting).",
  "Use cinematic manga framing: 3/4 turn, dynamic body, scene-directed eyelines.",
  "Avoid stock-photo symmetry, model-pose stance, or selfie composition.",
];

const ANGLE_DIRECTIVES = {
  eye_level: "Camera at eye-level — still use 3/4 turn, not flat mugshot.",
  front_view: "Camera DIRECTLY in front — character faces camera, but with natural in-scene action (not posing for a photo).",
  side_view: "Camera at character's SIDE — body MUST be turned 90° in profile. Show the character from the side; do not rotate them to face camera.",
  back_view: "Camera BEHIND the character — show the character from the BACK. Face is hidden or barely visible; render hair, shoulders, back of outfit. Do not flip them to face camera.",
  three_quarter_view: "Camera at 3/4 angle — body angled, one shoulder closer to camera; cinematic depth.",
  top_view: "Camera DIRECTLY ABOVE looking down — top-down view of the character and ground around them.",
  low_angle: "Camera BELOW the subject looking UP — heroic, imposing; chin and underside visible, towering perspective.",
  high_angle: "Camera ABOVE the subject looking DOWN — vulnerable, distant; top of head and shoulders dominate.",
  dutch_angle: "Camera tilted — visible horizon tilt, kinetic tension energy; characters lean with the tilt, never centered upright.",
  birds_eye: "Top-down bird's-eye view — show spatial layout from far above.",
  worms_eye: "Extreme low from the ground looking up — exaggerated perspective, feet and underside dominate.",
  over_shoulder: "Over-the-shoulder framing — foreground shoulder/back visible, subject in mid-ground; cinematic dialogue or action staging.",
  dynamic_perspective: "Dynamic dramatic perspective — strong foreshortening, diagonal composition, motion lines; never a flat front portrait.",
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
  if (node?.type === "person" || node?.type === "support") {
    return { ...base, name: d.name || "Character", role: node.type === "support" ? "support" : "primary" };
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

function bodyDirectionForAngle(angle) {
  switch (angle) {
    case "side_view": return "Body MUST be in profile (90° turned). Do not flip character to face camera.";
    case "back_view": return "Render character from BEHIND. Face hidden or barely visible; do not rotate them frontwards.";
    case "three_quarter_view": return "Body angled 3/4 to camera; one shoulder closer than the other.";
    case "over_shoulder": return "Foreground shoulder/back of one character visible; subject is in mid-ground.";
    case "low_angle":
    case "worms_eye": return "Body towering from below; underside of chin/objects visible.";
    case "high_angle":
    case "birds_eye":
    case "top_view": return "Body seen from above; top of head, shoulders dominate.";
    case "dutch_angle": return "Body leans with the tilt; never upright centered.";
    case "dynamic_perspective": return "Strong foreshortening (a limb closer to camera than rest of body); diagonal action stance.";
    case "front_view": return "Character can face camera, but in active scene posture (not posing).";
    default: return "Natural in-scene body angle; do not face camera unless beat requires it.";
  }
}

function formatCameraState(cameraNode, personNames = [], variety = null) {
  if (!cameraNode) {
    const shot = variety?.shot || "medium";
    const angle = variety?.angle || "eye_level";
    return {
      shot,
      angle,
      directive: [
        `Camera (panel-specific, auto-assigned for variety): ${shot.replace(/_/g, " ")} shot, ${angle.replace(/_/g, " ")}.`,
        ANGLE_DIRECTIVES[angle] || ANGLE_DIRECTIVES.eye_level,
        bodyDirectionForAngle(angle),
        "Composition must be UNIQUE to this panel — never copy framing from another panel.",
        ...ANTI_PORTRAIT,
      ].join(" "),
      antiPortrait: ANTI_PORTRAIT,
    };
  }
  const d = cameraNode.data || {};
  const shot = (d.shotType || "medium").replace(/_/g, " ");
  const angle = (d.angle || "eye_level").replace(/_/g, " ");
  const angleKey = d.angle || "eye_level";
  const focus = d.focusTarget || (personNames[0] || "subject");
  return {
    shot,
    angle,
    focus,
    directive: [
      `CAMERA AUTHORITY (HIGH PRIORITY — must dominate composition): ${shot} shot, ${angle}.`,
      ANGLE_DIRECTIVES[angleKey] || ANGLE_DIRECTIVES.eye_level,
      bodyDirectionForAngle(angleKey),
      `Compositional focus: ${focus}.`,
      "The connected camera node OVERRIDES any default front-facing portrait. Use this framing literally.",
      ...ANTI_PORTRAIT,
    ].join(" "),
  };
}

function enrichCharacterNode(person, panelId, nodes, edges, refSlotByNodeId) {
  const d = person.data || {};
  const profile = getNodeSemanticProfile(person);
  const name = d.name || "Character";
  const slot = refSlotByNodeId.get(person.id);
  const optionHidden = hiddenPromptsForNode(person);
  return {
    nodeId: person.id,
    name,
    profile,
    refSlot: slot || null,
    pose: (d.pose || "standing").replace(/_/g, " "),
    emotion: (d.emotion || "normal").replace(/_/g, " "),
    hiddenOptions: optionHidden,
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

/** Auto-variety rotation so no two panels share the same shot/angle/distance. */
const PANEL_VARIETY_TABLE = [
  { shot: "wide", angle: "eye_level", distance: "far", composition: "wide establishing — full bodies and environment" },
  { shot: "medium", angle: "low_angle", distance: "medium", composition: "medium two-shot — characters in scene context" },
  { shot: "close_up", angle: "eye_level", distance: "close", composition: "tight close-up — face/eyes intensity" },
  { shot: "over_shoulder", angle: "over_shoulder", distance: "medium", composition: "over-the-shoulder reaction" },
  { shot: "extreme_close_up", angle: "dutch_angle", distance: "very_close", composition: "extreme close-up on a key detail (hand, eye, prop)" },
  { shot: "wide_action", angle: "high_angle", distance: "far", composition: "high-angle wide showing spatial layout" },
  { shot: "medium", angle: "dutch_angle", distance: "medium", composition: "dutch-tilt tension medium shot" },
  { shot: "full_body", angle: "worms_eye", distance: "medium", composition: "low worm's-eye dramatic full-body" },
];

function pickVariety(index) {
  return PANEL_VARIETY_TABLE[index % PANEL_VARIETY_TABLE.length];
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
    const variety = pickVariety(index);

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
      variety,
      isolation_rules: [
        "This panel is a sealed narrative container.",
        "Only listed characters appear here — no cast from other panels.",
        `This panel MUST use a DIFFERENT composition than adjacent panels: ${variety.composition}.`,
        "Never reuse the same pose/shot/angle/framing as any other panel on this page.",
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
        variety,
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
      "Generate ONE complete manga page / comic sheet with multiple DISTINCT panels separated by clear gutters.",
      "Each panel shows a DIFFERENT story beat — never duplicate a composition across panels.",
      "Panels must vary in shot size, camera angle, distance and pose — no clone panels.",
      "Maintain character identity (face, hair, skin, outfit) across all panels from reference slots.",
      "Environment and lighting stay coherent unless the story explicitly changes setting.",
      "Read panels left-to-right, top-to-bottom — the page tells ONE continuous story.",
      "Do NOT split a single image into equal squares; build a real comic page with varied panel sizes.",
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
  if (ctx.variety) {
    lines.push(
      `Required composition (panel-unique): ${ctx.variety.composition}. Shot=${ctx.variety.shot.replace(/_/g, " ")}, angle=${ctx.variety.angle.replace(/_/g, " ")}, distance=${ctx.variety.distance.replace(/_/g, " ")}. NEVER repeat this framing in another panel.`,
    );
  }
  lines.push(`Camera: ${ctx.camera_state.directive}`);

  if (ctx.active_environment) {
    lines.push(`Environment: ${ctx.active_environment.name} — ${ctx.active_environment.description || "use graph-linked setting"}.`);
  }

  if (ctx.active_characters.length) {
    lines.push("Characters (THIS panel only):");
    ctx.active_characters.forEach((c) => {
      lines.push(`  - ${c.name}${c.refSlot ? ` [ref image ${c.refSlot}]` : ""}: ${c.pose}, ${c.emotion}.`);
      if (c.hiddenOptions?.length) {
        lines.push(`    Hidden UI locks: ${c.hiddenOptions.join(" ")}`);
      }
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
  lines.push("ISOLATION: Do not import action, cast or background from other panels. This panel is one unique beat in the page sequence.");
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

  // Priority order — resolves conflicts deterministically.
  lines.push(PRIORITY_BLOCK);

  // Hidden directives auto-generated from every node.
  const hiddenBlock = renderHiddenNodePromptsBlock(nodes);
  if (hiddenBlock) lines.push(hiddenBlock);

  // Persistent scene memory across panels.
  const sceneState = buildSceneState(sheet.panels, nodes);
  const memoryBlock = renderSceneStateBlock(sceneState);
  if (memoryBlock) lines.push(memoryBlock);

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
    lines.push(
      `Draw a professional manga PAGE with ${sheet.panel_count} DIFFERENT panels separated by visible black gutters/borders.`,
    );
    lines.push("Panel sizes/shapes VARY across the page (mix wide cinematic panels, tall close-ups, medium beats).");
    lines.push("Read order: left-to-right, top-to-bottom — panels form a clear sequential STORY, not a grid of copies.");
    lines.push("");
    lines.push("### PAGE VARIETY MATRIX (each panel must use a different framing)");
    sheet.panels.forEach((ctx, i) => {
      if (ctx.variety) {
        lines.push(
          `- Panel ${i + 1}: ${ctx.variety.composition} (shot=${ctx.variety.shot.replace(/_/g, " ")}, angle=${ctx.variety.angle.replace(/_/g, " ")}).`,
        );
      } else {
        lines.push(`- Panel ${i + 1}: unique composition required.`);
      }
    });
    lines.push("");
    lines.push("### NARRATIVE FLOW (sequence — do not break order)");
    sheet.panels.forEach((ctx, i) => {
      const beat = ctx.momentDesc || ctx.narrative_directive || ctx.narrative_role;
      lines.push(`- Panel ${i + 1} [${ctx.narrative_role}]: ${beat}`);
    });
    lines.push("");
    lines.push("### PER-PANEL DETAIL (each section = ONE separate panel with unique content)");
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

  if (sheet.panel_count >= 2) {
    lines.push("## ANTI-REPETITION (mandatory)");
    lines.push("- Do NOT duplicate the same image across panels.");
    lines.push("- Do NOT split a single composition into equal squares.");
    lines.push("- Do NOT use the same pose, framing, distance, or background crop in adjacent panels.");
    lines.push("- Each panel must visibly advance the story.");
    lines.push("");
  }

  // Camera authority — make sure connected/auto cameras dominate composition.
  lines.push("## CAMERA AUTHORITY (mandatory)");
  lines.push("- Every camera node connected to a character has HIGH PRIORITY over the default eye-level portrait.");
  lines.push("- Apply the camera literally: shot size, angle and perspective control the panel composition.");
  lines.push("- Body orientation MUST follow the camera (profile for side_view, from-behind for back_view, towering for low_angle, foreshortened for worms_eye/dynamic_perspective, tilted for dutch_angle, over-shoulder framing for over_shoulder).");
  lines.push("- Characters ACT inside the scene — they never pose for the camera, no selfies, no model stances, no flat mugshots.");
  lines.push("- When no camera node is connected, use the auto-assigned variety camera from the page matrix above (still never default to front portrait).");
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
