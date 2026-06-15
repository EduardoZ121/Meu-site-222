/**
 * Hidden After Effects-style motion flyer prompt library — 10s, Seedance-safe (<3900 chars).
 * Placeholder: __FLYER__
 */

const TIMES = [
  "0:00-0:01", "0:01-0:02", "0:02-0:03", "0:03-0:04", "0:04-0:05",
  "0:05-0:06", "0:06-0:07", "0:07-0:08", "0:08-0:09", "0:09-0:10",
];

const INTRO =
  "Create a professional After Effects-style motion flyer for __FLYER__ using [Image1] as the primary visual reference. "
  + "Analyze all visual layers automatically: main subject, background, typography, logos, decorative graphics, particles, social icons, and supporting elements. "
  + "Preserve the original flyer identity, colors, branding, and composition. Do NOT redesign the flyer. Do NOT alter logos, text content, or branding. "
  + "Enhance through professional animation only. Maintain text readability throughout.";

const STYLE_BASE =
  "Premium After Effects motion graphics, smooth cinematic transitions, advanced parallax, dynamic but controlled movement, "
  + "broadcast-quality promotional aesthetics, high-end social media ad quality, modern commercial motion design.";

const AUDIO_BASE =
  "Audio: rhythmic promotional soundtrack with beat-synced motion accents — intensity responds naturally to music pulses.";

function mf(storyboard, scenes, styleExtra = "") {
  const body = scenes
    .map((s, i) => `Scene ${i + 1} (${TIMES[i]}): ${s}`)
    .join("\n\n");
  return `${INTRO}\n\n${body}\n\n${AUDIO_BASE}\n\nStyle: ${STYLE_BASE} ${styleExtra}`.trim();
}

function entry(id, storyboard, scenes, styleExtra = "") {
  return {
    id,
    storyboard,
    weight: 1,
    generateAudio: true,
    prompt: mf(storyboard, scenes, styleExtra),
  };
}

const MUSIC_EVENT = [
  entry("music_parallax_10", "Cinematic parallax reveal — music event flyer",
    [
      "Cinematic reveal: flyer layers separate with multi-layer parallax — foreground subject, midground typography, deep background. Subtle camera dolly-in through depth haze.",
      "Event title typography animates with smooth kinetic entrance — letters slide and settle with professional easing. All text stays sharp and readable.",
      "Main artist/DJ subject receives subtle life-like motion: breathing, head micro-movement, hair sway, clothing ripple. Identity preserved exactly.",
      "Decorative neon shapes, graffiti accents, and graphic elements pulse gently with rhythmic energy matching the flyer aesthetic.",
      "Environmental effects: floating particles, light streaks, subtle smoke haze, and atmospheric glow matching flyer colors.",
      "Social media icons, music visualizer bars, and secondary badges animate with subtle bounce and glow — complement without distraction.",
      "Professional slow push-in camera move — dynamic framing emphasizes hero subject and event title hierarchy.",
      "Motion intensity builds — beat-synced light pulses and particle bursts increase energy gradually across the composition.",
      "All animated elements settle into natural micro-float — depth hierarchy maintained between layers.",
      "Final hero frame: complete flyer composition polished and readable — premium marketing-ready end card.",
    ], "Music event energy, concert promo motion design."),

  entry("music_strobe_10", "Strobe build — live show flyer",
    [
      "Dark frame — flyer emerges through volumetric light burst with layered parallax depth. Controlled cinematic reveal.",
      "Headline text kinetic animation — staggered letter entrance with smooth settle. Subtext follows with offset timing.",
      "Performing subject subtle motion: confident micro-pose shift, fabric movement, realistic depth on face and body.",
      "Stage-light flares, geometric shapes, and flyer graphics animate in sync with implied beat rhythm.",
      "Atmospheric particles, dust motes, and colored haze float through scene matching flyer palette.",
      "Logos, sponsor marks, and social handles receive gentle scale pulse and glow accents.",
      "Camera slow orbit around central composition — slight rotation adds cinematic depth.",
      "Energy escalates — strobe accents and light pulses intensify toward climax while text remains legible.",
      "Elements ease into controlled hover state — professional motion graphics settling.",
      "Strong hero hold — full flyer visible, all layers aligned, broadcast-quality final frame.",
    ], "Live concert strobe energy, premium event promo."),

  entry("music_vinyl_10", "Vinyl groove — album release flyer",
    [
      "Flyer layers peel apart cinematically — background vinyl texture parallax, midground artwork, foreground typography.",
      "Album/event title slides in with kinetic typography — smooth entrance, subtle drift, natural settle.",
      "Artist portrait or subject: breathing motion, subtle expression shift, hair and clothing micro-animation.",
      "Decorative vinyl rings, waveforms, and graphic accents rotate and pulse organically.",
      "Floating dust particles and warm light leaks match retro-modern flyer mood.",
      "Streaming/social icons and date badges animate with refined motion graphics timing.",
      "Slow cinematic push-in toward album art focal point — depth simulation enhanced.",
      "Rhythm-synced visualizer elements pulse brighter as energy builds through the sequence.",
      "All motion decelerates into elegant float — layers maintain hierarchy.",
      "Final polished hero — complete flyer composition, text crisp, identity intact.",
    ], "Album release aesthetic, warm analog-meets-digital motion."),

  entry("music_bass_10", "Bass drop build — DJ night flyer",
    [
      "Low-angle cinematic open — flyer depth layers reveal through smoke and colored backlight parallax.",
      "Bold title typography slams in with controlled kinetic impact then smooth settle — fully readable.",
      "DJ/artist subject: subtle head nod, shoulder shift, clothing and accessory micro-motion.",
      "Bass-wave graphic elements, equalizer shapes, and decorative flyers graphics ripple with energy.",
      "Particle systems, light beams, and atmospheric fog enhance mood without obscuring text.",
      "Venue info, social icons, and ticket badges animate with subtle professional motion.",
      "Camera pull-back then push-in — dynamic framing with slight dutch angle correction.",
      "Beat-synced intensity ramp — glow pulses and particle speed increase toward drop moment.",
      "Post-peak settle — elements float with controlled premium motion graphics feel.",
      "Hero end card — full flyer locked in polished final composition for marketing use.",
    ], "DJ night bass energy, nightclub promo quality."),
];

