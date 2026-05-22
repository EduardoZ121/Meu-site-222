import { NODE_COLORS, NODE_ICONS, NODE_LABELS } from "./types";
import { orderNodesByFlow, calcConsistencyScore } from "./buildFlowPrompt";

export const STORY_GENRES = [
  { id: "action", label: "Ação", icon: "⚔️" },
  { id: "romance", label: "Romance", icon: "💕" },
  { id: "comedy", label: "Comédia", icon: "😄" },
  { id: "drama", label: "Drama", icon: "🎭" },
  { id: "horror", label: "Terror", icon: "👻" },
  { id: "scifi", label: "Sci-fi", icon: "🚀" },
  { id: "fantasy", label: "Fantasia", icon: "🐉" },
  { id: "slice", label: "Slice of life", icon: "☕" },
];

export const STORY_TONES = [
  { id: "light", label: "Leve" },
  { id: "dramatic", label: "Dramático" },
  { id: "dark", label: "Sombrio" },
  { id: "epic", label: "Épico" },
  { id: "mysterious", label: "Misterioso" },
  { id: "humorous", label: "Humorístico" },
];

export const STORY_POV = [
  { id: "first", label: "1ª pessoa" },
  { id: "third", label: "3ª pessoa" },
  { id: "omniscient", label: "Omnisciente" },
];

export const READING_ORDERS = [
  { id: "ltr", label: "← Esquerda → direita" },
  { id: "rtl", label: "Direita → esquerda →" },
  { id: "ttb", label: "↑ Cima → baixo" },
];

export const DEFAULT_STORY = {
  chapterTitle: "Capítulo 1",
  synopsis: "",
  logline: "",
  genre: "action",
  tone: "dramatic",
  pov: "third",
  readingOrder: "ltr",
  themes: [],
  manualSequence: null,
  beats: [],
  sceneNotes: {},
  tags: [],
};

export function getStorySequence(nodes, edges, manualSequence) {
  if (manualSequence?.length) {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const ordered = manualSequence.map((id) => byId.get(id)).filter(Boolean);
    nodes.forEach((n) => {
      if (!manualSequence.includes(n.id)) ordered.push(n);
    });
    return ordered;
  }
  return orderNodesByFlow(nodes, edges);
}

export function buildBranches(nodes, edges) {
  const children = new Map(nodes.map((n) => [n.id, []]));
  edges.forEach((e) => {
    if (children.has(e.source)) children.get(e.source).push(e.target);
  });
  const incoming = new Map(nodes.map((n) => [n.id, 0]));
  edges.forEach((e) => incoming.set(e.target, (incoming.get(e.target) || 0) + 1));
  const roots = nodes.filter((n) => (incoming.get(n.id) || 0) === 0).map((n) => n.id);

  const paths = [];
  function walk(id, trail) {
    if (trail.includes(id)) {
      paths.push([...trail, id]);
      return;
    }
    const next = children.get(id) || [];
    if (!next.length) {
      paths.push([...trail, id]);
      return;
    }
    next.forEach((child) => walk(child, [...trail, id]));
  }
  (roots.length ? roots : nodes.slice(0, 1).map((n) => n.id)).forEach((r) => walk(r, []));
  return paths.map((ids, i) => ({
    id: `branch_${i}`,
    label: `Ramo ${i + 1}`,
    nodeIds: ids,
    length: ids.length,
  }));
}

