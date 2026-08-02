const TIA_ANY_BRAND_RULES = `REFERENCE IMAGES (Tia Any Fast Food):
Image "logo" is the official Tia Any Fast Food logo. Use only this logo and preserve its orange/white/black identity.
Image "uniform" is the official black polo uniform. Whenever an employee appears, they must wear this black polo with the embroidered Tia Any logo on the left chest.
User upload 1 may be a person or food. If it is a person, preserve exact identity. If it is food, preserve the exact dish.
User upload 2, when present, is the featured food reference. Preserve ingredients, colors, textures, sauces, cooking style, shape, plating, garnishes and all visible details.
Never add QR codes, barcodes, watermarks, AI signatures, random logos or unrelated branding. Official Tia Any branding only.`;

function prompt(body) {
  return `${TIA_ANY_BRAND_RULES}\n\n${body}`;
}

const COMMON_PLACEHOLDERS = [
  "MAIN_TITLE",
  "SUBTITLE",
  "CTA_TEXT",
  "PHONE",
  "INSTAGRAM",
  "PRICE",
];

const COMMON_OPTIONAL = ["SUBTITLE", "PHONE", "INSTAGRAM", "PRICE"];

const INFO_PLACEHOLDERS = ["MAIN_TITLE", "SECTION_1", "SECTION_2", "SECTION_3", "SECTION_4", "PHONE", "INSTAGRAM"];
const INFO_OPTIONAL = ["SECTION_1", "SECTION_2", "SECTION_3", "SECTION_4", "PHONE", "INSTAGRAM"];

