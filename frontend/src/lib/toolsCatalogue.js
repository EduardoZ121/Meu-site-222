/**
 * Tools catalogue — 30+ entries.
 *
 * Each entry maps to an EXISTING in-app route. We re-use the same backend tool
 * for visual variants (eg. White Background, Logo BG Remover, Face Cutout all
 * route to /app/tools/bg-remove). Preview images are pulled from Pollo's
 * public CDN (just used as illustrative thumbnails — same approach as any
 * marketing showcase).
 */
const TOOLS = [
  // Hero / generation tools (our existing routes)
  {
    id: "clothes_changer", tier: "image", to: "/app/generate?prompt=change+clothes",
    name: "AI Clothes Changer", cost: 12,
    poster: "https://pollo.ai/cms/ai_virtual_try_on_01_cover_ceadf6a653.jpg",
  },
  {
    id: "art_generator", tier: "image", to: "/app/generate",
    name: "AI Art Generator", cost: 10,
    poster: "https://pollo.ai/cms/ai_art_generator_1_cf9a98750a.jpg",
  },
  {
    id: "image_enhancer", tier: "image", to: "/app/tools/upscale",
    name: "Image Enhancer", cost: 8,
    poster: "https://pollo.ai/cms/image_enhancer_s_e486481843.jpg",
  },
  {
    id: "image_upscaler", tier: "image", to: "/app/tools/upscale",
    name: "Image Upscaler", cost: 8,
    poster: "https://pollo.ai/cms/ai_image_upscaler_1_03b9d16a34.jpg",
  },
  {
    id: "bg_remove", tier: "image", to: "/app/tools/bg-remove",
    name: "Background Remover", cost: 5,
    poster: "https://pollo.ai/cms/bg_remove_01_7669e60844.jpg",
  },
  {
    id: "anime_upscaler", tier: "image", to: "/app/tools/upscale",
    name: "Anime Upscaler", cost: 8,
    poster: "https://pollo.ai/cms/anime_photo_01_cbf044d212.jpg",
  },
  {
    id: "logo_bg_remove", tier: "image", to: "/app/tools/bg-remove",
    name: "Logo Background Remover", cost: 5,
    poster: "https://pollo.ai/cms/logo_background_remover_s_fb55e32ad7.jpg",
  },
  {
    id: "white_bg", tier: "image", to: "/app/tools/bg-remove",
    name: "White Background", cost: 5,
    poster: "https://pollo.ai/cms/white_background_editor_01_6ec93062ac.jpg",
  },
  {
    id: "unblur", tier: "image", to: "/app/tools/upscale",
    name: "Unblur Images", cost: 8,
    poster: "https://pollo.ai/cms/unblur_images_s_966be55018.jpg",
  },
  {
    id: "denoise", tier: "image", to: "/app/tools/restore",
    name: "Denoise AI", cost: 8,
    poster: "https://pollo.ai/cms/remove_grains_from_photo_01_d2bd6039a5.jpg",
  },
  {
    id: "sharpener", tier: "image", to: "/app/tools/upscale",
    name: "Image Sharpener", cost: 8,
    poster: "https://pollo.ai/cms/image_sharpener_s_95ae6a9403.jpg",
  },
  {
    id: "tattoo", tier: "image", to: "/app/generate?prompt=tattoo+design",
    name: "AI Tattoo Generator", cost: 10,
    poster: "https://pollo.ai/cms/ai_tattoo_generator_01_64814fb379.jpg",
  },
  {
    id: "cartoon_char", tier: "image", to: "/app/artistic",
    name: "Cartoon Character Maker", cost: 13,
    poster: "https://pollo.ai/cms/cartoon_character_maker_01_e6d51beb8f.jpg",
  },
  {
    id: "logo_gen", tier: "image", to: "/app/generate?prompt=minimalist+brand+logo",
    name: "AI Logo Generator", cost: 10,
    poster: "https://pollo.ai/cms/ai_logo_generator_s_6bab94d901.jpg",
  },
  {
    id: "character_gen", tier: "image", to: "/app/generate?prompt=character+portrait",
    name: "AI Character Generator", cost: 10,
    poster: "https://pollo.ai/cms/ai_character_generator_01_3ad76c7449.jpg",
  },
  {
    id: "face_swap", tier: "image", to: "/app/pro",
    name: "Photo Face Swap", cost: 18,
    poster: "https://pollo.ai/cms/photo_face_swap_01_7897ae4c26.jpg",
  },
  {
    id: "bg_generator", tier: "image", to: "/app/generate?prompt=studio+background",
    name: "AI Background Generator", cost: 10,
    poster: "https://pollo.ai/cms/background_generator_01_cee4cc53c5.jpg",
  },
  {
    id: "magic_eraser", tier: "image", to: "/app/tools/inpaint", isNew: true,
    name: "Magic Eraser", cost: 12,
    poster: "https://pollo.ai/cms/object_remover_01_dca60ac5d5.jpg",
  },
  {
    id: "face_enhancer", tier: "image", to: "/app/tools/restore", isNew: true,
    name: "AI Face Enhancer", cost: 8,
    poster: "https://pollo.ai/cms/old_photo_to_new_photo_01_a29d811098.jpg",
  },
  {
    id: "retouching", tier: "image", to: "/app/pro", isNew: true,
    name: "AI Photo Retouching", cost: 18,
    poster: "https://pollo.ai/cms/photo_face_swap_01_7897ae4c26.jpg",
  },
  {
    id: "object_remove", tier: "image", to: "/app/tools/inpaint",
    name: "Object Remover", cost: 12,
    poster: "https://pollo.ai/cms/object_remover_01_dca60ac5d5.jpg",
  },
  {
    id: "uncrop", tier: "image", to: "/app/tools/inpaint",
    name: "Uncrop Images", cost: 12,
    poster: "https://pollo.ai/cms/uncrop_images_s_3fc8958332.jpg",
  },
  {
    id: "bg_changer", tier: "image", to: "/app/generate",
    name: "AI Background Changer", cost: 12,
    poster: "https://pollo.ai/cms/background_changer_1_f299cdab98.jpg",
  },
  {
    id: "people_remove", tier: "image", to: "/app/tools/inpaint",
    name: "AI People Remover", cost: 12,
    poster: "https://pollo.ai/cms/how_to_remove_people_from_background_01_18a10b09ee.jpg",
  },
  {
    id: "restoration", tier: "image", to: "/app/tools/restore",
    name: "Photo Restoration", cost: 8,
    poster: "https://pollo.ai/cms/old_photo_to_new_photo_01_a29d811098.jpg",
  },
  {
    id: "text_remove", tier: "image", to: "/app/tools/inpaint",
    name: "Text Remover", cost: 12,
    poster: "https://pollo.ai/cms/text_remover_s_ae948c34da.jpg",
  },
  {
    id: "avatar_maker", tier: "image", to: "/app/artistic",
    name: "Cartoon Avatar Maker", cost: 13,
    poster: "https://pollo.ai/cms/cartoon_avatar_s_4884b2d147.jpg",
  },
  {
    id: "colorize", tier: "image", to: "/app/tools/colorize",
    name: "Colorize Black & White", cost: 6,
    poster: "https://pollo.ai/cms/black_and_white_to_color_01_af880a5b97.jpg",
  },
  {
    id: "face_cutout", tier: "image", to: "/app/tools/bg-remove",
    name: "Face Cutout", cost: 5,
    poster: "https://pollo.ai/cms/face_cut_01_dcb2c521aa.jpg",
  },
  {
    id: "inpaint", tier: "image", to: "/app/tools/inpaint",
    name: "Inpaint", cost: 12,
    poster: "https://pollo.ai/cms/inpaint_01_cover_b24232839d.jpg",
  },
  {
    id: "blur_bg", tier: "image", to: "/app/generate?prompt=blur+background",
    name: "Blur Background", cost: 10,
    poster: "https://pollo.ai/cms/blur_background_01_6dd474fda2.jpg",
  },
  // Native Remake tools
  {
    id: "posters", tier: "image", to: "/app/posters",
    name: "Pôsteres Profissionais", cost: 15,
    poster: "https://pollo.ai/cms/ai_art_generator_1_cf9a98750a.jpg",
  },
  {
    id: "carousel", tier: "image", to: "/app/carousel",
    name: "Carrossel Instagram", cost: 8,
    poster: "https://pollo.ai/cms/ai_character_generator_01_3ad76c7449.jpg",
  },
  {
    id: "wizard", tier: "image", to: "/app/wizard",
    name: "Wizard (Assistente)", cost: 0,
    poster: "https://pollo.ai/cms/cartoon_avatar_s_4884b2d147.jpg",
  },

  // Video
  {
    id: "video", tier: "video", to: "/app/video",
    name: "Texto / Foto → Vídeo", cost: 20,
    poster: "https://pollo.ai/cms/photo_face_swap_01_7897ae4c26.jpg",
  },
];

export default TOOLS;
