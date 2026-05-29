/**
 * Visual Graph → Semantic Interpretation Layer
 * Each edge type gets hidden AI instructions + optional user prompt.
 */

import { inferCharacterRelation, relationSemanticBlock } from "./mangaFlowRelations";

function nodeName(node) {
  if (!node) return "?";
  const d = node.data || {};
  return (d.name && String(d.name).trim()) || d.text || node.type || "?";
}

function cameraDesc(node) {
  const d = node?.data || {};
  const shot = (d.shotType || "medium").replace(/_/g, " ");
  const angle = (d.angle || "eye_level").replace(/_/g, " ");
  return `${shot} shot, ${angle} angle`;
}

/** Ordered connection type id (direction matters). */
export function connectionTypeId(sourceType, targetType) {
  return `${sourceType}→${targetType}`;
}

/**
 * Default hidden semantic prompt for AI (always applied even if user leaves prompt empty).
 */
export function getDefaultSemanticPrompt(sourceNode, targetNode) {
  const s = sourceNode?.type;
  const t = targetNode?.type;
  const a = nodeName(sourceNode);
  const b = nodeName(targetNode);

  if (s === "person" && t === "person") {
    return (
      relationSemanticBlock("talking_to", a, b) +
      ` MUST appear together in the SAME panel/scene — both visible, both interacting. Never draw them in separate panels unless another connection says so.`
    );
  }

  if (s === "person" && t === "scenario") {
    return (
      `CHARACTER→SCENARIO: "${a}" MUST be physically placed inside environment "${b}". ` +
      `The action happens in this specific location. Match scenario lighting, weather, mood and architecture. ` +
      `"${a}" must be composited naturally into "${b}" — feet grounded, scale correct — not floating on a generic background. ` +
      `The background of every panel showing "${a}" MUST be "${b}" unless another scenario link overrides it.`
    );
  }

  if (s === "scenario" && t === "person") {
    return (
      `SCENARIO→CHARACTER: Environment "${a}" MUST host character "${b}". ` +
      `"${b}" belongs in this setting. Background of every panel with "${b}" must match "${a}".`
    );
  }

  if (s === "person" && t === "camera") {
    const cd = targetNode?.data || {};
    return (
      `CHARACTER→CAMERA (HIGH PRIORITY): "${a}" is framed by camera "${b}" (${cameraDesc(targetNode)}). ` +
      `This camera node is AUTHORITATIVE — it overrides any default front-facing portrait. ` +
      `Apply the camera literally: shot size = ${cd.shotType || "medium"}, angle = ${cd.angle || "eye_level"}. ` +
      `"${a}"'s body MUST be oriented to match this angle (side angle → profile body, back angle → from behind, over-shoulder → foreground shoulder of someone, low angle → towering up, etc.). ` +
      `"${a}" is the compositional focus but must be acting inside the scene — NEVER posing for the camera.`
    );
  }

  if (s === "camera" && t === "person") {
    const cd = sourceNode?.data || {};
    return (
      `CAMERA→CHARACTER (HIGH PRIORITY): Render "${b}" using camera "${a}" (${cameraDesc(sourceNode)}). ` +
      `Camera is authoritative: shot = ${cd.shotType || "medium"}, angle = ${cd.angle || "eye_level"}. ` +
      `"${b}"'s body orientation MUST follow this camera (profile for side, from-behind for back, foreshortened for low/worms-eye, tilted with dutch). ` +
      `No default eye-level mugshot. No model-pose stance.`
    );
  }

  if (s === "person" && t === "object") {
    return (
      `CHARACTER→OBJECT: "${a}" MUST be visibly holding, wielding, wearing or interacting with "${b}". ` +
      `"${b}" must appear in "${a}"'s hand, belt, body or immediate reach — physically connected, not a separate floating prop. ` +
      `Never omit "${b}" from any panel where "${a}" appears, unless another link removes it.`
    );
  }

  if (s === "object" && t === "person") {
    return (
      `OBJECT→CHARACTER: "${b}" MUST possess, hold or use "${a}". Show "${a}" together with "${b}" in the same frame, physically connected.`
    );
  }

  if (s === "person" && t === "panel") {
    return (
      `CHARACTER→PANEL: "${a}" appears in manga panel "${b}". ` +
      `Only "${a}" (among characters) should be treated as cast for this panel unless other characters are also linked to it. ` +
      `Follow this panel's unique story beat and framing.`
    );
  }

  if (s === "panel" && t === "person") {
    return (
      `PANEL→CHARACTER: Panel "${a}" includes character "${b}". ` +
      `"${b}" is part of this panel's isolated narrative moment. Do not merge with other panels' action.`
    );
  }

  if (s === "person" && t === "speech") {
    return `CHARACTER→DIALOGUE: "${a}" speaks the linked dialogue bubble. Lip/sync and bubble tail toward "${a}".`;
  }

  if (s === "speech" && t === "person") {
    return `DIALOGUE→CHARACTER: This line is spoken by "${b}".`;
  }

  if (s === "person" && t === "effect") {
    return `CHARACTER→EFFECT: Visual effect applies to "${a}" — surround or impact "${a}" as described.`;
  }

  if (s === "effect" && t === "person") {
    return `EFFECT→CHARACTER: Effect hits or surrounds "${b}".`;
  }

  if (s === "scenario" && t === "panel") {
    return `SCENARIO→PANEL: Panel "${b}" takes place in environment "${a}". Shared setting for this frame.`;
  }

  if (s === "panel" && t === "scenario") {
    return `PANEL→SCENARIO: Panel "${a}" uses background/setting "${b}".`;
  }

  if (s === "camera" && t === "panel") {
    return `CAMERA→PANEL: Panel "${b}" uses this camera framing (${cameraDesc(sourceNode)}).`;
  }

  if (s === "panel" && t === "camera") {
    return `PANEL→CAMERA: Apply camera "${b}" to compose panel "${a}".`;
  }

  if (s === "panel" && t === "panel") {
    return (
      `PANEL→PANEL: Narrative sequence from "${a}" to "${b}". ` +
      `Maintain continuity but change moment, pose and framing between panels.`
    );
  }

  if (s === "speech" && t === "panel") {
    return `DIALOGUE→PANEL: Speech appears in panel "${b}".`;
  }

  if (s === "panel" && t === "speech") {
    return `PANEL→DIALOGUE: Panel "${a}" contains this dialogue.`;
  }

  if (s === "effect" && t === "panel") {
    return `EFFECT→PANEL: Visual effect active in panel "${b}".`;
  }

  return (
    `CONNECTION ${s}→${t}: "${a}" is narratively linked to "${b}". ` +
    `Respect this relationship in composition and story logic.`
  );
}

