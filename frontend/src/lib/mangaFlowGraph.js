/**
 * Graph-aware context for Manga Flow — respects edges, isolates panels, binds character refs.
 */

import { getEdgeAiInstruction, resolveEdgeSemantics } from "./mangaFlowSemantics";

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
  const lines = ["## CAST — IDENTITY LOCK (do not swap or invent NPCs)", ""];
  persons.forEach((p, idx) => {
    const name = p.data?.name || `Character ${idx + 1}`;
    const slot = refSlots.find((s) => s.node?.id === p.id);
    const img = slot?.slot ?? idx + 1;
    lines.push(`- "${name}"${hasNodeRef(p) ? ` → reference image ${img} ONLY` : ""}: ${characterAppearanceLine(p) || "use reference photo identity"}`);
  });
  const withRefs = persons.filter(hasNodeRef);
  if (withRefs.length >= 2) {
    const a = withRefs[0].data?.name || "Character 1";
    const b = withRefs[1].data?.name || "Character 2";
    lines.push("");
    lines.push(
      `CRITICAL: "${a}" and "${b}" are different real people. Never use ${a}'s face on ${b} or vice versa. No random anime stock characters.`,
    );
  }
  lines.push("");
  return lines.join("\n");
}