const NIGHTCLUB = [
  entry("club_neon_10", "Neon club parallax — nightlife flyer",
    [
      "Neon-lit cinematic reveal — flyer layers split with deep parallax: crowd bokeh background, midground graphics, foreground subject.",
      "Club event title kinetic text entrance — neon glow trails, smooth letter animation, text always readable.",
      "Main subject subtle party motion: confident pose shift, hair movement, outfit ripple under club lighting.",
      "Neon tubes, geometric shapes, and graffiti-style decorations pulse with controlled rhythm.",
      "Smoke, haze, floating light particles, and lens flares match nightclub atmosphere.",
      "Social icons, DJ lineup text blocks, and date badges animate with subtle bounce.",
      "Slow push-in through neon depth — cinematic camera adds engagement.",
      "Energy builds — light pulses sync to implied beat, particles accelerate tastefully.",
      "Motion settles into hypnotic micro-float — premium club promo aesthetic.",
      "Final hero frame — complete flyer, all branding preserved, marketing-ready.",
    ], "Neon nightclub atmosphere, premium party promo."),

  entry("club_laser_10", "Laser sweep — rave flyer",
    [
      "Black void — flyer materializes through laser sweep reveal with multi-layer parallax depth.",
      "Event name typography animates with sleek kinetic slide — glow edges, clean readability maintained.",
      "Subject micro-animation: subtle dance energy, clothing flow, realistic depth on skin tones.",
      "Laser beam graphics, triangular shapes, and decorative elements sweep across composition naturally.",
      "Atmospheric fog, dust, and colored particle trails enhance rave mood.",
      "Logos, VIP badges, and social handles receive refined motion graphics treatment.",
      "Camera slight rotation and push-in — dynamic but controlled framing.",
      "Visual energy ramps with beat-synced laser pulses and particle bursts.",
      "Controlled deceleration — elements settle with professional motion design polish.",
      "Hero composition hold — full flyer visible, identity and text intact.",
    ], "Rave laser aesthetic, high-energy club motion."),

  entry("club_vip_10", "VIP lounge — upscale nightlife flyer",
    [
      "Elegant cinematic reveal — gold and dark tones, parallax separation of flyer layers with luxury depth.",
      "Premium typography entrance — smooth kinetic gold-accent text animation, perfect readability.",
      "Subject subtle confident motion: breathing, slight turn, fabric and jewelry micro-shimmer.",
      "Decorative flourishes, champagne bubble particles, and geometric accents move gracefully.",
      "Soft smoke, bokeh lights, and warm atmospheric texture match upscale club mood.",
      "VIP badges, venue logos, and social elements animate with understated elegance.",
      "Slow cinematic dolly-in — sophisticated camera movement enhances hierarchy.",
      "Gentle energy build — light pulses and particle drift intensify subtly.",
      "Elegant settle — all layers float with premium broadcast motion quality.",
      "Final luxury hero frame — complete flyer polished for high-end promotion.",
    ], "Upscale VIP lounge motion, luxury nightlife promo."),
];

