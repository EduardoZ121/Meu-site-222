/**
 * Marketing social — famílias inspiradas em referências IG (tipografia editorial,
 * produto 3D, automóvel, beleza, retail, gaming, YouTube). Lorem inputs editáveis.
 * Run: node scripts/gen-poster-social-marketing.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const PERSON_REF = `REFERENCE PHOTO (mandatory): Use the uploaded photo as the exact same person — preserve 100% of their face, facial features, skin tone, ethnicity, hair texture and likeness. Seamlessly composite them into this poster like professional photo retouching: unified lighting on face and body, natural skin blend, no floating cutout, no pasted sticker look, no disjointed face layer. Place the subject in the pose/position described below while keeping their real identity. Typography and graphic elements must sit in clear layout zones — never let text overlap, cut through or hide behind the face.

`;

const PRODUCT_REF = `REFERENCE PHOTO (mandatory): Use the uploaded photo as the exact same product — preserve shape, colors, materials, branding, packaging and proportions. Composite it naturally into the poster with matching lighting, perspective, reflections and soft shadows; no floating cutout look. Scale the product hero prominently but keep realistic perspective.

`;

const TYPO_META = `Top metadata row (small caps, clean sans-serif, muted gray): left "{{META_LABEL}}", center "{{BRAND_NAME}}", right "{{CATEGORY_TAG}}".

`;

function slug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function personVariant(title, gradient, placeholders, replacements, optional, body) {
  return {
    key: slug(title),
    title,
    labelKey: `post_style_${slug(title)}`,
    gradient,
    placeholders,
    replacements,
    optional: optional || [],
    productTemplate: false,
    prompt: `${PERSON_REF}${body.trim()}`,
  };
}

function productVariant(title, gradient, placeholders, replacements, optional, body) {
  return {
    key: slug(title),
    title,
    labelKey: `post_style_${slug(title)}`,
    gradient,
    placeholders,
    replacements,
    optional: optional || [],
    productTemplate: true,
    prompt: `${PRODUCT_REF}${body.trim()}`,
  };
}

const LOREM = {
  BRAND_NAME: "LOREM BRAND",
  PRODUCT_NAME: "LOREM PRODUCT",
  MAIN_TITLE: "LOREM IPSUM",
  HEADLINE: "LOREM HEADLINE",
  SUBTITLE: "Dolor sit amet consectetur",
  PRICE: "€49.99",
  PROMO_TEXT: "-30% OFF",
  DISCOUNT: "30% OFF",
  DESCRIPTION: "Lorem ipsum dolor sit amet, editable placeholder copy.",
  CTA: "SHOP NOW",
  CONTACT: "+351 912 345 678",
  PHONE: "+351 912 345 678",
  WEBSITE: "www.lorem.com",
  META_LABEL: "JUNE 2026",
  CATEGORY_TAG: "Marketing",
  MODEL_NAME: "LOREM MODEL X",
  GAME_TITLE: "LOREM QUEST",
  CHANNEL_NAME: "LOREM CHANNEL",
  STREAM_TIME: "LIVE · 8PM",
  EPISODE_TITLE: "Episode 01",
  SIZE_INFO: "S · M · L · XL",
  BENEFIT: "Hydrating · Vegan · Clean",
};

const SOCIAL_MARKETING_FAMILIES = [
  {
    id: "social_typo_hero",
    category: "social",
    label: "SOCIAL TYPO",
    subtag: "6 estilos · Tipografia editorial IG",
    variants: [
      personVariant(
        "Neon Box Hero",
        "linear-gradient(135deg,#E8F5E9 0%,#A7F3D0 55%,#064E3B 100%)",
        ["META_LABEL", "BRAND_NAME", "CATEGORY_TAG", "MAIN_TITLE", "HEADLINE", "SUBTITLE"],
        {
          META_LABEL: LOREM.META_LABEL,
          BRAND_NAME: LOREM.BRAND_NAME,
          CATEGORY_TAG: "Graphic Design",
          MAIN_TITLE: "Social",
          HEADLINE: "fonts collection",
          SUBTITLE: "Editable lorem headline",
        },
        ["SUBTITLE"],
        `${TYPO_META}Vertical Instagram post 4:5, soft pastel sky and editorial field background with subtle surreal atmosphere (original composition, not copied).
Center-right: optional subject from reference photo integrated naturally, calm pose.
Massive bold black sans-serif "{{HEADLINE}}" with soft drop shadow dominates center.
Keyword "{{MAIN_TITLE}}" inside vibrant neon-lime rectangular badge above headline.
Small "{{SUBTITLE}}" tucked under headline tail.
Premium design-education carousel energy, high whitespace, magazine cover hierarchy.`,
      ),
      personVariant(
        "Stacked Impact",
        "linear-gradient(135deg,#0B0B0C 0%,#18181B 50%,#A855F7 100%)",
        ["BRAND_NAME", "MAIN_TITLE", "SUBTITLE", "CTA"],
        {
          BRAND_NAME: LOREM.BRAND_NAME,
          MAIN_TITLE: "LOREM IPSUM",
          SUBTITLE: LOREM.SUBTITLE,
          CTA: LOREM.CTA,
        },
        ["SUBTITLE"],
        `Vertical dark editorial Instagram post 4:5, charcoal textured background with purple accent glow.
${TYPO_META.replace("{{META_LABEL}}", "2026").replace("{{CATEGORY_TAG}}", "Design")}
Left-aligned stacked ultra-bold white condensed type:
"{{MAIN_TITLE}}"
Muted paragraph "{{SUBTITLE}}" below.
Bottom-right pill button "{{CTA}}" in purple gradient.
Subject from reference photo lower-right, rim-lit, typography in clear negative space.`,
      ),
      personVariant(
        "Split Editorial",
        "linear-gradient(135deg,#F4F1EA 0%,#F97316 48%,#0B0B0C 100%)",
        ["MAIN_TITLE", "HEADLINE", "DESCRIPTION", "CTA"],
        {
          MAIN_TITLE: LOREM.MAIN_TITLE,
          HEADLINE: LOREM.HEADLINE,
          DESCRIPTION: LOREM.DESCRIPTION,
          CTA: LOREM.CTA,
        },
        ["DESCRIPTION"],
        `Vertical split-layout Instagram flyer 4:5 inspired by editorial design grids (original layout).
Left 42%: warm orange panel with rotated vertical label "{{MAIN_TITLE}}" in white.
Right: reference subject portrait, studio lighting.
Bottom band: bold "{{HEADLINE}}" black on cream, short copy "{{DESCRIPTION}}", accent CTA "{{CTA}}".
Clean grid lines, Swiss typography, high-end social media template.`,
      ),
      personVariant(
        "Brush Diagonal",
        "linear-gradient(135deg,#020617 0%,#DC2626 52%,#FACC15 100%)",
        ["MAIN_TITLE", "SUBTITLE", "CTA"],
        {
          MAIN_TITLE: LOREM.MAIN_TITLE,
          SUBTITLE: LOREM.SUBTITLE,
          CTA: LOREM.CTA,
        },
        [],
        `Vertical dynamic Instagram post 4:5, diagonal red-to-black gradient band cutting frame.
Brush-display "{{MAIN_TITLE}}" follows diagonal edge in white with red offset shadow.
Subject from reference upper-right triangle, gritty grain texture.
Footer microcopy "{{SUBTITLE}}" and bold CTA strip "{{CTA}}".
Street-meets-editorial, high contrast, original composition.`,
      ),
      personVariant(
        "Minimal Frame",
        "linear-gradient(135deg,#FAFAFA 0%,#D4D4D8 55%,#52525B 100%)",
        ["BRAND_NAME", "MAIN_TITLE", "SUBTITLE"],
        {
          BRAND_NAME: LOREM.BRAND_NAME,
          MAIN_TITLE: LOREM.MAIN_TITLE,
          SUBTITLE: LOREM.SUBTITLE,
        },
        ["SUBTITLE"],
        `Vertical minimalist Instagram post 4:5, off-white paper texture, thin double-line frame inset.
Subject centered smaller (~55% height), soft daylight, reference identity preserved.
Bottom-left elegant serif + sans pairing: "{{MAIN_TITLE}}".
Tiny brand "{{BRAND_NAME}}" top-center, caption "{{SUBTITLE}}" bottom margin.
Gallery poster aesthetic, quiet luxury, abundant negative space.`,
      ),
      personVariant(
        "Carousel Hook",
        "linear-gradient(135deg,#1E1B4B 0%,#6366F1 50%,#EC4899 100%)",
        ["MAIN_TITLE", "HEADLINE", "CTA", "SWIPE_TEXT"],
        {
          MAIN_TITLE: "SWIPE",
          HEADLINE: LOREM.HEADLINE,
          CTA: LOREM.CTA,
          SWIPE_TEXT: "→ More styles inside",
        },
        ["SWIPE_TEXT"],
        `Vertical Instagram carousel cover 4:5, indigo-pink gradient with subtle grain.
Top badge "{{MAIN_TITLE}}" in white outline box.
Center: massive white "{{HEADLINE}}" with subtle 3D extrusion.
Reference subject integrated as supporting visual, not covering text.
Bottom: CTA pill "{{CTA}}" and swipe hint "{{SWIPE_TEXT}}".
Designed for multi-slide educational marketing grids.`,
      ),
    ],
  },
  {
    id: "automotive_showroom",
    category: "automotive",
    label: "AUTO SHOWROOM",
    subtag: "5 estilos · Stand & vendas",
    productTemplate: true,
    variants: [
      productVariant(
        "Luxury Stage",
        "linear-gradient(135deg,#0B0B0C 0%,#1F2937 48%,#CA8A04 100%)",
        ["BRAND_NAME", "MODEL_NAME", "MAIN_TITLE", "PRICE", "PROMO_TEXT", "CTA", "PHONE"],
        {
          BRAND_NAME: LOREM.BRAND_NAME,
          MODEL_NAME: LOREM.MODEL_NAME,
          MAIN_TITLE: "PREMIUM DRIVE",
          PRICE: "€29.900",
          PROMO_TEXT: LOREM.PROMO_TEXT,
          CTA: "BOOK TEST DRIVE",
          PHONE: LOREM.PHONE,
        },
        ["PROMO_TEXT", "PHONE"],
        `Vertical automotive dealership Instagram post 4:5, dark studio with gold accent spotlight and reflective floor.
Reference vehicle hero center, realistic 3D stage pedestal, cinematic rim light.
Top: brand "{{BRAND_NAME}}", model "{{MODEL_NAME}}".
Headline "{{MAIN_TITLE}}" in bold condensed white, circular promo badge "{{PROMO_TEXT}}".
Price tag "{{PRICE}}" and CTA button "{{CTA}}", footer phone "{{PHONE}}".
Luxury car ad layout, never obscure vehicle lines with text.`,
      ),
      productVariant(
        "Neon Night",
        "linear-gradient(135deg,#020617 0%,#0E7490 52%,#22D3EE 100%)",
        ["MAIN_TITLE", "MODEL_NAME", "PRICE", "CTA"],
        {
          MAIN_TITLE: "NIGHT EDITION",
          MODEL_NAME: LOREM.MODEL_NAME,
          PRICE: "€24.500",
          CTA: "RESERVE NOW",
        },
        [],
        `Vertical car promo 4:5, wet asphalt night scene, cyan neon reflections, urban skyline bokeh.
Reference car angled three-quarter front, headlights on, dramatic mood.
Stacked neon typography "{{MAIN_TITLE}}", model "{{MODEL_NAME}}", price "{{PRICE}}", CTA "{{CTA}}".
High-end automotive Instagram sales creative.`,
      ),
      productVariant(
        "Showroom Clean",
        "linear-gradient(135deg,#F4F1EA 0%,#E5E7EB 55%,#6B7280 100%)",
        ["BRAND_NAME", "MAIN_TITLE", "DESCRIPTION", "PRICE", "CONTACT"],
        {
          BRAND_NAME: LOREM.BRAND_NAME,
          MAIN_TITLE: LOREM.MAIN_TITLE,
          DESCRIPTION: LOREM.DESCRIPTION,
          PRICE: LOREM.PRICE,
          CONTACT: LOREM.CONTACT,
        },
        ["DESCRIPTION"],
        `Vertical clean showroom flyer 4:5, bright white studio, soft shadows.
Reference car centered on circular platform, minimal Scandinavian layout.
Brand "{{BRAND_NAME}}", headline "{{MAIN_TITLE}}", short copy "{{DESCRIPTION}}".
Price "{{PRICE}}" in accent box, contact line "{{CONTACT}}" footer.`,
      ),
      productVariant(
        "Racing Strip",
        "linear-gradient(135deg,#450A0A 0%,#DC2626 55%,#0B0B0C 100%)",
        ["MAIN_TITLE", "MODEL_NAME", "PROMO_TEXT", "CTA"],
        {
          MAIN_TITLE: "PERFORMANCE",
          MODEL_NAME: LOREM.MODEL_NAME,
          PROMO_TEXT: "0% APR",
          CTA: LOREM.CTA,
        },
        [],
        `Vertical sporty car ad 4:5, diagonal racing stripes, motion blur background.
Reference vehicle dynamic angle, red/black palette, aggressive sans headline "{{MAIN_TITLE}}".
Model "{{MODEL_NAME}}", promo ribbon "{{PROMO_TEXT}}", CTA "{{CTA}}".`,
      ),
      productVariant(
        "SUV Family",
        "linear-gradient(135deg,#14532D 0%,#22C55E 52%,#F4F1EA 100%)",
        ["MAIN_TITLE", "SUBTITLE", "PRICE", "PHONE", "WEBSITE"],
        {
          MAIN_TITLE: "FAMILY READY",
          SUBTITLE: LOREM.SUBTITLE,
          PRICE: "from €19.990",
          PHONE: LOREM.PHONE,
          WEBSITE: LOREM.WEBSITE,
        },
        [],
        `Vertical family SUV Instagram post 4:5, outdoor golden-hour road, green lifestyle palette.
Reference SUV hero with natural environment, warm friendly typography "{{MAIN_TITLE}}".
Subtitle "{{SUBTITLE}}", price "{{PRICE}}", contact row phone + web footer.`,
      ),
    ],
  },
  {
    id: "beauty_glow",
    category: "beauty",
    label: "BEAUTY & SKIN",
    subtag: "6 estilos · Cosmética & skincare",
    variants: [
      productVariant(
        "Serum Float 3D",
        "linear-gradient(135deg,#FDF2F8 0%,#F9A8D4 52%,#831843 100%)",
        ["BRAND_NAME", "PRODUCT_NAME", "MAIN_TITLE", "BENEFIT", "PRICE", "CTA"],
        {
          BRAND_NAME: LOREM.BRAND_NAME,
          PRODUCT_NAME: "LOREM SERUM",
          MAIN_TITLE: "GLOW SKIN",
          BENEFIT: LOREM.BENEFIT,
          PRICE: LOREM.PRICE,
          CTA: LOREM.CTA,
        },
        ["BENEFIT"],
        `Vertical beauty product Instagram post 4:5, soft pink gradient, floating 3D pedestal with subtle shadow.
Reference product bottle hero center, glass reflections, dewy highlights.
Brand "{{BRAND_NAME}}", product "{{PRODUCT_NAME}}", headline "{{MAIN_TITLE}}".
Benefit chips "{{BENEFIT}}", price "{{PRICE}}", CTA pill "{{CTA}}".
Premium cosmetics e-commerce aesthetic.`,
      ),
      personVariant(
        "Model Glow",
        "linear-gradient(135deg,#FFF7ED 0%,#FDBA74 55%,#9A3412 100%)",
        ["BRAND_NAME", "MAIN_TITLE", "SUBTITLE", "PRICE", "CTA"],
        {
          BRAND_NAME: LOREM.BRAND_NAME,
          MAIN_TITLE: "RADIANT YOU",
          SUBTITLE: LOREM.SUBTITLE,
          PRICE: LOREM.PRICE,
          CTA: LOREM.CTA,
        },
        [],
        `Vertical beauty campaign 4:5, warm peach tones, soft studio beauty lighting.
Reference model portrait holding product area (product can be stylized generic if no second photo).
Headline "{{MAIN_TITLE}}" elegant serif, brand "{{BRAND_NAME}}", subtitle "{{SUBTITLE}}".
Price "{{PRICE}}", CTA "{{CTA}}". Clean feminine editorial layout, text clear of face.`,
      ),
      productVariant(
        "Pastel Drop",
        "linear-gradient(135deg,#E0E7FF 0%,#C4B5FD 50%,#F5D0FE 100%)",
        ["PRODUCT_NAME", "MAIN_TITLE", "PROMO_TEXT", "CTA"],
        {
          PRODUCT_NAME: LOREM.PRODUCT_NAME,
          MAIN_TITLE: "NEW DROP",
          PROMO_TEXT: LOREM.PROMO_TEXT,
          CTA: "GET YOURS",
        },
        [],
        `Vertical pastel beauty launch 4:5, lilac-lavender gradient, geometric shapes.
Reference product with 3D soft shadow, bold stacked "{{MAIN_TITLE}}", name "{{PRODUCT_NAME}}".
Promo sticker "{{PROMO_TEXT}}", CTA "{{CTA}}".`,
      ),
      productVariant(
        "Spa Minimal",
        "linear-gradient(135deg,#ECFDF5 0%,#6EE7B7 55%,#065F46 100%)",
        ["BRAND_NAME", "MAIN_TITLE", "DESCRIPTION", "PRICE"],
        {
          BRAND_NAME: LOREM.BRAND_NAME,
          MAIN_TITLE: "PURE CARE",
          DESCRIPTION: LOREM.DESCRIPTION,
          PRICE: LOREM.PRICE,
        },
        ["DESCRIPTION"],
        `Vertical spa skincare post 4:5, mint green minimal, lots of whitespace.
Reference product line hero, thin typography, brand "{{BRAND_NAME}}", title "{{MAIN_TITLE}}".
Description "{{DESCRIPTION}}", price "{{PRICE}}".`,
      ),
      personVariant(
        "Before After",
        "linear-gradient(135deg,#0B0B0C 0%,#374151 50%,#F472B6 100%)",
        ["MAIN_TITLE", "BEFORE_LABEL", "AFTER_LABEL", "CTA"],
        {
          MAIN_TITLE: "REAL RESULTS",
          BEFORE_LABEL: "BEFORE",
          AFTER_LABEL: "AFTER",
          CTA: LOREM.CTA,
        },
        [],
        `Vertical beauty before/after Instagram post 4:5, split panel layout.
Reference person integrated in dual panels with labels "{{BEFORE_LABEL}}" and "{{AFTER_LABEL}}".
Center headline "{{MAIN_TITLE}}", bottom CTA "{{CTA}}". Clear typography hierarchy.`,
      ),
      productVariant(
        "Luxury Gold",
        "linear-gradient(135deg,#0B0B0C 0%,#78350F 48%,#FACC15 100%)",
        ["BRAND_NAME", "PRODUCT_NAME", "MAIN_TITLE", "PRICE", "CTA"],
        {
          BRAND_NAME: LOREM.BRAND_NAME,
          PRODUCT_NAME: LOREM.PRODUCT_NAME,
          MAIN_TITLE: "LUXE FORMULA",
          PRICE: "€89.00",
          CTA: "DISCOVER",
        },
        [],
        `Vertical luxury cosmetics 4:5, black and gold, marble texture hints.
Reference product on gold pedestal with 3D depth, brand "{{BRAND_NAME}}", name "{{PRODUCT_NAME}}".
Headline "{{MAIN_TITLE}}", price "{{PRICE}}", gold CTA "{{CTA}}".`,
      ),
    ],
  },
  {
    id: "retail_product_3d",
    category: "retail",
    label: "RETAIL 3D",
    subtag: "6 estilos · Produto & e-commerce",
    productTemplate: true,
    variants: [
      productVariant(
        "Hero Pedestal",
        "linear-gradient(135deg,#EFF6FF 0%,#3B82F6 52%,#1E3A8A 100%)",
        ["BRAND_NAME", "PRODUCT_NAME", "MAIN_TITLE", "PRICE", "DISCOUNT", "CTA"],
        {
          BRAND_NAME: LOREM.BRAND_NAME,
          PRODUCT_NAME: LOREM.PRODUCT_NAME,
          MAIN_TITLE: LOREM.MAIN_TITLE,
          PRICE: LOREM.PRICE,
          DISCOUNT: LOREM.DISCOUNT,
          CTA: LOREM.CTA,
        },
        ["DISCOUNT"],
        `Vertical e-commerce Instagram post 4:5, blue studio gradient, product on white 3D cylinder pedestal with soft shadow.
Reference product hero center, realistic lighting and reflection.
Brand "{{BRAND_NAME}}", name "{{PRODUCT_NAME}}", headline "{{MAIN_TITLE}}".
Price "{{PRICE}}", discount badge "{{DISCOUNT}}", CTA "{{CTA}}".`,
      ),
      productVariant(
        "Flash Sale",
        "linear-gradient(135deg,#450A0A 0%,#EF4444 55%,#FACC15 100%)",
        ["MAIN_TITLE", "PROMO_TEXT", "PRICE", "CTA", "CONTACT"],
        {
          MAIN_TITLE: "FLASH SALE",
          PROMO_TEXT: "48H ONLY",
          PRICE: LOREM.PRICE,
          CTA: LOREM.CTA,
          CONTACT: LOREM.CONTACT,
        },
        [],
        `Vertical retail promo 4:5, urgent red-yellow energy, burst shapes.
Reference product angled dynamic, massive "{{MAIN_TITLE}}", timer feel "{{PROMO_TEXT}}".
Price "{{PRICE}}", CTA "{{CTA}}", WhatsApp/contact "{{CONTACT}}".`,
      ),
      productVariant(
        "Catalog Grid",
        "linear-gradient(135deg,#F4F1EA 0%,#D6D3D1 55%,#57534E 100%)",
        ["BRAND_NAME", "MAIN_TITLE", "DESCRIPTION", "PRICE", "WEBSITE"],
        {
          BRAND_NAME: LOREM.BRAND_NAME,
          MAIN_TITLE: LOREM.MAIN_TITLE,
          DESCRIPTION: LOREM.DESCRIPTION,
          PRICE: LOREM.PRICE,
          WEBSITE: LOREM.WEBSITE,
        },
        ["DESCRIPTION"],
        `Vertical catalog-style product post 4:5, neutral paper background, thin grid lines.
Reference product large with spec-style labels, brand "{{BRAND_NAME}}", title "{{MAIN_TITLE}}".
Copy "{{DESCRIPTION}}", price "{{PRICE}}", web "{{WEBSITE}}".`,
      ),
      productVariant(
        "Neon Tech",
        "linear-gradient(135deg,#020617 0%,#7C3AED 48%,#06B6D4 100%)",
        ["PRODUCT_NAME", "MAIN_TITLE", "SUBTITLE", "PRICE", "CTA"],
        {
          PRODUCT_NAME: LOREM.PRODUCT_NAME,
          MAIN_TITLE: "NEXT GEN",
          SUBTITLE: LOREM.SUBTITLE,
          PRICE: LOREM.PRICE,
          CTA: LOREM.CTA,
        },
        [],
        `Vertical tech product ad 4:5, dark purple-cyan neon glow, holographic accents.
Reference gadget/product with 3D levitation effect, name "{{PRODUCT_NAME}}".
Headline "{{MAIN_TITLE}}", subtitle "{{SUBTITLE}}", price "{{PRICE}}", CTA "{{CTA}}".`,
      ),
      productVariant(
        "Bundle Offer",
        "linear-gradient(135deg,#14532D 0%,#84CC16 52%,#ECFCCB 100%)",
        ["MAIN_TITLE", "PROMO_TEXT", "PRICE", "CTA"],
        {
          MAIN_TITLE: "BUNDLE DEAL",
          PROMO_TEXT: "3 FOR 2",
          PRICE: "€39.99",
          CTA: LOREM.CTA,
        },
        [],
        `Vertical bundle promo 4:5, fresh green lifestyle palette.
Reference product group composition (same product repeated artistically if single photo).
Headline "{{MAIN_TITLE}}", offer "{{PROMO_TEXT}}", price "{{PRICE}}", CTA "{{CTA}}".`,
      ),
      productVariant(
        "Premium Unbox",
        "linear-gradient(135deg,#0B0B0C 0%,#27272A 50%,#A855F7 100%)",
        ["BRAND_NAME", "PRODUCT_NAME", "MAIN_TITLE", "DESCRIPTION", "CTA"],
        {
          BRAND_NAME: LOREM.BRAND_NAME,
          PRODUCT_NAME: LOREM.PRODUCT_NAME,
          MAIN_TITLE: "UNBOX PREMIUM",
          DESCRIPTION: LOREM.DESCRIPTION,
          CTA: LOREM.CTA,
        },
        ["DESCRIPTION"],
        `Vertical unboxing aesthetic 4:5, dark premium with purple accent light.
Reference product emerging from stylized box/pedestal 3D scene.
Brand "{{BRAND_NAME}}", product "{{PRODUCT_NAME}}", title "{{MAIN_TITLE}}".
Copy "{{DESCRIPTION}}", CTA "{{CTA}}".`,
      ),
    ],
  },
  {
    id: "fashion_ig_shop",
    category: "fashion",
    label: "FASHION IG SHOP",
    subtag: "5 estilos · Venda no Instagram",
    variants: [
      personVariant(
        "Drop Alert",
        "linear-gradient(135deg,#0B0B0C 0%,#BE185D 52%,#F472B6 100%)",
        ["BRAND_NAME", "MAIN_TITLE", "PRICE", "SIZE_INFO", "CTA", "CONTACT"],
        {
          BRAND_NAME: LOREM.BRAND_NAME,
          MAIN_TITLE: "NEW DROP",
          PRICE: LOREM.PRICE,
          SIZE_INFO: LOREM.SIZE_INFO,
          CTA: "DM TO ORDER",
          CONTACT: LOREM.CONTACT,
        },
        ["SIZE_INFO", "CONTACT"],
        `Vertical Instagram fashion sale post 4:5, hot pink on black, streetwear energy.
Reference model full outfit from photo, confident pose, unified lighting.
Brand "{{BRAND_NAME}}", headline "{{MAIN_TITLE}}", price tag "{{PRICE}}".
Size row "{{SIZE_INFO}}", CTA "{{CTA}}", contact "{{CONTACT}}". Text never covers face.`,
      ),
      personVariant(
        "Lookbook Clean",
        "linear-gradient(135deg,#FAFAFA 0%,#E7E5E4 55%,#78716C 100%)",
        ["BRAND_NAME", "MAIN_TITLE", "SUBTITLE", "PRICE", "CTA"],
        {
          BRAND_NAME: LOREM.BRAND_NAME,
          MAIN_TITLE: "SUMMER EDIT",
          SUBTITLE: LOREM.SUBTITLE,
          PRICE: "€59",
          CTA: "SHOP LINK IN BIO",
        },
        [],
        `Vertical lookbook 4:5, neutral studio, soft shadows, editorial fashion spacing.
Reference model centered, outfit from photo, minimal serif headline "{{MAIN_TITLE}}".
Brand "{{BRAND_NAME}}", subtitle "{{SUBTITLE}}", price "{{PRICE}}", CTA "{{CTA}}".`,
      ),
      personVariant(
        "Sale Strip",
        "linear-gradient(135deg,#1C1917 0%,#EF4444 50%,#FACC15 100%)",
        ["MAIN_TITLE", "PROMO_TEXT", "PRICE", "CTA"],
        {
          MAIN_TITLE: "OUTLET",
          PROMO_TEXT: LOREM.PROMO_TEXT,
          PRICE: "from €29",
          CTA: LOREM.CTA,
        },
        [],
        `Vertical fashion outlet post 4:5, red sale stripe across middle, bold typography "{{MAIN_TITLE}}".
Reference model dynamic pose, promo "{{PROMO_TEXT}}", price "{{PRICE}}", CTA "{{CTA}}".`,
      ),
      personVariant(
        "Boutique Lux",
        "linear-gradient(135deg,#0B0B0C 0%,#44403C 48%,#D6D3D1 100%)",
        ["BRAND_NAME", "MAIN_TITLE", "DESCRIPTION", "PRICE", "WEBSITE"],
        {
          BRAND_NAME: LOREM.BRAND_NAME,
          MAIN_TITLE: "BOUTIQUE",
          DESCRIPTION: LOREM.DESCRIPTION,
          PRICE: LOREM.PRICE,
          WEBSITE: LOREM.WEBSITE,
        },
        ["DESCRIPTION"],
        `Vertical luxury boutique 4:5, marble and gold accents, elegant spacing.
Reference model high-fashion pose, brand "{{BRAND_NAME}}", title "{{MAIN_TITLE}}".
Description "{{DESCRIPTION}}", price "{{PRICE}}", web footer "{{WEBSITE}}".`,
      ),
      personVariant(
        "Street Drop",
        "linear-gradient(135deg,#022C22 0%,#14B8A6 52%,#FDE047 100%)",
        ["MAIN_TITLE", "HEADLINE", "PRICE", "CTA"],
        {
          MAIN_TITLE: "STREET",
          HEADLINE: "COLLECTION",
          PRICE: LOREM.PRICE,
          CTA: "ORDER VIA IG",
        },
        [],
        `Vertical streetwear IG sale 4:5, teal-yellow urban gradient, graffiti texture hints.
Reference model street pose, stacked "{{MAIN_TITLE}}" + "{{HEADLINE}}", price "{{PRICE}}", CTA "{{CTA}}".`,
      ),
    ],
  },
  {
    id: "gaming_stream",
    category: "gaming",
    label: "GAMING & STREAM",
    subtag: "5 estilos · Gameplay & live",
    variants: [
      personVariant(
        "RGB Live",
        "linear-gradient(135deg,#020617 0%,#7C3AED 48%,#22D3EE 100%)",
        ["CHANNEL_NAME", "MAIN_TITLE", "GAME_TITLE", "STREAM_TIME", "CTA"],
        {
          CHANNEL_NAME: LOREM.CHANNEL_NAME,
          MAIN_TITLE: "LIVE NOW",
          GAME_TITLE: LOREM.GAME_TITLE,
          STREAM_TIME: LOREM.STREAM_TIME,
          CTA: "WATCH LIVE",
        },
        [],
        `Vertical gaming stream promo 4:5, RGB purple-cyan glow, esports energy.
Reference streamer portrait with headset integrated naturally, gameplay UI frame hints in background (generic, no copyrighted game logos).
Channel "{{CHANNEL_NAME}}", headline "{{MAIN_TITLE}}", game "{{GAME_TITLE}}".
Schedule "{{STREAM_TIME}}", CTA "{{CTA}}". Text clear of face.`,
      ),
      personVariant(
        "Tournament",
        "linear-gradient(135deg,#450A0A 0%,#DC2626 55%,#0B0B0C 100%)",
        ["MAIN_TITLE", "GAME_TITLE", "PRICE", "CTA"],
        {
          MAIN_TITLE: "GRAND FINAL",
          GAME_TITLE: LOREM.GAME_TITLE,
          PRICE: "€500 PRIZE",
          CTA: "REGISTER",
        },
        [],
        `Vertical esports tournament flyer 4:5, red/black aggressive layout, diagonal shapes.
Reference player hero pose, title "{{MAIN_TITLE}}", game "{{GAME_TITLE}}".
Prize "{{PRICE}}", CTA "{{CTA}}".`,
      ),
      personVariant(
        "Clip Highlight",
        "linear-gradient(135deg,#0B0B0C 0%,#059669 52%,#34D399 100%)",
        ["CHANNEL_NAME", "MAIN_TITLE", "SUBTITLE", "CTA"],
        {
          CHANNEL_NAME: LOREM.CHANNEL_NAME,
          MAIN_TITLE: "EPIC CLIP",
          SUBTITLE: LOREM.SUBTITLE,
          CTA: "FULL VIDEO",
        },
        [],
        `Vertical gameplay highlight post 4:5, green gaming HUD accents, dark background.
Reference creator reaction portrait, headline "{{MAIN_TITLE}}", channel "{{CHANNEL_NAME}}".
Subtitle "{{SUBTITLE}}", CTA "{{CTA}}".`,
      ),
      personVariant(
        "Neon Squad",
        "linear-gradient(135deg,#1E1B4B 0%,#DB2777 50%,#06B6D4 100%)",
        ["MAIN_TITLE", "GAME_TITLE", "STREAM_TIME", "CTA"],
        {
          MAIN_TITLE: "SQUAD UP",
          GAME_TITLE: LOREM.GAME_TITLE,
          STREAM_TIME: LOREM.STREAM_TIME,
          CTA: "JOIN DISCORD",
        },
        [],
        `Vertical squad gaming post 4:5, synthwave gradient, neon grid floor.
Reference gamer portrait, title "{{MAIN_TITLE}}", game "{{GAME_TITLE}}".
Time "{{STREAM_TIME}}", CTA "{{CTA}}".`,
      ),
      personVariant(
        "New Season",
        "linear-gradient(135deg,#422006 0%,#F59E0B 52%,#78350F 100%)",
        ["MAIN_TITLE", "HEADLINE", "CTA"],
        {
          MAIN_TITLE: "SEASON",
          HEADLINE: "LAUNCH DAY",
          CTA: "PLAY NOW",
        },
        [],
        `Vertical game season launch 4:5, amber epic fantasy energy, particle effects.
Reference character-inspired portrait from user photo stylized as gamer avatar.
Stacked "{{MAIN_TITLE}}" + "{{HEADLINE}}", CTA "{{CTA}}".`,
      ),
    ],
  },
  {
    id: "youtube_creator",
    category: "youtube",
    label: "YOUTUBE",
    subtag: "5 estilos · Thumbnail & promo",
    variants: [
      personVariant(
        "Bold Thumbnail",
        "linear-gradient(135deg,#0B0B0C 0%,#DC2626 48%,#FACC15 100%)",
        ["CHANNEL_NAME", "MAIN_TITLE", "EPISODE_TITLE", "CTA"],
        {
          CHANNEL_NAME: LOREM.CHANNEL_NAME,
          MAIN_TITLE: LOREM.MAIN_TITLE,
          EPISODE_TITLE: LOREM.EPISODE_TITLE,
          CTA: "WATCH NOW",
        },
        [],
        `Vertical YouTube promo 4:5 styled like high-CTR thumbnail layout (original, not copying any channel).
Reference creator expressive face large right, bold outlined text left: "{{MAIN_TITLE}}".
Channel "{{CHANNEL_NAME}}", episode "{{EPISODE_TITLE}}", red subscribe-style CTA "{{CTA}}".
High contrast, thick strokes, clear readable hierarchy.`,
      ),
      personVariant(
        "Clean Upload",
        "linear-gradient(135deg,#F4F1EA 0%,#3B82F6 52%,#1D4ED8 100%)",
        ["MAIN_TITLE", "SUBTITLE", "CTA"],
        {
          MAIN_TITLE: "NEW VIDEO",
          SUBTITLE: LOREM.SUBTITLE,
          CTA: "SUBSCRIBE",
        },
        [],
        `Vertical YouTube announcement 4:5, clean blue-white, play button motif.
Reference creator portrait, headline "{{MAIN_TITLE}}", subtitle "{{SUBTITLE}}", CTA "{{CTA}}".`,
      ),
      personVariant(
        "Podcast Frame",
        "linear-gradient(135deg,#18181B 0%,#52525B 50%,#A855F7 100%)",
        ["CHANNEL_NAME", "MAIN_TITLE", "EPISODE_TITLE", "DESCRIPTION"],
        {
          CHANNEL_NAME: LOREM.CHANNEL_NAME,
          MAIN_TITLE: "PODCAST",
          EPISODE_TITLE: LOREM.EPISODE_TITLE,
          DESCRIPTION: LOREM.DESCRIPTION,
        },
        ["DESCRIPTION"],
        `Vertical podcast/YouTube hybrid 4:5, dark studio mic aesthetic, purple accent.
Reference host portrait with mic silhouette, channel "{{CHANNEL_NAME}}".
Title "{{MAIN_TITLE}}", episode "{{EPISODE_TITLE}}", blurb "{{DESCRIPTION}}".`,
      ),
      personVariant(
        "Tutorial Hook",
        "linear-gradient(135deg,#ECFDF5 0%,#10B981 55%,#064E3B 100%)",
        ["MAIN_TITLE", "HEADLINE", "CTA"],
        {
          MAIN_TITLE: "HOW TO",
          HEADLINE: LOREM.HEADLINE,
          CTA: "LINK IN DESCRIPTION",
        },
        [],
        `Vertical tutorial promo 4:5, green educational palette, step-number graphic hints.
Reference creator pointing gesture, big "{{MAIN_TITLE}}" + "{{HEADLINE}}", CTA "{{CTA}}".`,
      ),
      personVariant(
        "Vlog Day",
        "linear-gradient(135deg,#FEF3C7 0%,#FB923C 55%,#7C2D12 100%)",
        ["CHANNEL_NAME", "MAIN_TITLE", "SUBTITLE", "CTA"],
        {
          CHANNEL_NAME: LOREM.CHANNEL_NAME,
          MAIN_TITLE: "VLOG",
          SUBTITLE: LOREM.SUBTITLE,
          CTA: "NEW UPLOAD",
        },
        [],
        `Vertical vlog announcement 4:5, warm travel vlog colors, film frame overlays.
Reference creator casual portrait, channel "{{CHANNEL_NAME}}", title "{{MAIN_TITLE}}".
Subtitle "{{SUBTITLE}}", CTA "{{CTA}}".`,
      ),
    ],
  },
  {
    id: "promo_flyer_3d",
    category: "flyers",
    label: "PROMO 3D",
    subtag: "6 estilos · Flyers multi-nicho",
    variants: [
      productVariant(
        "3D Explosion",
        "linear-gradient(135deg,#020617 0%,#F97316 52%,#FACC15 100%)",
        ["BRAND_NAME", "MAIN_TITLE", "PROMO_TEXT", "PRICE", "CTA", "CONTACT"],
        {
          BRAND_NAME: LOREM.BRAND_NAME,
          MAIN_TITLE: LOREM.MAIN_TITLE,
          PROMO_TEXT: LOREM.PROMO_TEXT,
          PRICE: LOREM.PRICE,
          CTA: LOREM.CTA,
          CONTACT: LOREM.CONTACT,
        },
        ["CONTACT"],
        `Vertical promotional flyer 4:5 with 3D extruded typography and floating geometric shapes.
Reference product hero on stylized 3D platform, dynamic orange-yellow energy.
Brand "{{BRAND_NAME}}", headline "{{MAIN_TITLE}}", promo "{{PROMO_TEXT}}".
Price "{{PRICE}}", CTA "{{CTA}}", contact "{{CONTACT}}". Original layout inspired by high-end IG design grids.`,
      ),
      productVariant(
        "Glass Morph",
        "linear-gradient(135deg,#1E1B4B 0%,#6366F1 50%,#EC4899 100%)",
        ["MAIN_TITLE", "SUBTITLE", "PRICE", "CTA"],
        {
          MAIN_TITLE: LOREM.MAIN_TITLE,
          SUBTITLE: LOREM.SUBTITLE,
          PRICE: LOREM.PRICE,
          CTA: LOREM.CTA,
        },
        [],
        `Vertical glassmorphism promo 4:5, frosted panels, soft 3D depth, iridescent gradient.
Reference product behind glass card UI, headline "{{MAIN_TITLE}}", subtitle "{{SUBTITLE}}".
Price "{{PRICE}}", CTA "{{CTA}}".`,
      ),
      personVariant(
        "Service Pro",
        "linear-gradient(135deg,#0B0B0C 0%,#1F2937 48%,#CA8A04 100%)",
        ["BRAND_NAME", "MAIN_TITLE", "DESCRIPTION", "PHONE", "WEBSITE", "CTA"],
        {
          BRAND_NAME: LOREM.BRAND_NAME,
          MAIN_TITLE: LOREM.MAIN_TITLE,
          DESCRIPTION: LOREM.DESCRIPTION,
          PHONE: LOREM.PHONE,
          WEBSITE: LOREM.WEBSITE,
          CTA: LOREM.CTA,
        },
        ["DESCRIPTION"],
        `Vertical professional service flyer 4:5, dark gold business aesthetic.
Reference person professional portrait, brand "{{BRAND_NAME}}", title "{{MAIN_TITLE}}".
Description "{{DESCRIPTION}}", phone "{{PHONE}}", web "{{WEBSITE}}", CTA "{{CTA}}".`,
      ),
      productVariant(
        "Pop Sale",
        "linear-gradient(135deg,#FDF2F8 0%,#EC4899 52%,#BE185D 100%)",
        ["MAIN_TITLE", "DISCOUNT", "PRICE", "CTA"],
        {
          MAIN_TITLE: "MEGA SALE",
          DISCOUNT: LOREM.DISCOUNT,
          PRICE: LOREM.PRICE,
          CTA: LOREM.CTA,
        },
        [],
        `Vertical pop-art sale flyer 4:5, pink halftone dots, 3D star bursts.
Reference product center, headline "{{MAIN_TITLE}}", discount "{{DISCOUNT}}".
Price "{{PRICE}}", CTA "{{CTA}}".`,
      ),
      personVariant(
        "Event Night",
        "linear-gradient(135deg,#020617 0%,#7C3AED 48%,#EC4899 100%)",
        ["MAIN_TITLE", "SUBTITLE", "DATE", "CTA", "CONTACT"],
        {
          MAIN_TITLE: "EVENT NIGHT",
          SUBTITLE: LOREM.SUBTITLE,
          DATE: "SAT · 21 JUN",
          CTA: "GET TICKETS",
          CONTACT: LOREM.CONTACT,
        },
        [],
        `Vertical event promo 4:5, neon club gradient, 3D light streaks.
Reference host/DJ portrait, title "{{MAIN_TITLE}}", subtitle "{{SUBTITLE}}".
Date "{{DATE}}", CTA "{{CTA}}", contact "{{CONTACT}}".`,
      ),
      productVariant(
        "Editorial Product",
        "linear-gradient(135deg,#FAFAFA 0%,#A8A29E 55%,#292524 100%)",
        ["BRAND_NAME", "PRODUCT_NAME", "MAIN_TITLE", "DESCRIPTION", "PRICE"],
        {
          BRAND_NAME: LOREM.BRAND_NAME,
          PRODUCT_NAME: LOREM.PRODUCT_NAME,
          MAIN_TITLE: LOREM.MAIN_TITLE,
          DESCRIPTION: LOREM.DESCRIPTION,
          PRICE: LOREM.PRICE,
        },
        ["DESCRIPTION"],
        `Vertical editorial product story 4:5, magazine layout, stone neutral palette.
Reference product artistic still life with subtle 3D shadow layers.
Brand "{{BRAND_NAME}}", product "{{PRODUCT_NAME}}", headline "{{MAIN_TITLE}}".
Copy "{{DESCRIPTION}}", price "{{PRICE}}".`,
      ),
    ],
  },
];

function buildSocialMarketingTemplates() {
  return SOCIAL_MARKETING_FAMILIES.map((family) => {
    const first = family.variants[0];
    return {
      id: family.id,
      source_id: family.id,
      familyId: family.id,
      styleVariants: true,
      category: family.category,
      label: family.label,
      subtag: family.subtag,
      productTemplate: Boolean(family.productTemplate || first.productTemplate),
      placeholders: first.placeholders,
      optional: first.optional || [],
      replacements: { ...first.replacements },
      prompt: first.prompt,
      aspect: "4:5",
    };
  });
}

const jsOut = `/**
 * Marketing social — nichos IG (auto, beauty, retail, gaming, YouTube, tipografia).
 * AUTO-GENERATED — edit scripts/gen-poster-social-marketing.mjs and re-run.
 */