export function analyzeCoherence(nodes, edges, story, sequence) {
  const issues = [];
  let score = 100;

  if (!nodes.length) {
    return { score: 0, issues: [{ id: "empty", level: "error", message: "Adiciona caixas no Flow para começar a história." }] };
  }

  if (!story.synopsis?.trim() || story.synopsis.length < 20) {
    issues.push({ id: "synopsis", level: "warn", message: "Sinopse curta — descreve o enredo em pelo menos 20 caracteres." });
    score -= 8;
  }

  const orphans = nodes.filter((n) => {
    const hasIn = edges.some((e) => e.target === n.id);
    const hasOut = edges.some((e) => e.source === n.id);
    return !hasIn && !hasOut && nodes.length > 1;
  });
  orphans.forEach((n) => {
    issues.push({
      id: `orphan_${n.id}`,
      level: "warn",
      message: `«${n.data.name}» está isolada — liga-a ao fluxo.`,
      nodeId: n.id,
    });
    score -= 6;
  });

  const roots = nodes.filter((n) => !edges.some((e) => e.target === n.id));
  if (roots.length > 1) {
    issues.push({
      id: "multi_root",
      level: "warn",
      message: `${roots.length} inícios de história — considera um único ponto de partida.`,
    });
    score -= 5;
  }

  edges.forEach((e) => {
    if (!e.data?.promptEnhancement?.trim()) {
      const src = nodes.find((n) => n.id === e.source);
      const tgt = nodes.find((n) => n.id === e.target);
      issues.push({
        id: `edge_${e.id}`,
        level: "info",
        message: `Ligação ${src?.data?.name || "?"} → ${tgt?.data?.name || "?"} sem prompt de relação.`,
        edgeId: e.id,
      });
      score -= 3;
    }
  });

  const chars = nodes.filter((n) => n.data.flowType === "personagem");
  chars.forEach((n) => {
    const c = calcConsistencyScore(n.data);
    if (c < 40) {
      issues.push({
        id: `char_${n.id}`,
        level: "warn",
        message: `Personagem «${n.data.name}» com consistência baixa (${c}%).`,
        nodeId: n.id,
      });
      score -= 7;
    }
  });

  const dialogs = sequence.filter((n) => n.data.flowType === "dialogo");
  if (sequence.length >= 4 && dialogs.length < 1) {
    issues.push({ id: "no_dialog", level: "info", message: "História longa sem diálogo — adiciona balões para narrativa." });
    score -= 5;
  }

  const scenes = sequence.filter((n) => n.data.flowType === "cenario");
  if (sequence.length >= 3 && !scenes.length) {
    issues.push({ id: "no_scene", level: "info", message: "Sem caixa de cenário — o fundo pode ficar inconsistente." });
    score -= 4;
  }

  if (sequence.length >= 2) {
    let prevChar = null;
    sequence.forEach((n, i) => {
      if (n.data.flowType === "personagem") prevChar = n.data.name;
      if (n.data.flowType === "dialogo" && !n.data.text?.trim()) {
        issues.push({
          id: `dialog_empty_${n.id}`,
          level: "warn",
          message: `Passo ${i + 1}: diálogo vazio.`,
          nodeId: n.id,
        });
        score -= 5;
      }
    });
  }

  score = Math.max(0, Math.min(100, score));
  return { score, issues };
}

export function stepSummary(node, edgeIn) {
  const type = node.data.flowType;
  const icon = NODE_ICONS[type] || "📦";
  const label = NODE_LABELS[type] || type;
  const name = node.data.name || node.data.text?.slice(0, 40) || label;
  let detail = "";
  if (type === "dialogo" && node.data.text) detail = `"${node.data.text.slice(0, 80)}"`;
  else if (type === "cenario" && node.data.location) detail = node.data.location;
  else if (type === "acao") detail = node.data.category || "ação";
  else if (edgeIn?.data?.promptEnhancement) detail = edgeIn.data.promptEnhancement.slice(0, 60);
  return { icon, label, name, detail, color: NODE_COLORS[type] };
}

export function exportStoryText(projectName, story, sequence, edges) {
  const lines = [
    `# ${projectName}`,
    `## ${story.chapterTitle || "Capítulo"}`,
    "",
    story.logline ? `Logline: ${story.logline}` : "",
    story.synopsis ? `Sinopse: ${story.synopsis}` : "",
    `Género: ${story.genre} · Tom: ${story.tone} · POV: ${story.pov}`,
    "",
    "## Sequência narrativa",
    "",
  ].filter(Boolean);

  const edgeByTarget = new Map(edges.map((e) => [e.target, e]));
  sequence.forEach((node, i) => {
    const edge = edgeByTarget.get(node.id);
    const note = story.sceneNotes?.[node.id];
    const s = stepSummary(node, edge);
    lines.push(`${i + 1}. ${s.icon} ${s.name} (${s.label})`);
    if (s.detail) lines.push(`   → ${s.detail}`);
    if (note) lines.push(`   Nota: ${note}`);
    lines.push("");
  });
  return lines.join("\n");
}

export const DEMO_STORY = {
  chapterTitle: "Capítulo 1 — Telhado ao pôr do sol",
  synopsis:
    "Dois estudantes encontram-se no telhado da escola ao pôr do sol. Entre conversas tímidas e o vento, a tensão romântica cresce até um momento decisivo.",
  logline: "No telhado, um pôr do sol e duas confissões que mudam tudo.",
  genre: "romance",
  tone: "light",
  pov: "third",
  readingOrder: "ltr",
};
