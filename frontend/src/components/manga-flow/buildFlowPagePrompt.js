/**
 * Graph-aware manga page prompts — panel isolation, edge-respecting cast.
 */

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
  buildCastIdentitySection,
  hasNodeRef,
} from "../../lib/mangaFlowGraph";
import { buildSemanticGraphSection } from "../../lib/mangaFlowSemantics";

const ANTI_PORTRAIT = [
  "NOT a centered passport photo or ID portrait.",
  "Character must NOT stare straight at the camera unless the beat explicitly requires it.",
  "Use dynamic manga/comic framing: body turned in scene direction.",
  "Avoid stock-photo symmetry or generic anime gym extras unless scenario explicitly says gym.",
];

const ANGLE_DIRECTIVES = {
  low_angle: "Camera below subject — heroic or imposing.",
  high_angle: "Camera above — vulnerable or distant.",
  dutch_angle: "Tilted horizon — tension, kinetic energy.",
  birds_eye: "Top-down — spatial layout.",
  over_shoulder: "Over-the-shoulder toward subject or scene.",
  worms_eye: "Extreme low from ground.",
  eye_level: "Eye-level — still use 3/4 turn, not flat mugshot.",
};

function formatCameraBlock(camera) {
  if (!camera) {
    return ["Camera: cinematic manga framing.", ...ANTI_PORTRAIT.map((x) => `  ${x}`)].join("\n");
  }
  const d = camera.data || {};
  const shot = (d.shotType || "medium").replace(/_/g, " ");
  const angle = (d.angle || "eye_level").replace(/_/g, " ");
  return [
    `Camera: ${shot} shot, ${angle}.`,
    ANGLE_DIRECTIVES[d.angle] || ANGLE_DIRECTIVES.eye_level,
    d.focusTarget ? `Focus: ${d.focusTarget}.` : "",
    ...ANTI_PORTRAIT.map((x) => `  ${x}`),
  ]
    .filter(Boolean)
    .join("\n");
}

function formatPersonInPanel(person, panelId, nodes, edges, refSlotByNodeId) {
  const d = person.data || {};
  const name = d.name || "Character";
  const slot = refSlotByNodeId.get(person.id);
  const lines = [
    `  • ${name}${slot ? ` [identity = reference image ${slot}]` : ""}:`,
    `    Pose: ${(d.pose || "standing").replace(/_/g, " ")} | Expression: ${(d.emotion || "normal").replace(/_/g, " ")}`,
  ];
  const panelLink = getEdgePrompt(person.id, panelId, edges, nodes);
  if (panelLink) lines.push(`    Panel link (semantic): ${panelLink}`);
  else if (d.actionDesc) lines.push(`    Action: ${d.actionDesc}`);

  if (d.clothing) lines.push(`    Outfit: ${d.clothing}`);
  if (slot) {
    lines.push(`    MUST match reference image ${slot} exactly — same face, hair, skin, body. NOT a different person.`);
  }

  for (const obj of objectsForPerson(person.id, nodes, edges)) {
    const op = getEdgePrompt(person.id, obj.id, edges, nodes);
    lines.push(`    Object: ${obj.data?.name || "item"}${op ? ` — ${op}` : ""}`);
  }
  if (d.speech) lines.push(`    Dialogue: "${d.speech}"`);
  return lines.join("\n");
}

function buildPanelSection(panel, index, total, nodes, edges, refSlotByNodeId) {
  const d = panel.data || {};
  const lines = [];
  lines.push(`### PANEL ${index + 1} of ${total} — ${d.name || `Frame ${index + 1}`}`);
  lines.push(
    `Frame: ${(d.panelSize || "medium").replace(/_/g, " ")} ${(d.format || "rectangle").replace(/_/g, " ")} | ISOLATED beat — do not merge with other panels.`,
  );
  const beat = d.momentDesc || d.promptOverride;
  if (beat) lines.push(`Narrative beat: ${beat}`);

  const scenario = scenarioForPanel(panel.id, nodes, edges);
  if (scenario) {
    const sd = scenario.data || {};
    lines.push(
      `Setting (this panel only): ${[sd.name, sd.description, sd.timeOfDay, sd.weather, sd.mood].filter(Boolean).join(" · ")}`,
    );
  }

  lines.push(formatCameraBlock(cameraForPanel(panel.id, nodes, edges)));

  const persons = personsForPanel(panel.id, nodes, edges);
  if (persons.length) {
    lines.push("Characters IN THIS PANEL ONLY (via graph connections):");
    persons.forEach((p) => lines.push(formatPersonInPanel(p, panel.id, nodes, edges, refSlotByNodeId)));
  } else {
    lines.push("Characters: none directly linked to this panel — show environment or transition only; do not add random people.");
  }

  for (const s of speechesForPanel(panel.id, nodes, edges)) {
    if (s.data?.text) lines.push(`Dialogue: "${s.data.text}"`);
  }
  for (const fx of effectsForPanel(panel.id, nodes, edges)) {
    lines.push(`FX: ${(fx.data?.effectType || "motion").replace(/_/g, " ")}`);
  }
  lines.push("");
  return lines.join("\n");
}

