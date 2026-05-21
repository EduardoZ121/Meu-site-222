import { NODE_LABELS } from "./types";

function summarizeNode(data) {
  const type = data.flowType;
  const parts = [data.name || NODE_LABELS[type] || type];
  switch (type) {
    case "personagem":
      if (data.bodyType) parts.push(`${data.bodyType} body`);
      if (data.avatarUrl) parts.push("face reference");
      break;
    case "cenario":
      if (data.location) parts.push(data.location);
      if (data.timeOfDay) parts.push(data.timeOfDay);
      if (data.weather) parts.push(data.weather);
      break;
    case "objeto":
      if (data.description) parts.push(data.description);
      if (data.position) parts.push(`position: ${data.position}`);
      break;
    case "acao":
      if (data.category) parts.push(`${data.category} pose`);
      if (data.handPose) parts.push(`hands: ${data.handPose}`);
      break;
    case "dialogo":
      if (data.text) parts.push(`"${data.text}"`);
      if (data.speechType) parts.push(data.speechType);
      break;
    case "efeito":
      if (data.effectType) parts.push(data.effectType);
      break;
    case "transicao":
      if (data.transitionType) parts.push(`${data.transitionType} transition`);
      break;
    default:
      break;
  }
  return parts.filter(Boolean).join(", ");
}

/** Topological order from edges; unconnected nodes appended by canvas order. */
export function orderNodesByFlow(nodes, edges) {
  if (!nodes.length) return [];
  const ids = nodes.map((n) => n.id);
  const incoming = new Map(ids.map((id) => [id, 0]));
  const adj = new Map(ids.map((id) => [id, []]));
  edges.forEach((e) => {
    if (!incoming.has(e.target) || !adj.has(e.source)) return;
    incoming.set(e.target, (incoming.get(e.target) || 0) + 1);
    adj.get(e.source).push(e.target);
  });
  const roots = ids.filter((id) => incoming.get(id) === 0);
  const queue = [...roots];
  const seen = new Set();
  const ordered = [];
  while (queue.length) {
    const id = queue.shift();
    if (seen.has(id)) continue;
    seen.add(id);
    const node = nodes.find((n) => n.id === id);
    if (node) ordered.push(node);
    (adj.get(id) || []).forEach((t) => {
      incoming.set(t, (incoming.get(t) || 1) - 1);
      if (incoming.get(t) === 0) queue.push(t);
    });
  }
  nodes.forEach((n) => {
    if (!seen.has(n.id)) ordered.push(n);
  });
  return ordered;
}

export function buildFlowPrompt(nodes, edges, globalSettings = {}) {
  const ordered = orderNodesByFlow(nodes, edges);
  const edgeByTarget = new Map(edges.map((e) => [e.target, e]));
  const style = globalSettings.style || "manga";

  const segments = ordered.map((node, i) => {
    const edge = edgeByTarget.get(node.id);
    const base = summarizeNode(node.data);
    const link = edge?.data?.promptEnhancement?.trim();
    const auto =
      edge?.data?.autoEnhance !== false && !link
        ? `linked from previous scene with ${style} style`
        : "";
    const enhancement = link || auto;
    return `[${i + 1}] ${base}${enhancement ? `. ${enhancement}` : ""}`;
  });

  return segments.join(". ").trim();
}

export function calcConsistencyScore(data) {
  let score = 0;
  if (data.avatarUrl) score += 15;
  const sheet = data.referenceSheet || {};
  const angles = ["front", "profile", "threeQuarter", "back"].filter((k) => sheet[k]);
  score += angles.length * 12;
  const exprCount = Object.values(data.expressions || {}).filter(Boolean).length;
  score += Math.min(exprCount * 8, 32);
  return Math.min(100, score);
}