const PROMO = [
  entry("promo_impact_10", "Impact sale reveal — promo flyer",
    [
      "Dynamic cinematic reveal — flyer layers explode into parallax depth with controlled energy, background to foreground.",
      "Sale headline kinetic typography — bold entrance animation, price text slides in smoothly, always readable.",
      "Product or model subject: subtle life-like motion, breathing, clothing shift, preserved identity.",
      "Star bursts, discount badges, arrows, and promo graphics animate with purposeful commercial energy.",
      "Spark particles, light rays, and promotional glow effects match brand colors.",
      "Brand logos, QR codes, and social icons receive subtle professional motion treatment.",
      "Camera push-in on key offer text — cinematic emphasis on promotional message.",
      "Energy builds toward offer climax — beat-synced accents highlight discount elements.",
      "Motion settles — all promo elements align in clean commercial composition.",
      "Final hero — complete sale flyer, text legible, branding intact, ad-ready.",
    ], "High-impact retail promo, commercial motion graphics."),

  entry("promo_countdown_10", "Countdown urgency — limited offer flyer",
    [
      "Tense cinematic open — flyer layers reveal with parallax urgency, subtle camera drift inward.",
      "Headline and offer text kinetic animation — staggered entrance, smooth settle, maximum readability.",
      "Subject or product hero: micro-motion adds life — subtle rotation, fabric or packaging shift.",
      "Countdown graphics, urgency badges, and decorative shapes pulse with controlled tempo.",
      "Particle sparks, light flares, and atmospheric tension effects match promo mood.",
      "Store logos, app icons, and contact info animate with clean motion graphics.",
      "Slow zoom on primary offer — camera emphasizes call-to-action hierarchy.",
      "Rhythm-synced intensity increase — visual energy builds toward urgency peak.",
      "Controlled settle — elements lock into polished promotional layout.",
      "Strong final frame — complete flyer hero, all text and logos preserved.",
    ], "Urgency-driven promo motion, retail advertising quality."),

  entry("promo_minimal_10", "Minimal premium — clean promo flyer",
    [
      "Clean cinematic reveal — subtle parallax between flyer background, content, and foreground accents.",
      "Typography smooth kinetic entrance — elegant letter spacing animation, pristine readability.",
      "Subject subtle motion: breathing, micro-expression, natural depth simulation.",
      "Minimal geometric shapes and line accents animate with refined precision.",
      "Soft floating particles and gentle light gradients enhance without clutter.",
      "Logo and secondary info subtle fade-slide animation — professional restraint.",
      "Slow cinematic push-in — premium commercial camera movement.",
      "Gradual energy build — subtle pulse sync to promotional soundtrack rhythm.",
      "Gentle settle — balanced composition with clear visual hierarchy.",
      "Polished hero end — complete flyer, clean and marketing-ready.",
    ], "Minimal premium promo, Apple-style motion restraint."),
];

