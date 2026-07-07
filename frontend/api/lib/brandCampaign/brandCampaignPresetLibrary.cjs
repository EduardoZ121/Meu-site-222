/**
 * Hidden marketing ad prompt library — static image ads (Nano Banana / poster).
 * Never expose full prompts to the client API.
 */
const { CATEGORIES, resolveCategoryId } = require("./brandCampaignCategories.cjs");

function p(id, labelPt, labelEn, prompt) {
  return { id, labelPt, labelEn, prompt };
}

/** @type {Record<string, Array<{id:string,labelPt:string,labelEn:string,prompt:string}>>} */
const PRESETS = {
  fashion: [
    p("fashion_runway", "Passarela Premium", "Runway Premium",
      "High-fashion editorial ad: model in confident stride, garment in motion with wind and rim light. "
      + "Minimal luxury set in brand colors, shallow depth of field, Vogue-level composition. "
      + "Hero product sharp — fabric texture, stitching, label visible. Bold headline zone top-third. Dramatic contrast, no clutter."),
    p("fashion_flatlay", "Flat Lay Editorial", "Flat Lay Editorial",
      "Overhead flat-lay advertisement: outfit and accessories arranged in perfect symmetry on textured surface matching brand palette. "
      + "Soft diffused studio light, subtle shadows, magazine-quality styling. Product labels readable. Clean negative space for offer text."),
    p("fashion_street", "Streetwear Urbano", "Urban Streetwear",
      "Urban street-style ad at golden hour: subject on rain-slick city street, neon reflections, authentic attitude. "
      + "Product integrated naturally — sneakers, hoodie, or bag as hero. Handheld cinematic energy, gritty yet premium grade."),
    p("fashion_macro", "Macro Tecido", "Fabric Macro",
      "Extreme macro luxury ad: fabric weave, stitching, button or zipper in hyper-detail. "
      + "Brand-colored gradient background, soft bokeh, tactile ASMR-quality texture. Premium craft story — material is the hero."),
    p("fashion_minimal", "Estúdio Minimal", "Minimal Studio",
      "Pure white or brand-tinted studio ad: single product on pedestal, soft box lighting, mirror floor reflection. "
      + "Apple-level minimalism, one clear headline, one CTA zone. Ultra-clean hierarchy for paid social feed."),
  ],
  cars: [
    p("car_hero", "Hero Dinâmico", "Dynamic Hero",
      "Automotive hero ad: vehicle at 3/4 angle on dramatic dark set, wet asphalt reflections, volumetric headlights. "
      + "Low camera, motion blur on wheels, premium dealership energy. Space for bold offer headline. Ultra-realistic paint and chrome."),
    p("car_interior", "Interior Luxo", "Luxury Interior",
      "Cabin lifestyle ad: steering wheel, dashboard, leather seats in warm golden light through windshield. "
      + "Driver POV or passenger luxury feel. Tech screen glow, premium materials macro. Aspirational comfort narrative."),
    p("car_detail", "Detalhe Premium", "Premium Detail",
      "Macro automotive ad: wheel rim, badge emblem, headlight LED pattern, or grille mesh in extreme detail. "
      + "Black studio, rim light tracing curves. Engineering precision meets desire — tight crop for Instagram feed."),
    p("car_road", "Estrada Épica", "Epic Road",
      "Open-road cinematic ad: car on coastal or mountain highway at sunrise, long lens compression, dust or spray particles. "
      + "Freedom, performance, adventure. Brand colors in sky grade. Vehicle sharp, environment epic but not distracting."),
    p("car_showroom", "Showroom", "Showroom",
      "Showroom spotlight ad: vehicle centered on rotating platform, overhead soft boxes, polished floor reflection. "
      + "Launch-event energy, clean typography zones, zero clutter. Premium dealer campaign aesthetic."),
  ],
  cosmetics: [
    p("beauty_glow", "Glow Skin", "Glow Skin",
      "Beauty skincare ad: dewy skin close-up, product bottle beside cheek, soft pink/gold light, water droplets. "
      + "Clean science-luxury hybrid. Label readable, serum texture visible. Fresh, radiant, trustworthy for Meta ads."),
    p("beauty_splash", "Splash Premium", "Premium Splash",
      "Dynamic product splash ad: perfume or lotion with liquid arc, frozen droplets, dark gradient backdrop in brand hues. "
      + "High-speed photography look, glossy highlights, sensual premium mood. Hero pack shot with energy."),
    p("beauty_flatlay", "Ritual Flat Lay", "Ritual Flat Lay",
      "Self-care flat lay: bottles, jars, flowers, linen on marble. Soft morning window light. "
      + "Routine storytelling — order, calm, luxury bathroom spa. Ample space for promo copy and percentage-off badge."),
    p("beauty_model", "Rosto Editorial", "Editorial Face",
      "Editorial beauty portrait: model with flawless makeup holding product near face, catchlight in eyes. "
      + "Magazine cover crop 4:5, brand color gel on background. Product shade/name legible. Aspirational yet accessible."),
    p("beauty_minimal", "Packshot Clean", "Clean Packshot",
      "Minimal cosmetic packshot: single SKU floating with soft shadow, pastel or brand-solid background. "
      + "E-commerce meets luxury DTC. Ingredient callouts zone, certification badges area. Crisp label typography."),
  ],
  food: [
    p("food_hero", "Hero Appetite", "Appetite Hero",
      "Food hero ad: dish at 45° with steam rising, fork pull or cheese stretch moment. "
      + "Dark rustic table or bright diner set in brand style. Macro appetite appeal, saturated fresh colors, delivery-app campaign energy."),
    p("food_overhead", "Top View Mesa", "Table Top View",
      "Overhead feast ad: multiple items arranged on table, hands reaching in, shared dining joy. "
      + "Natural daylight, authentic imperfections, restaurant promo layout with price bubble zone."),
    p("food_ingredient", "Ingredient Fresh", "Fresh Ingredients",
      "Farm-to-table ad: raw ingredients exploding outward from central plated dish, motion freeze, vibrant greens and reds. "
      + "Freshness story, quality sourcing, clean background for headline about taste or offer."),
    p("food_pack", "Embalagem Delivery", "Delivery Pack",
      "Packaged food ad: branded box or bag open revealing product, condensation or warmth cues. "
      + "Kitchen counter lifestyle, phone-order narrative. Logo on packaging exact from reference photos."),
    p("food_dessert", "Sobremesa Macro", "Dessert Macro",
      "Dessert macro ad: chocolate drip, cream swirl, berry garnish extreme close-up. "
      + "Indulgence mood, shallow DOF, jewel-tone background matching brand. Sweet promo for stories format."),
  ],
  drinks: [
    p("drink_splash", "Splash Refrescante", "Refresh Splash",
      "Beverage splash ad: can or bottle with ice cubes and liquid burst, backlit condensation droplets. "
      + "Summer campaign energy, cyan/orange contrast or brand palette. Refreshment you can feel — feed-stopping motion."),
    p("drink_lifestyle", "Momento Social", "Social Moment",
      "Lifestyle drinks ad: friends toasting, product label facing camera, golden hour patio or bar bokeh. "
      + "Authentic joy, not stock-cliché. Brand colors in wardrobe and props. Space for limited-time offer text."),
    p("drink_pour", "Pour Slow-Mo", "Slow Pour",
      "Pour shot ad: liquid stream into glass, macro bubbles, amber or ruby glow through beverage. "
      + "Craft beer, wine, coffee or cocktail — premium pour ritual. Dark moody bar lighting."),
    p("drink_hero", "Produto Gélido", "Ice Cold Product",
      "Hero bottle/can on ice bed, frost mist, single spotlight. Minimal copy zone. "
      + "Label razor sharp from reference. Cold refreshment campaign for supermarket or DTC."),
    p("drink_ingredient", "Ingredient Story", "Ingredient Story",
      "Natural ingredients ad: fruit, botanicals, beans arranged around bottle — origin story visual. "
      + "Clean daylight, organic premium, transparency marketing for health-conscious audience."),
  ],
  websites: [
    p("web_device", "Mockup Device", "Device Mockup",
      "SaaS/app ad: laptop and phone showing website UI mock (abstract screens, no unreadable microtext). "
      + "Floating devices on gradient brand background, soft shadows, startup launch energy. Headline zone for value proposition."),
    p("web_dashboard", "Dashboard Hero", "Dashboard Hero",
      "B2B software ad: clean dashboard interface on wide monitor, dark mode UI glow, professional desk setup. "
      + "Trust, productivity, scale. Isometric or straight-on hero with CTA button area in composition."),
    p("web_mobile", "Mobile First", "Mobile First",
      "Mobile-app ad: hand holding phone with app screen, thumb interaction, blurred café background. "
      + "DTC app download campaign, notification badge optional. Brand colors on device frame and UI accents."),
    p("web_lifestyle", "Founder Story", "Founder Story",
      "Website service ad: entrepreneur at laptop, confident smile, browser with homepage visible. "
      + "Human trust + digital product. Warm office light, authentic not corporate stock. Offer for free trial zone."),
    p("web_abstract", "Abstract Tech", "Abstract Tech",
      "Abstract digital ad: flowing data particles, nodes, glass morphism shapes in brand colors forming device silhouette. "
      + "No fake UI text — pure tech premium mood for AI, hosting, or fintech landing page promo."),
  ],
  people: [
    p("people_hero", "Retrato Hero", "Hero Portrait",
      "People-first brand ad: confident person using or wearing product, direct eye contact, brand-colored backdrop. "
      + "Authentic diversity, natural skin texture, commercial portrait lighting. Product integration feels real not forced."),
    p("people_lifestyle", "Lifestyle Dia-a-dia", "Daily Lifestyle",
      "Day-in-the-life ad: subject in home, gym, or commute moment with product subtly hero. "
      + "Documentary warmth, window light, relatable aspiration. Headline speaks to transformation or benefit."),
    p("people_group", "Comunidade", "Community",
      "Group lifestyle ad: 2–4 people sharing experience connected to brand — meal, workout, creative session. "
      + "Genuine interaction, candid laughter, product visible mid-use. Community belonging campaign."),
    p("people_professional", "Profissional", "Professional",
      "Professional services ad: expert in work environment — coach, consultant, creator — with branded materials. "
      + "Authority and trust, clean office or studio, subtle logo placement. Premium personal brand energy."),
    p("people_before", "Transformação", "Transformation",
      "Transformation story ad: split visual narrative showing confidence boost (not gimmicky before/after unless product fits). "
      + "Uplifting light, same person empowered, product as catalyst. Motivational paid social creative."),
  ],
  tech: [
    p("tech_hero", "Gadget Hero", "Gadget Hero",
      "Consumer tech ad: device floating at slight angle, LED accent glow, dark premium stage. "
      + "Reflection floor, spec callout zones, unboxing excitement. Exact product shape from reference photos."),
    p("tech_inuse", "Em Uso", "In Use",
      "Tech-in-use ad: hands interacting with gadget — earbuds, watch, keyboard — macro usability moment. "
      + "Desk or commute context, shallow DOF on product. Innovation meets everyday life."),
    p("tech_exploded", "Exploded View", "Exploded View",
      "Exploded-view style ad: product components separated elegantly in air, engineering beauty. "
      + "Dark background, technical premium, innovation narrative for hardware or accessories."),
    p("tech_minimal", "Minimal DTC", "Minimal DTC",
      "DTC tech minimal ad: single SKU centered, infinite gradient background brand-tinted, soft shadow. "
      + "Apple-inspired clarity, one headline, warranty/trust badge area. E-commerce conversion creative."),
    p("tech_gaming", "Gaming RGB", "Gaming RGB",
      "Gaming gear ad: RGB lighting trails, esports desk setup, product as focal with peripheral context. "
      + "Neon brand accents, energy and performance, youth audience Meta ad."),
  ],
  jewelry: [
    p("jewel_macro", "Macro Brilho", "Sparkle Macro",
      "Jewelry macro ad: ring, necklace or watch extreme close-up, facet reflections, black velvet or marble. "
      + "Single spotlight, diamond fire, ultra-sharp metal. Luxury desire — minimal text, maximum sparkle."),
    p("jewel_wrist", "Lifestyle Pulso", "Wrist Lifestyle",
      "Watch/jewelry lifestyle: on wrist or neck during elegant moment — café, gala prep, driving. "
      + "Soft bokeh, aspirational but attainable. Product scale accurate, logo on dial readable."),
    p("jewel_gift", "Presente Luxo", "Luxury Gift",
      "Gift campaign ad: open box with tissue, ribbon, jewelry revealed, warm holiday or anniversary light. "
      + "Emotional gifting story, brand packaging exact from references. Promo for seasonal sale zone."),
    p("jewel_model", "Editorial Modelo", "Editorial Model",
      "High-fashion jewelry editorial: model profile with earring or necklace highlighted, dramatic shadow. "
      + "Runway jewelry campaign, monochrome outfit, piece is sole color accent."),
    p("jewel_flat", "Flat Lay Coleção", "Collection Flat Lay",
      "Collection flat lay: multiple pieces arranged geometrically on silk, overhead soft light. "
      + "Collection launch ad, price tier storytelling, cohesive brand gold/silver tones."),
  ],
  realEstate: [
    p("re_ext", "Fachada Golden", "Golden Facade",
      "Real estate exterior ad: property at golden hour, lawn and sky perfection, wide architectural hero. "
      + "For sale/rent banner zone, premium agency branding. Aspirational homeownership emotion."),
    p("re_int", "Interior Wide", "Interior Wide",
      "Interior design ad: wide-angle living room or kitchen, natural light floods, staged furniture. "
      + "Space, light, lifestyle. Clean lines, no wide distortion faces. Virtual tour promo energy."),
    p("re_detail", "Detalhe Acabamento", "Finish Detail",
      "Luxury detail ad: marble countertop, designer faucet, hardwood grain — craftsmanship close-up. "
      + "Premium finishes marketing for developer or interior brand. Tactile quality story."),
    p("re_aerial", "Vista Aérea", "Aerial View",
      "Aerial property ad: drone-style view of villa, pool, neighborhood context. "
      + "Investment or luxury listing campaign. Clear sky, brand color in graphic overlay zone."),
    p("re_keys", "Entrega Chaves", "Keys Handover",
      "Emotional handover ad: keys in hand, new home door blurred behind, warm backlight. "
      + "Dream achieved narrative, mortgage or agency promo. Human moment plus property bokeh."),
  ],
  fitness: [
    p("fit_action", "Ação Desporto", "Sports Action",
      "Fitness action ad: athlete mid-movement — sprint, lift, yoga peak pose — product worn or held. "
      + "Dynamic sweat and muscle definition, gym or outdoor dramatic light. Performance energy for supplement or apparel."),
    p("fit_product", "Suplemento Hero", "Supplement Hero",
      "Supplement hero ad: tub or bottle with powder splash, gym chalk dust atmosphere. "
      + "Power and purity, label readable, flavor color cues. Pre-workout campaign intensity."),
    p("fit_lifestyle", "Wellness Calm", "Wellness Calm",
      "Wellness lifestyle ad: post-workout calm, towel, water, product on bench, soft window light. "
      + "Recovery and balance narrative, muted brand tones, self-care crossover."),
    p("fit_equipment", "Equipamento", "Equipment",
      "Equipment ad: dumbbell, mat, or tech wearable isolated on rubber gym floor, chalk marks. "
      + "Gritty authentic gym texture, motivational headline zone. Black and brand accent palette."),
    p("fit_group", "Aula Grupo", "Group Class",
      "Group fitness ad: class energy from front row POV, instructor silhouette, community sweat. "
      + "Studio mirrors bokeh, brand apparel visible. Membership promo creative."),
  ],
  general: [
    p("gen_hero", "Produto Hero", "Product Hero",
      "Universal product hero ad: SKU centered on seamless brand-gradient backdrop, soft studio boxes, subtle floor reflection. "
      + "Paid-social conversion layout — headline top, offer middle, product bottom third. Reference-accurate packaging."),
    p("gen_lifestyle", "Lifestyle Contexto", "Context Lifestyle",
      "Context lifestyle ad: product in authentic use environment inferred from brand — home, office, outdoor. "
      + "Natural light, real surfaces, human hands optional. Benefit-led visual story without clutter."),
    p("gen_sale", "Promo Bold", "Bold Promo",
      "High-impact promo ad: product large left, bold diagonal color blocks in brand palette right for % OFF text zone. "
      + "Retail urgency, black Friday energy, readable hierarchy. Still premium not clip-art."),
    p("gen_social", "Social Proof", "Social Proof",
      "Trust ad: product with star rating graphic zone, testimonial quote area, clean UGC-meets-studio hybrid. "
      + "E-commerce Meta classic — credibility + desire. Brand colors unify layout."),
    p("gen_premium", "Luxo Escuro", "Dark Luxury",
      "Dark luxury ad: product spotlit on black, gold or silver accent lines, museum pedestal feel. "
      + "Premium tier positioning, minimal copy, maximum desire. Label micro-detail sharp."),
  ],
};

