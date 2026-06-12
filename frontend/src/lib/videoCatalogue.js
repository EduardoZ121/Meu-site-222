/** Categorias de vídeo — hub /app/video (estilo OpenArt: criar + editar). */

import { canAccessVideoFeatures } from "./isAdmin";
import { VIDEO_TOOL_IDS } from "./videoModels";



export const VIDEO_SECTIONS = [

  { id: "create", titleKey: "vid_section_create" },

  { id: "edit", titleKey: "vid_section_edit" },

];



export const VIDEO_CATEGORIES = [

  {

    id: "text-marketing",

    section: "create",

    to: "/app/video/text-marketing",

    tool: VIDEO_TOOL_IDS.kling_turbo,

    flow: "generate",

    nameKey: "vid_cat_text_marketing",

    descKey: "vid_desc_text_marketing",

    costKey: "videoMarketing",

    icon: "megaphone",

    badgeKey: "vid_badge_marketing",

  },

  {

    id: "text-fast",

    section: "create",

    to: "/app/video/text-fast",

    tool: VIDEO_TOOL_IDS.wan_t2v_fast,

    flow: "generate",

    nameKey: "vid_cat_text_fast",

    descKey: "vid_desc_text_fast",

    costKey: "videoFast",

    icon: "zap",

    badgeKey: "vid_badge_fast",

  },

  {

    id: "image",

    section: "create",

    to: "/app/video/image",

    tool: VIDEO_TOOL_IDS.grok,

    flow: "generate",

    nameKey: "vid_tab_image",

    descKey: "vid_desc_image_mode",

    costKey: "videoImage",

    icon: "image",

    badgeKey: "vid_badge_grok",

  },

  {

    id: "image-marketing",

    section: "create",

    to: "/app/video/image-marketing",

    tool: VIDEO_TOOL_IDS.kling_turbo,

    flow: "generate",

    nameKey: "vid_cat_image_marketing",

    descKey: "vid_desc_image_marketing",

    costKey: "videoMarketingImage",

    icon: "sparkles",

    badgeKey: "vid_badge_marketing",

  },

  {

    id: "image-fast",

    section: "create",

    to: "/app/video/image-fast",

    tool: VIDEO_TOOL_IDS.wan_i2v_fast,

    flow: "generate",

    nameKey: "vid_cat_image_fast",

    descKey: "vid_desc_image_fast",

    costKey: "videoFastImage",

    icon: "zap",

    badgeKey: "vid_badge_fast",

  },

  {

    id: "elements",

    section: "create",

    to: "/app/video/elements",

    tool: VIDEO_TOOL_IDS.kling_elements,

    flow: "generate",

    nameKey: "vid_cat_elements",

    descKey: "vid_desc_elements",

    costKey: "videoElements",

    icon: "layers",

    badgeKey: "vid_badge_elements",

  },

  {

    id: "marketing",

    section: "create",

    to: "/app/video/marketing",

    tool: VIDEO_TOOL_IDS.kling_turbo,

    flow: "generate",

    preset: "marketing",

    nameKey: "vid_cat_marketing_pack",

    descKey: "vid_desc_marketing_pack",

    costKey: "videoMarketing",

    icon: "briefcase",

    badgeKey: "vid_badge_marketing",

  },

  {

    id: "fun",

    section: "create",

    to: "/app/video/fun",

    tool: VIDEO_TOOL_IDS.wan_t2v_fast,

    flow: "generate",

    preset: "fun",

    nameKey: "vid_cat_fun",

    descKey: "vid_desc_fun",

    costKey: "videoFast",

    icon: "party",

    badgeKey: "vid_badge_fun",

  },

  {

    id: "edit",

    section: "edit",

    to: "/app/video/edit",

    tool: VIDEO_TOOL_IDS.wan_edit,

    flow: "edit",

    nameKey: "vid_tab_editor",

    descKey: "vid_cat_edit_short",

    costKey: "videoEdit",

    icon: "clapperboard",

  },

  {

    id: "change-bg",

    section: "edit",

    to: "/app/video/change-bg",

    tool: VIDEO_TOOL_IDS.wan_edit,

    flow: "edit",

    preset: "background",

    nameKey: "vid_cat_change_bg",

    descKey: "vid_desc_change_bg",

    costKey: "videoEdit",

    icon: "mountain",

  },

  {

    id: "change-outfit",

    section: "edit",

    to: "/app/video/change-outfit",

    tool: VIDEO_TOOL_IDS.wan_edit,

    flow: "edit",

    preset: "outfit",

    nameKey: "vid_cat_change_outfit",

    descKey: "vid_desc_change_outfit",

    costKey: "videoEdit",

    icon: "shirt",

  },

  {

    id: "restyle",

    section: "edit",

    to: "/app/video/restyle",

    tool: VIDEO_TOOL_IDS.wan_edit,

    flow: "edit",

    preset: "restyle",

    nameKey: "vid_cat_restyle",

    descKey: "vid_desc_restyle",

    costKey: "videoEdit",

    icon: "palette",

  },

];



/** Ocultas no hub por enquanto — rotas directas redireccionam para /app/video */
export const VIDEO_HIDDEN_IDS = new Set([
  "text-marketing",
  "image-marketing",
  "image-fast",
  "elements",
  "marketing",
  "fun",
  "change-bg",
  "change-outfit",
  "restyle",
]);

export const VIDEO_LEGACY_REDIRECTS = {

  text: "text-fast",

};

export function isVideoCategoryVisible(id) {
  return !VIDEO_HIDDEN_IDS.has(id);
}



export const VIDEO_FLOW_MODES = new Set([

  ...VIDEO_CATEGORIES.map((c) => c.id),

  ...Object.keys(VIDEO_LEGACY_REDIRECTS),

]);



export function findVideoCategory(mode) {

  const legacy = VIDEO_LEGACY_REDIRECTS[mode];

  const resolved = legacy || mode;

  const cat = VIDEO_CATEGORIES.find((c) => c.id === resolved);

  if (!cat || !isVideoCategoryVisible(cat.id)) return null;

  return cat;

}



export function categoriesForSection(sectionId, user = null) {
  const pool = user ? getVideoCategoriesForUser(user) : VIDEO_CATEGORIES;
  return pool.filter((c) => c.section === sectionId);
}

export function getVideoCategoriesForUser(user) {
  if (!canAccessVideoFeatures(user)) return [];
  return VIDEO_CATEGORIES.filter((c) => isVideoCategoryVisible(c.id));
}

export { canAccessVideoFeatures };