export const SOCIAL_MARKETING_FAMILIES = ${JSON.stringify(SOCIAL_MARKETING_FAMILIES, null, 2)};

export function buildSocialMarketingTemplates() {
  return SOCIAL_MARKETING_FAMILIES.map((family) => {
    const first = family.variants[0];
    return {
      id: family.id,
      source_id: family.id,
      familyId: family.id,
      styleVariants: true,
      category: family.category,
      label: family.label,
      subtag: family.subtag,
      productTemplate: Boolean(family.productTemplate || first.productTemplate),
      placeholders: first.placeholders,
      optional: first.optional || [],
      replacements: { ...first.replacements },
      prompt: first.prompt,
      aspect: "4:5",
    };
  });
}

export function registerSocialMarketingStyleVariants(registerFn) {
  for (const family of SOCIAL_MARKETING_FAMILIES) {
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
        productTemplate: Boolean(v.productTemplate),
      })),
    );
  }
}
`;

fs.writeFileSync(path.join(root, "src/lib/posterSocialMarketingFamilies.js"), jsOut);
fs.writeFileSync(
  path.join(root, "api/lib/posterSocialMarketingTemplatesData.json"),
  JSON.stringify(buildSocialMarketingTemplates(), null, 2),
);
console.log(
  `Generated posterSocialMarketingFamilies.js (${SOCIAL_MARKETING_FAMILIES.length} families, ${SOCIAL_MARKETING_FAMILIES.reduce((n, f) => n + f.variants.length, 0)} variants)`,
);