const ALL_CATEGORY_IDS = Object.keys(PRESETS);

function labelFor(preset, lang) {
  const en = String(lang || "pt").slice(0, 2) === "en";
  return en ? preset.labelEn : preset.labelPt;
}

function listPresetsForCategory(categoryId, lang = "pt") {
  const cat = resolveCategoryId(categoryId);
  if (cat === "random") return [];
  const pool = PRESETS[cat] || PRESETS.general;
  return pool.map((x) => ({ id: x.id, label: labelFor(x, lang) }));
}

function pickRandomCategory() {
  const ids = ALL_CATEGORY_IDS.filter((id) => id !== "general");
  return ids[Math.floor(Math.random() * ids.length)] || "general";
}

function pickBrandCampaignPreset({
  categoryId = "general",
  presetId = "auto",
  conceptIndex = 0,
  lang = "pt",
} = {}) {
  let cat = resolveCategoryId(categoryId);
  if (cat === "random") {
    cat = pickRandomCategory();
  }
  const pool = PRESETS[cat] || PRESETS.general;
  if (!pool.length) return null;

  let chosen;
  if (presetId && presetId !== "auto" && presetId !== "random") {
    chosen = pool.find((x) => x.id === presetId) || pool[conceptIndex % pool.length];
  } else if (presetId === "random") {
    chosen = pool[Math.floor(Math.random() * pool.length)];
  } else {
    chosen = pool[conceptIndex % pool.length];
  }

  return {
    id: chosen.id,
    categoryId: cat,
    label: labelFor(chosen, lang),
    prompt: chosen.prompt,
  };
}

function presetCount() {
  return ALL_CATEGORY_IDS.reduce((n, id) => n + (PRESETS[id]?.length || 0), 0);
}

module.exports = {
  PRESETS,
  listPresetsForCategory,
  pickBrandCampaignPreset,
  presetCount,
};
