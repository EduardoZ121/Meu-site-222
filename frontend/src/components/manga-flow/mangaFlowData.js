/** Manga Flow Studio — data helpers (save/load/defaults) */

const STORAGE_KEY = "rp_manga_flow_projects";
const ACTIVE_KEY = "rp_manga_flow_active";

export function uid(prefix = "n") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createDefaultProject(name = "Page 1") {
  const personId = uid("pers");
  const sceneId = uid("scen");
  return {
    id: uid("proj"),
    name,
    nodes: [
      {
        id: personId,
        type: "person",
        position: { x: 100, y: 180 },
        data: {
          name: "",
          pose: "talk",
          emotion: "normal",
          speech: "",
          speechType: "speech",
          clothing: "",
          refImage: null,
          refImageUrl: null,
          _color: { bg: "rgba(147,51,234,0.15)", border: "#9333EA" },
        },
      },
      {
        id: sceneId,
        type: "scenario",
        position: { x: 450, y: 180 },
        data: {
          name: "",
          timeOfDay: "day",
          weather: "clear",
          mood: "neutral",
          description: "",
          refImage: null,
          refImageUrl: null,
          _color: { bg: "rgba(20,184,166,0.15)", border: "#14B8A6" },
        },
      },
    ],
    edges: [],
  };
}

export function saveFlowProject(project) {
  try {
    const all = loadAllProjects();
    const idx = all.findIndex((p) => p.id === project.id);
    const clean = {
      ...project,
      nodes: (project.nodes || []).map((n) => ({
        ...n,
        data: { ...n.data, refImage: undefined },
      })),
    };
    if (idx >= 0) all[idx] = clean;
    else all.push(clean);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    localStorage.setItem(ACTIVE_KEY, project.id);
  } catch { /* quota */ }
}

export function loadFlowProject() {
  try {
    const activeId = localStorage.getItem(ACTIVE_KEY);
    if (!activeId) return null;
    const all = loadAllProjects();
    return all.find((p) => p.id === activeId) || null;
  } catch {
    return null;
  }
}

export function loadAllProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function listFlowProjects() {
  return loadAllProjects().map((p) => ({ id: p.id, name: p.name }));
}
