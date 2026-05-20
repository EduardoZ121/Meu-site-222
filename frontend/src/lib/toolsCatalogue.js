/**
 * Catalogue — REAL TOOLS ONLY. No duplicates.
 * Display names/descriptions come from i18n (useLocalizedTools).
 */
const TOOLS = [
  { id: "studio", tier: "image", to: "/app/generate", cost: 12 },
  { id: "clothes", tier: "image", to: "/app/tools/clothes", cost: 24 },
  { id: "art", tier: "image", to: "/app/artistic", cost: 18 },
  { id: "pro", tier: "image", to: "/app/pro", cost: 26 },
  { id: "bg_remove", tier: "image", to: "/app/tools/bg-remove", cost: 8 },
  { id: "upscale", tier: "image", to: "/app/tools/upscale", cost: 20 },
  { id: "restore", tier: "image", to: "/app/tools/restore", cost: 18 },
  { id: "colorize", tier: "image", to: "/app/tools/colorize", cost: 16 },
  { id: "inpaint", tier: "image", to: "/app/tools/inpaint", cost: 28 },
  { id: "posters", tier: "image", to: "/app/posters", cost: 24 },
  { id: "manga_studio", tier: "image", to: "/app/manga-studio", cost: 15, isBeta: true },
  { id: "wizard", tier: "image", to: "/app/wizard", cost: 0 },
  { id: "video", tier: "video", to: "/app/video", cost: 70 },
];

export default TOOLS;
