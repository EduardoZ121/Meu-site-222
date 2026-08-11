/** Textos dos ícones ! (ajuda contextual) — PT + EN. */

const en = {
  help_tip_aria: "Show help",
  help_tip_close_aria: "Close help",

  help_page_generate:
    "Create images from text, edit a photo with a prompt, or apply a style preset. Upload optional — without a photo you generate from text only.",
  help_page_pro:
    "Professional photo retouch: pick a preset (lighting, mood, skin…), adjust intensity, then generate. Always needs a photo.",
  help_page_posters:
    "Design marketing posters: choose a template, add your photo or product, fill business details, then generate. Open the editor to tweak text layers.",
  help_page_carousel:
    "Build Instagram-style carousel slides from one reference photo and a campaign brief. Choose how many slides and generate the series.",
  help_page_artistic:
    "Turn a photo into art or generate from text. Pick a style module, optional effects (! on each effect), prompt, then generate.",
  help_page_gallery:
    "Your generated images and videos. View, download, favourite, delete, or extend videos (admin). Tap Refresh if something new is missing.",
  help_page_tools:
    "Quick utilities: upscale, restore, remove background, change clothes, etc. Each tool opens its own simple workflow.",
  help_page_wizard:
    "Step-by-step prompt builder — answer short questions and we compose a strong prompt for Generate.",
  help_page_suggest:
    "AI suggests prompt ideas based on what you want to create. Copy one into Generate or edit it first.",
  help_page_settings:
    "Account preferences: language, default aspect ratio for new sessions, password, WhatsApp notifications.",

  help_tool_upscale: "Increase resolution (2× or 4×) with optional sharpen and noise reduction. Best for photos that look soft or small.",
  help_tool_restore: "Fix old or damaged photos — scratches, fade, blur. Upload the scan or photo and choose restore strength.",
  help_tool_colorize: "Add natural colour to black-and-white photos. Upload a B&W image and describe mood if needed.",
  help_tool_bgremove: "Remove the background automatically. You get a PNG with transparent background — good for products and portraits.",
  help_tool_clothes: "Virtual try-on: person photo + garment photo (or text outfit). The AI swaps or applies the clothing.",
  help_tool_inpaint: "Paint a mask over the area to change, describe what should appear there — local edits without redoing the whole image.",

  help_sec_upload:
    "Tap or drag your image here (JPEG, PNG, WEBP). Wait for “ready” before Generate — large phone photos may take a few seconds.",
  help_sec_prompt:
    "Describe what you want in plain language (min. 3 characters). With a photo, say what to change or add — e.g. outfit, background, style.",
  help_sec_format:
    "Output shape. “Original” keeps your photo’s proportions. Other buttons force square, story, landscape, etc.",
  help_sec_styles:
    "Optional presets (Easy mode): pick a look and subject type. Requires a photo — without one, Generate uses text only and ignores the preset.",
  help_sec_presets:
    "Choose one retouch preset. Categories group realism, mood, and detail fixes. Tap a card to select — only one active at a time.",
  help_sec_intensity:
    "How strong the preset effect is. Subtle = light touch; Intense = more visible change. Balance is a good default.",
  help_sec_custom_prompt:
    "Optional extra instructions on top of the preset — e.g. “warmer skin”, “keep background unchanged”.",
  help_sec_result: "Preview of your last generation. Download or send to another tool from here when available.",

  help_sec_post_template: "Pick a poster layout. Each template expects different fields (food photo, fashion, event, etc.).",
  help_sec_post_photo: "Main photo for the poster — product, dish, person, or scene. Required for most templates.",
  help_sec_post_garment: "Optional second photo — clothing item for fashion posters. Shown on the model in the design.",
  help_sec_post_logo: "Optional brand logo (PNG with transparency works best). Placed according to the template.",
  help_sec_post_lang: "Language for text on the poster — headlines, prices, and labels.",
  help_sec_post_menu: "Menu items or product list for restaurant / price posters. One line per item.",
  help_sec_post_details: "Business name, dates, prices, contact — fills the template text areas.",
  help_sec_post_layers: "Custom text blocks — title, subtitle, CTA. Add, move position, or remove before generating.",
  help_sec_post_mood: "Visual mood keywords — elegant, bold, minimal… steers colours and typography.",
  help_sec_post_engine: "Low = fast, normal credits. Medium = photo-realistic. High quality uses separate HQ credits (buy in Billing) — sharpest text and layout; we email you the image when done.",
  help_sec_post_hq:
    "HQ credits are a separate wallet — only for High quality posters (OpenAI). Normal site credits do not work here. Each poster costs 50 HQ credits. Buy packs in Billing (5 / 10 / 20 posters). When generation finishes, the image is sent to your account email automatically.",
  help_sec_post_format: "Poster proportions — story, square, landscape. “Original” matches your upload.",
  help_sec_post_prompt: "Extra creative direction for the AI — optional on top of template + fields.",

  help_sec_car_mode: "Single image = one slide. Multi = several connected slides for a carousel post.",
  car_mode_label: "Generation mode",
  help_sec_car_ref: "Reference photo — character, product, or scene that should stay consistent across slides.",
  help_sec_car_brief: "Campaign story: what the carousel communicates slide by slide. Be specific about offer, mood, and audience.",
  help_sec_car_slides: "How many images to generate and short text per slide. Check continuity options to keep the same look.",
  help_sec_car_continuity: "Keeps the same person, lighting, or colour palette across all slides — turn on what must stay consistent.",
  help_sec_car_style: "Visual style for the whole series — colours, typography feel, photography vs illustration.",
  help_sec_car_model: "Which AI model draws the slides. Default is balanced; premium costs more credits.",
  help_sec_car_format: "Aspect ratio of each slide — usually 4:5 or 1:1 for Instagram.",

  help_sec_art_photo: "Upload the photo to transform. Required for photo-to-art; optional modules work text-only.",
  help_sec_art_style: "Art direction module — portrait, anime, oil painting, etc. Each opens its own options.",
  help_sec_art_prompt: "What should change or the scene to create. With a photo, describe edits; text-only = full scene.",
  help_sec_art_effects: "Fine-tune lighting, lens, film look. Tap ! on any effect for a short explanation.",

  help_sec_upscale_scale: "2× doubles width and height (4× pixels). 4× is heavier and costs more — use for small sources only.",
  help_sec_upscale_options: "Sharpen = clearer edges. Denoise = less grain. Preserve colours = avoid colour shifts.",
  help_sec_restore_level: "Higher = stronger repair (scratches, tears). Too high may look artificial — start medium.",
  help_sec_colorize_options: "Control saturation and era feel. Optional prompt nudges clothing or skin tones.",
  help_sec_bgremove_options: "Edge refinement and shadow — useful for product shots on white or transparent PNG.",
  help_sec_clothes_garment: "Photo of the clothing item or describe the outfit in text if no garment photo.",
  help_sec_clothes_person: "Photo of the person who will wear the garment. Face and pose should be clearly visible.",
  help_sec_inpaint_mask: "Brush over the area to replace. White = edit zone; leave the rest untouched.",

  help_sec_set_language: "Interface language. Reloads the app to apply.",
  help_sec_set_theme: "Dark (default black + purple) or Light (bright surfaces, purple accents).",
  help_sec_set_aspect: "Default format when you open Generate or similar tools. You can still change per session.",
  help_sec_set_password: "Change login password. Not available for Google-only accounts.",
  help_sec_set_whatsapp: "Optional WhatsApp number for generation-ready alerts when enabled.",

  help_ctrl_improve_prompt:
    "AI rewrites your prompt for clearer results (+5 credits). Good when you’re unsure how to describe the scene.",
  help_ctrl_hd_quality:
    "Higher detail and sharper output for text-to-image (+8 credits). Slower; best for final exports.",
  help_ctrl_aspect_original:
    "Output matches your uploaded photo’s proportions — nothing forced to square unless you pick another format.",
  help_ctrl_aspect_11: "Square output — Instagram feed, profile pictures, balanced compositions.",
  help_ctrl_aspect_45: "Vertical portrait — common for Instagram feed and Pinterest.",
  help_ctrl_aspect_34: "Classic portrait photo ratio — slightly taller than 4:5.",
  help_ctrl_aspect_916: "Full-screen vertical — Stories, Reels, TikTok.",
  help_ctrl_aspect_169: "Widescreen landscape — YouTube thumbnails, banners, desktop wallpapers.",
  help_ctrl_aspect_219: "Ultra-wide cinematic — hero banners and film-style frames.",
  help_ctrl_wizard: "Opens the guided prompt wizard — useful if you don’t know where to start.",
  help_ctrl_suggest: "AI prompt ideas based on your goal. Tap to open the suggest page.",
  help_sec_model:
    "Pick the AI engine for text-to-image. Grok is the default (15 credits). Flux, Seedream and Imagen excel at photorealism; Ideogram at text in images; Recraft at design. Each model has its own credit cost.",

  help_model_grok: "xAI Grok Imagine — strong default for photoreal portraits and creative scenes. Balanced quality and cost (15 credits).",
  help_model_nano_banana: "Google Nano Banana — versatile edits and generation, good all-rounder for photo + prompt workflows.",
  help_model_seedream45: "ByteDance Seedream 4.5 — detailed composition and product-style shots; higher credit cost.",
  help_model_flux2_pro: "Black Forest Labs Flux 2 Pro — professional photorealism and lighting control.",
  help_model_flux2_max: "Flux 2 Max — maximum detail for final exports; slowest and most expensive Flux option here.",
  help_model_flux2_klein: "Flux 2 Klein — speed/quality balance when Pro is more than you need.",
  help_model_imagen4_fast: "Google Imagen 4 Fast — quick, clean results at lower cost.",
  help_model_imagen4: "Google Imagen 4 — higher-fidelity Google photorealism.",
  help_model_ideogram_turbo: "Ideogram v3 Turbo — fast text-in-image and poster-like typography.",
  help_model_ideogram_quality: "Ideogram v3 Quality — best Ideogram typography and layout fidelity.",
  help_model_recraft_v4: "Recraft v4 — design, icons, and vector-friendly graphics.",
  help_model_flux_schnell: "Flux Schnell — ultra-fast drafts for exploring ideas cheaply.",
  help_model_flux_dev: "Flux Dev — creative control for experimental looks.",

  help_page_brand_campaign:
    "On-brand ads from a website URL and/or product photos. AI reads brand colors and offer, then generates a batch of ad images with GPT HQ (50 HQ credits per image).",
  help_sec_bc_url: "Paste your brand website. Optional if you upload photos — used to read titles, colors, and product context.",
  help_sec_bc_photos: "Up to 5 product or brand photos. Works with URL only, photos only, or both.",
  help_sec_bc_count: "How many ad variations to generate in this batch. Cost = 50 HQ credits × count.",
  help_sec_bc_style: "Marketing style category and how prompts are chosen (auto rotate vs random) for each ad.",

  help_page_gpt_hq:
    "AURUM / GPT-HQ studio — premium HQ-credit styles for ultra-sharp posters and retouches. Needs a photo and a style.",
  help_sec_gpt_hq_style: "Pick one HQ style preset. Locked cards are coming soon. Cost is shown in HQ credits.",

  help_page_marketing_video:
    "Turn product photos into a short marketing video. Choose Quick, Custom, or CGI mode, then format and style.",
  help_page_video:
    "Video hub — create clips from text or image, edit existing footage, or open Marketing Video / Motion Flyer.",
  help_sec_mktvid_format: "Output aspect for TikTok, Reels, feed, or landscape — match where you will post.",
  help_sec_mktvid_category: "Campaign category steers music/mood and story beats. Auto lets the AI pick.",
  help_sec_mktvid_style: "Visual look of the clip — clean, luxury, bold, etc. Random varies each run.",
  help_sec_mktvid_cgi_template: "CGI motion template — pick a prebuilt camera/product move.",
  help_sec_mktvid_cgi_storyboard: "Optional custom storyboard text that overrides the template narrative.",

  help_sec_vid_duration: "Clip length in seconds. Longer clips cost more credits and take longer to render.",
  help_sec_vid_motion: "How much camera or subject motion — subtle vs dynamic. Higher motion can look less stable.",
  help_sec_vid_reference: "Optional reference image to guide identity, product, or style while generating the video.",

  help_sec_video_edit_prompt:
    "This tool edits your clip — it keeps the original movement (walk, dance, gestures). Works well: change outfit, background, lighting, colours, add or remove objects. Often fails: new pose, different action (e.g. walking → dancing). For a new action, use Image → Video with a frame from your clip.",
};

