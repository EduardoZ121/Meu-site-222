/** Carousel page UI + default example content. */

import { emptySlide } from "./carouselSlides";

const en = {
  car_sec_ref: "1. REFERENCE (OPTIONAL)",
  car_sec_ref_hint: "Face, character, or main product — keeps identity across all slides.",
  car_upload_label: "Attach the main face, character, or product",
  car_upload_hint: "Paste with Ctrl+V · JPEG, PNG or WebP",
  car_sec_brief: "2. POST CONTEXT",
  car_brief_ph: "e.g. Summer skincare launch, fresh tone, audience 25–35, CTA link in bio.",
  car_brief_hint: "Product, campaign, tone, and audience — the AI uses this on every slide.",
  car_sec_style: "3. OVERALL VISUAL STYLE",
  car_sec_continuity: "4. SLIDE CONTINUITY",
  car_toggle_character: "Same character",
  car_toggle_character_hint: "Consistent face and outfit.",
  car_toggle_lighting: "Same lighting",
  car_toggle_lighting_hint: "Matching time of day and shadows.",
  car_toggle_palette: "Same palette",
  car_toggle_palette_hint: "Unified grading across the series.",
  car_toggle_smooth: "Smooth transition",
  car_toggle_smooth_hint: "Links each slide to the next (per-slide mode).",
  car_panoramic_hint:
    "Describe each panel as part of the same scene (left → center → right). Typography can span the cuts.",
  car_sec_panels: "5. PANELS ({n} / {max})",
  car_add_slide: "Add slide",
  car_slide_ph: "Describe slide {n}…",
  car_sec_model: "6. AI ENGINE",
  car_sec_format: "7. FORMAT",
  car_result_here: "Your carousel appears here.",
  car_empty_panoramic: "Panoramic mode: one continuous image split into vertical panels.",
  car_empty_per_slide: "Set context, panels, and tap Render.",
  car_gen_panorama: "Generating continuous panoramic…",
  car_split_panels: "Splitting into panels…",
  car_gen_slides: "Rendering {n} slides…",
  car_start_panorama: "Starting panoramic…",
  car_start: "Starting…",
  car_no_panorama: "Panoramic image missing.",
  car_split_failed:
    'Panoramic generated but failed to split into slides: {err} Open "View original panoramic" and crop manually, or try again.',
  car_example_loaded: "Seamless example loaded — adjust text and render.",
  car_loading_cut: "Cutting seamless panels",
  car_loading_one_image: "One image · multiple cuts",
  car_loading_progress: "{index}/{total} · context + continuity",
  car_loading_preserve: "Preserving character and style",
  car_loading_slide: "Slide {index} of {total}",
  car_alt_panorama: "Panoramic",
  car_splitting_vertical: "Splitting into vertical panels…",
  car_split_fail_msg:
    "The panoramic was generated but automatic cropping failed. Use the image below or try again.",
  car_open_panorama: "Open full-size panoramic",
  car_view_original: "View original panoramic (before crop)",
  car_download_fail: "Download failed.",
  car_role_cover: "Cover",
  car_role_cover_hint: "Hook — first image of the post",
  car_role_content: "Content",
  car_role_content_hint: "Develops the story",
  car_role_detail: "Detail",
  car_role_detail_hint: "Close-up, product, or moment",
  car_role_cta: "CTA",
  car_role_cta_hint: "Closing call-to-action",
};

