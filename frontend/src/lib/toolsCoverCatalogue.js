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
  "text-fast": "/images/tools/video/text-fast.jpg",
  image: "/images/tools/video/image.jpg",
  "image-marketing": "/images/tools/video/image-marketing.jpg",
  "image-fast": "/images/tools/video/image-fast.jpg",
  elements: "/images/tools/video/elements.jpg",
  marketing: "/images/tools/video/marketing.jpg",
  fun: "/images/tools/video/fun.jpg",
  edit: "/images/tools/video/edit.jpg",
  "change-bg": "/images/tools/video/change-bg.jpg",
  "change-outfit": "/images/tools/video/change-outfit.jpg",
  restyle: "/images/tools/video/restyle.jpg",
  extend: "/images/tools/video/edit.jpg",
};

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
const COVER_VERSION = "4";

function withVersion(path) {
  return `${path}?v=${COVER_VERSION}`;
}

export function getImageToolCover(id) {
  return withVersion(IMAGE_COVERS[id] || `/images/tools/${id}.jpg`);
}

export function getVideoToolCover(id) {
  return withVersion(VIDEO_COVERS[id] || `/images/tools/video/${id}.jpg`);
}

export function getToolCover(id, tier = "image") {
  if (tier === "video") return getVideoToolCover(id);
  return getImageToolCover(id);
}

export function getToolCoverPosition(id) {
  return OBJECT_POSITION[id] || "center center";
}
