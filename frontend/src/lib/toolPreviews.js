/**
 * Curated preview images served from /public/images.
 * Keeping these local avoids third-party CDN failures that can make grids look empty.
 */

const LOCAL_PREVIEWS = [
  "/images/tools/studio.jpg",
  "/images/tools/pro.jpg",
  "/images/tools/art.jpg",
  "/images/tools/posters.jpg",
  "/images/tools/carousel.jpg",
  "/images/tools/clothes.jpg",
  "/images/tools/bg_remove.jpg",
  "/images/tools/upscale.jpg",
  "/images/tools/restore.jpg",
  "/images/tools/colorize.jpg",
  "/images/styles-grid.jpg",
  "/images/edit.jpg",
  "/images/generate.jpg",
  "/images/motion.jpg",
];

const U = (id) => {
  const hash = Array.from(id).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return LOCAL_PREVIEWS[hash % LOCAL_PREVIEWS.length];
};

// === TOOLS (12 main cards on /app/tools) ===
export const TOOL_PREVIEWS = {
  studio:    U("photo-1614729939124-032d1e6d3c4a"),    // creative artist tools
  clothes:   U("photo-1490481651871-ab68de25d43d"),    // fashion shot
  pro:       U("photo-1494790108377-be9c29b29330"),    // studio portrait
  bg_remove: U("photo-1521572163474-6864f9cf17ab"),    // silhouette
  upscale:   U("photo-1500382017468-9049fed747ef"),    // detailed scenic
  restore:   U("photo-1503951914875-452162b0f3f1"),    // old photograph
  colorize:  U("photo-1503951914875-452162b0f3f1"),    // B&W to color
  inpaint:   U("photo-1502082553048-f009c37129b9"),    // landscape
  posters:   U("photo-1551582045-6ec9c11d8697"),       // poster design
  carousel:  U("photo-1611162617474-5b21e879e113"),    // instagram-style
  wizard:    U("photo-1620641788421-7a1c342ea42e"),    // magical purple
  video:     U("photo-1492691527719-9d1e07e534b4"),    // film/cinema
};

// === PRO PRESETS (20 — by id from pro_presets.py) ===
export const PRO_PREVIEWS = {
  original:    U("photo-1531123897727-8f129e1688ce"),    // natural portrait
  expression:  U("photo-1494790108377-be9c29b29330"),    // expressive woman
  softer:      U("photo-1438761681033-6461ffad8d80"),    // soft lighting
  cinematic:   U("photo-1492691527719-9d1e07e534b4"),    // cinematic moody
  ultra_real:  U("photo-1517841905240-472988babdf9"),    // ultra real portrait
  iphone:      U("photo-1488161628813-04466f872be2"),    // selfie style
  studio:      U("photo-1507003211169-0a1dd7228f2d"),    // studio portrait
  smile:       U("photo-1545167622-3a6ac756afa4"),       // smiling
  seductive:   U("photo-1488426862026-3ee34a7d66df"),    // intense gaze
  model:       U("photo-1524504388940-b1c1722653e1"),    // fashion model
  intense:     U("photo-1542178243-bc20204b769f"),       // dramatic look
  romantic:    U("photo-1521146764736-56c929d59c83"),    // soft romantic
  fun:         U("photo-1531746020798-e6953c6e8e04"),    // playful
  fullbody:    U("photo-1496360166961-10a51d5f367a"),    // editorial full body
  lighting:    U("photo-1520975954732-35dd22299614"),    // dramatic lighting
  skin_hair:   U("photo-1542824585-1c9e08ad6dca"),       // close-up skin
  outfit:      U("photo-1490481651871-ab68de25d43d"),    // fashion outfit
  color:       U("photo-1493612276216-ee3925520721"),    // vibrant colors
  eyes:        U("photo-1531123897727-8f129e1688ce"),    // expressive eyes
  max:         U("photo-1517841905240-472988babdf9"),    // max quality
};

// === CLOTHES CHANGER STYLE PRESETS ===
export const CLOTHES_PREVIEWS = {
  casual:     U("photo-1488161628813-04466f872be2"),
  formal:     U("photo-1507003211169-0a1dd7228f2d"),
  streetwear: U("photo-1519415943484-9fa1873496d4"),
  luxury:     U("photo-1490481651871-ab68de25d43d"),
  sport:      U("photo-1571019613454-1cb2f99b2d8b"),
  evening:    U("photo-1521146764736-56c929d59c83"),
  vintage:    U("photo-1503951914875-452162b0f3f1"),
  business:   U("photo-1507003211169-0a1dd7228f2d"),
};
