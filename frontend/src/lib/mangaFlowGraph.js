/**
 * Graph-aware context for Manga Flow — respects edges, isolates panels, binds character refs.
 */

import { getEdgeAiInstruction, resolveEdgeSemantics } from "./mangaFlowSemantics";
import { buildCharacterIdentityCards, getCharacterIdentityTag } from "./mangaCharacterRef";

export function hasNodeRef(node) {
  const d = node?.data;
  return Boolean(
    d?.refImage instanceof File ||
    d?.refImageUrl ||
    d?.refPersistUrl,
  );
}

export function sortPanels(nodes) {
  return [...nodes]
    .filter((n) => n.type === "panel")
    .sort((a, b) => {
      const ay = a.position?.y ?? 0;
      const by = b.position?.y ?? 0;
      if (ay !== by) return ay - by;
      return (a.position?.x ?? 0) - (b.position?.x ?? 0);
    });
}

export function sortPersons(nodes) {
  return [...nodes]
    .filter((n) => n.type === "person")
    .sort((a, b) => {
      const ay = a.position?.y ?? 0;
      const by = b.position?.y ?? 0;
      if (ay !== by) return ay - by;
      return (a.position?.x ?? 0) - (b.position?.x ?? 0);
    });
}

/** Direct neighbors of nodeId via one edge. */
export function getLinked(nodeId, nodes, edges, typeFilter = null) {
  const out = [];
  const seen = new Set();
  for (const e of edges) {
    let otherId = null;
    if (e.source === nodeId) otherId = e.target;
    else if (e.target === nodeId) otherId = e.source;
    if (!otherId || seen.has(otherId)) continue;
    const node = nodes.find((n) => n.id === otherId);
    if (!node) continue;
    if (typeFilter && !typeFilter.includes(node.type)) continue;
    seen.add(otherId);
    out.push({ node, edge: e });
  }
  return out;
}

export function getEdgePrompt(aId, bId, edges, nodes = []) {
  const e = edges.find(
    (x) =>
      (x.source === aId && x.target === bId) || (x.source === bId && x.target === aId),
  );
  if (!e) return "";
  if (nodes.length) return getEdgeAiInstruction(aId, bId, edges, nodes);
  return e?.data?.aiInstruction?.trim() || e?.data?.prompt?.trim() || "";
}

/** Persons with a direct edge to this panel (either direction). */
export function personsForPanel(panelId, nodes, edges) {
  return getLinked(panelId, nodes, edges, ["person"]).map((x) => x.node);
}

export function scenarioForPanel(panelId, nodes, edges) {
  const direct = getLinked(panelId, nodes, edges, ["scenario"]).map((x) => x.node);
  if (direct.length) return direct[0];
  const persons = personsForPanel(panelId, nodes, edges);
  for (const p of persons) {
    const sc = getLinked(p.id, nodes, edges, ["scenario"]).map((x) => x.node);
    if (sc[0]) return sc[0];
  }
  return null;
}

export function cameraForPanel(panelId, nodes, edges) {
  const direct = getLinked(panelId, nodes, edges, ["camera"]).map((x) => x.node);
  if (direct.length) return direct[0];
  const persons = personsForPanel(panelId, nodes, edges);
  for (const p of persons) {
    const c = getLinked(p.id, nodes, edges, ["camera"]).map((x) => x.node);
    if (c[0]) return c[0];
  }
  return null;
}

export function speechesForPanel(panelId, nodes, edges) {
  const direct = getLinked(panelId, nodes, edges, ["speech"]).map((x) => x.node);
  const fromPersons = [];
  for (const p of personsForPanel(panelId, nodes, edges)) {
    fromPersons.push(...getLinked(p.id, nodes, edges, ["speech"]).map((x) => x.node));
  }
  const ids = new Set();
  return [...direct, ...fromPersons].filter((n) => {
    if (ids.has(n.id)) return false;
    ids.add(n.id);
    return true;
  });
}

export function effectsForPanel(panelId, nodes, edges) {
  return getLinked(panelId, nodes, edges, ["effect"]).map((x) => x.node);
}