function refSlotMap(refSlots) {
  const m = new Map();
  for (const s of refSlots || []) {
    if (s.node?.id) m.set(s.node.id, s.slot);
  }
  return m;
}

/**
 * @param {object[]} nodes
 * @param {object[]} edges
 * @param {object} [context]
 * @param {object[]} [refSlots]
 */
export function buildPagePromptFromFlow(nodes, edges, context = {}, refSlots = []) {
  const panels = sortPanels(nodes);
  const refMap = refSlotMap(refSlots);
  const lines = [];

  lines.push("=== MANGA PAGE — GRAPH-ORCHESTRATED (connections = law) ===\n");
  lines.push("RULES:");
  lines.push("- Each PANEL section is ISOLATED. Do not blend beats across panels.");
  lines.push("- Only characters listed under a panel appear in that panel.");
  lines.push("- Respect REFERENCE IMAGE slots — no random NPCs, no face swapping.");
  lines.push("- Connections in the graph define who appears where; ignore unlinked characters for that panel.");
  lines.push("");

  const semanticBlock = buildSemanticGraphSection(nodes, edges);
  if (semanticBlock) {
    lines.push(semanticBlock);
  }

  if (context.storySynopsis) {
    lines.push("## STORY");
    lines.push(context.storySynopsis.slice(0, 500));
    lines.push("");
  }
  if (context.pageBeat) lines.push(`Page beat: ${context.pageBeat}\n`);

  const cast = sortPersons(nodes);
  if (cast.length) {
    lines.push(buildCastIdentitySection(cast, refSlots));
  }

  const interactions = personInteractions(nodes, edges);
  if (interactions.length) {
    lines.push("## CHARACTER ↔ CHARACTER (must appear together when linked)");
    interactions.forEach((x) => lines.push(`- ${x.a} ↔ ${x.b}: ${x.text}`));
    lines.push("");
  }

  if (panels.length >= 2) {
    lines.push("## PANELS (read left-to-right, top-to-bottom)\n");
    panels.forEach((panel, i) => {
      lines.push(buildPanelSection(panel, i, panels.length, nodes, edges, refMap));
    });
  } else if (panels.length === 1) {
    lines.push("## SINGLE PANEL SCENE\n");
    lines.push(buildPanelSection(panels[0], 0, 1, nodes, edges, refMap));
  } else {
    lines.push("## SCENE (no panel cards — full canvas)\n");
    const scenario = nodes.find((n) => n.type === "scenario");
    if (scenario) {
      const sd = scenario.data || {};
      lines.push(`Setting: ${[sd.name, sd.description].filter(Boolean).join(" — ")}`);
    }
    const persons = sortPersons(nodes);
  if (persons.length) {
      lines.push("Characters:");
      persons.forEach((p) => {
        lines.push(formatPersonInPanel(p, p.id, nodes, edges, refMap).replace(/^  /gm, ""));
      });
    }
    lines.push(formatCameraBlock(nodes.find((n) => n.type === "camera")));
    lines.push("");
  }

  lines.push("Negative: duplicate panel content, wrong faces, random anime extras, gym background unless specified, identity swap, watermark.");

  return lines.join("\n");
}

/** Always prefer graph prompt when 2+ panels OR 2+ persons with refs. */
export function shouldUseGraphPrompt(nodes, edges) {
  const panelCount = sortPanels(nodes).length;
  const personRefCount = sortPersons(nodes).filter(hasNodeRef).length;
  const personCount = sortPersons(nodes).length;
  return panelCount >= 2 || personRefCount >= 2 || (personCount >= 2 && edges.length >= 2);
}
