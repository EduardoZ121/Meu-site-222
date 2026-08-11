/**
 * Famílias rich — categorias que tinham posts soltos sem grelha de estilos.
 * Run: node scripts/gen-poster-rich.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const PERSON_REF = `REFERENCE PHOTO (mandatory): Use the uploaded photo as the exact same person — preserve 100% of their face, facial features, skin tone, ethnicity, hair texture and likeness. Seamlessly composite them into this poster like professional photo retouching: unified lighting on face and body, natural skin blend, no floating cutout, no pasted sticker look, no disjointed face layer. Place the subject in the pose/position described below while keeping their real identity. Typography and graphic elements must sit in clear layout zones — never let text overlap, cut through or hide behind the face; place headlines in negative space or on background layers behind the subject when needed.

`;

const FOOD_REF = `REFERENCE PHOTO (mandatory): Use the uploaded photo as the exact same dish — preserve plating, textures, colors and food identity. Composite it naturally into the poster with matching lighting, perspective and shadows; no floating cutout look.

`;

const FASHION_REF = `${PERSON_REF}Use the uploaded photo for the person reference. If a second reference image (logo slot) is provided, use it as the clothing/garment reference.
Completely replace the original background and environment.

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
    prompt: `${PERSON_REF}${body.trim()}`,
  };
}

function foodVariant(title, gradient, placeholders, replacements, optional, body) {
  return {
    key: slug(title),
    title,
    labelKey: `post_style_${slug(title)}`,
    gradient,
    placeholders,
    replacements,
    optional: optional || [],
    prompt: `${FOOD_REF}${body.trim()}`,
  };
}

function fashionVariant(title, gradient, placeholders, replacements, optional, body) {
  return {
    key: slug(title),
    title,
    labelKey: `post_style_${slug(title)}`,
    gradient,
    placeholders,
    replacements,
    optional: optional || [],
    prompt: `${FASHION_REF}${body.trim()}`,
  };
}

const RICH_POSTER_FAMILIES = [
  {
    id: "music_artist",
    category: "music",
    label: "ARTIST PROMO",
    subtag: "6 estilos · Streaming & álbum",
    variants: [
      personVariant(
        "Street Energy",
        "linear-gradient(135deg,#0B0B0C 0%,#DC2626 48%,#F4F1EA 100%)",
        ["line_1", "line_2"],
        { line_1: "STREET ENERGY", line_2: "OUT NOW" },
        ["line_2"],
        `Vertical urban music poster, red black white graffiti, paint splashes, rough textures.
Three-quarter back pose, head turned, street attitude.
Large brush typography "{{line_1}}" with "{{line_2}}" badge.
Grunge overlays, barcode, parental advisory. Aggressive street-art album aesthetic.`,
      ),
      personVariant(
        "Chill Session",
        "linear-gradient(135deg,#FDE68A 0%,#F97316 55%,#78350F 100%)",
        ["line_1", "line_2"],
        { line_1: "CHILL MODE", line_2: "LISTEN NOW" },
        [],
        `Vertical lifestyle music poster, warm natural tones, outdoor golden-hour light.
Seated relaxed pose, casual fashion.
Clean typography "{{line_1}}" with "{{line_2}}" and Spotify-style waveform bar.
Minimal lifestyle branding, soft shadows, editorial calm.`,
      ),
      personVariant(
        "Classic Album",
        "linear-gradient(135deg,#0B0B0C 0%,#374151 50%,#CA8A04 100%)",
        ["line_1"],
        { line_1: "CLASSIC DROP" },
        [],
        `Vertical luxury album cover, black textured background, subtle scratches.
Subject centered on steps, full body visible, thin gold decorative frame.
Centered serif "{{line_1}}", small waveform line, top spotlight, cinematic elegant.`,
      ),
      personVariant(
        "Gold Rush",
        "linear-gradient(135deg,#F59E0B 0%,#EA580C 52%,#0B0B0C 100%)",
        ["line_1", "line_2"],
        { line_1: "GOLD RUSH", line_2: "NEW ERA" },
        [],
        `Vertical energetic pop promo, warm yellow-orange palette, motion streaks.
Subject close portrait right, large circular ring graphic, diagonal paint stroke.
Typography "{{line_1}}" and "{{line_2}}", dotted grid, golden highlights, vibrant campaign.`,
      ),
      personVariant(
        "New Single",
        "linear-gradient(135deg,#020617 0%,#14532D 55%,#22C55E 100%)",
        ["line_1", "line_2"],
        { line_1: "NEW SINGLE", line_2: "OUT NOW" },
        [],
        `Vertical dark streaming promo, deep black with green glow from left.
Subject upper body left, facing right. Stacked bold text "{{line_1}}" neon green gradient.
Top badge "{{line_2}}", small Spotify logo, parental advisory, crosshair UI accents.`,
      ),
      personVariant(
        "Vol Editorial",
        "linear-gradient(135deg,#E5E7EB 0%,#3B82F6 48%,#1E3A8A 100%)",
        ["line_1", "line_2", "line_3"],
        { line_1: "VOL.02", line_2: "ARTIST NAME", line_3: "LISTEN ON SPOTIFY" },
        [],
        `Vertical clean editorial poster, light gray paper texture.
Subject bottom-right profile, blue horizontal brush stroke behind.
Top "{{line_1}}", bold blue "{{line_2}}", script accent line, bottom "{{line_3}}".
Plus-symbol grid, globe icon, refined music branding.`,
      ),
    ],
  },
  {
    id: "music_nightlife",
    category: "music",
    label: "CLUB & DJ",
    subtag: "5 estilos · Neon & EDM",
    variants: [
      personVariant(
        "Neon Club",
        "linear-gradient(135deg,#020617 0%,#7C3AED 48%,#EC4899 100%)",
        ["line_1"],
        { line_1: "NIGHT VIBES" },
        [],
        `Vertical nightclub poster, neon purple pink lighting, dark background, glow effects.
DJ performance pose, dynamic lighting, smoke and crowd silhouettes.
Neon typography "{{line_1}}", light beams, electronic nightlife aesthetic.`,
      ),
      personVariant(
        "Underground Drop",
        "linear-gradient(135deg,#0B0B0C 0%,#450A0A 50%,#EF4444 100%)",
        ["line_1", "line_2"],
        { line_1: "UNDERGROUND", line_2: "DROP" },
        [],
        `Vertical aggressive club poster, black background, red paint splashes, white scratches.
Subject seated center, layered brush typography "{{line_1}}" white and "{{line_2}}" red offset.
Hand-drawn crown, barcode, parental advisory, hard directional lighting.`,
      ),
      personVariant(
        "Frequency",
        "linear-gradient(135deg,#0B0B0C 0%,#6D28D9 45%,#DB2777 100%)",
        ["line_1"],
        { line_1: "NIGHT FREQUENCY" },
        [],
        `Vertical DJ poster, neon purple magenta, subject right over mixer, controller foreground.
Diagonal neon light bars, fog layers, glowing "{{line_1}}" blue-pink gradient, waveform bar bottom.`,
      ),
      personVariant(
        "Sunset Sound",
        "linear-gradient(135deg,#F97316 0%,#FB7185 50%,#581C87 100%)",
        ["line_1", "line_2"],
        { line_1: "SUNSET SOUND", line_2: "LIVE SET" },
        [],
        `Vertical sunset festival poster, orange-pink-purple gradient sky, palm silhouettes.
Subject mid-frame performing, warm rim light, bold "{{line_1}}" and badge "{{line_2}}".
Open-air concert energy, lens flare, summer nightlife.`,
      ),
      personVariant(
        "Stream Control",
        "linear-gradient(135deg,#F4F1EA 0%,#14532D 55%,#052E16 100%)",
        ["line_1", "line_2"],
        { line_1: "STREAM CONTROL", line_2: "VOL.01" },
        [],
        `Vertical minimal streaming UI poster, white paper texture, thin dark green frame.
Subject bottom-left, green brush ribbon diagonal. Top-left "{{line_1}}", top-right "{{line_2}}".
Centered audio player UI, waveform, clean modern layout.`,
      ),
    ],
  },
  {
    id: "motivational_impact",
    category: "motivational",
    label: "MOTIVAÇÃO",
    subtag: "6 estilos · Mindset premium",
    variants: [
      personVariant(
        "Discipline Today",
        "linear-gradient(135deg,#0B0B0C 0%,#1F2937 50%,#F59E0B 100%)",
        ["line_1", "line_2", "line_3"],
        { line_1: "DISCIPLINE", line_2: "STARTS TODAY", line_3: "NOT TOMORROW" },
        [],
        `Vertical motivational poster, dark charcoal with gold accents, cinematic portrait.
Subject powerful forward gaze, low-angle hero framing.
Massive stacked typography "{{line_1}}", "{{line_2}}", quote strip "{{line_3}}".
Dust particles, dramatic contrast, premium mindset campaign.`,
      ),
      personVariant(
        "No Limits",
        "linear-gradient(135deg,#020617 0%,#0E7490 48%,#22D3EE 100%)",
        ["line_1", "line_2"],
        { line_1: "NO LIMITS", line_2: "ONLY PROGRESS" },
        [],
        `Vertical bold motivational poster, deep navy to cyan gradient, geometric lines.
Subject athletic silhouette breaking forward, motion blur accents.
Oversized "{{line_1}}", subhead "{{line_2}}", clean sans-serif, high-energy sports brand.`,
      ),
      personVariant(
        "Mindset Power",
        "linear-gradient(135deg,#18181B 0%,#7C3AED 50%,#C4B5FD 100%)",
        ["line_1", "line_2", "line_3"],
        { line_1: "MINDSET", line_2: "IS EVERYTHING", line_3: "TRAIN YOUR THOUGHTS" },
        [],
        `Vertical purple editorial motivation poster, soft glow aura behind subject.
Centered portrait, calm confident expression, minimalist frame.
Typography hierarchy "{{line_1}}", "{{line_2}}", footer mantra "{{line_3}}".`,
      ),
      personVariant(
        "Execute Now",
        "linear-gradient(135deg,#0B0B0C 0%,#991B1B 45%,#F4F1EA 100%)",
        ["line_1", "line_2"],
        { line_1: "EXECUTE", line_2: "NO EXCUSES" },
        [],
        `Vertical aggressive motivation poster, black and crimson, distressed textures.
Subject mid-action sprint or push-up, gritty documentary lighting.
Huge condensed "{{line_1}}", stamp-style "{{line_2}}", barcode detail, raw energy.`,
      ),
      personVariant(
        "New Chance",
        "linear-gradient(135deg,#ECFEFF 0%,#0891B2 52%,#164E63 100%)",
        ["line_1", "line_2", "line_3"],
        { line_1: "NEW CHANCE", line_2: "NEW YOU", line_3: "BEGIN AGAIN" },
        [],
        `Vertical hopeful motivational poster, sunrise teal gradient, soft light rays.
Subject standing on rooftop or open road, silhouette with rim light.
Elegant serif + sans pairing for "{{line_1}}", "{{line_2}}", caption "{{line_3}}".`,
      ),
      personVariant(
        "Rise Higher",
        "linear-gradient(135deg,#0B0B0C 0%,#854D0E 48%,#FACC15 100%)",
        ["line_1", "line_2"],
        { line_1: "RISE HIGHER", line_2: "YOUR TIME IS NOW" },
        [],
        `Vertical golden motivation poster, black to amber, light beams from above.
Subject arms raised victory pose, epic cinematic scale.
Metallic gold "{{line_1}}", supporting line "{{line_2}}", particle dust, championship energy.`,
      ),
    ],
  },
  {
    id: "food_signature",
    category: "food",
    label: "PRATO ASSINATURA",
    subtag: "5 estilos · Promo gastronómica",
    variants: [
      foodVariant(
        "Chef Table",
        "linear-gradient(135deg,#0B0B0C 0%,#78350F 48%,#F5F5DC 100%)",
        ["line_1", "line_2", "line_3"],
        { line_1: "SABORES QUE CONECTAM", line_2: "RESTAURANTE", line_3: "RESERVE JÁ" },
        [],
        `Elegant vertical fine-dining promo, dark background, gold geometric frame.
Featured dish center, wine glass subtle background, warm dramatic lighting.
Gold white typography "{{line_1}}", subtitle "{{line_2}}", CTA banner "{{line_3}}".`,
      ),
      foodVariant(
        "Artisan Burger",
        "linear-gradient(135deg,#451A03 0%,#EA580C 50%,#FEF3C7 100%)",
        ["line_1", "line_2"],
        { line_1: "BURGER ARTESANAL", line_2: "FEITO NA BRASA" },
        [],
        `Vertical bold burger promo, warm rustic wood and fire glow.
Hero burger close-up, melting cheese, steam, dynamic angle.
Heavy display type "{{line_1}}", badge "{{line_2}}", craft food photography, rich colors.`,
      ),
      foodVariant(
        "Oriental Luxe",
        "linear-gradient(135deg,#0B0B0C 0%,#991B1B 45%,#CA8A04 100%)",
        ["line_1", "line_2", "line_3"],
        { line_1: "SABOR ORIENTAL", line_2: "AUTÊNTICO", line_3: "DELIVERY" },
        [],
        `Vertical luxury Asian cuisine poster, red and gold palette, lantern bokeh.
Dish in ceramic bowl elevated angle, chopsticks, steam wisps.
Typography "{{line_1}}", accent "{{line_2}}", footer "{{line_3}}", premium commercial look.`,
      ),
      foodVariant(
        "Experience Unique",
        "linear-gradient(135deg,#1A1A1C 0%,#374151 50%,#CA8A04 100%)",
        ["line_1", "line_2", "line_3"],
        { line_1: "EXPERIÊNCIA ÚNICA", line_2: "GASTRONOMIA PREMIUM", line_3: "RESERVE SUA MESA" },
        [],
        `Sophisticated dark fine-dining ad, soft gold accents, cinematic plating.
Dish refined presentation, garnish details, icons column right.
Headline "{{line_1}}", sub "{{line_2}}", bottom gold banner "{{line_3}}".`,
      ),
      foodVariant(
        "Quality Taste",
        "linear-gradient(135deg,#FEF3C7 0%,#16A34A 50%,#14532D 100%)",
        ["line_1", "line_2"],
        { line_1: "SABOR & QUALIDADE", line_2: "INGREDIENTES FRESCOS" },
        [],
        `Bright fresh restaurant promo, light background, green organic curves.
Dish upper-left on clean plate, scattered vegetables decorative.
Bold "{{line_1}}", tagline "{{line_2}}", healthy premium branding.`,
      ),
    ],
  },
  {
    id: "fashion_editorial",
    category: "fashion",
    label: "FASHION EDITORIAL",
    subtag: "6 estilos · Lookbook premium",
    variants: [
      fashionVariant(
        "Character Showcase",
        "linear-gradient(135deg,#0B0B0C 0%,#78350F 42%,#F5F5DC 100%)",
        [],
        {},
        [],
        `hyper-realistic person, warm cinematic lighting, high-end fashion editorial photography.
Professional fashion character showcase sheet: hero image, turnaround front/side/back, facial close-up, hair and outfit detail panels, minimalist elegant layout, warm beige seamless backdrop, color palette swatches matching clothing.`,
      ),
      fashionVariant(
        "Portfolio Sheet",
        "linear-gradient(135deg,#E8E0D5 0%,#A8A29E 50%,#57534E 100%)",
        [],
        {},
        [],
        `hyper-realistic person, luxury campaign presentation, professional fashion portfolio sheet.
Large hero ~45% frame, turnaround views, accessory and footwear detail panels, integrated color swatches, warm beige studio backdrop, Vogue-style layout.`,
      ),
      fashionVariant(
        "Runway Grid",
        "linear-gradient(135deg,#0B0B0C 0%,#4C1D95 48%,#E4E4E7 100%)",
        [],
        {},
        [],
        `hyper-realistic person, high-fashion runway editorial sheet, 2x3 panel grid on black studio.
Full-length walk pose, profile, detail zoom on fabric texture, bold purple accent lighting, luxury couture week aesthetic, clean gutters between panels.`,
      ),
      fashionVariant(
        "Couture Portrait",
        "linear-gradient(135deg,#18181B 0%,#71717A 55%,#FAFAF9 100%)",
        [],
        {},
        [],
        `hyper-realistic close-up fashion portrait sheet, soft Rembrandt lighting, neutral gray seamless.
Hero beauty portrait, collarbone crop, fabric drape detail, monochrome with single gold accent line, Harper's Bazaar elegance.`,
      ),
      fashionVariant(
        "Street Lookbook",
        "linear-gradient(135deg,#0B0B0C 0%,#DC2626 42%,#FACC15 100%)",
        [],
        {},
        [],
        `hyper-realistic person, urban streetwear lookbook sheet, graffiti texture borders muted.
Full outfit front, seated editorial, shoe detail, accessory flat-lay panel, energetic red-yellow accents, hype culture magazine layout.`,
      ),
      fashionVariant(
        "Magazine Cover",
        "linear-gradient(135deg,#F5F5DC 0%,#0B0B0C 50%,#CA8A04 100%)",
        ["line_1", "line_2"],
        { line_1: "FASHION", line_2: "ISSUE 01" },
        [],
        `hyper-realistic person, single premium fashion magazine cover composition (not multi-panel).
Subject dominant center, masthead "{{line_1}}" top, issue badge "{{line_2}}", barcode strip, coverlines left, gold foil accents, ELLE/Vogue cover quality.`,
      ),
    ],
  },
  {
    id: "fitness_gym",
    category: "fitness",
    label: "GYM INTENSO",
    subtag: "5 estilos · Campanha fitness",
    variants: [
      personVariant(
        "Beast Mode",
        "linear-gradient(135deg,#0B0B0C 0%,#14532D 50%,#22C55E 100%)",
        ["line_1", "line_2", "line_3"],
        { line_1: "BEAST MODE", line_2: "NO PAIN NO GAIN", line_3: "JOIN TODAY" },
        [],
        `Vertical gym poster, black background neon green paint splash.
Subject muscular upper body with dumbbell right side. Stacked "{{line_1}}" white and green.
Badge "{{line_2}}", bullet list BUILD MUSCLE BURN FAT, CTA "{{line_3}}", hard gym lighting.`,
      ),
      personVariant(
        "Train Hard",
        "linear-gradient(135deg,#FAFAF9 0%,#DC2626 48%,#0B0B0C 100%)",
        ["line_1", "line_2", "line_3"],
        { line_1: "TRAIN HARD", line_2: "STAY FOCUSED", line_3: "JOIN THE MOVEMENT" },
        [],
        `Vertical clean gym poster, white textured background red accents.
Subject crouched athletic starting pose center. Bold "{{line_1}}", sub "{{line_2}}".
Icons STRENGTH FOCUS DISCIPLINE, bottom CTA "{{line_3}}", modern structured layout.`,
      ),
      personVariant(
        "Strong Life",
        "linear-gradient(135deg,#020617 0%,#1D4ED8 50%,#38BDF8 100%)",
        ["line_1", "line_2"],
        { line_1: "STRONG LIFE", line_2: "YOUR ONLY LIMIT IS YOU" },
        [],
        `Vertical gym poster, dark blue gradient mist, back view barbell wide stance.
Center brush typography "{{line_1}}", top mantra "{{line_2}}", bottom JOIN US, rim glow spotlight.`,
      ),
      personVariant(
        "Iron Club",
        "linear-gradient(135deg,#0B0B0C 0%,#44403C 50%,#EF4444 100%)",
        ["line_1", "line_2", "line_3"],
        { line_1: "IRON CLUB", line_2: "LIFT HEAVY", line_3: "LIVE STRONG" },
        [],
        `Vertical industrial gym poster, concrete textures, red accent stripes.
Subject gripping barbell, chalk dust, gritty documentary style.
Distressed "{{line_1}}", tags "{{line_2}}" "{{line_3}}", warehouse gym atmosphere.`,
      ),
      personVariant(
        "Discipline Zone",
        "linear-gradient(135deg,#18181B 0%,#7C3AED 48%,#C4B5FD 100%)",
        ["line_1", "line_2"],
        { line_1: "DISCIPLINE ZONE", line_2: "RESULTS START HERE" },
        [],
        `Vertical premium fitness poster, purple gradient, modern boutique gym.
Subject dynamic lunge or battle rope, clean studio lighting.
Bold sans "{{line_1}}", subtitle "{{line_2}}", minimal icons row, upscale wellness club branding.`,
      ),
    ],
  },
];

function buildRichPosterTemplates() {
  return RICH_POSTER_FAMILIES.map((family) => {
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

const jsOut = `/**
 * Posters rich — famílias com grelha de estilos (music, motivational, food, fashion, fitness).
 * AUTO-GENERATED — edit scripts/gen-poster-rich.mjs and re-run.
 */
export const RICH_POSTER_FAMILIES = ${JSON.stringify(RICH_POSTER_FAMILIES, null, 2)};

export function buildRichPosterTemplates() {
  return RICH_POSTER_FAMILIES.map((family) => {
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

export function registerRichStyleVariants(registerFn) {
  for (const family of RICH_POSTER_FAMILIES) {
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
`;

fs.writeFileSync(path.join(root, "src/lib/posterRichFamilies.js"), jsOut);
fs.writeFileSync(
  path.join(root, "api/lib/posterRichTemplatesData.json"),
  JSON.stringify(buildRichPosterTemplates(), null, 2),
);
console.log(`Generated posterRichFamilies.js (${RICH_POSTER_FAMILIES.length} families, ${RICH_POSTER_FAMILIES.reduce((n, f) => n + f.variants.length, 0)} variants)`);
