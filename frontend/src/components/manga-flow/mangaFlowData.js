/** Manga Flow Studio — data helpers with MULTI-PAGE support */

import { hydrateFlowNodes, sanitizeNodeRefData } from "../../lib/mangaFlowRefStorage";

const STORAGE_KEY = "rp_manga_flow_projects";
const ACTIVE_KEY = "rp_manga_flow_active";
const ACTIVE_PAGE_KEY = "rp_manga_flow_active_page";

export function uid(prefix = "n") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createEmptyPage(name = "Page 1") {
  return {
    id: uid("pg"),
    name,
    nodes: [
      {
        id: uid("pers"), type: "person",
        position: { x: 100, y: 180 },
        data: { name: "", pose: "talk", emotion: "normal", speech: "", speechType: "speech", clothing: "", refImage: null, refImageUrl: null, _color: { bg: "rgba(147,51,234,0.15)", border: "#9333EA" } },
      },
      {
        id: uid("scen"), type: "scenario",
        position: { x: 450, y: 180 },
        data: { name: "", timeOfDay: "day", weather: "clear", mood: "neutral", description: "", refImage: null, refImageUrl: null, _color: { bg: "rgba(20,184,166,0.15)", border: "#14B8A6" } },
      },
    ],
    edges: [],
  };
}

export function createDefaultProject(name = "My Manga") {
  const page1 = createEmptyPage("Página 1");
  return {
    id: uid("proj"),
    name,
    updatedAt: Date.now(),
    pages: [page1],
    activePageId: page1.id,
  };
}

/** Migrate old single-page projects to multi-page format */
function migrateProject(proj) {
  if (proj.pages && Array.isArray(proj.pages)) return proj;
  const page = {
    id: uid("pg"),
    name: "Página 1",
    nodes: proj.nodes || [],
    edges: proj.edges || [],
  };
  return { ...proj, pages: [page], activePageId: page.id, nodes: undefined, edges: undefined };
}

function cleanForStorage(project) {
  return {
    ...project,
    updatedAt: Date.now(),
    pages: (project.pages || []).map((pg) => ({
      ...pg,
      nodes: (pg.nodes || []).map((n) => ({
        ...n,
        data: sanitizeNodeRefData(n.data || {}),
      })),
    })),
  };
}

function hydrateProjectPages(project) {
  return {
    ...project,
    pages: (project.pages || []).map((pg) => ({
      ...pg,
      nodes: hydrateFlowNodes(pg.nodes),
    })),
  };
}

export function saveFlowProject(project) {
  try {
    const all = loadAllProjects();
    const idx = all.findIndex((p) => p.id === project.id);
    const clean = cleanForStorage(project);
    if (idx >= 0) all[idx] = clean; else all.push(clean);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    localStorage.setItem(ACTIVE_KEY, project.id);
    if (project.activePageId) localStorage.setItem(ACTIVE_PAGE_KEY, project.activePageId);
  } catch { /* quota */ }
}

export function loadFlowProject() {
  try {
    const activeId = localStorage.getItem(ACTIVE_KEY);
    if (!activeId) return null;
    const all = loadAllProjects();
    const found = all.find((p) => p.id === activeId);
    if (!found) return null;
    const migrated = migrateProject(found);
    const savedPageId = localStorage.getItem(ACTIVE_PAGE_KEY);
    if (savedPageId && migrated.pages.some((pg) => pg.id === savedPageId)) {
      migrated.activePageId = savedPageId;
    } else if (!migrated.activePageId && migrated.pages.length) {
      migrated.activePageId = migrated.pages[0].id;
    }
    return hydrateProjectPages(migrated);
  } catch { return null; }
}

export function loadAllProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.map((p) => hydrateProjectPages(migrateProject(p))) : [];
  } catch { return []; }
}

export function listFlowProjects() {
  return loadAllProjects()
    .map((p) => ({ id: p.id, name: p.name || "Untitled", updatedAt: p.updatedAt || 0, pageCount: (p.pages || []).length }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function loadFlowProjectById(id) {
  try {
    const all = loadAllProjects();
    const found = all.find((p) => p.id === id);
    return found ? hydrateProjectPages(migrateProject(found)) : null;
  } catch { return null; }
}

export function deleteFlowProject(id) {
  try {
    const all = loadAllProjects().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    if (localStorage.getItem(ACTIVE_KEY) === id) localStorage.removeItem(ACTIVE_KEY);
  } catch { /* ignore */ }
}
