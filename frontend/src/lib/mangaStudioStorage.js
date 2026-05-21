import { defaultProject, emptyPanel } from "./mangaStudioData";
import { migrateMangaProject } from "./migrateMangaPanel";

const KEY = "rp_manga_projects";
const ACTIVE_KEY = "rp_manga_active_id";
const MAX_DATA_URL_LEN = 48_000;

function readAll() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function trimDataUrl(url) {
  if (!url || typeof url !== "string") return null;
  if (!url.startsWith("data:")) return url;
  if (url.length <= MAX_DATA_URL_LEN) return url;
  return null;
}

/** Reduz tamanho para caber no localStorage (~5 MB). */
export function projectForPersist(project) {
  return {
    ...project,
    characters: (project.characters || []).map((c) => {
      const { _refFile, ...rest } = c;
      return {
        ...rest,
        thumb: trimDataUrl(c.thumb),
        sheets: {
          front: trimDataUrl(c.sheets?.front),
          profile: trimDataUrl(c.sheets?.profile),
          back: trimDataUrl(c.sheets?.back),
          expressions: [],
        },
      };
    }),
    scenarios: (project.scenarios || []).map((s) => ({
      ...s,
      thumb: trimDataUrl(s.thumb),
    })),
    customPoses: (project.customPoses || []).map((p) => ({
      ...p,
      thumb: trimDataUrl(p.thumb),
    })),
    panels: (project.panels || []).map((p) => ({
      ...p,
      resultUrl: p.resultUrl?.startsWith?.("http") ? p.resultUrl : null,
    })),
  };
}

function writeAll(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function listProjects() {
  return readAll().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export function loadProject(id) {
  const p = readAll().find((x) => x.id === id);
  return p ? migrateMangaProject({ ...p }) : null;
}

/**
 * @returns {{ project: object, warning?: string }}
 */
export function saveProject(project) {
  const list = readAll().filter((p) => p.id !== project.id);
  const next = { ...project, updatedAt: Date.now() };
  const toStore = projectForPersist(next);
  try {
    writeAll([toStore, ...list]);
    localStorage.setItem(ACTIVE_KEY, next.id);
    const stripped =
      JSON.stringify(project).length - JSON.stringify(toStore).length > 5000;
    return {
      project: next,
      warning: stripped
        ? "Projeto guardado sem imagens grandes — os PNGs ficam só nesta sessão."
        : undefined,
    };
  } catch (e) {
    const isQuota =
      e?.name === "QuotaExceededError"
      || /quota/i.test(String(e?.message || ""));
    if (isQuota) {
      try {
        const minimal = projectForPersist({
          ...next,
          characters: next.characters.map((c) => ({ ...c, thumb: null, sheets: {} })),
          scenarios: next.scenarios.map((s) => ({ ...s, thumb: null })),
          customPoses: [],
        });
        writeAll([minimal, ...list]);
        localStorage.setItem(ACTIVE_KEY, next.id);
        return {
          project: next,
          warning:
            "Armazenamento cheio — guardámos só texto e estrutura. Evita PNGs enormes ou limpa outros projetos.",
        };
      } catch {
        return {
          project: next,
          warning: "Não foi possível guardar o projeto no browser.",
        };
      }
    }
    return { project: next, warning: "Erro ao guardar projeto." };
  }
}

export function deleteProject(id) {
  const list = readAll().filter((p) => p.id !== id);
  writeAll(list);
  if (localStorage.getItem(ACTIVE_KEY) === id) {
    localStorage.removeItem(ACTIVE_KEY);
  }
}

export function getActiveProjectId() {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

/** Garante arrays e pelo menos um painel — evita crash e tela vazia. */
export function sanitizeMangaProject(project) {
  if (!project) return migrateMangaProject(defaultProject());
  const base = {
    ...project,
    characters: Array.isArray(project.characters) ? project.characters : [],
    scenarios: Array.isArray(project.scenarios) ? project.scenarios : [],
    panels:
      Array.isArray(project.panels) && project.panels.length
        ? project.panels
        : [emptyPanel(0)],
    pageThumbs:
      project.pageThumbs && typeof project.pageThumbs === "object" ? project.pageThumbs : {},
  };
  return migrateMangaProject(base);
}

export function loadActiveProject() {
  const id = getActiveProjectId();
  if (id) {
    const p = loadProject(id);
    if (p) return sanitizeMangaProject(p);
  }
  const fresh = defaultProject();
  saveProject(fresh);
  return sanitizeMangaProject(fresh);
}

export function createNewProject(name) {
  const p = defaultProject();
  if (name) p.name = name;
  saveProject(p);
  return p;
}