const pt = {
  help_tip_aria: "Ver explicação",
  help_tip_close_aria: "Fechar explicação",

  help_page_generate:
    "Cria imagens a partir de texto, edita uma foto com instruções ou aplica um estilo pré-definido. Foto opcional — sem foto geras só por texto.",
  help_page_pro:
    "Retoque profissional: escolhe um preset (luz, mood, pele…), ajusta a intensidade e gera. Precisa sempre de uma foto.",
  help_page_posters:
    "Posters de marketing: escolhe modelo, adiciona foto/produto, preenche dados do negócio e gera. Abre o editor para ajustar textos.",
  help_page_carousel:
    "Carrossel estilo Instagram a partir de uma foto de referência e um briefing. Escolhe quantos slides e gera a série.",
  help_page_artistic:
    "Transforma foto em arte ou gera por texto. Escolhe módulo de estilo, efeitos opcionais (! em cada efeito), prompt e gera.",
  help_page_gallery:
    "Imagens e vídeos gerados. Ver, descarregar, favorito, apagar ou estender vídeos (admin). Toca Atualizar se faltar algo novo.",
  help_page_tools:
    "Utilitários rápidos: upscale, restaurar, remover fundo, trocar roupa, etc. Cada ferramenta abre o seu fluxo simples.",
  help_page_wizard:
    "Construtor de prompt passo a passo — respondes a perguntas curtas e montamos um prompt forte para Gerar.",
  help_page_suggest:
    "A IA sugere ideias de prompt. Copia uma para Gerar ou edita antes.",
  help_page_settings:
    "Preferências: idioma, proporção padrão em novas sessões, palavra-passe, notificações WhatsApp.",

  help_tool_upscale:
    "Aumenta resolução (2× ou 4×) com nitidez e redução de ruído opcionais. Ideal para fotos pequenas ou sem foco.",
  help_tool_restore:
    "Repara fotos antigas ou danificadas — riscos, desbotado, blur. Envia o scan/foto e escolhe a força.",
  help_tool_colorize:
    "Cor natural em fotos a preto e branco. Envia P&B e descreve o ambiente se quiseres.",
  help_tool_bgremove:
    "Remove o fundo automaticamente. Recebes PNG transparente — produtos e retratos.",
  help_tool_clothes:
    "Experimentar roupa: foto da pessoa + foto da peça (ou texto). A IA veste ou troca a roupa.",
  help_tool_inpaint:
    "Pinta a zona a alterar e descreve o que deve aparecer — edição local sem refazer a imagem toda.",

  help_sec_upload:
    "Toca ou arrasta a imagem (JPEG, PNG, WEBP). Espera “pronto” antes de Gerar — fotos grandes do telemóvel podem demorar.",
  help_sec_prompt:
    "Descreve o que queres (mín. 3 caracteres). Com foto, diz o que mudar — roupa, fundo, estilo, etc.",
  help_sec_format:
    "Formato de saída. “Original” mantém as proporções da tua foto. Outros botões forçam quadrado, story, paisagem…",
  help_sec_styles:
    "Presets opcionais (modo Easy): escolhe look e tipo de sujeito. Precisa de foto — sem foto gera só por texto e ignora o preset.",
  help_sec_presets:
    "Escolhe um preset de retoque. Categorias: realismo, mood, detalhes. Um de cada vez — toca no cartão para selecionar.",
  help_sec_intensity:
    "Força do efeito. Subtil = leve; Intenso = mudança visível. Equilibrado é um bom meio-termo.",
  help_sec_custom_prompt:
    "Instruções extra por cima do preset — ex.: “pele mais quente”, “manter o fundo”.",
  help_sec_result: "Pré-visualização da última geração. Descarrega ou envia para outra ferramenta quando disponível.",

  help_sec_post_template: "Escolhe o layout do poster. Cada modelo pede campos diferentes (comida, moda, evento…).",
  help_sec_post_photo: "Foto principal — produto, prato, pessoa ou cena. Obrigatória na maioria dos modelos.",
  help_sec_post_garment: "Foto opcional da peça de roupa para posters de moda.",
  help_sec_post_logo: "Logótipo opcional (PNG transparente funciona melhor).",
  help_sec_post_lang: "Idioma dos textos no poster — títulos, preços, etiquetas.",
  help_sec_post_menu: "Itens de menu ou lista de produtos para restaurante / preços.",
  help_sec_post_details: "Nome do negócio, datas, preços, contacto — preenche as áreas de texto do modelo.",
  help_sec_post_layers: "Blocos de texto personalizados — título, subtítulo, CTA. Adiciona, posiciona ou remove.",
  help_sec_post_mood: "Palavras-chave de ambiente — elegante, bold, minimal… influenciam cores e tipografia.",
  help_sec_post_engine: "Baixa = rápido, créditos normais. Média = foto-realista. Alta qualidade usa créditos HQ (compra em Faturação) — texto e layout máximos; enviamos a imagem por email quando terminar.",
  help_sec_post_hq:
    "Créditos HQ são uma carteira separada — só para posters Alta qualidade (OpenAI). Os créditos normais do site não funcionam aqui. Cada poster gasta 50 créditos HQ. Compra packs em Faturação (5 / 10 / 20 posters). Quando a geração termina, recebes a imagem no email da tua conta automaticamente.",
  help_sec_post_format: "Proporções do poster — story, quadrado, paisagem. “Original” segue o upload.",
  help_sec_post_prompt: "Direção criativa extra para a IA — opcional por cima do modelo e campos.",

  help_sec_car_mode: "Imagem única = um slide. Multi = vários slides ligados para carrossel.",
  car_mode_label: "Modo de geração",
  help_sec_car_ref: "Foto de referência — personagem, produto ou cena consistente em todos os slides.",
  help_sec_car_brief: "História da campanha: o que cada slide comunica. Sê específico sobre oferta, mood e público.",
  help_sec_car_slides: "Quantas imagens gerar e texto por slide. Opções de continuidade mantêm o mesmo visual.",
  help_sec_car_continuity: "Mantém a mesma pessoa, luz ou paleta em todos os slides — activa o que deve ficar igual.",
  help_sec_car_style: "Estilo visual da série — cores, tipografia, foto vs ilustração.",
  help_sec_car_model: "Modelo de IA dos slides. Padrão equilibrado; premium custa mais créditos.",
  help_sec_car_format: "Proporção de cada slide — normalmente 4:5 ou 1:1 para Instagram.",

  help_sec_art_photo: "Foto a transformar. Obrigatória em foto→arte; alguns módulos funcionam só com texto.",
  help_sec_art_style: "Módulo de direção artística — retrato, anime, óleo, etc.",
  help_sec_art_prompt: "O que mudar ou a cena a criar. Com foto = edições; só texto = cena completa.",
  help_sec_art_effects: "Luz, lente, filme. Toca ! em cada efeito para explicação curta.",

  help_sec_upscale_scale: "2× duplica largura e altura. 4× é mais pesado — usa só em imagens muito pequenas.",
  help_sec_upscale_options: "Nitidez = bordas mais claras. Denoise = menos grão. Preservar cores = evita mudanças de cor.",
  help_sec_restore_level: "Mais alto = reparação mais forte. Demasiado pode parecer artificial — começa no meio.",
  help_sec_colorize_options: "Saturação e época. Prompt opcional orienta tons de pele ou roupa.",
  help_sec_bgremove_options: "Refino de bordas e sombra — útil para produtos em PNG transparente.",
  help_sec_clothes_garment: "Foto da peça ou descreve a roupa em texto.",
  help_sec_clothes_person: "Foto da pessoa. Rosto e pose visíveis funcionam melhor.",
  help_sec_inpaint_mask: "Pinta a zona a substituir. Branco = área a editar; o resto fica intacto.",

  help_sec_set_language: "Idioma da interface. Recarrega a app para aplicar.",
  help_sec_set_theme: "Escuro (preto + roxo por defeito) ou Claro (superfícies claras, acentos roxos).",
  help_sec_set_aspect: "Formato padrão ao abrires Gerar ou ferramentas similares. Podes mudar em cada sessão.",
  help_sec_set_password: "Alterar palavra-passe. Indisponível para contas só Google.",
  help_sec_set_whatsapp: "Número WhatsApp opcional para avisos quando a geração termina.",

  help_ctrl_improve_prompt:
    "A IA melhora o teu prompt (+5 créditos). Útil quando não sabes como descrever a cena.",
  help_ctrl_hd_quality:
    "Mais detalhe e nitidez em texto→imagem (+8 créditos). Mais lento; bom para export final.",
  help_ctrl_aspect_original:
    "A saída segue as proporções da foto — não força quadrado a menos que escolhas outro formato.",
  help_ctrl_aspect_11: "Quadrado — feed Instagram, avatar, composições equilibradas.",
  help_ctrl_aspect_45: "Retrato vertical — feed Instagram e Pinterest.",
  help_ctrl_aspect_34: "Retrato clássico — um pouco mais alto que 4:5.",
  help_ctrl_aspect_916: "Vertical ecrã inteiro — Stories, Reels, TikTok.",
  help_ctrl_aspect_169: "Paisagem larga — miniaturas YouTube, banners.",
  help_ctrl_aspect_219: "Ultra-largo cinematográfico — banners hero.",
  help_ctrl_wizard: "Assistente de prompt passo a passo — se não souberes por onde começar.",
  help_ctrl_suggest: "Ideias de prompt pela IA. Toca para abrir a página Sugerir.",
  help_sec_model:
    "Escolhe o motor de IA para texto→imagem. Grok é o padrão (15 créditos). Flux, Seedream e Imagen são ótimos em fotorrealismo; Ideogram em texto na imagem; Recraft em design. Cada modelo tem o seu preço em créditos.",

  help_model_grok: "xAI Grok Imagine — bom padrão para retratos fotorrealistas e cenas criativas. Equilíbrio qualidade/custo (15 créditos).",
  help_model_nano_banana: "Google Nano Banana — edição e geração versáteis, bom para fluxos foto + prompt.",
  help_model_seedream45: "ByteDance Seedream 4.5 — composição detalhada e produtos; custa mais créditos.",
  help_model_flux2_pro: "Black Forest Labs Flux 2 Pro — fotorrealismo profissional e controlo de luz.",
  help_model_flux2_max: "Flux 2 Max — máximo detalhe para export final; opção Flux mais cara e lenta aqui.",
  help_model_flux2_klein: "Flux 2 Klein — equilíbrio velocidade/qualidade quando o Pro é demais.",
  help_model_imagen4_fast: "Google Imagen 4 Fast — resultados rápidos e limpos a menor custo.",
  help_model_imagen4: "Google Imagen 4 — fotorrealismo Google com mais fidelidade.",
  help_model_ideogram_turbo: "Ideogram v3 Turbo — texto na imagem e tipografia rápida.",
  help_model_ideogram_quality: "Ideogram v3 Quality — melhor tipografia e layout Ideogram.",
  help_model_recraft_v4: "Recraft v4 — design, ícones e gráficos com ar vectorial.",
  help_model_flux_schnell: "Flux Schnell — rascunhos ultrarrápidos para explorar ideias.",
  help_model_flux_dev: "Flux Dev — controlo criativo para looks experimentais.",

  help_page_brand_campaign:
    "Anúncios on-brand a partir do URL do site e/ou fotos do produto. A IA lê cores e oferta e gera um lote de imagens com GPT HQ (50 créditos HQ por imagem).",
  help_sec_bc_url: "Cola o site da marca. Opcional se carregares fotos — serve para ler títulos, cores e contexto.",
  help_sec_bc_photos: "Até 5 fotos de produto ou marca. Funciona só com URL, só com fotos, ou os dois.",
  help_sec_bc_count: "Quantas variações de anúncio gerar neste lote. Custo = 50 créditos HQ × quantidade.",
  help_sec_bc_style: "Categoria de estilo de marketing e como os prompts são escolhidos (rotação automática vs aleatório).",

  help_page_gpt_hq:
    "Estúdio AURUM / GPT-HQ — estilos premium com créditos HQ para posters e retoques ultra-nítidos. Precisa de foto e estilo.",
  help_sec_gpt_hq_style: "Escolhe um preset HQ. Cartões bloqueados estão em breve. O custo aparece em créditos HQ.",

  help_page_marketing_video:
    "Transforma fotos de produto num vídeo curto de marketing. Escolhe Rápido, Personalizado ou CGI, depois formato e estilo.",
  help_page_video:
    "Hub de vídeo — cria clips a partir de texto ou imagem, edita footage, ou abre Vídeo Marketing / Motion Flyer.",
  help_sec_mktvid_format: "Proporção de saída para TikTok, Reels, feed ou horizontal — alinha com onde vais publicar.",
  help_sec_mktvid_category: "Categoria da campanha orienta mood e batidas da história. Auto deixa a IA escolher.",
  help_sec_mktvid_style: "Look visual do clip — clean, luxury, bold, etc. Aleatório varia em cada geração.",
  help_sec_mktvid_cgi_template: "Template CGI de movimento — escolhe um movimento de câmara/produto pronto.",
  help_sec_mktvid_cgi_storyboard: "Storyboard em texto opcional que substitui a narrativa do template.",

  help_sec_vid_duration: "Duração do clip em segundos. Mais longo = mais créditos e mais tempo de render.",
  help_sec_vid_motion: "Quanto movimento de câmara ou sujeito — subtil vs dinâmico. Mais movimento pode ficar menos estável.",
  help_sec_vid_reference: "Imagem de referência opcional para identidade, produto ou estilo no vídeo.",

  help_sec_video_edit_prompt:
    "Esta ferramenta edita o teu clip — mantém o movimento original (andar, dançar, gestos). Funciona bem: trocar roupa, fundo, luz, cores, adicionar ou remover objectos. Costuma falhar: nova pose ou acção diferente (ex.: caminhar → dançar). Para acção nova, usa Imagem → Vídeo com um frame do clip.",
};

