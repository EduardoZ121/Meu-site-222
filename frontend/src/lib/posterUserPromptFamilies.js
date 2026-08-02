import { POSTER_REFERENCE_FOOD, POSTER_REFERENCE_PERSON } from "./identityPrompts.js";

const NO_RANDOM_BRANDING =
  "No random logos, no AI signature, no watermark. Keep all text crisp, fully readable and inside the poster frame.";

function personPrompt(body) {
  return `${POSTER_REFERENCE_PERSON}\n\n${body}\n\n${NO_RANDOM_BRANDING}`;
}

function foodPrompt(body) {
  return `${POSTER_REFERENCE_FOOD}\n\n${body}\n\n${NO_RANDOM_BRANDING}`;
}

const FASHION_FIELDS = [
  "MAIN_TITLE",
  "DISCOUNT",
  "SUBTITLE",
  "FEATURE_1",
  "FEATURE_2",
  "FEATURE_3",
  "CTA_TEXT",
  "WEBSITE",
  "PHONE",
  "BRAND_NAME",
];

const EVENT_FIELDS = [
  "EVENT_TITLE",
  "EVENT_SUBTITLE",
  "EVENT_DATE",
  "SCHEDULE",
  "VENUE",
  "FOOTER_TEXT",
  "LOGO_TEXT",
];

const DJ_FIELDS = [
  "MAIN_TITLE",
  "DJ_NAME",
  "EVENT_DATE",
  "VENUE",
  "CTA_TEXT",
];

const FOOD_FIELDS = [
  "MAIN_TITLE",
  "SUBTITLE",
  "BADGE_TEXT",
  "PRICE",
  "CTA_TEXT",
  "PHONE",
  "WEBSITE",
  "SOCIAL",
  "DELIVERY_TEXT",
];

