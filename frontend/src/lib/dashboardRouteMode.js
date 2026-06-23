/**
 * Rotas do dashboard: hub (lista/gestão) vs workspace (estúdio em ecrã cheio).
 */

const WORKSPACE_PREFIX = "/app/";

/** Paths relativos a /app que usam layout de workspace (sem header global). */
export const WORKSPACE_ROUTE_IDS = new Set([
  "generate",
  "studio",
  "pro",
  "artistic",
  "video",
  "marketing-video",
  "motion-flyer",
  "brand-campaign",
  "posters",
  "manga-studio",
  "carousel",
  "wizard",
  "tools/bg-remove",
  "tools/upscale",
  "tools/restore",
  "tools/colorize",
  "tools/inpaint",
  "tools/clothes",
]);

/** Metadados do cabeçalho do workspace — chave i18n em `sidebar.*` ou `common.*`. */
export const WORKSPACE_HEADER_KEYS = {
  generate: "sidebar.generate",
  studio: "sidebar.generate",
  pro: "sidebar.pro",
  artistic: "sidebar_artistic",
  video: "sidebar.video",
  "marketing-video": "sidebar_marketing_video",
  "motion-flyer": "sidebar_motion_flyer",
  "brand-campaign": "sidebar_brand_campaign",
  posters: "sidebar.posters",
  "manga-studio": "sidebar.manga_studio",
  carousel: "sidebar.manga_studio",
  wizard: "sidebar.wizard",
  "tools/bg-remove": "tool_bg_remove_name",
  "tools/upscale": "tool_upscale_name",
  "tools/restore": "tool_restore_name",
  "tools/colorize": "tool_colorize_name",
  "tools/inpaint": "tool_inpaint_name",
  "tools/clothes": "tool_clothes_name",
};

export function getAppRelativePath(pathname) {
  const base = "/app";
  if (!pathname.startsWith(base)) return "";
  const rest = pathname.slice(base.length).replace(/^\//, "");
  return rest;
}

export function isWorkspacePath(pathname) {
  const rel = getAppRelativePath(pathname);
  if (!rel) return false;
  if (WORKSPACE_ROUTE_IDS.has(rel)) return true;
  if (rel.startsWith("video/")) return true;
  return false;
}

export function getWorkspaceHeaderKey(pathname) {
  const rel = getAppRelativePath(pathname);
  if (rel.startsWith("video/")) return WORKSPACE_HEADER_KEYS.video;
  if (rel === "marketing-video") return WORKSPACE_HEADER_KEYS["marketing-video"];
  if (rel === "motion-flyer") return WORKSPACE_HEADER_KEYS["motion-flyer"];
  if (rel === "brand-campaign") return WORKSPACE_HEADER_KEYS["brand-campaign"];
  return WORKSPACE_HEADER_KEYS[rel] || "sidebar.generate";
}