const FOOD = [
  entry("food_steam_10", "Steam & appetite — restaurant flyer",
    [
      "Warm cinematic reveal — flyer layers separate with food-themed parallax depth and bokeh kitchen lights.",
      "Restaurant name and dish title kinetic typography — appetizing entrance, text stays crisp and readable.",
      "Chef, server, or food hero subject: subtle motion — steam rise, ingredient shimmer, natural micro-movement.",
      "Decorative utensils, spice particles, and graphic accents animate organically.",
      "Steam wisps, floating herb particles, and warm light pulses match culinary mood.",
      "Logo, delivery app icons, and address badges animate with friendly motion graphics.",
      "Camera slow push-in toward hero dish or subject — appetite-driven framing.",
      "Energy builds — warm glow and particle motion sync to upbeat promo rhythm.",
      "Appetizing settle — layers float with delicious commercial polish.",
      "Final hero — complete menu/flyer frame, branding and text preserved.",
    ], "Appetizing food promo, restaurant commercial motion."),

  entry("food_fresh_10", "Fresh ingredients — food event flyer",
    [
      "Bright cinematic open — flyer parallax reveals fresh color layers from background to foreground.",
      "Event title and menu text kinetic animation — vibrant entrance, perfect legibility.",
      "Food subject or chef portrait: subtle life motion, apron fabric, natural expression shift.",
      "Ingredient splashes, circular badges, and decorative food graphics move naturally.",
      "Water droplets, fresh particle bursts, and light sparkles enhance freshness mood.",
      "Social, delivery, and brand logos animate with clean commercial timing.",
      "Dynamic camera orbit around central food composition — depth and appetite appeal.",
      "Rhythm-synced freshness pulses — energy builds through the sequence.",
      "Smooth settle — premium food advertising motion quality.",
      "Hero final frame — complete flyer readable and marketing-ready.",
    ], "Fresh ingredients energy, food festival promo."),
];

const FASHION = [
  entry("fashion_runway_10", "Runway parallax — fashion event flyer",
    [
      "Editorial cinematic reveal — flyer layers with fashion parallax: backdrop, model, typography foreground.",
      "Brand/event title kinetic text — high-fashion letter animation, smooth settle, always readable.",
      "Model subject: runway micro-motion — confident stride freeze with breathing, hair and fabric flow.",
      "Geometric fashion graphics, paint strokes, and decorative elements move with editorial grace.",
      "Floating fabric particles, light flares, and atmospheric studio haze match flyer palette.",
      "Brand logos, social handles, and date badges receive subtle luxury motion treatment.",
      "Slow cinematic push-in — Vogue-quality camera framing on hero subject.",
      "Energy builds — light pulses and fabric motion intensify with rhythm sync.",
      "Editorial settle — premium fashion motion graphics polish.",
      "Final hero — complete fashion flyer, identity and text intact.",
    ], "High-fashion editorial motion, runway promo quality."),

  entry("fashion_street_10", "Street style — urban fashion flyer",
    [
      "Urban cinematic reveal — graffiti bokeh background parallax, midground graphics, foreground subject.",
      "Streetwear title kinetic typography — bold entrance with urban edge, text fully readable.",
      "Subject subtle street attitude motion: head turn, jacket ripple, hair movement in city wind.",
      "Graffiti shapes, paint splashes, and urban graphic elements animate organically.",
      "Dust particles, city light bokeh, and atmospheric grit match street aesthetic.",
      "Brand tags, social icons, and event info animate with controlled urban energy.",
      "Handheld-style camera push-in — dynamic street commercial framing.",
      "Beat-synced energy build — particles and light accents intensify.",
      "Cool settle — street fashion motion design polish.",
      "Hero end card — complete flyer, branding preserved.",
    ], "Urban streetwear motion, gritty premium fashion promo."),
];