export const TIA_ANY_POSTER_FAMILIES = [
  {
    id: "tia_any_fast_food",
    category: "tia_any",
    label: "TIA ANY FAST FOOD",
    subtag: "Restaurante exclusivo · 40 estilos",
    variants: [
      {
        key: "hero_food_explosion",
        title: "Hero Food Explosion",
        gradient: "linear-gradient(135deg,#050505 0%,#F58220 52%,#FDE68A 100%)",
        placeholders: [...COMMON_PLACEHOLDERS, "FEATURE_1", "FEATURE_2", "FEATURE_3"],
        optional: [...COMMON_OPTIONAL, "FEATURE_1", "FEATURE_2", "FEATURE_3"],
        replacements: {
          MAIN_TITLE: "SABOR QUE VICIA!",
          SUBTITLE: "Ingredientes frescos, textura irresistível e aquele toque Tia Any.",
          CTA_TEXT: "PEÇA JÁ O SEU!",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
          PRICE: "Preço",
          FEATURE_1: "Carne Premium",
          FEATURE_2: "Ingredientes Frescos",
          FEATURE_3: "Preparado na Hora",
        },
        prompt: prompt(`Premium luxury restaurant commercial poster, hero food explosion.
The featured food occupies about 70% of the composition on the lower-right in impressive close-up perspective. Left side clean for typography.
Realistic floating ingredients around the food: tomato slices, purple onion rings, lettuce, sesame seeds, sauce splashes, cheese drips, herbs, spices, orange particles, steam and crumbs frozen in motion with realistic physics.
Premium matte black textured background, large artistic orange paint stroke crossing upper-right, warm cinematic lighting, soft vignette.
Include official Tia Any logo, small branded flag inserted naturally into the food, contact section, Instagram placeholder, phone placeholder and price placeholder.
Main headline "{{MAIN_TITLE}}"; subtitle "{{SUBTITLE}}"; feature list "{{FEATURE_1}}", "{{FEATURE_2}}", "{{FEATURE_3}}"; CTA "{{CTA_TEXT}}"; phone "{{PHONE}}"; Instagram "{{INSTAGRAM}}"; price "{{PRICE}}".
Ultra photorealistic commercial food photography, luxury restaurant advertising, perfect typography layout, 8K, advertising agency quality.`),
      },
      {
        key: "minimal_orange_hero",
        title: "Minimal Orange Hero",
        gradient: "linear-gradient(135deg,#F58220 0%,#FDBA74 48%,#111111 100%)",
        placeholders: [...COMMON_PLACEHOLDERS, "BADGE_TEXT"],
        optional: [...COMMON_OPTIONAL, "BADGE_TEXT"],
        replacements: {
          MAIN_TITLE: "IRRESISTÍVEL!",
          SUBTITLE: "Do primeiro ao último pedaço.",
          CTA_TEXT: "PEÇA AGORA",
          BADGE_TEXT: "100% ARTESANAL",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
          PRICE: "Preço",
        },
        prompt: prompt(`Modern premium fast-food commercial poster with vibrant solid orange background, subtle gradients and soft radial lighting.
Featured food positioned bottom-center occupying about 60% of the composition, clean balanced negative space, food is the absolute hero.
Huge bold condensed sans-serif headline in the upper half, white/black/orange typographic hierarchy.
Three premium feature icons vertically on the left, one luxury circular badge on the right with "{{BADGE_TEXT}}".
Official Tia Any logo centered at top, branded flag in the food, premium black rounded CTA button "{{CTA_TEXT}}", phone "{{PHONE}}", Instagram "{{INSTAGRAM}}", price "{{PRICE}}".
Main title "{{MAIN_TITLE}}"; subtitle "{{SUBTITLE}}". Ultra photorealistic food textures, glossy highlights, commercial food photography, luxury minimalism, 8K.`),
      },
      {
        key: "dark_smoke_hero",
        title: "Dark Smoke Hero",
        gradient: "linear-gradient(135deg,#030303 0%,#7C2D12 48%,#F58220 100%)",
        placeholders: [...COMMON_PLACEHOLDERS, "BACKGROUND_WORD", "BRUSH_TITLE"],
        optional: [...COMMON_OPTIONAL, "BACKGROUND_WORD", "BRUSH_TITLE"],
        replacements: {
          MAIN_TITLE: "PEÇA AGORA!",
          SUBTITLE: "Sabor marcante, qualidade garantida, experiência única.",
          CTA_TEXT: "EXPERIMENTE HOJE!",
          BACKGROUND_WORD: "BURGER",
          BRUSH_TITLE: "PERFEITO",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
          PRICE: "Preço",
        },
        prompt: prompt(`Dark luxury fast-food advertisement, bold modern masculine premium restaurant campaign.
Featured food at bottom center on rustic wooden board, dark matte black textured background with cinematic smoke and warm orange glow behind the food.
Oversized transparent outline background word "{{BACKGROUND_WORD}}" across the upper half, bold brush-style headline "{{BRUSH_TITLE}}" overlapping it.
Left information panel with three orange rounded feature buttons and minimalist black icons. Large CTA "{{CTA_TEXT}}" at the bottom.
Official logo centered at top, branded flag in the food, phone "{{PHONE}}", Instagram "{{INSTAGRAM}}", price "{{PRICE}}".
Commercial studio lighting, warm orange rim light, realistic steam, ultra sharp food photography, 8K.`),
      },
      {
        key: "clean_white_premium",
        title: "Clean White Premium",
        gradient: "linear-gradient(135deg,#F8FAFC 0%,#F58220 54%,#111111 100%)",
        placeholders: [...COMMON_PLACEHOLDERS, "FEATURE_1", "FEATURE_2", "FEATURE_3"],
        optional: [...COMMON_OPTIONAL, "FEATURE_1", "FEATURE_2", "FEATURE_3"],
        replacements: {
          MAIN_TITLE: "SABOR DE VERDADE",
          SUBTITLE: "Qualidade premium em cada detalhe.",
          CTA_TEXT: "FAÇA O SEU PEDIDO",
          FEATURE_1: "Ingredientes Premium",
          FEATURE_2: "Molho Caseiro",
          FEATURE_3: "Feito na Hora",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
          PRICE: "Preço",
        },
        prompt: prompt(`Luxury minimalist restaurant poster inspired by Apple advertising mixed with luxury food branding.
White marble background with orange premium accents and brush details. Food positioned lower-right; large typography on the left with lots of negative space.
Huge headline "{{MAIN_TITLE}}" mixing black and orange, subtitle "{{SUBTITLE}}", minimal line icons feature list "{{FEATURE_1}}", "{{FEATURE_2}}", "{{FEATURE_3}}".
Official Tia Any logo, branded flag, phone "{{PHONE}}", Instagram "{{INSTAGRAM}}", price "{{PRICE}}", CTA "{{CTA_TEXT}}".
Soft studio lighting, natural reflections, minimal graphic design, commercial food photography, advertising agency quality, 8K.`),
      },
      {
        key: "human_experience",
        title: "Human Experience",
        gradient: "linear-gradient(135deg,#111111 0%,#F58220 46%,#F4F1EA 100%)",
        placeholders: COMMON_PLACEHOLDERS,
        optional: COMMON_OPTIONAL,
        replacements: {
          MAIN_TITLE: "SERVIDO COM PAIXÃO",
          SUBTITLE: "Atendimento próximo, sabor inesquecível.",
          CTA_TEXT: "PEÇA JÁ O SEU!",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
          PRICE: "Preço",
        },
        prompt: prompt(`Restaurant employee proudly presenting the food, warm human connection, friendly smile, professional service.
If a person reference is provided, preserve exact identity. If no person is provided, generate a professional Tia Any employee wearing the official black polo uniform.
Employee holding a rustic wooden serving board, natural body language. Food occupies about 55% and remains perfectly sharp; employee about 45%.
Luxury restaurant background, warm orange lighting, soft bokeh, premium flyer typography on the left.
Official Tia Any logo, official uniform, branded food flag, phone "{{PHONE}}", Instagram "{{INSTAGRAM}}", price "{{PRICE}}", main title "{{MAIN_TITLE}}", subtitle "{{SUBTITLE}}", CTA "{{CTA_TEXT}}".
Ultra photorealistic commercial advertising, cinematic lighting, 8K.`),
      },
      {
        key: "combo_promotion",
        title: "Combo Promotion",
        gradient: "linear-gradient(135deg,#0B0B0C 0%,#B45309 52%,#FACC15 100%)",
        placeholders: [...COMMON_PLACEHOLDERS, "PROMO_BADGE"],
        optional: [...COMMON_OPTIONAL, "PROMO_BADGE"],
        replacements: {
          MAIN_TITLE: "COMBO PREMIUM",
          SUBTITLE: "Burger, batata e bebida na combinação perfeita.",
          CTA_TEXT: "PEÇA AGORA",
          PROMO_BADGE: "SUPER OFERTA",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
          PRICE: "Preço",
        },
        prompt: prompt(`Premium combo promotion: burger centered, fries on the right, drink behind, all fresh and irresistible on rustic wooden board.
Dark premium background with warm orange glow, soft smoke, balanced commercial composition.
Large promotional headline "{{MAIN_TITLE}}", subtitle "{{SUBTITLE}}", premium circular promotion badge "{{PROMO_BADGE}}", combo price "{{PRICE}}".
Official logo, branded flag, phone "{{PHONE}}", Instagram "{{INSTAGRAM}}", CTA "{{CTA_TEXT}}". Golden fries, condensation on drink, glossy bun, professional commercial photography, 8K.`),
      },
      {
        key: "giant_burger_construction",
        title: "Giant Burger Construction",
        gradient: "linear-gradient(135deg,#111111 0%,#EA580C 50%,#FDE68A 100%)",
        placeholders: COMMON_PLACEHOLDERS,
        optional: COMMON_OPTIONAL,
        replacements: {
          MAIN_TITLE: "BUILT WITH PASSION",
          SUBTITLE: "Cada detalhe importa.",
          CTA_TEXT: "EXPERIMENTE HOJE",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
          PRICE: "Preço",
        },
        prompt: prompt(`Advertising campaign where the burger is so gigantic that Tia Any employees are still building it.
Massive burger in the center on rustic wooden platform; tiny employees compared to the burger.
Employees must wear only the official black Tia Any polo uniform. One brushes sauce on top bun, one climbs ladder polishing bun, one adds sauce with brush, one carries vegetables, one pushes ingredient cart, one installs official branded flag.
Dark luxury restaurant background, soft smoke, warm orange lighting, wood textures. Large premium typography "{{MAIN_TITLE}}", subtitle "{{SUBTITLE}}", CTA "{{CTA_TEXT}}".
Official logo, phone "{{PHONE}}", Instagram "{{INSTAGRAM}}", price "{{PRICE}}". Ultra photorealistic, fun premium cinematic scene, advertising agency quality, 8K.`),
      },
      {
        key: "happy_customer_reaction",
        title: "Happy Customer Reaction",
        gradient: "linear-gradient(135deg,#F4F1EA 0%,#F58220 50%,#111111 100%)",
        placeholders: COMMON_PLACEHOLDERS,
        optional: COMMON_OPTIONAL,
        replacements: {
          MAIN_TITLE: "SABOR QUE SURPREENDE",
          SUBTITLE: "Uma reação impossível de esconder.",
          CTA_TEXT: "PEÇA JÁ",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
          PRICE: "Preço",
        },
        prompt: prompt(`Cheerful customer has just received the food and reacts with pure excitement: big smile, laughing, pointing at the burger, one fist raised in celebration.
If person reference is provided, preserve exact identity. If not, generate a cheerful customer; customer must not wear restaurant uniform.
Burger remains the hero with branded soft drink beside it. Clean white and orange premium background, luxury commercial advertising, Instagram premium campaign.
Official Tia Any branding only. Main title "{{MAIN_TITLE}}", subtitle "{{SUBTITLE}}", CTA "{{CTA_TEXT}}", phone "{{PHONE}}", Instagram "{{INSTAGRAM}}", price "{{PRICE}}". Ultra photorealistic, 8K.`),
      },
      {
        key: "perfect_combo_served",
        title: "Perfect Combo Served",
        gradient: "linear-gradient(135deg,#111111 0%,#F58220 50%,#F4F1EA 100%)",
        placeholders: COMMON_PLACEHOLDERS,
        optional: COMMON_OPTIONAL,
        replacements: {
          MAIN_TITLE: "COMBO PERFEITO",
          SUBTITLE: "Burger, batata e bebida servidos com orgulho.",
          CTA_TEXT: "PEÇA JÁ",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
          PRICE: "Preço",
        },
        prompt: prompt(`Restaurant employee proudly serving the perfect combo on a rustic wooden board.
Burger in the center, french fries on one side, premium drink on the opposite side. Employee smiling naturally while looking at the food.
Employee must wear the official black Tia Any polo uniform. Warm restaurant lighting, minimal luxury composition, orange and white branding, professional typography.
Main title "{{MAIN_TITLE}}", subtitle "{{SUBTITLE}}", CTA "{{CTA_TEXT}}", phone "{{PHONE}}", Instagram "{{INSTAGRAM}}", price "{{PRICE}}".
Ultra realistic Instagram premium advertisement, advertising agency quality, 8K.`),
      },
      {
        key: "energy_portal",
        title: "Energy Portal",
        gradient: "linear-gradient(135deg,#020617 0%,#F58220 52%,#7C3AED 100%)",
        placeholders: COMMON_PLACEHOLDERS,
        optional: COMMON_OPTIONAL,
        replacements: {
          MAIN_TITLE: "ENERGIA DE SABOR",
          SUBTITLE: "O burger aparece como uma explosão de felicidade.",
          CTA_TEXT: "EXPERIMENTE",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
          PRICE: "Preço",
        },
        prompt: prompt(`The burger emerges from a futuristic glowing orange energy portal. Two happy young adults jump with excitement on opposite sides of the burger.
Floating fries, floating drink, orange energy particles, light trails, cinematic smoke. The burger remains the visual hero.
Sci-fi premium advertising, luxury restaurant campaign, orange black and white branding, dynamic Instagram viral composition.
Main title "{{MAIN_TITLE}}", subtitle "{{SUBTITLE}}", CTA "{{CTA_TEXT}}", phone "{{PHONE}}", Instagram "{{INSTAGRAM}}", price "{{PRICE}}". Ultra photorealistic, 8K.`),
      },
      {
        key: "giant_burger_reaction",
        title: "Giant Burger Reaction",
        gradient: "linear-gradient(135deg,#0B0B0C 0%,#EA580C 48%,#FACC15 100%)",
        placeholders: COMMON_PLACEHOLDERS,
        optional: COMMON_OPTIONAL,
        replacements: {
          MAIN_TITLE: "TAMANHO INCRÍVEL",
          SUBTITLE: "Um burger gigante que surpreende qualquer cliente.",
          CTA_TEXT: "PEÇA O SEU",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
          PRICE: "Preço",
        },
        prompt: prompt(`Premium restaurant advertisement where a gigantic burger is placed in front of a surprised customer.
The burger occupies around 70% of the composition. Customer stands behind the burger with shocked expression, wide open eyes, open mouth, both hands stretched toward the burger as if they cannot believe its size.
Warm orange cinematic backlight, dark luxury restaurant background, orange light rays, premium typography. The burger remains the hero.
Main title "{{MAIN_TITLE}}", subtitle "{{SUBTITLE}}", CTA "{{CTA_TEXT}}", phone "{{PHONE}}", Instagram "{{INSTAGRAM}}", price "{{PRICE}}". Ultra photorealistic, 8K.`),
      },
      {
        key: "food_explosion_v12",
        title: "Food Explosion",
        gradient: "linear-gradient(135deg,#111111 0%,#F97316 52%,#FDE68A 100%)",
        placeholders: COMMON_PLACEHOLDERS,
        optional: COMMON_OPTIONAL,
        replacements: {
          MAIN_TITLE: "EXPLOSÃO DE SABOR",
          SUBTITLE: "Ingredientes a voar, sabor a dominar.",
          CTA_TEXT: "PROVE HOJE",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
          PRICE: "Preço",
        },
        prompt: prompt(`Premium commercial poster where the burger explodes with flavor. Floating tomato slices, onions, lettuce, sauce splashes, cheese splashes, sesame seeds, orange particles and smoke.
Everything frozen in motion around the burger. Dark premium background, large typography, luxury advertising. Burger remains untouched while everything around it explodes.
Main title "{{MAIN_TITLE}}", subtitle "{{SUBTITLE}}", CTA "{{CTA_TEXT}}", phone "{{PHONE}}", Instagram "{{INSTAGRAM}}", price "{{PRICE}}". Ultra photorealistic, advertising agency quality, 8K.`),
      },
      {
        key: "home_cooked_executive_meal",
        title: "Home Cooked Executive Meal",
        gradient: "linear-gradient(135deg,#F8FAFC 0%,#F58220 48%,#1F1308 100%)",
        placeholders: COMMON_PLACEHOLDERS,
        optional: COMMON_OPTIONAL,
        replacements: {
          MAIN_TITLE: "PRATO EXECUTIVO",
          SUBTITLE: "Sabor caseiro com apresentação premium.",
          CTA_TEXT: "PEÇA AGORA",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
          PRICE: "Preço",
        },
        prompt: prompt(`Premium commercial poster focused on a homemade executive meal. Large ceramic plate, natural steam, premium black bowl, rustic cloth underneath.
White marble mixed with orange brush strokes, warm lighting, minimal typography, clean premium composition. Food occupies approximately 70%.
Luxury restaurant branding, main title "{{MAIN_TITLE}}", subtitle "{{SUBTITLE}}", CTA "{{CTA_TEXT}}", phone "{{PHONE}}", Instagram "{{INSTAGRAM}}", price "{{PRICE}}". Ultra photorealistic, 8K.`),
      },
      {
        key: "executive_plate_dark",
        title: "Executive Plate Dark",
        gradient: "linear-gradient(135deg,#050505 0%,#7C2D12 50%,#F58220 100%)",
        placeholders: [...COMMON_PLACEHOLDERS, "FEATURE_1", "FEATURE_2", "FEATURE_3"],
        optional: [...COMMON_OPTIONAL, "FEATURE_1", "FEATURE_2", "FEATURE_3"],
        replacements: {
          MAIN_TITLE: "EXECUTIVO PREMIUM",
          SUBTITLE: "Uma refeição completa com qualidade de restaurante.",
          CTA_TEXT: "EXPERIMENTE",
          FEATURE_1: "Sabor Caseiro",
          FEATURE_2: "Servido Quente",
          FEATURE_3: "Qualidade Premium",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
          PRICE: "Preço",
        },
        prompt: prompt(`Dark luxury restaurant advertisement featuring a premium executive meal. Dark matte background, warm orange glow, visible steam, food in a large black ceramic plate.
Restaurant quality presentation, typography on the left, feature icons on the right, premium magazine style, commercial food photography.
Main title "{{MAIN_TITLE}}", subtitle "{{SUBTITLE}}", features "{{FEATURE_1}}", "{{FEATURE_2}}", "{{FEATURE_3}}", CTA "{{CTA_TEXT}}", phone "{{PHONE}}", Instagram "{{INSTAGRAM}}", price "{{PRICE}}". Ultra realistic, 8K.`),
      },
      {
        key: "customer_enjoying_food",
        title: "Customer Enjoying The Food",
        gradient: "linear-gradient(135deg,#F4F1EA 0%,#F58220 46%,#111111 100%)",
        placeholders: COMMON_PLACEHOLDERS,
        optional: COMMON_OPTIONAL,
        replacements: {
          MAIN_TITLE: "SABOR QUE SE SENTE",
          SUBTITLE: "O momento em que a comida fala por si.",
          CTA_TEXT: "VENHA PROVAR",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
          PRICE: "Preço",
        },
        prompt: prompt(`Premium restaurant campaign where the customer is enjoying the meal: natural smile, eyes partially closed while tasting the food, warm restaurant lighting.
Customer slightly blurred in background, food perfectly sharp in foreground. The meal remains the visual hero, steam visible, luxury restaurant atmosphere, Instagram premium campaign.
Main title "{{MAIN_TITLE}}", subtitle "{{SUBTITLE}}", CTA "{{CTA_TEXT}}", phone "{{PHONE}}", Instagram "{{INSTAGRAM}}", price "{{PRICE}}". Ultra photorealistic, 8K.`),
      },
      {
        key: "hero_burger",
        title: "Hero Burger",
        gradient: "linear-gradient(135deg,#111111 0%,#F58220 52%,#FDE68A 100%)",
        placeholders: COMMON_PLACEHOLDERS,
        optional: COMMON_OPTIONAL,
        replacements: {
          MAIN_TITLE: "O BURGER HERÓI",
          SUBTITLE: "Feito para dominar o apetite.",
          CTA_TEXT: "PEÇA JÁ",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
          PRICE: "Preço",
        },
        prompt: prompt(`Luxury restaurant advertisement where the featured burger is the absolute hero. Dark premium restaurant background, rustic wooden board.
Floating tomato slices, onion rings, lettuce, herbs, small glowing particles, soft smoke, warm orange cinematic lighting. Typography occupies the left side. Burger occupies around 70%.
Commercial food photography, luxury restaurant branding, Instagram premium campaign. Main title "{{MAIN_TITLE}}", subtitle "{{SUBTITLE}}", CTA "{{CTA_TEXT}}", phone "{{PHONE}}", Instagram "{{INSTAGRAM}}", price "{{PRICE}}". Ultra photorealistic, 8K.`),
      },
      {
        key: "burger_deconstruction",
        title: "Burger Deconstruction",
        gradient: "linear-gradient(135deg,#F58220 0%,#FDE68A 52%,#111111 100%)",
        placeholders: COMMON_PLACEHOLDERS,
        optional: COMMON_OPTIONAL,
        replacements: {
          MAIN_TITLE: "CADA CAMADA CONTA",
          SUBTITLE: "Ingredientes alinhados como uma obra de arte.",
          CTA_TEXT: "PROVE AGORA",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
          PRICE: "Preço",
        },
        prompt: prompt(`Premium advertisement where every burger ingredient floats separately in a vertical assembly: top bun, cheese, meat, tomatoes, onions, lettuce, sauce splashes and bottom bun.
Everything perfectly aligned vertically as if the burger is assembling itself. Orange splash background, luxury commercial typography, professional advertising. If food reference is provided, keep the burger identity exactly.
Main title "{{MAIN_TITLE}}", subtitle "{{SUBTITLE}}", CTA "{{CTA_TEXT}}", phone "{{PHONE}}", Instagram "{{INSTAGRAM}}", price "{{PRICE}}". Ultra realistic, 8K.`),
      },
      {
        key: "executive_meal_premium",
        title: "Executive Meal Premium",
        gradient: "linear-gradient(135deg,#F8FAFC 0%,#FDBA74 48%,#111111 100%)",
        placeholders: COMMON_PLACEHOLDERS,
        optional: COMMON_OPTIONAL,
        replacements: {
          MAIN_TITLE: "REFEIÇÃO COMPLETA",
          SUBTITLE: "Arroz, feijão, carne grelhada e salada fresca.",
          CTA_TEXT: "PEÇA O SEU",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
          PRICE: "Preço",
        },
        prompt: prompt(`Premium executive meal advertisement. Large black ceramic plate with rice, beans, grilled meat and fresh salad, premium presentation.
White luxury background, orange brush strokes, elegant typography, minimalist composition, commercial food photography, luxury branding.
Main title "{{MAIN_TITLE}}", subtitle "{{SUBTITLE}}", CTA "{{CTA_TEXT}}", phone "{{PHONE}}", Instagram "{{INSTAGRAM}}", price "{{PRICE}}". Advertising agency quality, ultra realistic, 8K.`),
      },
      {
        key: "executive_meal_dark",
        title: "Executive Meal Dark",
        gradient: "linear-gradient(135deg,#050505 0%,#78350F 52%,#F58220 100%)",
        placeholders: COMMON_PLACEHOLDERS,
        optional: COMMON_OPTIONAL,
        replacements: {
          MAIN_TITLE: "SABOR EXECUTIVO",
          SUBTITLE: "Prato quente, completo e irresistível.",
          CTA_TEXT: "FAÇA O PEDIDO",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
          PRICE: "Preço",
        },
        prompt: prompt(`Premium dark restaurant campaign. Executive meal served in a black bowl, visible steam, dark matte background, orange accents, luxury typography.
Warm cinematic lighting, restaurant magazine quality, food occupies around 70%, commercial food photography.
Main title "{{MAIN_TITLE}}", subtitle "{{SUBTITLE}}", CTA "{{CTA_TEXT}}", phone "{{PHONE}}", Instagram "{{INSTAGRAM}}", price "{{PRICE}}". Advertising agency quality, 8K.`),
      },
      {
        key: "food_explosion_with_waiter",
        title: "Food Explosion With Waiter",
        gradient: "linear-gradient(135deg,#111111 0%,#F58220 50%,#F4F1EA 100%)",
        placeholders: COMMON_PLACEHOLDERS,
        optional: COMMON_OPTIONAL,
        replacements: {
          MAIN_TITLE: "SERVIDO COM ENERGIA",
          SUBTITLE: "O prato explode em aroma e sabor.",
          CTA_TEXT: "EXPERIMENTE",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
          PRICE: "Preço",
        },
        prompt: prompt(`Professional restaurant employee wearing the official black Tia Any polo, holding the featured meal with both hands.
The meal explodes with ingredients: flying herbs, sauce splashes, floating pasta, floating vegetables. Warm cinematic orange lighting, luxury restaurant background.
Employee smiling naturally while looking at the food, premium advertising, commercial food photography.
Main title "{{MAIN_TITLE}}", subtitle "{{SUBTITLE}}", CTA "{{CTA_TEXT}}", phone "{{PHONE}}", Instagram "{{INSTAGRAM}}", price "{{PRICE}}". Ultra photorealistic, 8K.`),
      },
      {
        key: "karaoke_night",
        title: "Karaoke Night",
        gradient: "linear-gradient(135deg,#0F172A 0%,#7C3AED 46%,#F58220 100%)",
        placeholders: [...COMMON_PLACEHOLDERS, "EVENT_TITLE"],
        optional: [...COMMON_OPTIONAL, "EVENT_TITLE"],
        replacements: {
          MAIN_TITLE: "NOITE DE KARAOKÊ",
          EVENT_TITLE: "KARAOKÊ + JANTAR",
          SUBTITLE: "Cante, ria e curta com o melhor sabor.",
          CTA_TEXT: "RESERVE JÁ",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
          PRICE: "Preço",
        },
        prompt: prompt(`Premium karaoke night advertisement inside Tia Any Fast Food.
Happy singer with microphone on stage, audience silhouettes clapping, warm restaurant lighting, neon orange/blue/purple karaoke lights and stage spotlights.
Featured meal and drink positioned at bottom, dark premium restaurant atmosphere, luxury commercial layout.
Typography "{{MAIN_TITLE}}" and "{{EVENT_TITLE}}", subtitle "{{SUBTITLE}}", CTA "{{CTA_TEXT}}", phone "{{PHONE}}", Instagram "{{INSTAGRAM}}", price "{{PRICE}}". Official Tia Any branding, advertising agency quality, ultra photorealistic, 8K.`),
      },
      {
        key: "christmas_combo",
        title: "Christmas Combo",
        gradient: "linear-gradient(135deg,#064E3B 0%,#DC2626 48%,#FACC15 100%)",
        placeholders: [...COMMON_PLACEHOLDERS, "DISCOUNT"],
        optional: [...COMMON_OPTIONAL, "DISCOUNT"],
        replacements: {
          MAIN_TITLE: "NATAL ESPECIAL",
          SUBTITLE: "Combo premium para celebrar com sabor.",
          CTA_TEXT: "APROVEITE",
          DISCOUNT: "OFERTA",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
          PRICE: "Preço",
        },
        prompt: prompt(`Premium Christmas combo advertisement: featured burger, french fries and soft drink with Christmas ornaments, gift boxes, golden ribbons and snowflakes.
Luxury wooden board, dark restaurant background, warm Christmas lighting, premium commercial typography, large discount badge "{{DISCOUNT}}".
Main title "{{MAIN_TITLE}}", subtitle "{{SUBTITLE}}", CTA "{{CTA_TEXT}}", phone "{{PHONE}}", Instagram "{{INSTAGRAM}}", price "{{PRICE}}". Official Tia Any branding, ultra photorealistic, advertising agency quality, 8K.`),
      },
      {
        key: "christmas_special_menu",
        title: "Christmas Special Menu",
        gradient: "linear-gradient(135deg,#F8FAFC 0%,#DC2626 48%,#FACC15 100%)",
        placeholders: [...COMMON_PLACEHOLDERS, "DISCOUNT"],
        optional: [...COMMON_OPTIONAL, "DISCOUNT"],
        replacements: {
          MAIN_TITLE: "NATAL ESPECIAL",
          SUBTITLE: "Um menu especial para celebrar com sabor.",
          CTA_TEXT: "RESERVE JÁ",
          DISCOUNT: "MENU ESPECIAL",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
          PRICE: "Preço",
        },
        prompt: prompt(`Premium Christmas restaurant advertisement. Featured meal occupies approximately 65% of the composition.
Elegant white premium background with subtle marble texture, Christmas ornaments hanging from pine branches, luxury wrapped gift box, small Christmas decorations, warm golden lighting, soft Christmas particles.
Premium typography with large title "{{MAIN_TITLE}}", subtitle "{{SUBTITLE}}", discount "{{DISCOUNT}}", CTA "{{CTA_TEXT}}", phone "{{PHONE}}", Instagram "{{INSTAGRAM}}", price "{{PRICE}}". Official Tia Any branding, ultra photorealistic, 8K.`),
      },
      {
        key: "christmas_discount_campaign",
        title: "Christmas Discount Campaign",
        gradient: "linear-gradient(135deg,#F58220 0%,#DC2626 48%,#FACC15 100%)",
        placeholders: [...COMMON_PLACEHOLDERS, "DISCOUNT"],
        optional: [...COMMON_OPTIONAL, "DISCOUNT"],
        replacements: {
          MAIN_TITLE: "PROMOÇÃO DE NATAL",
          SUBTITLE: "Descontos especiais para celebrar.",
          CTA_TEXT: "APROVEITE",
          DISCOUNT: "DESCONTO",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
          PRICE: "Preço",
        },
        prompt: prompt(`Premium Christmas promotional campaign. Orange Christmas background, golden bokeh lights, gift boxes, pine branches, Christmas decorations.
Large premium meal, large circular discount badge "{{DISCOUNT}}", elegant typography, designed to promote Christmas discounts, luxury commercial advertising.
Main title "{{MAIN_TITLE}}", subtitle "{{SUBTITLE}}", CTA "{{CTA_TEXT}}", phone "{{PHONE}}", Instagram "{{INSTAGRAM}}", price "{{PRICE}}". Ultra realistic, 8K.`),
      },
      {
        key: "christmas_burger_promotion",
        title: "Christmas Burger Promotion",
        gradient: "linear-gradient(135deg,#064E3B 0%,#DC2626 48%,#F58220 100%)",
        placeholders: [...COMMON_PLACEHOLDERS, "DISCOUNT"],
        optional: [...COMMON_OPTIONAL, "DISCOUNT"],
        replacements: {
          MAIN_TITLE: "BURGER DE NATAL",
          SUBTITLE: "A promoção mais deliciosa da época.",
          CTA_TEXT: "PEÇA AGORA",
          DISCOUNT: "OFERTA",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
          PRICE: "Preço",
        },
        prompt: prompt(`Premium Christmas burger advertisement. Featured burger wearing a realistic Santa Claus hat, french fries, premium drink, snowflakes, gift box, Christmas ornaments.
Orange luxury background, large discount badge "{{DISCOUNT}}", warm Christmas lighting, luxury commercial design, Instagram premium campaign.
Main title "{{MAIN_TITLE}}", subtitle "{{SUBTITLE}}", CTA "{{CTA_TEXT}}", phone "{{PHONE}}", Instagram "{{INSTAGRAM}}", price "{{PRICE}}". Ultra photorealistic, 8K.`),
      },
      {
        key: "christmas_family_dinner",
        title: "Christmas Family Dinner",
        gradient: "linear-gradient(135deg,#050505 0%,#064E3B 48%,#DC2626 100%)",
        placeholders: COMMON_PLACEHOLDERS,
        optional: COMMON_OPTIONAL,
        replacements: {
          MAIN_TITLE: "JANTAR DE NATAL",
          SUBTITLE: "Uma refeição especial para partilhar.",
          CTA_TEXT: "ENCOMENDE",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
          PRICE: "Preço",
        },
        prompt: prompt(`Luxury Christmas campaign focused on an executive meal. Dark premium background, Christmas lights, pine branches, elegant Christmas ornaments, warm candlelight atmosphere.
Premium restaurant mood, meal is the visual hero, typography positioned above the food, luxury restaurant branding.
Main title "{{MAIN_TITLE}}", subtitle "{{SUBTITLE}}", CTA "{{CTA_TEXT}}", phone "{{PHONE}}", Instagram "{{INSTAGRAM}}", price "{{PRICE}}". Advertising agency quality, ultra realistic, 8K.`),
      },
      {
        key: "christmas_family_platter",
        title: "Christmas Family Platter",
        gradient: "linear-gradient(135deg,#7F1D1D 0%,#FACC15 48%,#064E3B 100%)",
        placeholders: COMMON_PLACEHOLDERS,
        optional: COMMON_OPTIONAL,
        replacements: {
          MAIN_TITLE: "PRATO FAMILIAR",
          SUBTITLE: "Celebre em família com sabor Tia Any.",
          CTA_TEXT: "RESERVE JÁ",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
          PRICE: "Preço Família",
        },
        prompt: prompt(`Premium Christmas family meal advertisement. Large sharing platter with roasted chicken, rice, beans and fresh salad.
Christmas decorations surrounding the plate, warm candle, golden fairy lights, pine branches, luxury restaurant atmosphere, large premium typography and space for Christmas family price.
Main title "{{MAIN_TITLE}}", subtitle "{{SUBTITLE}}", CTA "{{CTA_TEXT}}", phone "{{PHONE}}", Instagram "{{INSTAGRAM}}", price "{{PRICE}}". Designed for family celebrations, ultra photorealistic, 8K.`),
      },
      {
        key: "delivery_premium",
        title: "Delivery Premium",
        gradient: "linear-gradient(135deg,#F58220 0%,#FDBA74 52%,#0B0B0C 100%)",
        placeholders: COMMON_PLACEHOLDERS,
        optional: COMMON_OPTIONAL,
        replacements: {
          MAIN_TITLE: "DELIVERY PREMIUM",
          SUBTITLE: "O sabor Tia Any vai até si.",
          CTA_TEXT: "FAÇA O PEDIDO",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
          PRICE: "Preço",
        },
        prompt: prompt(`Premium delivery campaign. Featured burger positioned on a modern circular delivery platform, luxury kraft delivery bag behind, 3D location pin, floating clouds, orange premium background.
Minimal modern commercial typography, professional product presentation and delivery concept.
Official Tia Any logo, branded flag, main title "{{MAIN_TITLE}}", subtitle "{{SUBTITLE}}", CTA "{{CTA_TEXT}}", phone "{{PHONE}}", Instagram "{{INSTAGRAM}}", price "{{PRICE}}". Ultra realistic commercial food photography, 8K.`),
      },
      {
        key: "karaoke_stage",
        title: "Karaoke Stage",
        gradient: "linear-gradient(135deg,#111827 0%,#7C3AED 48%,#F58220 100%)",
        placeholders: [...COMMON_PLACEHOLDERS, "EVENT_TITLE"],
        optional: [...COMMON_OPTIONAL, "EVENT_TITLE"],
        replacements: {
          MAIN_TITLE: "PALCO KARAOKÊ",
          EVENT_TITLE: "KARAOKÊ",
          SUBTITLE: "Noite, música e sabor no mesmo lugar.",
          CTA_TEXT: "RESERVE",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
          PRICE: "Preço",
        },
        prompt: prompt(`Luxury flyer showing the karaoke stage inside Tia Any Fast Food. Large vintage microphone dominates the foreground, neon sign saying "{{EVENT_TITLE}}".
Restaurant tables visible in the background, purple orange and blue neon lighting, food and drink positioned naturally on a table, luxury typography, professional nightlife atmosphere.
Main title "{{MAIN_TITLE}}", subtitle "{{SUBTITLE}}", CTA "{{CTA_TEXT}}", phone "{{PHONE}}", Instagram "{{INSTAGRAM}}", price "{{PRICE}}". Instagram premium campaign, ultra photorealistic, 8K.`),
      },
      {
        key: "karaoke_together",
        title: "Karaoke Together",
        gradient: "linear-gradient(135deg,#4C1D95 0%,#F58220 50%,#FDE68A 100%)",
        placeholders: [...COMMON_PLACEHOLDERS, "EVENT_TITLE"],
        optional: [...COMMON_OPTIONAL, "EVENT_TITLE"],
        replacements: {
          MAIN_TITLE: "CANTE, RIA E CURTA",
          EVENT_TITLE: "KARAOKÊ COM AMIGOS",
          SUBTITLE: "Duas vozes, uma noite inesquecível.",
          CTA_TEXT: "PARTICIPE",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
          PRICE: "Preço",
        },
        prompt: prompt(`Premium karaoke campaign where two people sing together while laughing. Both hold microphones, audience behind them, food and drinks on the table.
Warm restaurant atmosphere, luxury orange lighting, professional nightclub mood. Preserve both identities if two people are provided, otherwise generate a happy couple or two friends.
Typography "{{MAIN_TITLE}}" and "{{EVENT_TITLE}}", subtitle "{{SUBTITLE}}", CTA "{{CTA_TEXT}}", phone "{{PHONE}}", Instagram "{{INSTAGRAM}}", price "{{PRICE}}". Ultra photorealistic, 8K.`),
      },
      {
        key: "friends_karaoke",
        title: "Friends Karaoke",
        gradient: "linear-gradient(135deg,#0F172A 0%,#EC4899 46%,#F58220 100%)",
        placeholders: [...COMMON_PLACEHOLDERS, "EVENT_TITLE"],
        optional: [...COMMON_OPTIONAL, "EVENT_TITLE"],
        replacements: {
          MAIN_TITLE: "KARAOKÊ COM OS AMIGOS É MELHOR!",
          EVENT_TITLE: "NOITE DE AMIGOS",
          SUBTITLE: "Cante, ria, coma e celebre.",
          CTA_TEXT: "JUNTE A TURMA",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
          PRICE: "Preço",
        },
        prompt: prompt(`Group of friends around a restaurant table: some singing, some laughing, some applauding. Microphones, cocktails and meals on the table, neon lights, confetti, warm cinematic lighting.
Restaurant full of life, luxury restaurant campaign. Typography "{{MAIN_TITLE}}" and "{{EVENT_TITLE}}", subtitle "{{SUBTITLE}}", CTA "{{CTA_TEXT}}", phone "{{PHONE}}", Instagram "{{INSTAGRAM}}", price "{{PRICE}}".
Advertising agency quality, ultra photorealistic, 8K.`),
      },
      {
        key: "karaoke_challenge",
        title: "Karaoke Challenge",
        gradient: "linear-gradient(135deg,#111827 0%,#FACC15 46%,#7C3AED 100%)",
        placeholders: [...COMMON_PLACEHOLDERS, "EVENT_TITLE"],
        optional: [...COMMON_OPTIONAL, "EVENT_TITLE"],
        replacements: {
          MAIN_TITLE: "DESAFIO KARAOKÊ",
          EVENT_TITLE: "TROFÉU DA NOITE",
          SUBTITLE: "Mostre a sua voz e celebre com sabor.",
          CTA_TEXT: "INSCREVA-SE",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
          PRICE: "Preço",
        },
        prompt: prompt(`Singer performs passionately under colorful spotlights. Golden trophy beside the stage, audience applauding, large executive meal displayed below.
Modern nightclub lighting, orange and purple neon, professional premium flyer, official Tia Any branding.
Typography "{{MAIN_TITLE}}" and "{{EVENT_TITLE}}", subtitle "{{SUBTITLE}}", CTA "{{CTA_TEXT}}", phone "{{PHONE}}", Instagram "{{INSTAGRAM}}", price "{{PRICE}}". Ultra photorealistic, 8K.`),
      },
      {
        key: "karaoke_dinner",
        title: "Karaoke & Dinner",
        gradient: "linear-gradient(135deg,#050505 0%,#7C3AED 45%,#F58220 100%)",
        placeholders: [...COMMON_PLACEHOLDERS, "EVENT_TITLE"],
        optional: [...COMMON_OPTIONAL, "EVENT_TITLE"],
        replacements: {
          MAIN_TITLE: "KARAOKÊ + JANTAR",
          EVENT_TITLE: "NOITE COMPLETA",
          SUBTITLE: "Jantar premium com música e diversão.",
          CTA_TEXT: "RESERVE AGORA",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
          PRICE: "Preço",
        },
        prompt: prompt(`Luxury advertisement promoting dinner and karaoke together. Premium executive meal occupies the foreground, premium drink beside it, glowing neon microphone, soft musical notes floating.
Restaurant stage blurred in the background, warm orange lighting, elegant typography, premium nightlife restaurant atmosphere, official Tia Any branding.
Main title "{{MAIN_TITLE}}", event "{{EVENT_TITLE}}", subtitle "{{SUBTITLE}}", CTA "{{CTA_TEXT}}", phone "{{PHONE}}", Instagram "{{INSTAGRAM}}", price "{{PRICE}}". Ultra photorealistic, 8K.`),
      },
      {
        key: "how_to_order",
        title: "How To Order",
        gradient: "linear-gradient(135deg,#111111 0%,#F58220 52%,#F4F1EA 100%)",
        placeholders: ["MAIN_TITLE", "STEP_1", "STEP_2", "STEP_3", "PHONE", "INSTAGRAM"],
        optional: ["PHONE", "INSTAGRAM"],
        replacements: {
          MAIN_TITLE: "COMO PEDIR",
          STEP_1: "Escolha o prato",
          STEP_2: "Faça o pedido",
          STEP_3: "Receba e aproveite",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
        },
        prompt: prompt(`Premium informative flyer explaining how to order from Tia Any Fast Food.
Professional infographic style, luxury orange and black layout, modern icons and clean spacing.
Title "{{MAIN_TITLE}}". Three steps: "{{STEP_1}}", "{{STEP_2}}", "{{STEP_3}}". Include phone "{{PHONE}}" and Instagram "{{INSTAGRAM}}".
Official Tia Any logo, no QR code, no random branding. Minimal premium composition, advertising agency quality, 8K.`),
      },
      {
        key: "about_us",
        title: "About Us",
        gradient: "linear-gradient(135deg,#111111 0%,#F58220 48%,#F4F1EA 100%)",
        placeholders: INFO_PLACEHOLDERS,
        optional: INFO_OPTIONAL,
        replacements: {
          MAIN_TITLE: "CONHEÇA A TIA ANY",
          SECTION_1: "Nossa História",
          SECTION_2: "Nossa Missão",
          SECTION_3: "Atendimento de Qualidade",
          SECTION_4: "Ingredientes Selecionados",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
        },
        prompt: prompt(`Premium "About Us" flyer for Tia Any Fast Food. Show restaurant interior as the main background, warm cinematic lighting, welcoming atmosphere, elegant typography.
Include sections "{{SECTION_1}}", "{{SECTION_2}}", "{{SECTION_3}}", "{{SECTION_4}}". Modern luxury layout, orange black and white brand identity, Instagram premium campaign.
Title "{{MAIN_TITLE}}", phone "{{PHONE}}", Instagram "{{INSTAGRAM}}". Advertising agency quality, ultra photorealistic, 8K.`),
      },
      {
        key: "why_choose_us",
        title: "Why Choose Us",
        gradient: "linear-gradient(135deg,#F8FAFC 0%,#F58220 50%,#111111 100%)",
        placeholders: INFO_PLACEHOLDERS,
        optional: INFO_OPTIONAL,
        replacements: {
          MAIN_TITLE: "PORQUÊ ESCOLHER-NOS",
          SECTION_1: "Ingredientes Frescos",
          SECTION_2: "Atendimento Rápido",
          SECTION_3: "Ambiente Familiar",
          SECTION_4: "Receitas Artesanais",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
        },
        prompt: prompt(`Informative premium flyer explaining why customers should choose Tia Any Fast Food. Luxury background, large icons, modern layout, typography inspired by luxury brands, minimal design.
Feature examples: "{{SECTION_1}}", "{{SECTION_2}}", "{{SECTION_3}}", "{{SECTION_4}}". Official branding only.
Title "{{MAIN_TITLE}}", phone "{{PHONE}}", Instagram "{{INSTAGRAM}}". Advertising agency quality, 8K.`),
      },
      {
        key: "how_to_order_alt",
        title: "How To Order Alt",
        gradient: "linear-gradient(135deg,#F58220 0%,#111111 52%,#F4F1EA 100%)",
        placeholders: ["MAIN_TITLE", "STEP_1", "STEP_2", "STEP_3", "PHONE", "INSTAGRAM"],
        optional: ["PHONE", "INSTAGRAM"],
        replacements: {
          MAIN_TITLE: "FAÇA O SEU PEDIDO",
          STEP_1: "Escolha o prato",
          STEP_2: "Faça o pedido",
          STEP_3: "Receba e aproveite",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
        },
        prompt: prompt(`Alternative premium informative flyer explaining how to order. More elegant vertical layout with large numbered cards, modern icons, luxury orange and black identity.
Steps: "{{STEP_1}}", "{{STEP_2}}", "{{STEP_3}}". Title "{{MAIN_TITLE}}". Include phone "{{PHONE}}" and Instagram "{{INSTAGRAM}}".
Professional infographic style, minimal Instagram premium design, advertising agency quality, 8K.`),
      },
      {
        key: "delivery_information",
        title: "Delivery Information",
        gradient: "linear-gradient(135deg,#F58220 0%,#FDE68A 48%,#111111 100%)",
        placeholders: ["MAIN_TITLE", "ZONE_TEXT", "HOURS_TEXT", "PHONE", "INSTAGRAM"],
        optional: ["ZONE_TEXT", "HOURS_TEXT", "PHONE", "INSTAGRAM"],
        replacements: {
          MAIN_TITLE: "INFORMAÇÕES DE DELIVERY",
          ZONE_TEXT: "Zonas de entrega",
          HOURS_TEXT: "Horário de atendimento",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
        },
        prompt: prompt(`Premium delivery information flyer. Show delivery bag, location pin, delivery motorcycle silhouette, phone, opening hours and delivery zones.
Professional infographic, luxury commercial design, orange and black identity. Title "{{MAIN_TITLE}}"; sections "{{ZONE_TEXT}}" and "{{HOURS_TEXT}}"; phone "{{PHONE}}"; Instagram "{{INSTAGRAM}}".
Official Tia Any branding only, ultra photorealistic, advertising agency quality, 8K.`),
      },
      {
        key: "opening_hours",
        title: "Opening Hours",
        gradient: "linear-gradient(135deg,#111111 0%,#374151 46%,#F58220 100%)",
        placeholders: ["MAIN_TITLE", "WEEKDAYS", "WEEKEND", "PHONE", "INSTAGRAM"],
        optional: ["WEEKDAYS", "WEEKEND", "PHONE", "INSTAGRAM"],
        replacements: {
          MAIN_TITLE: "HORÁRIO DE FUNCIONAMENTO",
          WEEKDAYS: "Segunda a Sexta",
          WEEKEND: "Sábado e Domingo",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
        },
        prompt: prompt(`Elegant opening hours flyer. Restaurant facade softly blurred in the background, luxury typography, modern clock icon, premium minimalist layout.
Sections for opening and closing times: "{{WEEKDAYS}}" and "{{WEEKEND}}". Title "{{MAIN_TITLE}}", phone "{{PHONE}}", Instagram "{{INSTAGRAM}}".
Official Tia Any branding only, advertising agency quality, 8K.`),
      },
      {
        key: "house_rules_experience",
        title: "House Rules & Experience",
        gradient: "linear-gradient(135deg,#F4F1EA 0%,#F58220 46%,#111111 100%)",
        placeholders: INFO_PLACEHOLDERS,
        optional: INFO_OPTIONAL,
        replacements: {
          MAIN_TITLE: "EXPERIÊNCIA TIA ANY",
          SECTION_1: "Ambiente Familiar",
          SECTION_2: "Música ao Vivo",
          SECTION_3: "Karaokê",
          SECTION_4: "Eventos Especiais",
          PHONE: "Telefone",
          INSTAGRAM: "@tiaanyfastfood",
        },
        prompt: prompt(`Premium informational flyer explaining the restaurant experience: family environment, live music, karaoke, Wi-Fi, personalized service and special events.
Warm restaurant atmosphere, luxury icons, modern infographic, minimal premium composition, official Tia Any branding.
Title "{{MAIN_TITLE}}"; sections "{{SECTION_1}}", "{{SECTION_2}}", "{{SECTION_3}}", "{{SECTION_4}}"; phone "{{PHONE}}"; Instagram "{{INSTAGRAM}}". Ultra photorealistic, 8K.`),
      },
    ],
  },
];

export function buildTiaAnyPosterTemplates() {
  return TIA_ANY_POSTER_FAMILIES.map((family) => {
    const first = family.variants[0];
    return {
      id: family.id,
      source_id: family.id,
      familyId: family.id,
      styleVariants: true,
      category: family.category,
      label: family.label,
      subtag: family.subtag,
      tiaAnyTemplate: true,
      placeholders: first.placeholders,
      optional: first.optional || [],
      replacements: { ...first.replacements },
      prompt: first.prompt,
      aspect: "4:5",
    };
  });
}

export function registerTiaAnyStyleVariants(registerFn) {
  for (const family of TIA_ANY_POSTER_FAMILIES) {
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
        tiaAnyTemplate: true,
      })),
    );
  }
}
