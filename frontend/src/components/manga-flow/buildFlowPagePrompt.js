/**
 * Multi-panel manga PAGE prompts — each panel = distinct story beat, not one image split 4 ways.
 */

import { sortNodesForRefs } from "../../lib/mangaGenerationRefs";

const ANTI_PORTRAIT = [
  "NOT a centered passport photo or ID portrait.",
  "Character must NOT stare straight at the camera unless the beat explicitly requires it.",
  "Use dynamic manga/comic framing: body turned in scene direction, weight on one foot, action lines.",
  "Avoid stock-photo symmetry, T-pose, or static front-facing mannequin pose.",
];

const ANGLE_DIRECTIVES = {
  low_angle: "Camera below subject — heroic or imposing; chin up, sky visible, dramatic foreshortening.",
  high_angle: "Camera above — subject looks smaller or vulnerable; top-down perspective.",
  dutch_angle: "Tilted horizon — tension, unease, kinetic energy.",
  birds_eye: "Top-down view — spatial layout, chase, or environment emphasis.",
  over_shoulder: "Shot from behind one character's shoulder toward another or the scene.",
  worms_eye: "Extreme low angle from ground level.",
  eye_level: "Neutral eye-level — still use 3/4 body turn, not flat frontal mugshot.",
};

const SHOT_DIRECTIVES = {
  establishing: "Wide establishing — environment and scale before character detail.",
  wide: "Wide shot — full bodies and environment context.",
  medium: "Medium shot — waist-up, dialogue or interaction focus.",
  close_up: "Close-up — face and emotion, background soft.",
  extreme_close_up: "Extreme close-up — eyes, mouth, or key detail.",
  panoramic: "Panoramic breadth across the scene.",
};

function sortPanels(nodes) {
  return [...nodes]
    .filter((n) => n.type === "panel")
    .sort((a, b) => {
      const ay = a.position?.y ?? 0;
      const by = b.position?.y ?? 0;
      if (ay !== by) return ay - by;
      return (a.position?.x ?? 0) - (b.position?.x ?? 0);
    });
}

function neighbors(panelId, nodes, edges) {
  const ids = new Set();
  for (const e of edges) {
    if (e.source === panelId) ids.add(e.target);
    if (e.target === panelId) ids.add(e.source);
  }
  return nodes.filter((n) => ids.has(n.id));
}

function edgePromptBetween(aId, bId, edges) {
  const e = edges.find(
    (x) =>
      (x.source === aId && x.target === bId) || (x.source === bId && x.target === aId),
  );
  return e?.data?.prompt?.trim() || "";
}

function formatPersonBlock(person, edges, panelId, allNodes) {
  const d = person.data || {};
  const name = d.name || "Character";
  const pose = (d.pose || "standing").replace(/_/g, " ");
  const emotion = (d.emotion || "normal").replace(/_/g, " ");
  const linkPrompt = edgePromptBetween(person.id, panelId, edges);
  const lines = [
    `Character: ${name}`,
    `  Pose (mandatory): ${pose} — draw this exact body language, not a generic stand.`,
    `  Expression: ${emotion}`,
  ];
  if (d.clothing) lines.push(`  Outfit: ${d.clothing}`);
  if (linkPrompt) lines.push(`  In this panel: ${linkPrompt}`);
  else if (d.actionDesc) lines.push(`  Action: ${d.actionDesc}`);

  const cam = d.cameraAngle ? String(d.cameraAngle).replace(/_/g, " ") : "";
  if (cam) lines.push(`  Framing hint: ${cam}`);

  for (const e of edges.filter((x) => x.source === person.id || x.target === person.id)) {
    const otherId = e.source === person.id ? e.target : e.source;
    const other = allNodes.find((n) => n.id === otherId);
    if (other?.type === "object" && e.data?.prompt) {
      lines.push(`  Object: ${other.data?.name || "item"} — ${e.data.prompt}`);
    }
    if (other?.type === "person" && e.data?.prompt && other.id !== person.id) {
      lines.push(`  With: ${e.data.prompt}`);
    }
  }
  if (d.speech) lines.push(`  Dialogue bubble: "${d.speech}"`);
  return lines.join("\n");
}

function formatCameraBlock(camera) {
  const d = camera.data || {};
  const shot = (d.shotType || "medium").replace(/_/g, " ");
  const angle = (d.angle || "eye_level").replace(/_/g, " ");
  const lines = [
    `Camera: ${shot} shot, ${angle} angle.`,
    ANGLE_DIRECTIVES[d.angle] || ANGLE_DIRECTIVES.eye_level,
    SHOT_DIRECTIVES[d.shotType] || "",
  ].filter(Boolean);
  if (d.focusTarget) lines.push(`Focus on: ${d.focusTarget}.`);
  lines.push(...ANTI_PORTRAIT.map((x) => `  ${x}`));
  return lines.join("\n");
}

