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
  art:       U("photo-1547891654-e66ed7ebb968"),       // artistic painting
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

// === ARTISTIC STYLES (62 — by id from artistic_styles.py) ===
export const ARTISTIC_PREVIEWS = {
  // Anime
  anime:             U("photo-1607604276583-eef5d076aa5f"),
  drawn_anime:       U("photo-1612544448445-b8232cff3b6c"),
  manga:             U("photo-1578632292113-32cf45d23bb0"),
  ghibli:            U("photo-1542273917363-3b1817f69a2d"),
  waifu:             U("photo-1578632749014-ca77efd052eb"),
  vintage_anime:     U("photo-1611162616305-c69b3fa7fbe0"),
  neon_vintage_anime:U("photo-1545239351-1e30b8ec98ed"),
  anime_50s_info:    U("photo-1503455637927-730bce8583c0"),
  // Real
  realistic:         U("photo-1517841905240-472988babdf9"),
  pro_photo:         U("photo-1494790108377-be9c29b29330"),
  cinematic_photo:   U("photo-1492691527719-9d1e07e534b4"),
  "1920s_photo":     U("photo-1503951914875-452162b0f3f1"),
  polaroid:          U("photo-1502082553048-f009c37129b9"),
  render_3d:         U("photo-1633957897986-70e83293f3ff"),
  // Paint
  oil_paint:         U("photo-1578321709-31bb01a3a7b8"),
  oil_realism:       U("photo-1547891654-e66ed7ebb968"),
  oil_old:           U("photo-1577720580479-7d839d829c73"),
  watercolor:        U("photo-1578321709-31bb01a3a7b8"),
  ink_wash:          U("photo-1582738411702-d4dc62ab3a30"),
  nihonga:           U("photo-1528360983277-13d401cdc186"),
  ukiyoe:            U("photo-1528360983277-13d401cdc186"),
  renaissance:       U("photo-1577720580479-7d839d829c73"),
  painterly:         U("photo-1547891654-e66ed7ebb968"),
  splatter:          U("photo-1541356665065-22676f35dd40"),
  // Cartoon
  disney_2d:         U("photo-1578321709-31bb01a3a7b8"),
  disney_3d:         U("photo-1633957897986-70e83293f3ff"),
  disney_sketch:     U("photo-1612544448445-b8232cff3b6c"),
  cartoon:           U("photo-1611162617474-5b21e879e113"),
  cute_3d:           U("photo-1633957897986-70e83293f3ff"),
  claymation:        U("photo-1611162617474-5b21e879e113"),
  pokemon_3d:        U("photo-1611162617474-5b21e879e113"),
  // Comic
  comic:             U("photo-1612544448445-b8232cff3b6c"),
  vintage_comic:     U("photo-1611162616305-c69b3fa7fbe0"),
  franco_belge:      U("photo-1611162616305-c69b3fa7fbe0"),
  tintin:            U("photo-1611162616305-c69b3fa7fbe0"),
  mtg_card:          U("photo-1542273917363-3b1817f69a2d"),
  concept_sketch:    U("photo-1578321709-31bb01a3a7b8"),
  sketch:            U("photo-1612544448445-b8232cff3b6c"),
  crayon:            U("photo-1578321709-31bb01a3a7b8"),
  tattoo:            U("photo-1542736143-29a8fbb4c0d4"),
  // Fantasy
  fantasy_landscape: U("photo-1500382017468-9049fed747ef"),
  fantasy_portrait:  U("photo-1542178243-bc20204b769f"),
  concept_art:       U("photo-1500382017468-9049fed747ef"),
  medieval:          U("photo-1577720580479-7d839d829c73"),
  cyberpunk:         U("photo-1545239351-1e30b8ec98ed"),
  retrowave:         U("photo-1545239351-1e30b8ec98ed"),
  steampunk:         U("photo-1577720580479-7d839d829c73"),
  pixel_art:         U("photo-1542736143-29a8fbb4c0d4"),
  low_poly:          U("photo-1633957897986-70e83293f3ff"),
  // Vintage
  vintage_photo:     U("photo-1503951914875-452162b0f3f1"),
  vintage_pulp:      U("photo-1611162616305-c69b3fa7fbe0"),
  enamel_50s:        U("photo-1611162616305-c69b3fa7fbe0"),
  pop_art:           U("photo-1541356665065-22676f35dd40"),
  art_nouveau:       U("photo-1547891654-e66ed7ebb968"),
  film_noir:         U("photo-1492691527719-9d1e07e534b4"),
  gothic:            U("photo-1542178243-bc20204b769f"),
  cursed:            U("photo-1542178243-bc20204b769f"),
  // Other
  digital_art:       U("photo-1547891654-e66ed7ebb968"),
  minimalist:        U("photo-1531746020798-e6953c6e8e04"),
  furry_oil:         U("photo-1547891654-e66ed7ebb968"),
  furry_cinematic:   U("photo-1492691527719-9d1e07e534b4"),
  yugioh:            U("photo-1542273917363-3b1817f69a2d"),
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
