/** Categorias de vídeo — três colunas na página principal /app/video. */
export const VIDEO_CATEGORIES = [
  {
    id: "text",
    to: "/app/video",
    testId: "video-column-text",
    nameKey: "vid_tab_text",
    descKey: "vid_desc_text_mode",
    costKey: "video",
    icon: "type",
  },
  {
    id: "image",
    to: "/app/video",
    testId: "video-column-image",
    nameKey: "vid_tab_image",
    descKey: "vid_desc_image_mode",
    costKey: "video",
    icon: "image",
  },
  {
    id: "edit",
    to: "/app/video",
    testId: "video-column-edit",
    nameKey: "vid_tab_editor",
    descKey: "vid_cat_edit_short",
    costKey: "videoEdit",
    icon: "clapperboard",
  },
];

export const VIDEO_FLOW_MODES = new Set(["text", "image", "edit"]);