/**
 * @param {object[]} nodes
 * @param {object[]} edges
 * @param {object} [context]
 * @returns {string|null} null if fewer than 2 panels (use single-panel prompt)
 */
export function buildPagePromptFromFlow(nodes, edges, context = {}) {
  const panels = sortPanels(nodes);
  if (panels.length < 2) return null;

  const scenario = nodes.find((n) => n.type === "scenario");
  const lines = [];

  lines.push("=== MANGA COMIC PAGE — MULTI-PANEL SEQUENCE ===\n");
  lines.push("OUTPUT: One manga page image containing a comic layout with SEPARATE bordered panels.");
  lines.push("CRITICAL RULES:");
  lines.push("- Each panel shows a DIFFERENT story moment, action, and camera angle.");
  lines.push("- Do NOT crop or duplicate one photograph into 4 identical quadrants.");
  lines.push("- Do NOT repeat the same pose, background, and framing in every panel.");
  lines.push("- Read panels left-to-right, top-to-bottom as chronological story beats.");
  lines.push("- Vary shot size: mix wide, medium, and close-up across panels when specified.");
  lines.push("");

  if (context.storySynopsis) {
    lines.push("## STORY CONTEXT (maintain continuity)");
    lines.push(context.storySynopsis.slice(0, 600));
    lines.push("");
  }
  if (context.pageName) {
    lines.push(`## THIS PAGE: ${context.pageName}`);
  }
  if (context.pageBeat) {
    lines.push(`Page narrative beat: ${context.pageBeat}`);
    lines.push("");
  }
  if (context.priorPagesSummary) {
    lines.push("## CONTINUITY FROM PREVIOUS PAGES");
    lines.push(context.priorPagesSummary);
    lines.push("");
  }

  if (scenario) {
    const d = scenario.data || {};
    lines.push("## SHARED SETTING (consistent across panels on this page)");
    lines.push(
      [
        d.name,
        d.description,
        `${d.timeOfDay || "day"}, ${d.weather || "clear"}`,
        d.mood && d.mood !== "neutral" ? `${d.mood} mood` : "",
        d.lighting ? `${d.lighting} lighting` : "",
      ]
        .filter(Boolean)
        .join(". "),
    );
    lines.push("");
  }

  lines.push("## PANEL-BY-PANEL STORYBOARD (each panel is unique)\n");

  panels.forEach((panel, i) => {
    const d = panel.data || {};
    const linked = neighbors(panel.id, nodes, edges);
    const persons = linked.filter((n) => n.type === "person");
    const cameras = linked.filter((n) => n.type === "camera");
    const speeches = linked.filter((n) => n.type === "speech");
    const effects = linked.filter((n) => n.type === "effect");

    lines.push(`### PANEL ${i + 1} of ${panels.length} — ${d.name || `Frame ${i + 1}`}`);
    lines.push(
      `Layout: ${(d.panelSize || "medium").replace(/_/g, " ")} ${(d.format || "rectangle").replace(/_/g, " ")} frame with ${d.borderStyle || "thin"} border.`,
    );
    const beat = d.momentDesc || d.promptOverride;
    if (beat) lines.push(`Story beat: ${beat}`);

  if (persons.length === 0) {
      const allPersons = nodes.filter((n) => n.type === "person");
      if (allPersons.length && i < allPersons.length) {
        persons.push(allPersons[i % allPersons.length]);
      } else if (allPersons[0]) persons.push(allPersons[0]);
    }

    if (cameras.length) {
      lines.push(formatCameraBlock(cameras[0]));
    } else {
      lines.push("Camera: cinematic manga angle — avoid flat front-facing portrait.");
      lines.push(...ANTI_PORTRAIT.map((x) => `  ${x}`));
    }

    persons.forEach((p) => {
      lines.push(formatPersonBlock(p, edges, panel.id, nodes));
    });

    speeches.forEach((s) => {
      if (s.data?.text) {
        lines.push(`Dialogue [${s.data.bubbleType || "speech"}]: "${s.data.text}"`);
      }
    });
    effects.forEach((fx) => {
      lines.push(
        `FX: ${(fx.data?.effectType || "motion").replace(/_/g, " ")} (${fx.data?.intensity || "medium"})`,
      );
    });
    lines.push("");
  });

  const personRefs = sortNodesForRefs(nodes.filter((n) => n.type === "person")).filter(
    (n) => n.data?.refImageUrl,
  );
  if (personRefs.length) {
    lines.push("## CHARACTER IDENTITY (all panels — do not swap)");
    personRefs.forEach((n, idx) => {
      const who = n.data?.name || `Character ${idx + 1}`;
      lines.push(
        `- "${who}" = reference image ${idx + 1} ONLY: exact face, hair, skin tone, body, outfit. Never use this face for other characters.`,
      );
    });
    if (personRefs.length >= 2) {
      const a = personRefs[0].data?.name || "Character 1";
      const b = personRefs[1].data?.name || "Character 2";
      lines.push(`- ${a} and ${b} are different people; both must appear with correct identities when in scene.`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
