/**
 * Capas locais para a grelha /app/tools (estilo OpenArt — quadrado 512×512).
 */

const IMAGE_COVERS = {
  studio: "/images/tools/studio.jpg",
  clothes: "/images/tools/clothes.jpg",
  pro: "/images/tools/pro.jpg",
  art: "/images/tools/art.jpg",
  bg_remove: "/images/tools/bg_remove.jpg",
  upscale: "/images/tools/upscale.jpg",
  restore: "/images/tools/restore.jpg",
  colorize: "/images/tools/colorize.jpg",
  inpaint: "/images/tools/inpaint.jpg",
  posters: "/images/tools/posters.jpg",
  manga_studio: "/images/tools/manga_studio.jpg",
  wizard: "/images/tools/wizard.jpg",
  carousel: "/images/tools/carousel.jpg",
  video: "/images/tools/video.jpg",
};

const VIDEO_COVERS = {
  "text-marketing": "/images/tools/video/text-marketing.jpg",
  "text-fast": "/images/tools/video/text-fast.mp4",
  image: "/images/tools/video/image.mp4",
  "image-marketing": "/images/tools/video/image-marketing.jpg",
  "image-fast": "/images/tools/video/image-fast.jpg",
  elements: "/images/tools/video/elements.jpg",
  marketing: "/images/tools/video/marketing.jpg",
  fun: "/images/tools/video/fun.jpg",
  edit: "/images/tools/video/edit.mp4",
  "change-bg": "/images/tools/video/change-bg.jpg",
  "change-outfit": "/images/tools/video/change-outfit.jpg",
  restyle: "/images/tools/video/restyle.jpg",
  extend: "/images/tools/video/edit.jpg",
};

/** Capas em vídeo (autoplay nas grelhas). */
export const VIDEO_COVER_IDS = new Set(["text-fast", "image", "edit"]);

/** Posição do crop — útil quando a cena principal não está ao centro */
const OBJECT_POSITION = {
  studio: "center 30%",
  clothes: "center center",
  pro: "center 25%",
  art: "center center",
  bg_remove: "center 28%",
  upscale: "center center",
  restore: "center center",
  colorize: "center center",
  inpaint: "center 40%",
  posters: "center center",
  manga_studio: "center 20%",
  wizard: "center center",
  image: "center 35%",
  "text-marketing": "center 40%",
  edit: "center 45%",
};

/** Bump quando substituir capas — evita cache antigo no browser */
const COVER_VERSION = "5";

function withVersion(path) {
  return `${path}?v=${COVER_VERSION}`;
}

export function getImageToolCover(id) {
  return withVersion(IMAGE_COVERS[id] || `/images/tools/${id}.jpg`);
}

export function getVideoToolCover(id) {
  return withVersion(VIDEO_COVERS[id] || `/images/tools/video/${id}.jpg`);
}

export function getVideoToolPoster(id) {
  return withVersion(`/images/tools/video/${id}.jpg`);
}

export function isVideoToolCover(id, tier = "video") {
  if (tier !== "video" || !VIDEO_COVER_IDS.has(id)) return false;
  const path = VIDEO_COVERS[id] || "";
  return /\.(mp4|webm)$/i.test(path);
}

export function getToolCover(id, tier = "image") {
  if (tier === "video") return getVideoToolCover(id);
  return getImageToolCover(id);
}

export function getToolCoverPosition(id) {
  return OBJECT_POSITION[id] || "center center";
}
