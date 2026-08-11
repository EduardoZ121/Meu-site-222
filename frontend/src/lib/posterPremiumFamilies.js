/**
 * Novos posters premium (Empresarial, DJ, Concerto, Academia) — 1 cartão por família,
 * grelha de estilos com campos editáveis POR VARIANTE. Aspect ratio vem do site.
 * AUTO-GENERATED — edit scripts/gen-poster-premium.mjs and re-run.
 */
export const PREMIUM_POSTER_FAMILIES = [
  {
    "id": "business_executive",
    "category": "business",
    "label": "EMPRESARIAL",
    "subtag": "6 estilos · Forbes",
    "variants": [
      {
        "key": "executive_vision",
        "title": "Executive Vision",
        "labelKey": "post_style_executive_vision",
        "gradient": "linear-gradient(135deg,#0B0B0C 0%,#1F2937 45%,#CA8A04 100%)",
        "placeholders": [
          "FIRST_NAME",
          "SURNAME",
          "HEADLINE",
          "LEFT_1",
          "LEFT_2",
          "LEFT_3",
          "SUPPORT",
          "GOLD_1",
          "GOLD_2",
          "GOLD_3",
          "SVC_1",
          "SVC_2",
          "SVC_3"
        ],
        "replacements": {
          "FIRST_NAME": "JOÃO",
          "SURNAME": "SILVA",
          "HEADLINE": "NEGÓCIOS\nQUE CONSTROEM\nO FUTURO",
          "LEFT_1": "ESTRATÉGIA",
          "LEFT_2": "GESTÃO",
          "LEFT_3": "RESULTADOS",
          "SUPPORT": "TRANSFORMAMOS DESAFIOS EM OPORTUNIDADES REAIS",
          "GOLD_1": "LIDERANÇA",
          "GOLD_2": "VISÃO",
          "GOLD_3": "IMPACTO",
          "SVC_1": "MENTORIA",
          "SVC_2": "CONSULTORIA",
          "SVC_3": "PALESTRAS"
        },
        "optional": [
          "SUPPORT"
        ],
        "prompt": "REFERENCE PHOTO (mandatory): Use the uploaded photo as the exact same person — preserve 100% of their face, facial features, skin tone, ethnicity, hair texture and likeness. Seamlessly composite them into this poster like professional photo retouching: unified lighting on face and body, natural skin blend, no floating cutout, no pasted sticker look, no disjointed face layer. Place the subject in the pose/position described below while keeping their real identity. Typography and graphic elements must sit in clear layout zones — never let text overlap, cut through or hide behind the face; place headlines in negative space or on background layers behind the subject when needed.\n\nHighly detailed vertical editorial business poster in premium corporate magazine style, luxury executive branding aesthetic, cinematic office photography, ultra-detailed commercial flyer design.\n\nCentral composition:\nConfident businessman sitting on a dark leather executive chair, low-angle perspective emphasizing authority and leadership. One hand pointing directly toward the camera, strong commanding body language. Wearing an elegant black tailored suit, white dress shirt, black tie, luxury wristwatch. Legs crossed in a relaxed but dominant posture.\n\nTypography layout:\nMassive distressed condensed sans-serif typography occupying the upper-left area.\n\nMain title:\nLarge white uppercase \"{{FIRST_NAME}}\".\nLarge gold textured uppercase \"{{SURNAME}}\" directly underneath.\n\nRight-center text block:\n\"{{HEADLINE}}\"\n\nLeft lower text stack:\n{{LEFT_1}}\n{{LEFT_2}}\n{{LEFT_3}}\n\nSmall supporting text:\n\"{{SUPPORT}}\"\n\nLower-right highlighted gold box:\n{{GOLD_1}}\n{{GOLD_2}}\n{{GOLD_3}}\n\nBottom-left information section:\n{{SVC_1}}\n{{SVC_2}}\n{{SVC_3}}\n\nBackground:\nModern luxury office interior with subtle city skyline visible through windows. Dark moody atmosphere with heavy urban grunge textures, distressed overlays, scratches, dust particles and premium editorial finish.\n\nLighting:\nCinematic studio lighting, dramatic contrast, strong key light illuminating subject, soft rim lighting around silhouette, deep shadows creating power and authority.\n\nColor palette:\nBlack, charcoal gray, white typography, luxury gold accents.\n\nStyle:\nForbes magazine cover meets luxury business advertisement, ultra realistic, premium branding poster, high-end editorial design, print-ready quality."
      },
      {
        "key": "executive_authority",
        "title": "Executive Authority",
        "labelKey": "post_style_executive_authority",
        "gradient": "linear-gradient(135deg,#111827 0%,#374151 50%,#D97706 100%)",
        "placeholders": [
          "FIRST_NAME",
          "SURNAME",
          "HEADLINE",
          "SIDE_1",
          "SIDE_2",
          "SIDE_3",
          "GOLD_1",
          "GOLD_2",
          "GOLD_3",
          "SVC_1",
          "SVC_2",
          "SVC_3"
        ],
        "replacements": {
          "FIRST_NAME": "JOÃO",
          "SURNAME": "SILVA",
          "HEADLINE": "TRANSFORMANDO VISÃO EM RESULTADOS",
          "SIDE_1": "ESTRATÉGIA",
          "SIDE_2": "INOVAÇÃO",
          "SIDE_3": "LIDERANÇA",
          "GOLD_1": "VISÃO",
          "GOLD_2": "IMPACTO",
          "GOLD_3": "SUCESSO",
          "SVC_1": "CONSULTORIA",
          "SVC_2": "MENTORIA",
          "SVC_3": "NEGÓCIOS"
        },
        "optional": [],
        "prompt": "REFERENCE PHOTO (mandatory): Use the uploaded photo as the exact same person — preserve 100% of their face, facial features, skin tone, ethnicity, hair texture and likeness. Seamlessly composite them into this poster like professional photo retouching: unified lighting on face and body, natural skin blend, no floating cutout, no pasted sticker look, no disjointed face layer. Place the subject in the pose/position described below while keeping their real identity. Typography and graphic elements must sit in clear layout zones — never let text overlap, cut through or hide behind the face; place headlines in negative space or on background layers behind the subject when needed.\n\nHighly detailed vertical corporate editorial poster in premium Forbes-style business magazine aesthetic, luxury executive branding design, cinematic office photography.\n\nCentral composition:\nPowerful businessman seated in an elegant executive chair inside a high-end office. Slight low-angle perspective emphasizing confidence and leadership. One hand resting naturally on the chair arm while maintaining direct and commanding posture. Wearing a tailored dark suit, white dress shirt, black tie, luxury watch, polished business appearance.\n\nTypography layout:\nMassive distressed bold condensed sans-serif typography covering the upper-left area.\n\nMain Title:\nLarge white uppercase \"{{FIRST_NAME}}\".\nLarge gold textured uppercase \"{{SURNAME}}\" beneath.\n\nSupporting headline:\n\"{{HEADLINE}}\"\n\nLeft-side information stack:\n{{SIDE_1}}\n{{SIDE_2}}\n{{SIDE_3}}\n\nGold highlight box:\n{{GOLD_1}}\n{{GOLD_2}}\n{{GOLD_3}}\n\nBottom services:\n{{SVC_1}}\n{{SVC_2}}\n{{SVC_3}}\n\nBackground:\nLuxury corporate office with city skyline through glass windows, subtle modern architecture details, premium grunge textures and editorial overlays.\n\nLighting:\nCinematic executive portrait lighting with dramatic shadows and sophisticated contrast.\n\nColor palette:\nBlack, dark gray, white typography, luxury gold accents.\n\nStyle:\nForbes magazine cover, premium business campaign, luxury executive editorial design."
      },
      {
        "key": "ceo_mindset",
        "title": "CEO Mindset",
        "labelKey": "post_style_ceo_mindset",
        "gradient": "linear-gradient(135deg,#0F172A 0%,#334155 55%,#F59E0B 100%)",
        "placeholders": [
          "FIRST_NAME",
          "SURNAME",
          "HEADLINE",
          "SIDE_1",
          "SIDE_2",
          "SIDE_3",
          "GOLD_1",
          "GOLD_2",
          "GOLD_3",
          "SVC_1",
          "SVC_2",
          "SVC_3"
        ],
        "replacements": {
          "FIRST_NAME": "JOÃO",
          "SURNAME": "SILVA",
          "HEADLINE": "LIDERANDO O FUTURO DOS NEGÓCIOS",
          "SIDE_1": "GESTÃO",
          "SIDE_2": "VISÃO",
          "SIDE_3": "CRESCIMENTO",
          "GOLD_1": "DECISÃO",
          "GOLD_2": "ESTRATÉGIA",
          "GOLD_3": "RESULTADOS",
          "SVC_1": "PALESTRAS",
          "SVC_2": "CONSULTORIA",
          "SVC_3": "COACHING EXECUTIVO"
        },
        "optional": [],
        "prompt": "REFERENCE PHOTO (mandatory): Use the uploaded photo as the exact same person — preserve 100% of their face, facial features, skin tone, ethnicity, hair texture and likeness. Seamlessly composite them into this poster like professional photo retouching: unified lighting on face and body, natural skin blend, no floating cutout, no pasted sticker look, no disjointed face layer. Place the subject in the pose/position described below while keeping their real identity. Typography and graphic elements must sit in clear layout zones — never let text overlap, cut through or hide behind the face; place headlines in negative space or on background layers behind the subject when needed.\n\nHighly detailed vertical business leadership poster in premium corporate editorial style, luxury CEO branding aesthetic.\n\nCentral composition:\nExecutive standing confidently inside a modern boardroom with arms crossed, projecting authority and strategic thinking. Wearing a perfectly tailored black suit, white shirt, dark tie and luxury accessories.\n\nTypography layout:\nOversized distressed uppercase typography dominating the upper third.\n\nMain Title:\nLarge white uppercase \"{{FIRST_NAME}}\".\nLarge amber gold uppercase \"{{SURNAME}}\".\n\nHeadline:\n\"{{HEADLINE}}\"\n\nSide information:\n{{SIDE_1}}\n{{SIDE_2}}\n{{SIDE_3}}\n\nHighlighted box:\n{{GOLD_1}}\n{{GOLD_2}}\n{{GOLD_3}}\n\nBottom section:\n{{SVC_1}}\n{{SVC_2}}\n{{SVC_3}}\n\nBackground:\nModern executive boardroom with panoramic city views and luxury interior design.\n\nLighting:\nHigh-end editorial lighting with cinematic contrast and premium business portrait style.\n\nColor palette:\nBlack, white, charcoal gray, metallic gold.\n\nStyle:\nCEO branding campaign, luxury business magazine cover, elite executive poster."
      },
      {
        "key": "business_visionary",
        "title": "Business Visionary",
        "labelKey": "post_style_business_visionary",
        "gradient": "linear-gradient(135deg,#18181B 0%,#52525B 48%,#EAB308 100%)",
        "placeholders": [
          "FIRST_NAME",
          "SURNAME",
          "HEADLINE",
          "SIDE_1",
          "SIDE_2",
          "SIDE_3",
          "GOLD_1",
          "GOLD_2",
          "GOLD_3",
          "SVC_1",
          "SVC_2",
          "SVC_3"
        ],
        "replacements": {
          "FIRST_NAME": "JOÃO",
          "SURNAME": "SILVA",
          "HEADLINE": "IDEIAS QUE CRIAM LEGADOS",
          "SIDE_1": "ESTRATÉGIA",
          "SIDE_2": "INFLUÊNCIA",
          "SIDE_3": "EXECUÇÃO",
          "GOLD_1": "LIDERANÇA",
          "GOLD_2": "INOVAÇÃO",
          "GOLD_3": "EXCELÊNCIA",
          "SVC_1": "NEGÓCIOS",
          "SVC_2": "MENTORIA",
          "SVC_3": "CONSULTORIA"
        },
        "optional": [],
        "prompt": "REFERENCE PHOTO (mandatory): Use the uploaded photo as the exact same person — preserve 100% of their face, facial features, skin tone, ethnicity, hair texture and likeness. Seamlessly composite them into this poster like professional photo retouching: unified lighting on face and body, natural skin blend, no floating cutout, no pasted sticker look, no disjointed face layer. Place the subject in the pose/position described below while keeping their real identity. Typography and graphic elements must sit in clear layout zones — never let text overlap, cut through or hide behind the face; place headlines in negative space or on background layers behind the subject when needed.\n\nHighly detailed premium business flyer in sophisticated editorial magazine style, modern entrepreneurship branding aesthetic.\n\nCentral composition:\nBusiness leader standing beside a large office desk, adjusting suit cufflinks with composed confidence. Elegant posture conveying intelligence and determination. Wearing luxury business attire with refined styling.\n\nTypography layout:\nLarge distressed typography extending vertically through the upper section.\n\nMain Title:\nBold white uppercase \"{{FIRST_NAME}}\".\nSecondary textured gold \"{{SURNAME}}\".\n\nHeadline:\n\"{{HEADLINE}}\"\n\nInformation stack:\n{{SIDE_1}}\n{{SIDE_2}}\n{{SIDE_3}}\n\nGold feature box:\n{{GOLD_1}}\n{{GOLD_2}}\n{{GOLD_3}}\n\nBottom information:\n{{SVC_1}}\n{{SVC_2}}\n{{SVC_3}}\n\nBackground:\nLuxury office environment with contemporary architecture, glass panels and subtle cityscape.\n\nLighting:\nCinematic editorial lighting with dramatic highlights and deep shadows.\n\nColor palette:\nBlack, white, gold, dark metallic tones.\n\nStyle:\nEntrepreneur magazine cover, executive branding campaign, ultra-premium corporate flyer."
      },
      {
        "key": "the_strategist",
        "title": "The Strategist",
        "labelKey": "post_style_the_strategist",
        "gradient": "linear-gradient(135deg,#0C0A09 0%,#44403C 50%,#CA8A04 100%)",
        "placeholders": [
          "FIRST_NAME",
          "SURNAME",
          "HEADLINE",
          "SIDE_1",
          "SIDE_2",
          "SIDE_3",
          "GOLD_1",
          "GOLD_2",
          "GOLD_3",
          "SVC_1",
          "SVC_2",
          "SVC_3"
        ],
        "replacements": {
          "FIRST_NAME": "JOÃO",
          "SURNAME": "SILVA",
          "HEADLINE": "ESTRATÉGIA QUE GERA IMPACTO",
          "SIDE_1": "PLANEAMENTO",
          "SIDE_2": "GESTÃO",
          "SIDE_3": "LIDERANÇA",
          "GOLD_1": "FOCO",
          "GOLD_2": "VISÃO",
          "GOLD_3": "RESULTADOS",
          "SVC_1": "CONSULTORIA",
          "SVC_2": "PALESTRAS",
          "SVC_3": "MENTORIA"
        },
        "optional": [],
        "prompt": "REFERENCE PHOTO (mandatory): Use the uploaded photo as the exact same person — preserve 100% of their face, facial features, skin tone, ethnicity, hair texture and likeness. Seamlessly composite them into this poster like professional photo retouching: unified lighting on face and body, natural skin blend, no floating cutout, no pasted sticker look, no disjointed face layer. Place the subject in the pose/position described below while keeping their real identity. Typography and graphic elements must sit in clear layout zones — never let text overlap, cut through or hide behind the face; place headlines in negative space or on background layers behind the subject when needed.\n\nHighly detailed vertical corporate poster with luxury executive magazine aesthetics, powerful leadership branding style.\n\nCentral composition:\nBusiness executive seated behind a modern office desk with hands interlocked in front, projecting intelligence and strategic authority. Tailored dark suit with premium professional appearance.\n\nTypography layout:\nHuge distressed typography occupying the upper-left corner.\n\nMain Title:\nLarge white uppercase \"{{FIRST_NAME}}\".\nLarge gold uppercase \"{{SURNAME}}\".\n\nHeadline:\n\"{{HEADLINE}}\"\n\nSide text:\n{{SIDE_1}}\n{{SIDE_2}}\n{{SIDE_3}}\n\nHighlight panel:\n{{GOLD_1}}\n{{GOLD_2}}\n{{GOLD_3}}\n\nBottom section:\n{{SVC_1}}\n{{SVC_2}}\n{{SVC_3}}\n\nBackground:\nExecutive office featuring luxury decor, bookshelves and city skyline elements.\n\nLighting:\nStrong cinematic key lighting creating a dramatic executive portrait effect.\n\nColor palette:\nDark charcoal, black, white and rich gold.\n\nStyle:\nFortune magazine inspired editorial design, premium corporate campaign."
      },
      {
        "key": "legacy_builder",
        "title": "Legacy Builder",
        "labelKey": "post_style_legacy_builder",
        "gradient": "linear-gradient(135deg,#09090B 0%,#27272A 45%,#FBBF24 100%)",
        "placeholders": [
          "FIRST_NAME",
          "SURNAME",
          "HEADLINE",
          "SIDE_1",
          "SIDE_2",
          "SIDE_3",
          "GOLD_1",
          "GOLD_2",
          "GOLD_3",
          "SVC_1",
          "SVC_2",
          "SVC_3"
        ],
        "replacements": {
          "FIRST_NAME": "JOÃO",
          "SURNAME": "SILVA",
          "HEADLINE": "CONSTRUINDO O FUTURO COM PROPÓSITO",
          "SIDE_1": "LIDERANÇA",
          "SIDE_2": "VISÃO",
          "SIDE_3": "TRANSFORMAÇÃO",
          "GOLD_1": "NEGÓCIOS",
          "GOLD_2": "IMPACTO",
          "GOLD_3": "LEGADO",
          "SVC_1": "MENTORIA",
          "SVC_2": "CONSULTORIA",
          "SVC_3": "ESTRATÉGIA"
        },
        "optional": [],
        "prompt": "REFERENCE PHOTO (mandatory): Use the uploaded photo as the exact same person — preserve 100% of their face, facial features, skin tone, ethnicity, hair texture and likeness. Seamlessly composite them into this poster like professional photo retouching: unified lighting on face and body, natural skin blend, no floating cutout, no pasted sticker look, no disjointed face layer. Place the subject in the pose/position described below while keeping their real identity. Typography and graphic elements must sit in clear layout zones — never let text overlap, cut through or hide behind the face; place headlines in negative space or on background layers behind the subject when needed.\n\nHighly detailed premium vertical business poster in luxury entrepreneurship editorial style, elite executive branding composition.\n\nCentral composition:\nConfident entrepreneur walking forward inside a sophisticated office environment, adjusting suit jacket while maintaining determined body language. Premium tailored business attire with refined executive aesthetics.\n\nTypography layout:\nMassive distressed uppercase typography spanning the upper portion of the design.\n\nMain Title:\nLarge white uppercase \"{{FIRST_NAME}}\".\nLarge textured gold \"{{SURNAME}}\".\n\nHeadline:\n\"{{HEADLINE}}\"\n\nInformation stack:\n{{SIDE_1}}\n{{SIDE_2}}\n{{SIDE_3}}\n\nGold emphasis box:\n{{GOLD_1}}\n{{GOLD_2}}\n{{GOLD_3}}\n\nBottom information:\n{{SVC_1}}\n{{SVC_2}}\n{{SVC_3}}\n\nBackground:\nModern corporate headquarters with luxurious interior details and urban skyline atmosphere.\n\nLighting:\nHigh-end commercial editorial lighting with cinematic business photography style.\n\nColor palette:\nBlack, deep gray, white and luxury gold.\n\nStyle:\nPremium entrepreneur magazine cover, elite executive advertising campaign, sophisticated business flyer design."
      }
    ]
  },
  {
    "id": "dj_nightlife",
    "category": "dj",
    "label": "DJ / CLUB",
    "subtag": "5 estilos · Neon",
    "variants": [
      {
        "key": "night_vibes",
        "title": "Night Vibes",
        "labelKey": "post_style_night_vibes",
        "gradient": "linear-gradient(135deg,#020617 0%,#0E7490 55%,#22D3EE 100%)",
        "placeholders": [
          "ARTIST_NAME",
          "SECONDARY",
          "RIGHT_1",
          "RIGHT_2",
          "RIGHT_3",
          "BOX_1",
          "BOX_2",
          "BOX_3",
          "BOT_1",
          "BOT_2",
          "BOT_3"
        ],
        "replacements": {
          "ARTIST_NAME": "DJ REMAKE",
          "SECONDARY": "SPIN",
          "RIGHT_1": "VIBES",
          "RIGHT_2": "QUE",
          "RIGHT_3": "CONECTAM",
          "BOX_1": "MÚSICA",
          "BOX_2": "ENERGIA",
          "BOX_3": "EXPERIÊNCIA",
          "BOT_1": "DEEJAY",
          "BOT_2": "PRODUTOR",
          "BOT_3": "REMIXES"
        },
        "optional": [],
        "prompt": "REFERENCE PHOTO (mandatory): Use the uploaded photo as the exact same person — preserve 100% of their face, facial features, skin tone, ethnicity, hair texture and likeness. Seamlessly composite them into this poster like professional photo retouching: unified lighting on face and body, natural skin blend, no floating cutout, no pasted sticker look, no disjointed face layer. Place the subject in the pose/position described below while keeping their real identity. Typography and graphic elements must sit in clear layout zones — never let text overlap, cut through or hide behind the face; place headlines in negative space or on background layers behind the subject when needed.\n\nHighly detailed vertical DJ promotional poster in premium nightlife editorial style, luxury urban music branding, cinematic club photography.\n\nCentral composition:\nProfessional DJ standing behind a high-end DJ controller with one hand adjusting the mixer and the other resting naturally over the setup. Relaxed but confident posture. Wearing modern streetwear including fitted black t-shirt, cap, layered chains, luxury watch and headphones around the neck.\n\nTypography layout:\nMassive distressed bold condensed typography occupying the upper section.\n\nMain Title:\nLarge turquoise uppercase \"{{ARTIST_NAME}}\".\n\nSecondary brush typography:\n\"{{SECONDARY}}\"\n\nRight-side text:\n{{RIGHT_1}}\n{{RIGHT_2}}\n{{RIGHT_3}}\n\nTurquoise highlight box:\n{{BOX_1}}\n{{BOX_2}}\n{{BOX_3}}\n\nBottom information:\n{{BOT_1}}\n{{BOT_2}}\n{{BOT_3}}\n\nBackground:\nLuxury nightclub atmosphere with speakers, DJ booth equipment and industrial grunge textures.\n\nLighting:\nCinematic nightclub lighting with turquoise neon accents and dramatic shadows.\n\nColor palette:\nBlack, turquoise, white.\n\nStyle:\nPremium DJ flyer, nightlife editorial, luxury club branding."
      },
      {
        "key": "sound_architect",
        "title": "Sound Architect",
        "labelKey": "post_style_sound_architect",
        "gradient": "linear-gradient(135deg,#0B0B0C 0%,#1D4ED8 52%,#38BDF8 100%)",
        "placeholders": [
          "ARTIST_NAME",
          "SECONDARY",
          "RIGHT_1",
          "RIGHT_2",
          "RIGHT_3",
          "BOX_1",
          "BOX_2",
          "BOX_3",
          "BOT_1",
          "BOT_2",
          "BOT_3"
        ],
        "replacements": {
          "ARTIST_NAME": "DJ REMAKE",
          "SECONDARY": "MIX",
          "RIGHT_1": "CRIANDO",
          "RIGHT_2": "EXPERIÊNCIAS",
          "RIGHT_3": "SONORAS",
          "BOX_1": "BEATS",
          "BOX_2": "ENERGIA",
          "BOX_3": "ATMOSFERA",
          "BOT_1": "LIVE SETS",
          "BOT_2": "PRODUÇÃO",
          "BOT_3": "REMIXES"
        },
        "optional": [],
        "prompt": "REFERENCE PHOTO (mandatory): Use the uploaded photo as the exact same person — preserve 100% of their face, facial features, skin tone, ethnicity, hair texture and likeness. Seamlessly composite them into this poster like professional photo retouching: unified lighting on face and body, natural skin blend, no floating cutout, no pasted sticker look, no disjointed face layer. Place the subject in the pose/position described below while keeping their real identity. Typography and graphic elements must sit in clear layout zones — never let text overlap, cut through or hide behind the face; place headlines in negative space or on background layers behind the subject when needed.\n\nHighly detailed vertical DJ flyer with premium electronic music editorial aesthetics and modern urban branding.\n\nCentral composition:\nDJ leaning slightly over a professional mixing console while adjusting audio controls. Stylish urban posture projecting confidence and creativity. Modern streetwear outfit with cap, headphones, jewelry and luxury accessories.\n\nTypography layout:\nHuge distressed typography dominating the top area.\n\nMain Title:\nLarge electric blue uppercase \"{{ARTIST_NAME}}\".\n\nSecondary title:\n\"{{SECONDARY}}\"\n\nSupporting headline:\n{{RIGHT_1}}\n{{RIGHT_2}}\n{{RIGHT_3}}\n\nInformation panel:\n{{BOX_1}}\n{{BOX_2}}\n{{BOX_3}}\n\nBottom section:\n{{BOT_1}}\n{{BOT_2}}\n{{BOT_3}}\n\nBackground:\nDark electronic music studio with large speakers and illuminated DJ setup.\n\nLighting:\nBlue neon reflections, cinematic nightclub contrast, dramatic highlights.\n\nColor palette:\nBlack, electric blue, white.\n\nStyle:\nElectronic music festival flyer, premium nightlife campaign."
      },
      {
        "key": "after_hours",
        "title": "After Hours",
        "labelKey": "post_style_after_hours",
        "gradient": "linear-gradient(135deg,#111827 0%,#0891B2 50%,#67E8F9 100%)",
        "placeholders": [
          "ARTIST_NAME",
          "SECONDARY",
          "RIGHT_1",
          "RIGHT_2",
          "RIGHT_3",
          "BOX_1",
          "BOX_2",
          "BOX_3",
          "BOT_1",
          "BOT_2",
          "BOT_3"
        ],
        "replacements": {
          "ARTIST_NAME": "DJ REMAKE",
          "SECONDARY": "LIVE",
          "RIGHT_1": "MÚSICA",
          "RIGHT_2": "MOVIMENTO",
          "RIGHT_3": "CONEXÃO",
          "BOX_1": "FESTAS",
          "BOX_2": "EVENTOS",
          "BOX_3": "EXPERIÊNCIAS",
          "BOT_1": "DJ SET",
          "BOT_2": "PRODUÇÃO",
          "BOT_3": "SHOWS"
        },
        "optional": [],
        "prompt": "REFERENCE PHOTO (mandatory): Use the uploaded photo as the exact same person — preserve 100% of their face, facial features, skin tone, ethnicity, hair texture and likeness. Seamlessly composite them into this poster like professional photo retouching: unified lighting on face and body, natural skin blend, no floating cutout, no pasted sticker look, no disjointed face layer. Place the subject in the pose/position described below while keeping their real identity. Typography and graphic elements must sit in clear layout zones — never let text overlap, cut through or hide behind the face; place headlines in negative space or on background layers behind the subject when needed.\n\nHighly detailed vertical urban DJ poster in premium nightlife magazine style, luxury entertainment branding.\n\nCentral composition:\nDJ standing confidently behind turntables with crossed-arm stance while one hand rests over the DJ controller. Wearing contemporary urban fashion with premium accessories and headphones around the neck.\n\nTypography layout:\nOversized distressed typography across upper section.\n\nMain Title:\nLarge cyan uppercase \"{{ARTIST_NAME}}\".\n\nSecondary title:\n\"{{SECONDARY}}\"\n\nRight-side text:\n{{RIGHT_1}}\n{{RIGHT_2}}\n{{RIGHT_3}}\n\nFeature box:\n{{BOX_1}}\n{{BOX_2}}\n{{BOX_3}}\n\nBottom section:\n{{BOT_1}}\n{{BOT_2}}\n{{BOT_3}}\n\nBackground:\nIndustrial nightclub setting with speakers and subtle crowd atmosphere.\n\nLighting:\nNightclub-inspired cinematic lighting with cyan glow effects.\n\nColor palette:\nDark gray, black, cyan, white.\n\nStyle:\nLuxury DJ branding, premium nightlife editorial flyer."
      },
      {
        "key": "electric_frequency",
        "title": "Electric Frequency",
        "labelKey": "post_style_electric_frequency",
        "gradient": "linear-gradient(135deg,#0F172A 0%,#0D9488 48%,#2DD4BF 100%)",
        "placeholders": [
          "ARTIST_NAME",
          "SECONDARY",
          "RIGHT_1",
          "RIGHT_2",
          "RIGHT_3",
          "BOX_1",
          "BOX_2",
          "BOX_3",
          "BOT_1",
          "BOT_2",
          "BOT_3"
        ],
        "replacements": {
          "ARTIST_NAME": "DJ REMAKE",
          "SECONDARY": "WAVE",
          "RIGHT_1": "SONS",
          "RIGHT_2": "QUE",
          "RIGHT_3": "MARCAM",
          "BOX_1": "ENERGIA",
          "BOX_2": "RITMO",
          "BOX_3": "EXPERIÊNCIA",
          "BOT_1": "PRODUCER",
          "BOT_2": "DJ",
          "BOT_3": "REMIX ARTIST"
        },
        "optional": [],
        "prompt": "REFERENCE PHOTO (mandatory): Use the uploaded photo as the exact same person — preserve 100% of their face, facial features, skin tone, ethnicity, hair texture and likeness. Seamlessly composite them into this poster like professional photo retouching: unified lighting on face and body, natural skin blend, no floating cutout, no pasted sticker look, no disjointed face layer. Place the subject in the pose/position described below while keeping their real identity. Typography and graphic elements must sit in clear layout zones — never let text overlap, cut through or hide behind the face; place headlines in negative space or on background layers behind the subject when needed.\n\nHighly detailed premium DJ event flyer with futuristic nightlife editorial design and urban music aesthetics.\n\nCentral composition:\nProfessional DJ manipulating mixer controls with focused expression and dynamic body posture. Modern streetwear style with cap, luxury watch, layered necklaces and headphones.\n\nTypography layout:\nLarge textured typography dominating the upper-left portion.\n\nMain Title:\nBold turquoise uppercase \"{{ARTIST_NAME}}\".\n\nSecondary title:\n\"{{SECONDARY}}\"\n\nSupporting headline:\n{{RIGHT_1}}\n{{RIGHT_2}}\n{{RIGHT_3}}\n\nInformation box:\n{{BOX_1}}\n{{BOX_2}}\n{{BOX_3}}\n\nBottom details:\n{{BOT_1}}\n{{BOT_2}}\n{{BOT_3}}\n\nBackground:\nHigh-end club environment with professional sound system and urban textures.\n\nLighting:\nTurquoise neon effects, dramatic club lighting and cinematic contrast.\n\nColor palette:\nBlack, turquoise, silver accents.\n\nStyle:\nLuxury electronic music branding, ultra-premium DJ campaign."
      },
      {
        "key": "club_icon",
        "title": "Club Icon",
        "labelKey": "post_style_club_icon",
        "gradient": "linear-gradient(135deg,#020617 0%,#2563EB 55%,#06B6D4 100%)",
        "placeholders": [
          "ARTIST_NAME",
          "SECONDARY",
          "RIGHT_1",
          "RIGHT_2",
          "RIGHT_3",
          "BOX_1",
          "BOX_2",
          "BOX_3",
          "BOT_1",
          "BOT_2",
          "BOT_3"
        ],
        "replacements": {
          "ARTIST_NAME": "DJ REMAKE",
          "SECONDARY": "BEATS",
          "RIGHT_1": "VIBES",
          "RIGHT_2": "MÚSICA",
          "RIGHT_3": "ENERGIA",
          "BOX_1": "LIVE DJ",
          "BOX_2": "PRODUCER",
          "BOX_3": "REMIXER",
          "BOT_1": "EVENTOS",
          "BOT_2": "CLUBS",
          "BOT_3": "FESTIVAIS"
        },
        "optional": [],
        "prompt": "REFERENCE PHOTO (mandatory): Use the uploaded photo as the exact same person — preserve 100% of their face, facial features, skin tone, ethnicity, hair texture and likeness. Seamlessly composite them into this poster like professional photo retouching: unified lighting on face and body, natural skin blend, no floating cutout, no pasted sticker look, no disjointed face layer. Place the subject in the pose/position described below while keeping their real identity. Typography and graphic elements must sit in clear layout zones — never let text overlap, cut through or hide behind the face; place headlines in negative space or on background layers behind the subject when needed.\n\nHighly detailed vertical nightclub promotional poster in premium DJ magazine style with urban luxury aesthetics.\n\nCentral composition:\nDJ positioned behind professional equipment in a confident pose, interacting naturally with the mixer controls. Wearing stylish all-black streetwear with luxury accessories and headphones.\n\nTypography layout:\nMassive distressed condensed typography occupying the upper section.\n\nMain Title:\nLarge bright cyan uppercase \"{{ARTIST_NAME}}\".\n\nSecondary brush typography:\n\"{{SECONDARY}}\"\n\nRight-side stack:\n{{RIGHT_1}}\n{{RIGHT_2}}\n{{RIGHT_3}}\n\nHighlight panel:\n{{BOX_1}}\n{{BOX_2}}\n{{BOX_3}}\n\nBottom section:\n{{BOT_1}}\n{{BOT_2}}\n{{BOT_3}}\n\nBackground:\nPremium nightclub setting with large speakers and industrial urban textures.\n\nLighting:\nCinematic blue neon atmosphere with dramatic contrast.\n\nColor palette:\nBlack, cyan, white.\n\nStyle:\nLuxury DJ flyer, premium nightlife editorial, high-end entertainment branding."
      }
    ]
  },
  {
    "id": "concert_live",
    "category": "concert",
    "label": "CANTOR / SHOW",
    "subtag": "5 estilos · Live",
    "variants": [
      {
        "key": "dante_live",
        "title": "Dante Live",
        "labelKey": "post_style_dante_live",
        "gradient": "linear-gradient(135deg,#0B0B0C 0%,#7F1D1D 55%,#EF4444 100%)",
        "placeholders": [
          "ARTIST_NAME",
          "SECONDARY",
          "RIGHT_HEAD",
          "HIGHLIGHT_1",
          "HIGHLIGHT_2",
          "BOTTOM_LEFT",
          "EVENT_DATE",
          "EVENT_WEEKDAY",
          "EVENT_TIME",
          "BANNER"
        ],
        "replacements": {
          "ARTIST_NAME": "DANTE",
          "SECONDARY": "LIVE",
          "RIGHT_HEAD": "UMA VOZ\nMIL HISTÓRIAS\nEMOÇÕES REAIS",
          "HIGHLIGHT_1": "SHOW AO VIVO",
          "HIGHLIGHT_2": "IMPERDÍVEL",
          "BOTTOM_LEFT": "NOVO EP\nDISPONÍVEL\nEM TODAS\nPLATAFORMAS",
          "EVENT_DATE": "15 JUN",
          "EVENT_WEEKDAY": "SÁBADO",
          "EVENT_TIME": "21:00",
          "BANNER": "INGRESSOS LIMITADOS"
        },
        "optional": [
          "BOTTOM_LEFT"
        ],
        "prompt": "REFERENCE PHOTO (mandatory): Use the uploaded photo as the exact same person — preserve 100% of their face, facial features, skin tone, ethnicity, hair texture and likeness. Seamlessly composite them into this poster like professional photo retouching: unified lighting on face and body, natural skin blend, no floating cutout, no pasted sticker look, no disjointed face layer. Place the subject in the pose/position described below while keeping their real identity. Typography and graphic elements must sit in clear layout zones — never let text overlap, cut through or hide behind the face; place headlines in negative space or on background layers behind the subject when needed.\n\nHighly detailed vertical concert promotional poster in premium music editorial style, cinematic live performance photography, luxury entertainment branding.\n\nCentral composition:\nModern singer performing energetically on stage holding a wireless microphone close to the mouth. Confident rockstar posture, expressive performance stance. Wearing black leather jacket over a fitted black outfit, layered silver chains, stylish sunglasses, modern concert aesthetic.\n\nTypography layout:\nMassive distressed bold condensed sans-serif typography occupying the upper-left section.\n\nMain Title:\nLarge textured red uppercase \"{{ARTIST_NAME}}\".\n\nSecondary title:\nDynamic white brush lettering \"{{SECONDARY}}\".\n\nRight-side headline:\n{{RIGHT_HEAD}}\n\nRed highlight box:\n{{HIGHLIGHT_1}}\n{{HIGHLIGHT_2}}\n\nBottom-left information panel:\n{{BOTTOM_LEFT}}\n\nBottom-right event box:\n{{EVENT_DATE}}\n{{EVENT_WEEKDAY}}\n{{EVENT_TIME}}\n\nBottom banner:\n{{BANNER}}\n\nBackground:\nDark concert stage environment with subtle audience atmosphere, heavy grunge textures and premium editorial finish.\n\nLighting:\nPowerful stage spotlights, dramatic red accent lighting, cinematic concert contrast.\n\nColor palette:\nBlack, dark gray, white, deep red accents.\n\nStyle:\nPremium concert flyer, luxury entertainment branding, ultra-detailed live music editorial design."
      },
      {
        "key": "stage_icon",
        "title": "Stage Icon",
        "labelKey": "post_style_stage_icon",
        "gradient": "linear-gradient(135deg,#18181B 0%,#991B1B 50%,#FCA5A5 100%)",
        "placeholders": [
          "ARTIST_NAME",
          "SECONDARY",
          "HEADLINE",
          "HIGHLIGHT_1",
          "HIGHLIGHT_2",
          "HIGHLIGHT_3",
          "EVENT_DATE",
          "VENUE",
          "EVENT_TIME"
        ],
        "replacements": {
          "ARTIST_NAME": "DANTE",
          "SECONDARY": "ON STAGE",
          "HEADLINE": "UMA PERFORMANCE INESQUECÍVEL",
          "HIGHLIGHT_1": "AO VIVO",
          "HIGHLIGHT_2": "EXCLUSIVO",
          "HIGHLIGHT_3": "LIMITADO",
          "EVENT_DATE": "15 JUN",
          "VENUE": "LISBOA",
          "EVENT_TIME": "21:00"
        },
        "optional": [],
        "prompt": "REFERENCE PHOTO (mandatory): Use the uploaded photo as the exact same person — preserve 100% of their face, facial features, skin tone, ethnicity, hair texture and likeness. Seamlessly composite them into this poster like professional photo retouching: unified lighting on face and body, natural skin blend, no floating cutout, no pasted sticker look, no disjointed face layer. Place the subject in the pose/position described below while keeping their real identity. Typography and graphic elements must sit in clear layout zones — never let text overlap, cut through or hide behind the face; place headlines in negative space or on background layers behind the subject when needed.\n\nHighly detailed vertical live music poster in luxury concert magazine style, cinematic entertainment photography.\n\nCentral composition:\nContemporary male singer performing passionately with a handheld microphone, dynamic stage movement conveying energy and emotion. Wearing premium black leather fashion pieces with subtle metallic accessories.\n\nTypography layout:\nHuge distressed uppercase typography across the upper third.\n\nMain Title:\nLarge red textured \"{{ARTIST_NAME}}\".\n\nSecondary title:\n\"{{SECONDARY}}\" in expressive white handwritten typography.\n\nSupporting text:\n\"{{HEADLINE}}\"\n\nHighlight box:\n{{HIGHLIGHT_1}}\n{{HIGHLIGHT_2}}\n{{HIGHLIGHT_3}}\n\nBottom details:\n{{EVENT_DATE}}\n{{VENUE}}\n{{EVENT_TIME}}\n\nBackground:\nModern concert stage with atmospheric haze, subtle crowd silhouettes and grunge overlays.\n\nLighting:\nRed stage wash lighting combined with dramatic white spotlights.\n\nColor palette:\nBlack, red, white.\n\nStyle:\nRock concert editorial, premium live show campaign, luxury music branding."
      },
      {
        "key": "night_performance",
        "title": "Night Performance",
        "labelKey": "post_style_night_performance",
        "gradient": "linear-gradient(135deg,#0A0A0A 0%,#B91C1C 52%,#F87171 100%)",
        "placeholders": [
          "ARTIST_NAME",
          "SECONDARY",
          "RIGHT_1",
          "RIGHT_2",
          "RIGHT_3",
          "HIGHLIGHT_1",
          "BOTTOM_LEFT",
          "EVENT_DATE",
          "EVENT_TIME",
          "VENUE"
        ],
        "replacements": {
          "ARTIST_NAME": "DANTE",
          "SECONDARY": "LIVE EXPERIENCE",
          "RIGHT_1": "MÚSICA",
          "RIGHT_2": "EMOÇÃO",
          "RIGHT_3": "CONEXÃO",
          "HIGHLIGHT_1": "SHOW EXCLUSIVO",
          "BOTTOM_LEFT": "NOVO ÁLBUM DISPONÍVEL",
          "EVENT_DATE": "15 JUN",
          "EVENT_TIME": "21:00",
          "VENUE": "PORTO"
        },
        "optional": [],
        "prompt": "REFERENCE PHOTO (mandatory): Use the uploaded photo as the exact same person — preserve 100% of their face, facial features, skin tone, ethnicity, hair texture and likeness. Seamlessly composite them into this poster like professional photo retouching: unified lighting on face and body, natural skin blend, no floating cutout, no pasted sticker look, no disjointed face layer. Place the subject in the pose/position described below while keeping their real identity. Typography and graphic elements must sit in clear layout zones — never let text overlap, cut through or hide behind the face; place headlines in negative space or on background layers behind the subject when needed.\n\nHighly detailed vertical entertainment flyer in premium live concert editorial style.\n\nCentral composition:\nProfessional singer captured mid-performance holding a microphone confidently, expressive body language showcasing passion and charisma. Modern rock-inspired wardrobe with black leather outerwear.\n\nTypography layout:\nOversized distressed condensed typography dominating the top-left area.\n\nMain Title:\nLarge deep red uppercase \"{{ARTIST_NAME}}\".\n\nSecondary title:\n\"{{SECONDARY}}\" in dynamic brush-style lettering.\n\nRight-side text:\n{{RIGHT_1}}\n{{RIGHT_2}}\n{{RIGHT_3}}\n\nFeature box:\n{{HIGHLIGHT_1}}\n\nBottom information:\n{{BOTTOM_LEFT}}\n\nEvent details:\n{{EVENT_DATE}}\n{{EVENT_TIME}}\n{{VENUE}}\n\nBackground:\nConcert stage environment featuring dramatic smoke effects and subtle audience ambiance.\n\nLighting:\nIntense concert spotlights with red atmospheric glow.\n\nColor palette:\nBlack, crimson red, white.\n\nStyle:\nPremium concert branding, luxury entertainment editorial flyer."
      },
      {
        "key": "live_experience",
        "title": "Live Experience",
        "labelKey": "post_style_live_experience",
        "gradient": "linear-gradient(135deg,#111 0%,#DC2626 48%,#FECACA 100%)",
        "placeholders": [
          "ARTIST_NAME",
          "SECONDARY",
          "HEADLINE",
          "HIGHLIGHT_1",
          "BOTTOM_LEFT",
          "BANNER",
          "EVENT_DATE",
          "VENUE",
          "EVENT_TIME"
        ],
        "replacements": {
          "ARTIST_NAME": "DANTE",
          "SECONDARY": "LIVE",
          "HEADLINE": "EMOÇÕES\nQUE MARCAM",
          "HIGHLIGHT_1": "SHOW AO VIVO",
          "BOTTOM_LEFT": "TOUR 2026",
          "BANNER": "INGRESSOS DISPONÍVEIS",
          "EVENT_DATE": "20 JUN",
          "VENUE": "COIMBRA",
          "EVENT_TIME": "21:00"
        },
        "optional": [],
        "prompt": "REFERENCE PHOTO (mandatory): Use the uploaded photo as the exact same person — preserve 100% of their face, facial features, skin tone, ethnicity, hair texture and likeness. Seamlessly composite them into this poster like professional photo retouching: unified lighting on face and body, natural skin blend, no floating cutout, no pasted sticker look, no disjointed face layer. Place the subject in the pose/position described below while keeping their real identity. Typography and graphic elements must sit in clear layout zones — never let text overlap, cut through or hide behind the face; place headlines in negative space or on background layers behind the subject when needed.\n\nHighly detailed vertical concert poster with cinematic entertainment aesthetics and premium music branding.\n\nCentral composition:\nSinger delivering a powerful live performance while holding a microphone close to the audience, energetic stage posture. Wearing stylish all-black fashion with leather jacket and modern accessories.\n\nTypography layout:\nLarge distressed typography extending vertically through the upper section.\n\nMain Title:\nBold textured red uppercase \"{{ARTIST_NAME}}\".\n\nSecondary title:\n\"{{SECONDARY}}\" in expressive handwritten white typography.\n\nSupporting headline:\n{{HEADLINE}}\n\nHighlight section:\n{{HIGHLIGHT_1}}\n\nBottom information:\n{{BOTTOM_LEFT}}\n{{BANNER}}\n\nEvent block:\n{{EVENT_DATE}}\n{{VENUE}}\n{{EVENT_TIME}}\n\nBackground:\nDark premium concert environment with stage structures and atmospheric textures.\n\nLighting:\nHigh contrast stage lighting with intense red accents and dramatic highlights.\n\nColor palette:\nBlack, dark gray, red, white.\n\nStyle:\nLuxury concert campaign, premium live entertainment flyer."
      },
      {
        "key": "voices_of_the_night",
        "title": "Voices of the Night",
        "labelKey": "post_style_voices_of_the_night",
        "gradient": "linear-gradient(135deg,#0B0B0C 0%,#9F1239 50%,#FB7185 100%)",
        "placeholders": [
          "ARTIST_NAME",
          "SECONDARY",
          "RIGHT_HEAD",
          "HIGHLIGHT_1",
          "HIGHLIGHT_2",
          "BOTTOM_LEFT",
          "EVENT_DATE",
          "EVENT_TIME",
          "VENUE",
          "BANNER"
        ],
        "replacements": {
          "ARTIST_NAME": "DANTE",
          "SECONDARY": "PERFORM LIVE",
          "RIGHT_HEAD": "UMA VOZ\nMIL MOMENTOS",
          "HIGHLIGHT_1": "EVENTO",
          "HIGHLIGHT_2": "IMPERDÍVEL",
          "BOTTOM_LEFT": "NOVO SINGLE\nDISPONÍVEL AGORA",
          "EVENT_DATE": "25 JUN",
          "EVENT_TIME": "21:00",
          "VENUE": "BRAGA",
          "BANNER": "LUGARES LIMITADOS"
        },
        "optional": [],
        "prompt": "REFERENCE PHOTO (mandatory): Use the uploaded photo as the exact same person — preserve 100% of their face, facial features, skin tone, ethnicity, hair texture and likeness. Seamlessly composite them into this poster like professional photo retouching: unified lighting on face and body, natural skin blend, no floating cutout, no pasted sticker look, no disjointed face layer. Place the subject in the pose/position described below while keeping their real identity. Typography and graphic elements must sit in clear layout zones — never let text overlap, cut through or hide behind the face; place headlines in negative space or on background layers behind the subject when needed.\n\nHighly detailed vertical music promotional poster in premium editorial concert style, luxury live event branding.\n\nCentral composition:\nModern vocalist captured during an intense stage performance with wireless microphone, charismatic stage presence and confident body language. Wearing contemporary black leather attire with stylish accessories.\n\nTypography layout:\nMassive distressed uppercase typography covering the upper-left area.\n\nMain Title:\nLarge textured red \"{{ARTIST_NAME}}\".\n\nSecondary title:\n\"{{SECONDARY}}\" in expressive white brush script.\n\nRight-side text:\n{{RIGHT_HEAD}}\n\nHighlight box:\n{{HIGHLIGHT_1}}\n{{HIGHLIGHT_2}}\n\nBottom information:\n{{BOTTOM_LEFT}}\n\nEvent details section:\n{{EVENT_DATE}}\n{{EVENT_TIME}}\n{{VENUE}}\n\nBottom banner:\n{{BANNER}}\n\nBackground:\nHigh-energy concert stage with dramatic atmosphere and editorial grunge textures.\n\nLighting:\nRed concert spotlights combined with subtle white highlights creating cinematic depth.\n\nColor palette:\nBlack, red, white.\n\nStyle:\nPremium live music branding, luxury entertainment editorial poster, ultra-detailed commercial concert flyer."
      }
    ]
  },
  {
    "id": "fitness_premium",
    "category": "fitness",
    "label": "ACADEMIA PREMIUM",
    "subtag": "5 estilos · Gold",
    "variants": [
      {
        "key": "alpha_zone",
        "title": "Alpha Zone",
        "labelKey": "post_style_alpha_zone",
        "gradient": "linear-gradient(135deg,#020617 0%,#854D0E 52%,#FACC15 100%)",
        "placeholders": [
          "TITLE_A",
          "TITLE_B",
          "RIGHT_1",
          "RIGHT_2",
          "RIGHT_3",
          "GOLD_1",
          "GOLD_2",
          "GOLD_3",
          "BOTTOM_L",
          "SVC_1",
          "SVC_2",
          "SVC_3",
          "SVC_4"
        ],
        "replacements": {
          "TITLE_A": "ALPHA",
          "TITLE_B": "ZONE",
          "RIGHT_1": "DISCIPLINA",
          "RIGHT_2": "FOCO",
          "RIGHT_3": "EVOLUÇÃO",
          "GOLD_1": "TREINE SUA MENTE",
          "GOLD_2": "SUPERE SEUS",
          "GOLD_3": "LIMITES",
          "BOTTOM_L": "SEU CORPO\nSUA MELHOR\nVERSÃO",
          "SVC_1": "MUSCULAÇÃO",
          "SVC_2": "FUNCIONAL",
          "SVC_3": "PERSONAL",
          "SVC_4": "NUTRIÇÃO"
        },
        "optional": [
          "SVC_4"
        ],
        "prompt": "REFERENCE PHOTO (mandatory): Use the uploaded photo as the exact same person — preserve 100% of their face, facial features, skin tone, ethnicity, hair texture and likeness. Seamlessly composite them into this poster like professional photo retouching: unified lighting on face and body, natural skin blend, no floating cutout, no pasted sticker look, no disjointed face layer. Place the subject in the pose/position described below while keeping their real identity. Typography and graphic elements must sit in clear layout zones — never let text overlap, cut through or hide behind the face; place headlines in negative space or on background layers behind the subject when needed.\n\nHighly detailed vertical fitness promotional poster in premium sports editorial style, luxury gym branding, cinematic fitness photography.\n\nCentral composition:\nPowerful athletic woman standing confidently inside a modern gym environment. Strong posture emphasizing discipline and determination. Holding a dumbbell naturally at her side. Wearing premium black sports bra and high-waisted athletic leggings. Defined muscular physique showcasing strength and dedication.\n\nTypography layout:\nMassive distressed condensed sans-serif typography occupying the upper section.\n\nMain Title:\nLarge textured white uppercase \"{{TITLE_A}}\".\n\nSecondary Title:\nLarge gold textured uppercase \"{{TITLE_B}}\".\n\nRight-side motivational text:\n{{RIGHT_1}}\n{{RIGHT_2}}\n{{RIGHT_3}}\n\nHighlighted gold box:\n{{GOLD_1}}\n{{GOLD_2}}\n{{GOLD_3}}\n\nBottom-left motivational text:\n{{BOTTOM_L}}\n\nBottom-right services:\n{{SVC_1}}\n{{SVC_2}}\n{{SVC_3}}\n{{SVC_4}}\n\nBackground:\nModern industrial gym with dumbbells and premium fitness equipment. Heavy grunge textures and editorial overlays.\n\nLighting:\nDramatic fitness lighting emphasizing muscle definition with high contrast shadows.\n\nColor palette:\nBlack, white, gold accents.\n\nStyle:\nLuxury fitness campaign, premium gym advertisement, ultra-detailed sports editorial design."
      },
      {
        "key": "elite_performance",
        "title": "Elite Performance",
        "labelKey": "post_style_elite_performance",
        "gradient": "linear-gradient(135deg,#0F172A 0%,#78350F 50%,#FDE047 100%)",
        "placeholders": [
          "MAIN_TITLE",
          "SUBTITLE",
          "RIGHT_1",
          "RIGHT_2",
          "RIGHT_3",
          "GOLD_1",
          "GOLD_2",
          "GOLD_3",
          "BOTTOM_L",
          "SVC_1",
          "SVC_2",
          "SVC_3"
        ],
        "replacements": {
          "MAIN_TITLE": "ELITE",
          "SUBTITLE": "PERFORMANCE",
          "RIGHT_1": "FORÇA",
          "RIGHT_2": "CONSISTÊNCIA",
          "RIGHT_3": "SUPERAÇÃO",
          "GOLD_1": "ULTRAPASSE",
          "GOLD_2": "SEUS LIMITES",
          "GOLD_3": "",
          "BOTTOM_L": "A SUA MELHOR\nVERSÃO",
          "SVC_1": "TREINO FUNCIONAL",
          "SVC_2": "PERSONAL TRAINER",
          "SVC_3": "NUTRIÇÃO"
        },
        "optional": [
          "GOLD_3"
        ],
        "prompt": "REFERENCE PHOTO (mandatory): Use the uploaded photo as the exact same person — preserve 100% of their face, facial features, skin tone, ethnicity, hair texture and likeness. Seamlessly composite them into this poster like professional photo retouching: unified lighting on face and body, natural skin blend, no floating cutout, no pasted sticker look, no disjointed face layer. Place the subject in the pose/position described below while keeping their real identity. Typography and graphic elements must sit in clear layout zones — never let text overlap, cut through or hide behind the face; place headlines in negative space or on background layers behind the subject when needed.\n\nHighly detailed vertical gym promotional flyer in premium athletic editorial style, cinematic sports branding.\n\nCentral composition:\nElite fitness athlete standing in a determined pose holding a kettlebell beside the body. Modern premium activewear with sleek black training outfit. Powerful athletic presence conveying resilience and discipline.\n\nTypography layout:\nOversized distressed typography dominating the upper-left area.\n\nMain Title:\nLarge textured white uppercase \"{{MAIN_TITLE}}\".\n\nSecondary Title:\nGold accent typography \"{{SUBTITLE}}\" beneath.\n\nRight-side text:\n{{RIGHT_1}}\n{{RIGHT_2}}\n{{RIGHT_3}}\n\nGold highlight box:\n{{GOLD_1}}\n{{GOLD_2}}\n{{GOLD_3}}\n\nBottom-left motivational phrase:\n{{BOTTOM_L}}\n\nBottom-right services:\n{{SVC_1}}\n{{SVC_2}}\n{{SVC_3}}\n\nBackground:\nLuxury gym interior featuring racks, free weights and industrial elements.\n\nLighting:\nStrong directional lighting emphasizing athletic definition and premium editorial aesthetics.\n\nColor palette:\nBlack, charcoal gray, gold accents, white typography.\n\nStyle:\nLuxury gym campaign, fitness magazine cover aesthetic."
      },
      {
        "key": "iron_mindset",
        "title": "Iron Mindset",
        "labelKey": "post_style_iron_mindset",
        "gradient": "linear-gradient(135deg,#09090B 0%,#57534E 48%,#EAB308 100%)",
        "placeholders": [
          "MAIN_TITLE",
          "SUBTITLE",
          "SUPPORT_1",
          "SUPPORT_2",
          "GOLD_1",
          "GOLD_2",
          "GOLD_3",
          "BOTTOM_L",
          "SVC_1",
          "SVC_2",
          "SVC_3"
        ],
        "replacements": {
          "MAIN_TITLE": "IRON",
          "SUBTITLE": "MINDSET",
          "SUPPORT_1": "MENTE FORTE",
          "SUPPORT_2": "CORPO FORTE",
          "GOLD_1": "DISCIPLINA",
          "GOLD_2": "DETERMINAÇÃO",
          "GOLD_3": "RESULTADOS",
          "BOTTOM_L": "TREINE COM\nPROPÓSITO",
          "SVC_1": "MUSCULAÇÃO",
          "SVC_2": "TREINO FUNCIONAL",
          "SVC_3": "CONSULTORIA FITNESS"
        },
        "optional": [],
        "prompt": "REFERENCE PHOTO (mandatory): Use the uploaded photo as the exact same person — preserve 100% of their face, facial features, skin tone, ethnicity, hair texture and likeness. Seamlessly composite them into this poster like professional photo retouching: unified lighting on face and body, natural skin blend, no floating cutout, no pasted sticker look, no disjointed face layer. Place the subject in the pose/position described below while keeping their real identity. Typography and graphic elements must sit in clear layout zones — never let text overlap, cut through or hide behind the face; place headlines in negative space or on background layers behind the subject when needed.\n\nHighly detailed vertical fitness advertisement with premium sports editorial aesthetics and motivational branding.\n\nCentral composition:\nConfident fitness model standing inside a professional training facility while holding a dumbbell. Athletic posture reflecting discipline and mental toughness. Wearing premium black training apparel.\n\nTypography layout:\nLarge distressed uppercase typography covering the upper third.\n\nMain Title:\nLarge white uppercase \"{{MAIN_TITLE}}\".\n\nSecondary Title:\nBold textured gold \"{{SUBTITLE}}\".\n\nSupporting text:\n{{SUPPORT_1}}\n{{SUPPORT_2}}\n\nFeature box:\n{{GOLD_1}}\n{{GOLD_2}}\n{{GOLD_3}}\n\nBottom-left statement:\n{{BOTTOM_L}}\n\nBottom-right services:\n{{SVC_1}}\n{{SVC_2}}\n{{SVC_3}}\n\nBackground:\nModern gym with industrial atmosphere and heavy grunge textures.\n\nLighting:\nHigh contrast fitness photography lighting enhancing muscle tone and definition.\n\nColor palette:\nBlack, white, metallic gold.\n\nStyle:\nPremium fitness branding, luxury sports campaign."
      },
      {
        "key": "beyond_limits",
        "title": "Beyond Limits",
        "labelKey": "post_style_beyond_limits",
        "gradient": "linear-gradient(135deg,#0C0A09 0%,#44403C 50%,#FBBF24 100%)",
        "placeholders": [
          "MAIN_TITLE",
          "SUBTITLE",
          "RIGHT_1",
          "RIGHT_2",
          "RIGHT_3",
          "GOLD_1",
          "GOLD_2",
          "GOLD_3",
          "BOTTOM_L",
          "SVC_1",
          "SVC_2",
          "SVC_3"
        ],
        "replacements": {
          "MAIN_TITLE": "BEYOND",
          "SUBTITLE": "LIMITS",
          "RIGHT_1": "FOCO",
          "RIGHT_2": "DISCIPLINA",
          "RIGHT_3": "RESULTADOS",
          "GOLD_1": "SUPERE",
          "GOLD_2": "TODAS AS",
          "GOLD_3": "BARREIRAS",
          "BOTTOM_L": "O PROGRESSO\nCOMEÇA HOJE",
          "SVC_1": "PERSONAL TRAINING",
          "SVC_2": "FITNESS",
          "SVC_3": "NUTRIÇÃO"
        },
        "optional": [],
        "prompt": "REFERENCE PHOTO (mandatory): Use the uploaded photo as the exact same person — preserve 100% of their face, facial features, skin tone, ethnicity, hair texture and likeness. Seamlessly composite them into this poster like professional photo retouching: unified lighting on face and body, natural skin blend, no floating cutout, no pasted sticker look, no disjointed face layer. Place the subject in the pose/position described below while keeping their real identity. Typography and graphic elements must sit in clear layout zones — never let text overlap, cut through or hide behind the face; place headlines in negative space or on background layers behind the subject when needed.\n\nHighly detailed vertical gym marketing poster in premium athletic editorial style.\n\nCentral composition:\nStrong female athlete standing confidently with dumbbell in hand, showcasing power and focus. Wearing elegant black activewear with premium fitness aesthetics.\n\nTypography layout:\nMassive distressed typography occupying the upper-left section.\n\nMain Title:\nLarge textured white uppercase \"{{MAIN_TITLE}}\".\n\nSecondary Title:\nGold accent typography \"{{SUBTITLE}}\" beneath.\n\nRight-side text:\n{{RIGHT_1}}\n{{RIGHT_2}}\n{{RIGHT_3}}\n\nGold motivational panel:\n{{GOLD_1}}\n{{GOLD_2}}\n{{GOLD_3}}\n\nBottom-left quote:\n{{BOTTOM_L}}\n\nBottom-right services:\n{{SVC_1}}\n{{SVC_2}}\n{{SVC_3}}\n\nBackground:\nContemporary gym environment with premium fitness equipment and urban textures.\n\nLighting:\nDramatic gym lighting with editorial contrast and premium sports aesthetics.\n\nColor palette:\nBlack, dark gray, gold and white.\n\nStyle:\nLuxury fitness campaign, premium gym flyer design."
      },
      {
        "key": "prime_fitness",
        "title": "Prime Fitness",
        "labelKey": "post_style_prime_fitness",
        "gradient": "linear-gradient(135deg,#111827 0%,#92400E 52%,#FCD34D 100%)",
        "placeholders": [
          "MAIN_TITLE",
          "SUBTITLE",
          "SUPPORT_1",
          "SUPPORT_2",
          "SUPPORT_3",
          "GOLD_1",
          "GOLD_2",
          "GOLD_3",
          "BOTTOM_L",
          "SVC_1",
          "SVC_2",
          "SVC_3",
          "SVC_4"
        ],
        "replacements": {
          "MAIN_TITLE": "PRIME",
          "SUBTITLE": "FITNESS",
          "SUPPORT_1": "EVOLUA",
          "SUPPORT_2": "TODOS OS",
          "SUPPORT_3": "DIAS",
          "GOLD_1": "TREINE",
          "GOLD_2": "COM",
          "GOLD_3": "INTENSIDADE",
          "BOTTOM_L": "SEJA A SUA\nMELHOR VERSÃO",
          "SVC_1": "TREINO FUNCIONAL",
          "SVC_2": "MUSCULAÇÃO",
          "SVC_3": "PERSONAL",
          "SVC_4": "NUTRIÇÃO"
        },
        "optional": [
          "SVC_4"
        ],
        "prompt": "REFERENCE PHOTO (mandatory): Use the uploaded photo as the exact same person — preserve 100% of their face, facial features, skin tone, ethnicity, hair texture and likeness. Seamlessly composite them into this poster like professional photo retouching: unified lighting on face and body, natural skin blend, no floating cutout, no pasted sticker look, no disjointed face layer. Place the subject in the pose/position described below while keeping their real identity. Typography and graphic elements must sit in clear layout zones — never let text overlap, cut through or hide behind the face; place headlines in negative space or on background layers behind the subject when needed.\n\nHighly detailed vertical fitness flyer in premium sports magazine style, cinematic athletic branding.\n\nCentral composition:\nDedicated fitness athlete standing in a powerful pose holding free weights. Strong body language expressing commitment and determination. Wearing sophisticated black workout apparel.\n\nTypography layout:\nOversized distressed uppercase typography across the upper section.\n\nMain Title:\nLarge white uppercase \"{{MAIN_TITLE}}\".\n\nSecondary Title:\nLarge textured gold \"{{SUBTITLE}}\".\n\nSupporting text:\n{{SUPPORT_1}}\n{{SUPPORT_2}}\n{{SUPPORT_3}}\n\nGold feature box:\n{{GOLD_1}}\n{{GOLD_2}}\n{{GOLD_3}}\n\nBottom-left motivation:\n{{BOTTOM_L}}\n\nBottom-right information:\n{{SVC_1}}\n{{SVC_2}}\n{{SVC_3}}\n{{SVC_4}}\n\nBackground:\nProfessional gym setting featuring modern fitness equipment with subtle grunge textures.\n\nLighting:\nCinematic fitness lighting emphasizing athletic form and premium editorial style.\n\nColor palette:\nBlack, white, gold accents.\n\nStyle:\nLuxury gym branding, premium fitness advertising, ultra-realistic editorial poster."
      }
    ]
  }
];

/** Templates primários (1 por família) para a grelha de categorias. */
export function buildPremiumPosterTemplates() {
  return PREMIUM_POSTER_FAMILIES.map((family) => {
    const first = family.variants[0];
    return {
      id: family.id,
      source_id: family.id,
      familyId: family.id,
      styleVariants: true,
      category: family.category,
      label: family.label,
      subtag: family.subtag,
      placeholders: first.placeholders,
      optional: first.optional || [],
      replacements: { ...first.replacements },
      prompt: first.prompt,
      aspect: "4:5",
    };
  });
}

export function registerPremiumStyleVariants(registerFn) {
  for (const family of PREMIUM_POSTER_FAMILIES) {
    registerFn(
      family.id,
      family.variants.map((v) => ({
        variantKey: v.key,
        label: v.title,
        labelKey: v.labelKey,
        gradient: v.gradient,
        prompt: v.prompt,
        placeholders: v.placeholders,
        replacements: { ...v.replacements },
        optional: v.optional || [],
      })),
    );
  }
}