export function mergeStudioHelpLocales(dict) {
  const es = {
    ...en,
    help_tip_aria: "Mostrar ayuda",
    help_tip_close_aria: "Cerrar ayuda",
    help_page_generate:
      "Crea imágenes desde texto, edita una foto con un prompt o aplica un estilo. Foto opcional — sin foto generas solo con texto.",
    help_page_brand_campaign:
      "Anuncios on-brand desde la URL del sitio y/o fotos del producto. La IA lee colores y oferta y genera un lote de imágenes.",
    help_sec_bc_url: "Pega el sitio de la marca. Opcional si subes fotos — sirve para leer títulos, colores y contexto.",
    help_sec_bc_photos: "Hasta 5 fotos de producto o marca. Funciona solo con URL, solo con fotos, o ambos.",
    help_sec_bc_count: "Cuántas variaciones de anuncio generar en este lote. Coste = créditos por imagen × cantidad.",
    help_sec_bc_style: "Categoría de estilo de marketing y cómo se eligen los prompts (rotar automático vs aleatorio).",
    help_page_gpt_hq:
      "Estudio AURUM / GPT-HQ — estilos premium con créditos HQ para posters y retoques ultra nítidos. Necesita foto y estilo.",
    help_sec_gpt_hq_style: "Elige un preset HQ. Las tarjetas bloqueadas llegan pronto. El coste se muestra en créditos HQ.",
    help_page_marketing_video:
      "Convierte fotos de producto en un vídeo corto de marketing. Elige Rápido, Personalizado o CGI, luego formato y estilo.",
    help_sec_mktvid_format: "Proporción de salida para TikTok, Reels, feed o horizontal — alinea con dónde publicarás.",
    help_sec_mktvid_category: "La categoría orienta el mood y la historia. Auto deja que la IA elija.",
    help_sec_mktvid_style: "Look visual del clip — clean, luxury, bold, etc. Aleatorio varía en cada generación.",
    help_sec_model:
      "Elige el motor de IA para texto→imagen. Grok es el predeterminado (15 créditos). Flux, Seedream e Imagen destacan en fotorrealismo; Ideogram en texto en imagen; Recraft en diseño.",
    help_sec_vid_duration: "Duración del clip en segundos. Más largo = más créditos y más tiempo de render.",
    help_sec_vid_motion: "Cuánto movimiento de cámara o sujeto — sutil vs dinámico.",
    help_sec_vid_reference: "Imagen de referencia opcional para identidad, producto o estilo en el vídeo.",
    help_ctrl_hd_quality:
      "Más detalle y nitidez en texto→imagen (+8 créditos). Más lento; ideal para exportación final.",
    help_sec_format:
      "Forma de salida. “Original” mantiene las proporciones de tu foto. Otros botones fuerzan cuadrado, story, paisaje, etc.",
  };

  const fr = {
    ...en,
    help_tip_aria: "Afficher l'aide",
    help_tip_close_aria: "Fermer l'aide",
    help_page_generate:
      "Créez des images à partir de texte, éditez une photo avec un prompt ou appliquez un style. Photo optionnelle — sans photo, génération texte seul.",
    help_page_brand_campaign:
      "Pubs on-brand à partir de l'URL du site et/ou de photos produit. L'IA lit couleurs et offre, puis génère un lot d'images.",
    help_sec_bc_url: "Collez le site de la marque. Optionnel si vous uploadez des photos — pour lire titres, couleurs et contexte.",
    help_sec_bc_photos: "Jusqu'à 5 photos produit ou marque. Fonctionne avec URL seule, photos seules, ou les deux.",
    help_sec_bc_count: "Combien de variations d'annonces générer. Coût = crédits par image × quantité.",
    help_sec_bc_style: "Catégorie de style marketing et comment les prompts sont choisis (rotation auto vs aléatoire).",
    help_page_gpt_hq:
      "Studio AURUM / GPT-HQ — styles premium avec crédits HQ pour posters et retouches ultra nettes. Photo et style requis.",
    help_sec_gpt_hq_style: "Choisissez un preset HQ. Les cartes verrouillées arrivent bientôt. Coût en crédits HQ.",
    help_page_marketing_video:
      "Transformez des photos produit en courte vidéo marketing. Choisissez Rapide, Perso ou CGI, puis format et style.",
    help_sec_mktvid_format: "Format de sortie pour TikTok, Reels, feed ou paysage — selon où vous publiez.",
    help_sec_mktvid_category: "La catégorie oriente l'ambiance et l'histoire. Auto laisse l'IA choisir.",
    help_sec_mktvid_style: "Look visuel du clip — clean, luxury, bold, etc. Aléatoire varie à chaque génération.",
    help_sec_model:
      "Choisissez le moteur IA pour texte→image. Grok est le défaut (15 crédits). Flux, Seedream et Imagen excellent en photoréalisme ; Ideogram pour le texte dans l'image ; Recraft pour le design.",
    help_sec_vid_duration: "Durée du clip en secondes. Plus long = plus de crédits et de temps de rendu.",
    help_sec_vid_motion: "Quantité de mouvement caméra/sujet — subtil vs dynamique.",
    help_sec_vid_reference: "Image de référence optionnelle pour l'identité, le produit ou le style de la vidéo.",
    help_ctrl_hd_quality:
      "Plus de détail et de netteté en texte→image (+8 crédits). Plus lent ; idéal pour l'export final.",
    help_sec_format:
      "Format de sortie. « Original » garde les proportions de votre photo. Les autres forcent carré, story, paysage, etc.",
  };

  Object.assign(dict.en, en);
  Object.assign(dict.pt, pt);
  Object.assign(dict.es, { ...es, ...dict.es });
  Object.assign(dict.fr, { ...fr, ...dict.fr });
}

/** Mapa de proporções → chave de ajuda */
export const ASPECT_HELP_KEYS = {
  match: "help_ctrl_aspect_original",
  original: "help_ctrl_aspect_original",
  "1:1": "help_ctrl_aspect_11",
  "4:5": "help_ctrl_aspect_45",
  "3:4": "help_ctrl_aspect_34",
  "9:16": "help_ctrl_aspect_916",
  "16:9": "help_ctrl_aspect_169",
  "21:9": "help_ctrl_aspect_219",
};