export function objectsForPerson(personId, nodes, edges) {
  return getLinked(personId, nodes, edges, ["object"]).map((x) => x.node);
}

/** Person ↔ person interactions (semantic + user prompt). */
export function personInteractions(nodes, edges) {
  const lines = [];
  for (const e of edges) {
    const src = nodes.find((n) => n.id === e.source);
    const tgt = nodes.find((n) => n.id === e.target);
    if (src?.type === "person" && tgt?.type === "person") {
      const r = resolveEdgeSemantics(e, nodes);
      lines.push({
        a: src.data?.name || "A",
        b: tgt.data?.name || "B",
        text: r.aiInstruction,
      });
    }
  }
  return lines;
}

/** Order persons with refs: panel reading order first, then unlinked. */
export function orderPersonsWithRefs(nodes, edges) {
  const all = sortPersons(nodes).filter(hasNodeRef);
  const panels = sortPanels(nodes);
  const ordered = [];
  const seen = new Set();

  for (const panel of panels) {
    for (const p of personsForPanel(panel.id, nodes, edges)) {
      if (hasNodeRef(p) && !seen.has(p.id)) {
        seen.add(p.id);
        ordered.push(p);
      }
    }
  }
  for (const p of all) {
    if (!seen.has(p.id)) ordered.push(p);
  }
  return ordered;
}

export function characterAppearanceLine(node) {
  const d = node?.data || {};
  const parts = [];
  if (d.clothing) parts.push(`outfit: ${d.clothing}`);
  if (d.refInstructions) parts.push(d.refInstructions);
  if (d.actionDesc) parts.push(d.actionDesc.slice(0, 120));
  return parts.join("; ");
}

export function validateGraphForGeneration(nodes, edges) {
  const warnings = [];
  const panels = sortPanels(nodes);
  const personsWithRef = sortPersons(nodes).filter(hasNodeRef);
  if (panels.length >= 2 && personsWithRef.length) {
    for (const p of personsWithRef) {
      const linked = panels.some((panel) =>
        personsForPanel(panel.id, nodes, edges).some((x) => x.id === p.id),
      );
      if (!linked) {
        warnings.push(
          `"${p.data?.name || "Personagem"}" tem referência mas não está ligado a nenhum painel — liga Person → Painel.`,
        );
      }
    }
  }
  return warnings;
}

export function buildCastIdentitySection(persons, refSlots = []) {
  if (!persons.length) return "";
  const cards = buildCharacterIdentityCards(persons, refSlots);
  const total = cards.length;
  const withRefs = cards.filter((c) => c.hasRef);

  const lines = [];
  lines.push("## CAST — IDENTITY LOCK (per-character isolation, no NPCs)");
  lines.push(
    `EXCLUSIVE CAST: exactly ${total} character${total === 1 ? "" : "s"} exist${total === 1 ? "s" : ""} in this story. No other people, no random NPCs, no generic anime extras, no background crowds with faces. Only the characters listed below may appear, and ONLY in the panels their graph links allow.`,
  );
  lines.push("");
  cards.forEach((c) => {
    lines.push(c.identityBlock);
  });
  lines.push("");

  // Pairwise non-mixing block — explicit "A ≠ B" rules for every pair.
  if (cards.length >= 2) {
    lines.push("## CHARACTER NON-MIXING MATRIX (mandatory)");
    for (let i = 0; i < cards.length; i += 1) {
      for (let j = i + 1; j < cards.length; j += 1) {
        const a = cards[i];
        const b = cards[j];
        lines.push(
          `- ${a.name} [${a.tag}] is NOT ${b.name} [${b.tag}]. Never share face, hair color, hair style, skin tone, eyes, body type or outfit between them. Never assign ${a.name}'s reference to ${b.name} or vice versa.`,
        );
      }
    }
    lines.push("");
  }

  if (withRefs.length >= 2) {
    const a = withRefs[0];
    const b = withRefs[1];
    lines.push(
      `CRITICAL: ${a.name} [${a.tag}] (reference image ${a.slot || 1}) and ${b.name} [${b.tag}] (reference image ${b.slot || 2}) are DIFFERENT real people. Each reference image binds to ONE character only and must NEVER cross-contaminate the other. No stock anime faces.`,
    );
    lines.push("");
  }
  return lines.join("\n");
}


