/** Categorias de vídeo — grelha de cartões (hub /app/video). */
export const VIDEO_CATEGORIES = [
  {
    id: "text",
    to: "/app/video/text",
    nameKey: "vid_tab_text",
    descKey: "vid_desc_text_mode",
    costKey: "video",
    icon: "type",
  },
  {
    id: "image",
    to: "/app/video/image",
    nameKey: "vid_tab_image",
    descKey: "vid_desc_image_mode",
    costKey: "video",
    icon: "image",
  },
  {
    id: "edit",
    to: "/app/video/edit",
    nameKey: "vid_tab_editor",
    descKey: "vid_cat_edit_short",
    costKey: "videoEdit",
    icon: "clapperboard",
  },
];

export const VIDEO_FLOW_MODES = new Set(["text", "image", "edit"]);