const SPORTS = [
  entry("sports_power_10", "Power impact — sports event flyer",
    [
      "Explosive cinematic reveal — flyer layers burst into parallax depth with stadium energy atmosphere.",
      "Event title kinetic typography — powerful entrance animation, team names readable throughout.",
      "Athlete subject: subtle power pose micro-motion — muscle tension, fabric stretch, sweat particles.",
      "Speed lines, trophy graphics, and sports decorative elements animate with dynamic force.",
      "Impact dust, light streaks, and arena particle effects match sports mood.",
      "Team logos, sponsor badges, and social icons receive bold motion graphics treatment.",
      "Low-angle camera push-in — heroic sports commercial framing.",
      "Energy builds toward climax — beat-synced impact accents and particle bursts.",
      "Power settle — athletic promo motion polish.",
      "Final hero — complete sports flyer, all text and logos preserved.",
    ], "Athletic power motion, sports broadcast promo quality."),

  entry("sports_arena_10", "Arena lights — tournament flyer",
    [
      "Stadium light cinematic reveal — flyer parallax with crowd bokeh and arena depth layers.",
      "Tournament title kinetic text — dramatic entrance, schedule text stays legible.",
      "Athlete or team subject: subtle competitive motion — breathing, gear shift, determined micro-expression.",
      "Court/field graphic overlays, scoreboard accents, and decorative shapes pulse with energy.",
      "Arena dust, spotlight particles, and volumetric light beams enhance atmosphere.",
      "Sponsor logos, ticket info, and social elements animate professionally.",
      "Crane-style camera movement — cinematic sports event framing.",
      "Rhythm-synced intensity ramp — lights and particles build with soundtrack.",
      "Controlled settle — premium sports motion graphics finish.",
      "Hero composition — full tournament flyer marketing-ready.",
    ], "Arena tournament energy, sports event motion design."),
];

const FESTIVAL = [
  entry("festival_sunset_10", "Sunset festival — outdoor event flyer",
    [
      "Golden-hour cinematic reveal — flyer layers with outdoor parallax: sky, stage graphics, foreground typography.",
      "Festival name kinetic typography — warm entrance animation, lineup text readable throughout.",
      "Performer or crowd subject: subtle joyful motion — hair in breeze, clothing ripple, natural depth.",
      "Festival flags, geometric patterns, and decorative art animate with organic festival energy.",
      "Floating pollen, light leaks, and sunset particle haze match outdoor mood.",
      "Sponsor logos, social icons, and ticket badges animate with festive motion graphics.",
      "Slow panoramic camera push — cinematic outdoor event framing.",
      "Energy builds — light pulses and particle drift sync to festival rhythm.",
      "Warm settle — premium festival promo motion polish.",
      "Final hero — complete festival flyer, identity intact.",
    ], "Outdoor festival warmth, premium event motion."),

  entry("festival_multistage_10", "Multi-stage — lineup flyer",
    [
      "Wide cinematic reveal — flyer depth layers reveal stage graphics, artist collage, and title foreground.",
      "Festival headline kinetic text — multi-line smooth entrance, all artist names readable.",
      "Featured artist subjects: subtle individual micro-motion preserving each identity.",
      "Stage icons, timeline graphics, and decorative festival art move naturally.",
      "Confetti particles, smoke plumes, and colored atmospheric effects enhance mood.",
      "Partner logos, social media row, and info badges animate with professional timing.",
      "Dynamic camera sweep across lineup composition — engaging depth hierarchy.",
      "Beat-synced energy escalation through the 10-second sequence.",
      "Festive settle — all elements align in polished layout.",
      "Hero end — complete lineup flyer, marketing-ready final frame.",
    ], "Multi-stage festival energy, lineup promo motion."),
];

const BUSINESS = [
  entry("business_corporate_10", "Corporate reveal — business event flyer",
    [
      "Clean cinematic reveal — professional parallax between flyer background, content blocks, and foreground branding.",
      "Event title kinetic typography — confident corporate entrance, all details readable.",
      "Speaker or professional subject: subtle authoritative micro-motion — breathing, slight gesture, natural depth.",
      "Geometric corporate graphics, line accents, and decorative elements animate with precision.",
      "Subtle particle dust, soft light gradients, and professional atmospheric texture.",
      "Company logos, registration info, and social links animate with restrained motion graphics.",
      "Slow push-in camera — trustworthy corporate commercial framing.",
      "Gradual professional energy build — rhythm-synced subtle light pulses.",
      "Confident settle — premium business motion design polish.",
      "Final hero — complete corporate flyer, branding and text preserved.",
    ], "Corporate professionalism, business event motion quality."),

  entry("business_tech_10", "Tech launch — startup event flyer",
    [
      "Futuristic cinematic reveal — flyer layers with tech parallax depth and digital grid background.",
      "Product/event title kinetic animation — sleek tech typography entrance, perfect readability.",
      "Speaker or product hero: subtle modern motion — screen glow reflection, natural micro-shift.",
      "Circuit patterns, data particles, and tech decorative graphics animate fluidly.",
      "Digital particles, holographic light accents, and atmospheric tech haze.",
      "App logos, QR codes, and social icons receive clean tech motion treatment.",
      "Camera dolly through digital depth — modern launch event framing.",
      "Energy builds — data pulses and particle speed sync to tech soundtrack.",
      "Sleek settle — startup launch motion graphics quality.",
      "Hero final — complete tech event flyer, identity intact.",
    ], "Tech launch aesthetic, modern startup promo motion."),
];

