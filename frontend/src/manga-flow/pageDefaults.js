/** Configuração de página de mangá (layout + slots de painéis). */

export const PAGE_LAYOUTS = [
  { id: "horizontal", label: "Horizontal", icon: "↔️", slots: 3, cols: 3, rows: 1 },
  { id: "vertical", label: "Vertical", icon: "↕️", slots: 4, cols: 1, rows: 4 },
  { id: "grid_2x2", label: "Grid 2×2", icon: "⊞", slots: 4, cols: 2, rows: 2 },
];

export const BORDER_STYLES = [
  { id: "classic", label: "Manga clássico" },
  { id: "webtoon", label: "Webtoon (sem margem)" },
  { id: "bleed", label: "Bleed / sangria" },
  { id: "gutterless", label: "Sem gutter" },
];

export const READING_ORDERS = [
  { id: "ltr", label: "← Esquerda → direita" },
  { id: "rtl", label: "Direita → esquerda →" },
  { id: "ttb", label: "↑ Cima → baixo" },
];

export function layoutMeta(layoutId) {
  return PAGE_LAYOUTS.find((l) => l.id === layoutId) || PAGE_LAYOUTS[0];
}

export function slotCountForLayout(layoutId) {
  return layoutMeta(layoutId).slots;
}

export function createEmptySlots(layoutId, fillIds = []) {
  const n = slotCountForLayout(layoutId);
  const slots = Array.from({ length: n }, (_, i) => fillIds[i] || null);
  return slots;
}

export function createPage(index = 0, layoutId = "horizontal", slotNodeIds = []) {
  return {
    id: `page_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
    title: `Página ${index + 1}`,
    layout: layoutId,
    slotNodeIds: createEmptySlots(layoutId, slotNodeIds),
    margin: 14,
    gutter: 10,
    readingOrder: "ltr",
    pageNotes: "",
    referenceUrl: null,
    resultUrl: null,
    borderStyle: "classic",
    background: "#f8f8fc",
  };
}

/** Agrupa a sequência narrativa em páginas conforme slots do layout. */
export function buildPagesFromSequence(sequence, layoutId = "horizontal", existingItems = []) {
  const slotsPerPage = slotCountForLayout(layoutId);
  const nodeIds = sequence.map((n) => n.id);
  const pages = [];
  let pageIndex = 0;

  for (let i = 0; i < nodeIds.length; i += slotsPerPage) {
    const chunk = nodeIds.slice(i, i + slotsPerPage);
    const prev = existingItems[pageIndex];
    if (prev && prev.layout === layoutId) {
      const merged = createEmptySlots(layoutId, chunk);
      pages.push({
        ...prev,
        slotNodeIds: merged,
        title: prev.title || `Página ${pageIndex + 1}`,
      });
    } else {
      pages.push(createPage(pageIndex, layoutId, chunk));
    }
    pageIndex += 1;
  }

  if (!pages.length) {
    pages.push(createPage(0, layoutId, []));
  }

  return pages;
}