export const USER_PROMPT_POSTER_FAMILIES = [
  {
    id: "fashion_sale_identity",
    category: "fashion",
    label: "FASHION SALE",
    subtag: "2 estilos · Identidade",
    variants: [
      {
        key: "promotional_sale",
        title: "Fashion Sale Promotional",
        gradient: "linear-gradient(135deg,#F8FAFC 0%,#C4B5FD 48%,#111827 100%)",
        placeholders: FASHION_FIELDS,
        optional: ["SUBTITLE", "FEATURE_1", "FEATURE_2", "FEATURE_3", "WEBSITE", "PHONE", "BRAND_NAME"],
        replacements: {
          MAIN_TITLE: "SALE",
          DISCOUNT: "50%",
          SUBTITLE: "Luxury handwritten subtitle",
          FEATURE_1: "Premium Collection",
          FEATURE_2: "Best Quality",
          FEATURE_3: "Fast Delivery",
          CTA_TEXT: "SHOP NOW",
          WEBSITE: "www.brand.com",
          PHONE: "+244 900 000 000",
          BRAND_NAME: "BRAND",
        },
        prompt: personPrompt(`Highly detailed premium fashion advertising poster, modern editorial branding design, luxury clothing campaign, minimalist commercial layout, clean high-end retail advertisement.
Main composition: stylish model positioned on the right side, seated in a relaxed editorial pose, resting one side of the face gently against one hand, body slightly angled while the face looks directly toward the camera.
Preserve original poster-like pose, hand placement, shoulder angle, facial orientation, body proportions, camera angle, framing, clothing, accessories, lighting, colors and overall visual design.
Hair replacement rule: replace only the original model hair with the hairstyle from the reference image while preserving the reference person's identity.
Clothing: beige blazer and inner clothing, premium fabric folds, sleeves, buttons, accessories and luxury fashion styling.
Background: minimal clean white background, soft lavender geometric shapes, large circular graphic behind the subject, subtle curved abstract shapes.
Typography: large headline "{{MAIN_TITLE}}"; luxury handwritten subtitle "{{SUBTITLE}}"; promotional block "UP TO {{DISCOUNT}} OFF"; feature blocks "{{FEATURE_1}}", "{{FEATURE_2}}", "{{FEATURE_3}}"; CTA "{{CTA_TEXT}}"; website "{{WEBSITE}}"; phone "{{PHONE}}"; brand logo text "{{BRAND_NAME}}".
Soft commercial studio lighting, natural skin tones, luxury beauty photography lighting, clean editorial shadows, professional graphic design, photorealistic, 8K.`),
      },
      {
        key: "luxury_fashion_sale",
        title: "Luxury Fashion Sale",
        gradient: "linear-gradient(135deg,#F5F5DC 0%,#D6B692 52%,#111111 100%)",
        placeholders: FASHION_FIELDS,
        optional: ["SUBTITLE", "FEATURE_1", "FEATURE_2", "FEATURE_3", "WEBSITE", "PHONE", "BRAND_NAME"],
        replacements: {
          MAIN_TITLE: "SUMMER SALE",
          DISCOUNT: "40%",
          SUBTITLE: "Elegant collection",
          FEATURE_1: "Premium Collections",
          FEATURE_2: "Best Quality",
          FEATURE_3: "Fast Delivery",
          CTA_TEXT: "SHOP NOW",
          WEBSITE: "www.brand.com",
          PHONE: "+244 900 000 000",
          BRAND_NAME: "BRAND",
        },
        prompt: personPrompt(`Luxury fashion campaign poster with premium minimalist branding.
The model occupies the right side wearing a beige blazer. Maintain seated pose, shoulder position, hand placement, body proportions, facial orientation and camera framing.
Typography layout: large headline "{{MAIN_TITLE}}"; luxury handwritten subtitle "{{SUBTITLE}}"; discount block "UP TO {{DISCOUNT}} OFF"; automatically generated promotional marketing text; bottom sections with feature icons "{{FEATURE_1}}", "{{FEATURE_2}}", "{{FEATURE_3}}"; CTA button "{{CTA_TEXT}}"; website "{{WEBSITE}}"; social/phone "{{PHONE}}"; logo placeholder "{{BRAND_NAME}}".
Warm luxury editorial lighting, neutral cream background with soft abstract geometric shapes, magazine fashion campaign, elegant typography, modern branding, photorealistic, 8K.`),
      },
    ],
  },
  {
    id: "editorial_art_exhibition",
    category: "editorial",
    label: "ART EXHIBITION",
    subtag: "2 estilos · Galeria",
    variants: [
      {
        key: "modern_art_exhibition",
        title: "Modern Art Exhibition",
        gradient: "linear-gradient(135deg,#F4F1EA 0%,#C65F3A 48%,#111111 100%)",
        placeholders: EVENT_FIELDS,
        optional: ["EVENT_SUBTITLE", "SCHEDULE", "VENUE", "FOOTER_TEXT", "LOGO_TEXT"],
        replacements: {
          EVENT_TITLE: "MODERN ART",
          EVENT_SUBTITLE: "EXHIBITION",
          EVENT_DATE: "JUNE 2026",
          SCHEDULE: "10AM - 8PM",
          VENUE: "Gallery Hall",
          FOOTER_TEXT: "Museum-quality exhibition",
          LOGO_TEXT: "GALLERY",
        },
        prompt: personPrompt(`Modern editorial exhibition poster, premium minimalist Swiss graphic design, museum-quality advertising layout.
The model occupies the right side wearing a black turtleneck, body slightly turned, head tilted upward with a confident editorial expression.
Maintain exact vertical typography layout with title "{{EVENT_TITLE}}", subtitle "{{EVENT_SUBTITLE}}", date "{{EVENT_DATE}}", schedule "{{SCHEDULE}}", venue "{{VENUE}}", footer "{{FOOTER_TEXT}}" and logo "{{LOGO_TEXT}}".
Minimal geometric composition using cream, black and terracotta circles and rectangles, luxury editorial lighting, soft beauty shadows, ultra clean magazine-quality commercial artwork, premium typography, photorealistic, 8K.`),
      },
      {
        key: "contemporary_gallery",
        title: "Contemporary Art Gallery",
        gradient: "linear-gradient(135deg,#EDE9FE 0%,#7C3AED 52%,#111827 100%)",
        placeholders: EVENT_FIELDS,
        optional: ["EVENT_SUBTITLE", "SCHEDULE", "VENUE", "FOOTER_TEXT", "LOGO_TEXT"],
        replacements: {
          EVENT_TITLE: "CONTEMPORARY",
          EVENT_SUBTITLE: "ART GALLERY",
          EVENT_DATE: "OPENING NIGHT",
          SCHEDULE: "18:00",
          VENUE: "Main Gallery",
          FOOTER_TEXT: "Gallery information",
          LOGO_TEXT: "ART",
        },
        prompt: personPrompt(`Premium contemporary gallery poster with minimalist editorial aesthetic.
The portrait is heavily cropped, showing only part of the face inside layered geometric shapes. Maintain crop, facial orientation, body angle, neck position and framing from the poster concept.
Large vertical typography "{{EVENT_TITLE}}"; subtitle "{{EVENT_SUBTITLE}}"; date "{{EVENT_DATE}}"; schedule "{{SCHEDULE}}"; venue "{{VENUE}}"; footer "{{FOOTER_TEXT}}"; logo "{{LOGO_TEXT}}".
Purple geometric circles, rectangles and transparent overlays, museum-quality graphic design, Swiss typography, luxury editorial composition, photorealistic beauty portrait, 8K.`),
      },
    ],
  },
  {
    id: "dj_3d_experience",
    category: "dj",
    label: "DJ 3D EXPERIENCE",
    subtag: "3 estilos · Festival",
    variants: [
      {
        key: "breakout_festival",
        title: "3D Breakout DJ Festival",
        gradient: "linear-gradient(135deg,#020617 0%,#7C3AED 46%,#22D3EE 100%)",
        placeholders: DJ_FIELDS,
        optional: ["DJ_NAME", "EVENT_DATE", "VENUE", "CTA_TEXT"],
        replacements: {
          MAIN_TITLE: "FESTIVAL NIGHT",
          DJ_NAME: "DJ NAME",
          EVENT_DATE: "SATURDAY",
          VENUE: "CLUB ARENA",
          CTA_TEXT: "GET TICKETS",
        },
        prompt: personPrompt(`Explosive 3D festival poster where the DJ dramatically breaks out of the poster frame. Upper body, one arm, headphones and one shoulder extend outside poster borders with realistic depth and perspective.
Large shattered glass pieces burst toward viewer, floating neon geometric shapes, glowing music particles, flying speaker fragments, 3D sound wave ribbons, equalizer bars, neon cubes, music notes made of light, volumetric smoke, purple cyan and magenta lighting.
DJ console with glowing RGB controls, laser beams crossing behind DJ, confetti, lens flares, dynamic motion blur. Large bold typography integrated into depth; text "{{MAIN_TITLE}}", DJ "{{DJ_NAME}}", date "{{EVENT_DATE}}", venue "{{VENUE}}", CTA "{{CTA_TEXT}}".
Premium EDM festival branding, hyper-realistic commercial graphic design, extreme depth illusion, 8K.`),
      },
      {
        key: "cyberpunk_portal",
        title: "Cyberpunk DJ Portal",
        gradient: "linear-gradient(135deg,#030712 0%,#2563EB 42%,#EC4899 100%)",
        placeholders: DJ_FIELDS,
        optional: ["DJ_NAME", "EVENT_DATE", "VENUE", "CTA_TEXT"],
        replacements: {
          MAIN_TITLE: "CYBER NIGHT",
          DJ_NAME: "DJ NAME",
          EVENT_DATE: "FRIDAY",
          VENUE: "NEON CLUB",
          CTA_TEXT: "JOIN NOW",
        },
        prompt: personPrompt(`Cyberpunk DJ poster: DJ emerging through a gigantic glowing circular energy portal, half body inside the portal while upper body extends into viewer space.
Holographic interface panels, transparent neon HUD graphics, animated equalizer rings, glowing vinyl discs orbiting around subject, floating holographic speakers, energy particles, electric arcs, neon smoke, purple blue and pink lighting, laser grids, volumetric fog, chrome reflections.
Large futuristic typography integrated into portal: "{{MAIN_TITLE}}"; DJ "{{DJ_NAME}}"; date "{{EVENT_DATE}}"; venue "{{VENUE}}"; CTA "{{CTA_TEXT}}". Enormous depth with foreground/background layers, premium nightclub campaign, ultra-realistic, 8K.`),
      },
      {
        key: "immersive_3d",
        title: "Immersive 3D DJ Experience",
        gradient: "linear-gradient(135deg,#111827 0%,#A855F7 48%,#F97316 100%)",
        placeholders: DJ_FIELDS,
        optional: ["DJ_NAME", "EVENT_DATE", "VENUE", "CTA_TEXT"],
        replacements: {
          MAIN_TITLE: "IMMERSIVE SOUND",
          DJ_NAME: "DJ NAME",
          EVENT_DATE: "LIVE TONIGHT",
          VENUE: "MAIN STAGE",
          CTA_TEXT: "BOOK NOW",
        },
        prompt: personPrompt(`Premium immersive poster where the entire artwork becomes a 3D scene instead of flat design. DJ booth extends outside the poster; large speakers protrude from frame; turntables partially leave borders; headphones float in front of camera.
Floating vinyl records, neon soundwaves wrapping around subject, musical particles, RGB lighting, floating LED panels, 3D equalizer columns, lasers, fire sparks, smoke, confetti and holographic music visualizers.
Typography wraps around DJ, some text behind DJ and some letters suspended in front of camera. Main title "{{MAIN_TITLE}}", DJ "{{DJ_NAME}}", date "{{EVENT_DATE}}", venue "{{VENUE}}", CTA "{{CTA_TEXT}}". Luxury EDM festival branding, extreme depth, photorealistic, 8K.`),
      },
    ],
  },
  {
    id: "restaurant_food_campaign",
    category: "food",
    label: "FOOD CAMPAIGN",
    subtag: "3 estilos · Menu",
    menuTemplate: true,
    variants: [
      {
        key: "premium_fast_food_menu",
        title: "Premium Fast Food Menu",
        gradient: "linear-gradient(135deg,#111111 0%,#F97316 50%,#FACC15 100%)",
        placeholders: FOOD_FIELDS,
        optional: ["SUBTITLE", "BADGE_TEXT", "PRICE", "PHONE", "WEBSITE", "SOCIAL", "DELIVERY_TEXT"],
        replacements: {
          MAIN_TITLE: "ULTIMATE BURGER",
          SUBTITLE: "Fresh everyday",
          BADGE_TEXT: "LIMITED OFFER",
          PRICE: "Preço",
          CTA_TEXT: "ORDER NOW",
          PHONE: "Telefone",
          WEBSITE: "Website",
          SOCIAL: "@restaurant",
          DELIVERY_TEXT: "Fast Delivery",
        },
        prompt: foodPrompt(`Energetic fast-food promotional poster with bold commercial branding. Uploaded meal becomes the hero of the advertisement, large food image centered with dramatic perspective and realistic shadows.
Large typography "{{MAIN_TITLE}}"; subtitle "{{SUBTITLE}}"; price "{{PRICE}}"; discount/promo badge "{{BADGE_TEXT}}"; delivery section "{{DELIVERY_TEXT}}"; CTA "{{CTA_TEXT}}"; phone "{{PHONE}}"; website "{{WEBSITE}}"; social "{{SOCIAL}}".
Black premium restaurant background, orange brush strokes, white typography, dynamic paint splashes, subtle smoke, floating spices and food crumbs. Icons: fast delivery, premium ingredients, fresh everyday, chef choice. Commercial food photography, ultra realistic, 8K.`),
      },
      {
        key: "modern_restaurant_promo",
        title: "Modern Restaurant Promotional",
        gradient: "linear-gradient(135deg,#F8FAFC 0%,#F97316 52%,#111111 100%)",
        placeholders: FOOD_FIELDS,
        optional: ["SUBTITLE", "BADGE_TEXT", "PRICE", "PHONE", "WEBSITE", "SOCIAL", "DELIVERY_TEXT"],
        replacements: {
          MAIN_TITLE: "CHEF'S SPECIAL",
          SUBTITLE: "Freshly served today",
          BADGE_TEXT: "BEST SELLER",
          PRICE: "Preço",
          CTA_TEXT: "ORDER NOW",
          PHONE: "Telefone",
          WEBSITE: "Website",
          SOCIAL: "@restaurant",
          DELIVERY_TEXT: "Fast Delivery",
        },
        prompt: foodPrompt(`Premium commercial restaurant advertisement in modern minimalist style. Food occupies the center, professionally cut out from original background and placed on a clean matte surface with realistic contact shadows.
Large bold headline "{{MAIN_TITLE}}"; short subtitle "{{SUBTITLE}}"; promotional badge "{{BADGE_TEXT}}"; price "{{PRICE}}"; CTA "{{CTA_TEXT}}"; phone "{{PHONE}}"; website "{{WEBSITE}}"; social "{{SOCIAL}}"; delivery "{{DELIVERY_TEXT}}".
Modern restaurant branding using orange, white and black, curved geometric shapes, soft gradients, premium lighting, minimal food icons and subtle brush accents. Photorealistic commercial quality, 8K.`),
      },
      {
        key: "signature_food_campaign",
        title: "Signature Restaurant Food Campaign",
        gradient: "linear-gradient(135deg,#050505 0%,#7C2D12 48%,#F97316 100%)",
        placeholders: FOOD_FIELDS,
        optional: ["SUBTITLE", "BADGE_TEXT", "PRICE", "PHONE", "WEBSITE", "SOCIAL", "DELIVERY_TEXT"],
        replacements: {
          MAIN_TITLE: "SIGNATURE MENU",
          SUBTITLE: "Taste the difference",
          BADGE_TEXT: "Chef Selected",
          PRICE: "Preço",
          CTA_TEXT: "RESERVE NOW",
          PHONE: "Telefone",
          WEBSITE: "Website",
          SOCIAL: "@restaurant",
          DELIVERY_TEXT: "Delivery information",
        },
        prompt: foodPrompt(`Luxury restaurant campaign poster inspired by premium international food brands. Uploaded dish remains central focus, elevated above background with realistic shadows and depth.
Large premium typography "{{MAIN_TITLE}}"; professional marketing description "{{SUBTITLE}}"; recommendation badge "{{BADGE_TEXT}}"; price "{{PRICE}}"; CTA/reservation button "{{CTA_TEXT}}"; delivery "{{DELIVERY_TEXT}}"; website "{{WEBSITE}}"; phone "{{PHONE}}"; social "{{SOCIAL}}".
Premium black background, orange accent blocks, white typography, thin modern geometric lines, elegant composition, studio food photography, warm orange rim light, soft reflections, luxury restaurant advertisement, 8K.`),
      },
    ],
  },
];

export function buildUserPromptPosterTemplates() {
  return USER_PROMPT_POSTER_FAMILIES.map((family) => {
    const first = family.variants[0];
    return {
      id: family.id,
      source_id: family.id,
      familyId: family.id,
      styleVariants: true,
      category: family.category,
      label: family.label,
      subtag: family.subtag,
      menuTemplate: Boolean(family.menuTemplate),
      placeholders: first.placeholders,
      optional: first.optional || [],
      replacements: { ...first.replacements },
      prompt: first.prompt,
      aspect: "4:5",
    };
  });
}

export function registerUserPromptStyleVariants(registerFn) {
  for (const family of USER_PROMPT_POSTER_FAMILIES) {
    registerFn(
      family.id,
      family.variants.map((v) => ({
        variantKey: v.key,
        label: v.title,
        gradient: v.gradient,
        prompt: v.prompt,
        placeholders: v.placeholders,
        replacements: { ...v.replacements },
        optional: v.optional || [],
      })),
    );
  }
}