const GENERAL = [
  entry("general_cinematic_10", "Universal cinematic — any flyer",
    [
      "Cinematic reveal — flyer layers separate with professional multi-layer parallax between foreground, midground, and background.",
      "Title typography kinetic entrance — smooth professional text animation, all copy readable throughout.",
      "Main subject subtle life-like motion: breathing, clothing movement, hair motion when applicable, depth simulation.",
      "Decorative shapes, icons, paint effects, and supporting graphics animate according to visual context.",
      "Environmental effects matching flyer mood: floating particles, smoke, dust, lighting pulses, atmospheric textures.",
      "Logos, social media elements, badges, and secondary info animate with subtle motion graphics principles.",
      "Professional camera movement — slow push-in, slight rotation, dynamic framing for depth.",
      "Motion intensity builds gradually — beat-synced accents respond to soundtrack rhythm.",
      "All elements settle into polished micro-float — clear visual hierarchy maintained.",
      "Final hero composition — complete flyer showcased, all branding preserved, marketing-ready.",
    ], "Universal premium motion flyer, After Effects broadcast quality."),

  entry("general_parallax_10", "Deep parallax — layered flyer animation",
    [
      "Opening depth explosion — every flyer layer splits into foreground, mid, and background parallax with cinematic camera drift.",
      "Headline kinetic text slides in with professional easing — subtext follows, readability priority.",
      "Hero subject micro-animation: natural breathing, fabric ripple, environmental interaction, identity locked.",
      "All decorative graphics move in context — shapes, splashes, icons enhance composition naturally.",
      "Atmospheric particles and mood-matched environmental effects float through depth planes.",
      "Brand marks and social icons receive complementary subtle motion treatment.",
      "Slow cinematic orbit camera — adds engagement without chaos.",
      "Rhythm-responsive energy build across all visual layers.",
      "Controlled settling — premium motion design deceleration.",
      "Polished hero hold — full flyer frame, text sharp, brand intact.",
    ], "Advanced parallax motion flyer, depth-rich commercial quality."),

  entry("general_energy_10", "Energy build — promotional flyer",
    [
      "Subtle cinematic open — flyer emerges through light with layered parallax depth introduction.",
      "Typography smooth kinetic reveal — titles and key info animate with professional timing.",
      "Subject receives tasteful life motion — micro-expressions, hair, clothing, realistic depth.",
      "Decorative and graphic elements animate with context-aware natural movement.",
      "Mood-matched particles, glow, and atmospheric effects enhance without overwhelming.",
      "Logos and secondary elements subtle motion graphics polish.",
      "Camera push-pull sequence — cinematic engagement through the middle section.",
      "Visual energy escalates smoothly — sync to promotional soundtrack beats.",
      "Elements converge into balanced final arrangement.",
      "Strong hero end card — complete flyer, promotional impact maximized.",
    ], "Energy-building promo motion, social ad quality."),
];

const PROMPTS_BY_CATEGORY = {
  music_event: MUSIC_EVENT,
  nightclub: NIGHTCLUB,
  promo: PROMO,
  food: FOOD,
  fashion: FASHION,
  sports: SPORTS,
  festival: FESTIVAL,
  business: BUSINESS,
  general: GENERAL,
};

function allPromptEntries() {
  return Object.values(PROMPTS_BY_CATEGORY).flat();
}

module.exports = {
  PROMPTS_BY_CATEGORY,
  allPromptEntries,
};