const pt = {
  car_sec_ref: "1. REFERÊNCIA (OPCIONAL)",
  car_sec_ref_hint: "Rosto, personagem ou produto principal — mantém a identidade em todas as slides.",
  car_upload_label: "Anexar o rosto, personagem ou produto principal",
  car_upload_hint: "Cola com Ctrl+V · JPEG, PNG ou WebP",
  car_sec_brief: "2. CONTEXTO DO POST",
  car_brief_ph: "Ex.: Lançamento skincare verão, tom fresco, público 25–35, CTA link na bio.",
  car_brief_hint: "Produto, campanha, tom e público — a IA usa isto em todas as slides.",
  car_sec_style: "3. ESTILO VISUAL GERAL",
  car_sec_continuity: "4. CONTINUIDADE ENTRE SLIDES",
  car_toggle_character: "Mesma personagem",
  car_toggle_character_hint: "Rosto e outfit consistentes.",
  car_toggle_lighting: "Mesma iluminação",
  car_toggle_lighting_hint: "Hora do dia e sombras idênticas.",
  car_toggle_palette: "Mesma paleta",
  car_toggle_palette_hint: "Grading unificado na série.",
  car_toggle_smooth: "Transição suave",
  car_toggle_smooth_hint: "Liga cada slide à seguinte (modo slide a slide).",
  car_panoramic_hint:
    "Descreve cada painel como parte da mesma cena (esquerda → centro → direita). A tipografia pode atravessar os cortes.",
  car_sec_panels: "5. PAINÉIS ({n} / {max})",
  car_add_slide: "Adicionar slide",
  car_slide_ph: "Descreve a slide {n}…",
  car_sec_model: "6. MOTOR DE IA",
  car_sec_format: "7. FORMATO",
  car_result_here: "O carrossel aparece aqui.",
  car_empty_panoramic: "Modo panorâmico: uma imagem contínua dividida em painéis verticais.",
  car_empty_per_slide: "Define contexto, painéis e toca em Renderizar.",
  car_gen_panorama: "A gerar panorâmica contínua…",
  car_split_panels: "A dividir em slides…",
  car_gen_slides: "A renderizar {n} slides…",
  car_start_panorama: "A iniciar panorâmica…",
  car_start: "A iniciar…",
  car_no_panorama: "Panorâmica sem imagem.",
  car_split_failed:
    'Panorâmica gerada, mas falhou ao dividir em slides: {err} Abre "Ver panorâmica original" e corta manualmente, ou tenta de novo.',
  car_example_loaded: "Exemplo seamless carregado — ajusta os textos e renderiza.",
  car_loading_cut: "A cortar painéis seamless",
  car_loading_one_image: "Uma imagem · vários cortes",
  car_loading_progress: "{index}/{total} · contexto + continuidade",
  car_loading_preserve: "Preserva personagem e estilo",
  car_loading_slide: "Slide {index} de {total}",
  car_alt_panorama: "Panorâmica",
  car_splitting_vertical: "A dividir em painéis verticais…",
  car_split_fail_msg:
    "A panorâmica foi gerada, mas o corte automático falhou. Usa a imagem abaixo ou tenta gerar de novo.",
  car_open_panorama: "Abrir panorâmica em tamanho completo",
  car_view_original: "Ver panorâmica original (antes do corte)",
  car_download_fail: "Falha ao baixar.",
  car_role_cover: "Capa",
  car_role_cover_hint: "Gancho — primeira imagem do post",
  car_role_content: "Conteúdo",
  car_role_content_hint: "Desenvolve a história",
  car_role_detail: "Detalhe",
  car_role_detail_hint: "Close-up, produto ou momento",
  car_role_cta: "CTA",
  car_role_cta_hint: "Fecho com call-to-action",
};

const EXAMPLES = {
  en: {
    brief:
      "Continuous Instagram-style seamless panoramic carousel. Premium black and gold campaign, editorial typography integrated in the composition.",
    briefFull:
      "Continuous Instagram-style seamless panoramic carousel. One horizontal image split into 3 slides. Character crosses the cuts. Connected background. Integrated editorial typography.",
    slides: [
      emptySlide(
        "cover",
        'Left start of the panoramic. Elegant fashion woman entering from the right, continuous black and gold background. Large editorial text beginning: "NEW".',
      ),
      emptySlide(
        "content",
        'Center of the same panoramic. Woman centered crossing the cuts. Text continues: "ERA OF". Background linked to neighboring panels.',
      ),
      emptySlide(
        "cta",
        'Right end of the composition. Character ends partially cropped on the left. Text completes: "LUXURY". Minimal button bottom right.',
      ),
    ],
  },
  pt: {
    brief:
      "Carrossel panorâmico contínuo estilo Instagram seamless. Campanha premium preto e dourado, tipografia editorial integrada na composição.",
    briefFull:
      "Carrossel panorâmico contínuo estilo Instagram seamless. Uma única imagem horizontal dividida em 3 slides. Personagem atravessa os cortes. Fundo conectado. Tipografia editorial integrada.",
    slides: [
      emptySlide(
        "cover",
        'Início esquerdo da panorâmica. Mulher fashion elegante entrando pela direita, fundo preto e dourado contínuo. Texto editorial grande começando: "NOVA".',
      ),
      emptySlide(
        "content",
        'Centro da mesma panorâmica. A mulher ocupa o centro atravessando os cortes. Texto continua: "ERA DO". Fundo ligado aos painéis vizinhos.',
      ),
      emptySlide(
        "cta",
        'Final direito da composição. Personagem termina parcialmente cortada à esquerda. Texto completa: "LUXO". Botão minimalista no canto inferior direito.',
      ),
    ],
  },
};

export function getCarouselExample(lang) {
  const code = lang === "pt" ? "pt" : "en";
  return EXAMPLES[code] || EXAMPLES.en;
}

export function getCarouselSlideRoles(t) {
  return [
    { key: "cover", label: t("car_role_cover"), hint: t("car_role_cover_hint") },
    { key: "content", label: t("car_role_content"), hint: t("car_role_content_hint") },
    { key: "detail", label: t("car_role_detail"), hint: t("car_role_detail_hint") },
    { key: "cta", label: t("car_role_cta"), hint: t("car_role_cta_hint") },
  ];
}

export function mergeCarouselLocales(dict) {
  Object.assign(dict.en, en);
  Object.assign(dict.pt, pt);
  Object.assign(dict.es, { ...en, ...dict.es });
  Object.assign(dict.fr, { ...en, ...dict.fr });
}