/** Merge user-visible prompt + hidden semantic instruction for the model. */
export function combineSemanticAndUser(semanticPrompt, userPrompt) {
  const sem = String(semanticPrompt || "").trim();
  const user = String(userPrompt || "").trim();
  if (sem && user) return `${sem}\nUser direction: ${user}`;
  return sem || user;
}

/**
 * Build edge.data fields when creating/updating a connection.
 */
export function buildEdgeSemanticData(sourceNode, targetNode, userPrompt = "", relationType = null) {
  const connectionType = connectionTypeId(sourceNode?.type, targetNode?.type);
  let semanticPrompt = getDefaultSemanticPrompt(sourceNode, targetNode);
  if (sourceNode?.type === "person" && targetNode?.type === "person" && relationType) {
    const a = nodeName(sourceNode);
    const b = nodeName(targetNode);
    semanticPrompt = relationSemanticBlock(relationType, a, b);
  }
  const aiInstruction = combineSemanticAndUser(semanticPrompt, userPrompt);
  return {
    connectionType,
    semanticPrompt,
    prompt: userPrompt || "",
    aiInstruction,
    ...(relationType ? { relationType } : {}),
  };
}

/**
 * Resolve full semantics for an existing edge (migrate old edges without semanticPrompt).
 */
export function resolveEdgeSemantics(edge, nodes) {
  const src = nodes.find((n) => n.id === edge.source);
  const tgt = nodes.find((n) => n.id === edge.target);
  const userPrompt = edge?.data?.prompt?.trim() || "";
  const connectionType =
    edge?.data?.connectionType || connectionTypeId(src?.type, tgt?.type);
  let semanticPrompt = edge?.data?.semanticPrompt?.trim();
  if (!semanticPrompt) {
    if (src?.type === "person" && tgt?.type === "person") {
      const rel = inferCharacterRelation(edge, src, tgt);
      semanticPrompt = relationSemanticBlock(rel, nodeName(src), nodeName(tgt));
    } else {
      semanticPrompt = getDefaultSemanticPrompt(src, tgt);
    }
  }
  const aiInstruction = combineSemanticAndUser(semanticPrompt, userPrompt);

  return {
    source: src,
    target: tgt,
    connectionType,
    userPrompt,
    semanticPrompt,
    aiInstruction,
    label: `${nodeName(src)} → ${nodeName(tgt)}`,
  };
}

/** Enrich all edges missing semantic fields (project load / before generate). */
export function enrichEdgesSemantics(edges, nodes) {
  return edges.map((e) => {
    const resolved = resolveEdgeSemantics(e, nodes);
    const same =
      e.data?.connectionType === resolved.connectionType &&
      e.data?.semanticPrompt === resolved.semanticPrompt &&
      e.data?.aiInstruction === resolved.aiInstruction;
    if (same) return e;
    return {
      ...e,
      data: {
        ...e.data,
        connectionType: resolved.connectionType,
        semanticPrompt: resolved.semanticPrompt,
        aiInstruction: resolved.aiInstruction,
      },
    };
  });
}

/**
 * Full semantic graph section for AI prompt builder.
 */
export function buildSemanticGraphSection(nodes, edges) {
  if (!edges?.length) return "";

  const lines = [
    "## GRAPH SEMANTIC RELATIONSHIPS (every connection = rule for the AI)",
    "The user drew these links on the storyboard. Each line is mandatory context, not decoration.",
    "",
  ];

  edges.forEach((e, i) => {
    const r = resolveEdgeSemantics(e, nodes);
    if (!r.source || !r.target) return;
    lines.push(`### Link ${i + 1}: ${r.label} [${r.connectionType}]`);
    lines.push(r.semanticPrompt);
    if (r.userPrompt) lines.push(`Creator note: ${r.userPrompt}`);
    lines.push("");
  });

  return lines.join("\n");
}

/** Short line for inline use (panel/person blocks). */
export function getEdgeAiInstruction(aId, bId, edges, nodes) {
  const e = edges.find(
    (x) =>
      (x.source === aId && x.target === bId) || (x.source === bId && x.target === aId),
  );
  if (!e) return "";
  return resolveEdgeSemantics(e, nodes).aiInstruction;
}