/**
 * Tight scene-graph summary — converts every visual edge into binding rules
 * the AI must obey. Goes at the TOP of the prompt so it can never be missed.
 */
function _displayName(node) {
  if (!node) return "?";
  const d = node.data || {};
  return (d.name && String(d.name).trim()) || d.text || node.type || "?";
}

export function buildSceneGraphSummary(nodes, edges) {
  if (!nodes?.length) return "";
  const persons = sortPersons(nodes);
  const scenarios = nodes.filter((n) => n.type === "scenario");
  const cameras = nodes.filter((n) => n.type === "camera");
  const objects = nodes.filter((n) => n.type === "object");
  const speeches = nodes.filter((n) => n.type === "speech");
  const effects = nodes.filter((n) => n.type === "effect");
  const panels = sortPanels(nodes);

  const rules = [];

  // Person ↔ Person — together in scene
  const pairsSeen = new Set();
  for (const e of edges || []) {
    const src = nodes.find((n) => n.id === e.source);
    const tgt = nodes.find((n) => n.id === e.target);
    if (src?.type === "person" && tgt?.type === "person") {
      const key = [src.id, tgt.id].sort().join("|");
      if (pairsSeen.has(key)) continue;
      pairsSeen.add(key);
      const rel = (e.data?.relationType || "together").replace(/_/g, " ");
      rules.push(
        `TOGETHER: ${_displayName(src)} + ${_displayName(tgt)} share the SAME panel/scene (relation: ${rel}). Both must be visible and interacting.`,
      );
    }
  }

  // Person ↔ Scenario — place inside
  for (const p of persons) {
    const sc = getLinked(p.id, nodes, edges, ["scenario"]).map((x) => x.node);
    for (const s of sc) {
      rules.push(
        `LOCATION: ${_displayName(p)} is INSIDE "${_displayName(s)}". Every panel showing ${_displayName(p)} uses ${_displayName(s)} as the background — never a generic setting.`,
      );
    }
  }

  // Person ↔ Camera — camera controls framing & body direction
  for (const p of persons) {
    const cams = getLinked(p.id, nodes, edges, ["camera"]).map((x) => x.node);
    for (const c of cams) {
      const cd = c.data || {};
      const shot = (cd.shotType || "medium").replace(/_/g, " ");
      const angle = cd.angle || "eye_level";
      const angleLabel = angle.replace(/_/g, " ");
      const body = (() => {
        switch (angle) {
          case "side_view": return "body MUST be in profile (90° turned, do NOT face camera)";
          case "back_view": return "render character from BEHIND (face hidden, do NOT flip frontwards)";
          case "three_quarter_view": return "body angled 3/4 — one shoulder closer to camera";
          case "over_shoulder": return "over-the-shoulder framing — foreground shoulder visible";
          case "low_angle":
          case "worms_eye": return "body towering from below — strong upward perspective";
          case "high_angle":
          case "birds_eye":
          case "top_view": return "seen from above — top of head/shoulders dominate";
          case "dutch_angle": return "body leans with the tilted horizon, never upright centered";
          case "dynamic_perspective": return "strong foreshortening, diagonal action stance";
          case "front_view": return "facing camera but ACTING in the scene, never posing";
          default: return "natural in-scene body angle, not facing camera unless beat requires";
        }
      })();
      rules.push(
        `CAMERA: ${_displayName(p)} is framed with ${shot} shot, ${angleLabel} (camera "${_displayName(c)}"). HIGH PRIORITY — this camera overrides default front portrait. ${body}.`,
      );
    }
  }

  // Person ↔ Object — interaction
  for (const p of persons) {
    const objs = getLinked(p.id, nodes, edges, ["object"]).map((x) => x.node);
    for (const o of objs) {
      rules.push(
        `PROP: ${_displayName(p)} is holding/using/wearing "${_displayName(o)}". The object must be physically connected to ${_displayName(p)} in every panel they appear, not a floating decoration.`,
      );
    }
  }

  // Person ↔ Speech — dialogue ownership
  for (const p of persons) {
    const sps = getLinked(p.id, nodes, edges, ["speech"]).map((x) => x.node);
    for (const sp of sps) {
      const line = (sp.data?.text || "").trim();
      rules.push(
        `DIALOGUE: ${_displayName(p)} speaks${line ? ` "${line.slice(0, 120)}"` : ` "${_displayName(sp)}"`}. Speech bubble tail points to ${_displayName(p)}'s mouth.`,
      );
    }
  }

  // Person ↔ Effect — vfx target
  for (const p of persons) {
    const fxs = getLinked(p.id, nodes, edges, ["effect"]).map((x) => x.node);
    for (const fx of fxs) {
      const t = (fx.data?.effectType || "motion").replace(/_/g, " ");
      rules.push(`EFFECT: ${t} surrounds/impacts ${_displayName(p)}.`);
    }
  }

  // Panel ↔ Person — explicit panel cast
  for (const panel of panels) {
    const cast = personsForPanel(panel.id, nodes, edges);
    if (cast.length) {
      rules.push(
        `PANEL "${_displayName(panel)}" CAST: ${cast.map(_displayName).join(", ")} — ONLY these characters appear in this panel.`,
      );
    }
    // Panel ↔ Scenario
    const panelScenarios = getLinked(panel.id, nodes, edges, ["scenario"]).map((x) => x.node);
    for (const sc of panelScenarios) {
      rules.push(
        `PANEL "${_displayName(panel)}" SETTING: ${_displayName(sc)} — background of this panel MUST match this environment.`,
      );
    }
    // Panel ↔ Camera
    const panelCameras = getLinked(panel.id, nodes, edges, ["camera"]).map((x) => x.node);
    for (const c of panelCameras) {
      const cd = c.data || {};
      const shot = (cd.shotType || "medium").replace(/_/g, " ");
      const angle = (cd.angle || "eye_level").replace(/_/g, " ");
      rules.push(
        `PANEL "${_displayName(panel)}" CAMERA: ${shot} shot, ${angle} (HIGH PRIORITY — applied to this panel only).`,
      );
    }
    // Panel ↔ Effect
    const panelEffects = getLinked(panel.id, nodes, edges, ["effect"]).map((x) => x.node);
    for (const fx of panelEffects) {
      const t = (fx.data?.effectType || "motion").replace(/_/g, " ");
      rules.push(`PANEL "${_displayName(panel)}" FX: ${t} — active in this panel.`);
    }
  }

  if (!rules.length) return "";

  // List unlinked elements so the AI knows they exist but only via their links.
  const usedIds = new Set();
  (edges || []).forEach((e) => { usedIds.add(e.source); usedIds.add(e.target); });
  const orphans = nodes.filter((n) => !usedIds.has(n.id) && ["person", "scenario", "object", "camera", "speech", "effect"].includes(n.type));

  const out = [
    "## SCENE GRAPH — BINDING RULES (the user drew these links, you MUST obey them)",
    "Every line below is a hard rule, not a hint. Disobeying these breaks the scene.",
    "",
  ];
  rules.forEach((r) => out.push(`- ${r}`));
  if (persons.length || scenarios.length || objects.length) {
    out.push("");
    out.push(
      `ELEMENT LOCK: this scene uses ONLY the graph elements above (${persons.length} character${persons.length === 1 ? "" : "s"}, ${scenarios.length} scenario${scenarios.length === 1 ? "" : "s"}, ${objects.length} object${objects.length === 1 ? "" : "s"}, ${cameras.length} camera${cameras.length === 1 ? "" : "s"}, ${speeches.length} dialogue${speeches.length === 1 ? "" : "s"}, ${effects.length} effect${effects.length === 1 ? "" : "s"}). Do NOT add unlinked people, props, locations or effects.`,
    );
  }
  if (orphans.length) {
    out.push(
      `UNLINKED elements (exist but only appear if explicitly listed in a panel): ${orphans.map((o) => `${_displayName(o)} [${o.type}]`).join(", ")}.`,
    );
  }
  out.push("");
  return out.join("\n");
}
