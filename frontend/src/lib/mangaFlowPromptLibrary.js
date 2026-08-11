/**
 * Prompts ocultos por opção do Manga Studio (UI mostra label curta; IA recebe direção completa).
 * Mesmo padrão do marketingVideoPromptLibrary — nunca expor estes textos na interface.
 */

const POSE = {
  standing: "Neutral standing weight shift, relaxed shoulders, natural manga idle — not a stiff model pose.",
  running: "Mid-stride run: back leg pushing off, front knee lifted, arms pumping, motion blur optional on limbs.",
  sitting: "Seated with believable weight on hips/chair/ground; knees and hands placed naturally.",
  jumping: "Peak jump or takeoff — hair/clothes react to motion, dynamic diagonal body line.",
  fighting: "Combat stance: guard up, twisted torso, impact-ready limbs; action lines allowed.",
  hugging: "Embrace with visible arm wrap and body contact; emotional closeness readable.",
  looking_back: "Torso turned away, head glancing back over shoulder; eyeline toward off-panel target.",
  kneeling: "One or both knees down; gravity on fabric and posture believable.",
  leaning: "Weight on wall/rail/another person; casual or tired body language.",
  crouching: "Low center of gravity, knees bent, ready to move or hide.",
  walking: "Mid-walk gait cycle — one foot forward, opposite arm swing.",
  flying: "Suspended in air — cape/hair upward, heroic or magical lift pose.",
  falling: "Loss of balance or aerial drop — limbs trailing, panic or impact anticipation.",
  dancing: "Rhythmic motion — arms/legs in dance position, flow in fabric.",
  sleeping: "Collapsed or curled rest pose; eyes closed, relaxed limbs.",
  pointing: "Arm extended pointing at target; eyeline follows finger; clear gesture line.",
};

const EMOTION = {
  normal: "Calm neutral face — relaxed brows, closed or soft mouth.",
  happy: "Genuine smile, bright eyes, uplifted cheeks.",
  angry: "Furrowed brows, tight jaw, intense eyeline.",
  sad: "Downcast eyes, drooping mouth, subtle tear optional.",
  surprised: "Wide eyes, raised brows, open mouth — shock beat.",
  serious: "Focused gaze, minimal smile, controlled tension.",
  blushing: "Pink cheeks, shy eyes averted, embarrassed micro-expression.",
  crying: "Tears on cheeks, trembling mouth, grief or relief.",
  laughing: "Open laugh, closed or squinting eyes, joyful energy.",
  scared: "Fear widened eyes, sweat drop optional, defensive body.",
  disgusted: "Wrinkled nose, narrowed eyes, recoiling head.",
  confused: "One brow raised, puzzled mouth, tilted head.",
  determined: "Steely eyes, firm mouth, forward-leaning intensity.",
  smirking: "Asymmetric half-smile, confident or mischievous.",
  embarrassed: "Blush + awkward smile, hunched shoulders.",
  exhausted: "Half-lidded eyes, slumped posture, sweat optional.",
};

const PERSON_CAMERA = {
  extreme_close_up: "Frame eyes/mouth only — micro-expression dominates.",
  close_up: "Head and shoulders; emotional read priority.",
  medium_close: "Chest-up; dialogue-friendly framing.",
  medium: "Waist-up standard manga dialogue shot.",
  medium_full: "Knees-up — outfit and gesture visible.",
  full_body: "Entire figure head to toe in frame.",
  wide: "Character small in environment — context shot.",
  front_view: "Facing camera but in-scene action, not passport photo.",
  side_view: "Strict profile — body turned 90°, nose/chin silhouette.",
  back_view: "From behind — face hidden, back of hair/outfit.",
  three_quarter_view: "3/4 turn — depth on face and torso.",
  top_view: "Camera above looking down — spatial layout.",
  low_angle: "Camera below — heroic towering perspective.",
  high_angle: "Camera above subject — vulnerability or overview.",
  dutch_angle: "Tilted horizon — kinetic tension.",
  over_shoulder: "Foreground shoulder, subject in mid-ground.",
  birds_eye: "Far top-down — map-like composition.",
  worms_eye: "Ground-level looking up — extreme foreshortening.",
  dynamic_perspective: "Strong foreshortening and diagonal action lines.",
};

const SCENARIO_TIME = {
  day: "Bright daylight, clear shadows, blue sky tone.",
  sunset: "Golden hour warm rim light, long shadows, orange sky.",
  night: "Dark sky, artificial or moon fill, high contrast pools of light.",
  dawn: "Soft pink-blue early light, mist optional.",
  midnight: "Deep night, minimal ambient, strong contrast.",
  noon: "Harsh overhead sun, short shadows, high saturation.",
  golden_hour: "Warm cinematic side light, soft haze.",
  twilight: "Blue hour — cool ambient, city lights waking.",
};

const SCENARIO_WEATHER = {
  clear: "Clear visibility, crisp atmosphere.",
  rain: "Visible rain streaks, wet surfaces, reflective ground.",
  storm: "Dark clouds, wind, dramatic lightning optional.",
  snow: "Falling snowflakes, white ground accumulation.",
  fog: "Reduced visibility, soft depth falloff.",
  windy: "Hair/clothes blown, debris or leaves in air.",
  hail: "Ice pellets, tense atmosphere.",
  cloudy: "Overcast diffuse light, muted colors.",
};

const SCENARIO_MOOD = {
  neutral: "Balanced everyday tone.",
  tense: "Held breath energy — tight composition, sharp shadows.",
  romantic: "Soft focus warmth, intimate spacing between characters.",
  mysterious: "Shadows, partial reveals, cool palette.",
  epic: "Grand scale, dramatic light, heroic staging.",
  melancholic: "Muted colors, empty space, reflective mood.",
  chaotic: "Crowded motion, overlapping elements, high energy.",
  peaceful: "Calm horizon, gentle light, stillness.",
  horror: "Uncanny shadows, unsettling angles, desaturated.",
  comedic: "Exaggerated expressions, visual gags space.",
};

const SCENARIO_LIGHTING = {
  bright: "Even high-key illumination.",
  dark: "Low-key, heavy shadows.",
  dramatic: "Strong key/fill ratio, rim light.",
  soft: "Diffused wrap light, minimal harsh shadow.",
  neon: "Colored neon glow, cyberpunk reflections.",
  candlelight: "Warm flicker, small light source.",
  moonlight: "Cool blue silvery fill.",
  spotlight: "Single pool of light on subject.",
};

const EFFECT_TYPE = {
  motion_lines: "Speed/motion lines trailing movement.",
  impact: "Impact star burst at hit point.",
  sparkle: "Sparkle particles — magic or beauty.",
  explosion: "Explosion bloom and debris.",
  speed_lines: "Classic manga speed lines radiating from action.",
  smoke: "Smoke plumes obscuring or framing.",
  fire: "Flames on subject or background.",
  lightning: "Electric bolts and flash highlights.",
  aura: "Energy aura outline around character.",
  rain_drops: "Rain overlay on panel.",
  shockwave: "Radial shockwave distortion.",
  hearts: "Floating heart symbols — romance/comedy.",
  sweat_drop: "Anime sweat drop — stress/comedy.",
  anger_vein: "Popping anger vein mark — comedic rage.",
};

const EFFECT_INTENSITY = {
  subtle: "Light touch — suggest effect without overpowering art.",
  medium: "Clear readable effect balanced with scene.",
  strong: "Bold dominant effect shaping composition.",
  extreme: "Maximum impact — effect is the visual focus.",
};

const SPEECH_TYPE = {
  speech: "Standard speech bubble with tail to speaker mouth.",
  thought: "Cloud-shaped thought bubble, softer outline.",
  scream: "Jagged burst bubble, bold lettering.",
  whisper: "Small dotted whisper bubble.",
  narration: "Rectangular narration box, no tail.",
};

const SPEECH_STYLE = {
  normal: "Clean round bubble borders.",
  jagged: "Spiky burst edges — shock/shout.",
  cloud: "Fluffy cloud outline — thoughts/dreams.",
  burst: "Explosion-shaped bubble outline.",
  drip: "Dripping horror-style bubble edge.",
  electric: "Crackling electric border on bubble.",
};

const CAMERA_SHOT = {
  extreme_close_up: "ECU — eyes or detail only.",
  close_up: "CU — face dominates frame.",
  medium: "MS — waist-up dialogue framing.",
  wide: "WS — environment + figures.",
  establishing: "Establishing wide — place and scale.",
  panoramic: "Ultra-wide panoramic composition.",
};

const CAMERA_ANGLE = {
  eye_level: "Eye-level camera — natural in-scene 3/4 body.",
  front_view: "Direct front — only when beat requires.",
  side_view: "Profile camera — body must be in profile.",
  back_view: "From behind subject.",
  three_quarter_view: "3/4 camera on subject.",
  top_view: "Top-down camera.",
  low_angle: "Low angle looking up.",
  high_angle: "High angle looking down.",
  dutch_angle: "Tilted dutch angle.",
  birds_eye: "Bird's-eye far above.",
  worms_eye: "Worm's-eye from ground.",
  over_shoulder: "OTS framing.",
  dynamic_perspective: "Dynamic forced perspective.",
};

const PANEL_SIZE = {
  small: "Small inset panel — detail or reaction.",
  medium: "Standard panel proportion.",
  large: "Large dominant panel — key beat.",
  full_page: "Full page splash — single image dominates.",
  double_spread: "Double-page spread width.",
};

const PANEL_FORMAT = {
  square: "Square panel crop.",
  rectangle: "Classic horizontal rectangle panel.",
  tall: "Tall vertical strip panel.",
  wide: "Wide cinematic strip.",
  dynamic: "Irregular dynamic panel shape.",
  circle: "Circular panel inset.",
  diagonal: "Diagonal slanted panel border.",
};

const PANEL_BORDER = {
  thick: "Bold black panel border.",
  thin: "Thin clean panel border.",
  none: "Borderless bleed to edge.",
  artistic: "Hand-drawn irregular ink border.",
  double: "Double-line panel frame.",
  rough: "Rough sketchy border.",
};

const OBJECT_SIZE = {
  tiny: "Tiny prop — detail scale.",
  small: "Hand-held small object.",
  medium: "Standard prop scale.",
  large: "Large prop — furniture/weapon length.",
  huge: "Massive object — vehicle/building scale.",
};

const OBJECT_STATE = {
  normal: "Pristine normal state.",
  broken: "Cracked, shattered or damaged.",
  glowing: "Emits light or magical glow.",
  wet: "Wet surface, droplets visible.",
  burning: "On fire with flames/smoke.",
  frozen: "Ice-coated, frost visible.",
  rusty: "Oxidized weathered metal.",
  shiny: "Polished reflective surface.",
  bloody: "Blood-stained (stylized manga).",
  transparent: "Ghostly or glass transparent.",
};

const GEN_STYLE = {
  manga: "Japanese manga B&W ink, screentone, professional print quality.",
  anime: "Full-color anime cel shading, vibrant palette.",
  comic: "Western comic bold inks and halftone.",
  realistic: "Semi-realistic render with manga composition.",
  ghibli: "Soft watercolor Ghibli-inspired backgrounds and characters.",
  webtoon: "Clean digital webtoon vertical-friendly art.",
  retro: "Retro 80s/90s screentone manga aesthetic.",
};

const ASPECT = {
  "3:4": "Portrait 3:4 — standard manga page proportions.",
  "4:5": "Portrait 4:5 — mobile/web manga page.",
  "1:1": "Square composition.",
  "9:16": "Vertical story/webtoon strip.",
  "16:9": "Cinematic widescreen panel.",
};

const ACTION_SPEED = {
  slow: "Slow-motion beat — elongated pose, trailing motion cues.",
  normal: "Natural real-time action speed.",
  fast: "Fast action — blur lines, compressed timing.",
  instant: "Instant snap action — impact frame, no wind-up.",
};

const LAYER = {
  foreground: "Foreground layer — large, sharp, overlaps midground.",
  midground: "Midground — main action plane.",
  background: "Background layer — smaller, softer detail, depth of field.",
};

const AMBIENT_FX = {
  none: "No ambient particle overlay.",
  particles: "Floating dust/magic particles in air.",
  fog: "Atmospheric fog reducing distance clarity.",
  rain_drops: "Ambient rain streaks across panel.",
  falling_leaves: "Autumn leaves drifting through frame.",
  fireflies: "Glowing fireflies at dusk.",
  dust: "Dust motes in light beams.",
  snow_flakes: "Gentle snow falling in scene.",
  sakura_petals: "Cherry blossom petals drifting — romantic/spring.",
};

const TRANSITION = {
  none: "Hard cut — no transition effect.",
  fade_in: "Fade-in entrance from white/black.",
  slide_left: "Panel/element enters sliding from right.",
  slide_right: "Panel/element enters sliding from left.",
  zoom_in: "Zoom-in reveal on entrance.",
  drop: "Drop-in from above — comedic or sudden.",
  fade_out: "Fade-out exit to white/black.",
  zoom_out: "Zoom-out departure.",
  dissolve: "Cross-dissolve exit blend.",
};

const TAIL_DIRECTION = {
  left: "Speech bubble tail points left toward speaker.",
  right: "Speech bubble tail points right toward speaker.",
  top: "Tail points upward to speaker above bubble.",
  bottom: "Tail points downward to speaker below bubble.",
  none: "No tail — narration box or off-panel voice.",
};

const NARRATIVE_ROLE = {
  introduction: "Establish scene, setting and characters; wide or medium establishing energy.",
  transition: "Bridge moment — movement, location shift or time pass.",
  dialogue: "Dialogue-focused framing — faces readable, bubbles clear.",
  action: "Peak physical action — dynamic pose and motion lines.",
  reaction: "Emotional reaction beat — expression dominates.",
  close_up: "Tight close-up on face or detail.",
  tension: "Suspense beat — tight framing, held breath.",
  climax: "Story climax — maximum visual impact.",
  aftermath: "Resolution beat — consequences visible, calmer energy.",
};

export function hiddenPrompt(category, id) {
  if (!id) return "";
  const key = String(id).trim();
  const maps = {
    pose: POSE,
    emotion: EMOTION,
    person_camera: PERSON_CAMERA,
    scenario_time: SCENARIO_TIME,
    scenario_weather: SCENARIO_WEATHER,
    scenario_mood: SCENARIO_MOOD,
    scenario_lighting: SCENARIO_LIGHTING,
    effect_type: EFFECT_TYPE,
    effect_intensity: EFFECT_INTENSITY,
    speech_type: SPEECH_TYPE,
    speech_style: SPEECH_STYLE,
    camera_shot: CAMERA_SHOT,
    camera_angle: CAMERA_ANGLE,
    panel_size: PANEL_SIZE,
    panel_format: PANEL_FORMAT,
    panel_border: PANEL_BORDER,
    object_size: OBJECT_SIZE,
    object_state: OBJECT_STATE,
    gen_style: GEN_STYLE,
    aspect: ASPECT,
    action_speed: ACTION_SPEED,
    layer: LAYER,
    ambient_fx: AMBIENT_FX,
    transition: TRANSITION,
    tail_direction: TAIL_DIRECTION,
    narrative_role: NARRATIVE_ROLE,
  };
  const map = maps[category];
  return map?.[key] || "";
}

/** Prompts ocultos para um nó do grafo (person, scenario, etc.). */
export function hiddenPromptsForNode(node) {
  if (!node?.type) return [];
  const d = node.data || {};
  const out = [];

  switch (node.type) {
    case "person":
    case "support":
      if (d.pose) out.push(hiddenPrompt("pose", d.pose));
      if (d.emotion) out.push(hiddenPrompt("emotion", d.emotion));
      if (d.cameraAngle) out.push(hiddenPrompt("person_camera", d.cameraAngle));
      if (d.actionSpeed) out.push(hiddenPrompt("action_speed", d.actionSpeed));
      if (d.layer) out.push(hiddenPrompt("layer", d.layer));
      if (d.speechType) out.push(hiddenPrompt("speech_type", d.speechType));
      break;
    case "scenario":
      if (d.timeOfDay) out.push(hiddenPrompt("scenario_time", d.timeOfDay));
      if (d.weather) out.push(hiddenPrompt("scenario_weather", d.weather));
      if (d.mood) out.push(hiddenPrompt("scenario_mood", d.mood));
      if (d.lighting) out.push(hiddenPrompt("scenario_lighting", d.lighting));
      if (d.ambientFx && d.ambientFx !== "none") out.push(hiddenPrompt("ambient_fx", d.ambientFx));
      if (d.entryCondition && d.entryCondition !== "none") out.push(hiddenPrompt("transition", d.entryCondition));
      if (d.exitCondition && d.exitCondition !== "none") out.push(hiddenPrompt("transition", d.exitCondition));
      break;
    case "effect":
      if (d.effectType) out.push(hiddenPrompt("effect_type", d.effectType));
      if (d.intensity) out.push(hiddenPrompt("effect_intensity", d.intensity));
      break;
    case "speech":
      if (d.bubbleType) out.push(hiddenPrompt("speech_type", d.bubbleType));
      if (d.style) out.push(hiddenPrompt("speech_style", d.style));
      if (d.tailDirection) out.push(hiddenPrompt("tail_direction", d.tailDirection));
      break;
    case "camera":
      if (d.shotType) out.push(hiddenPrompt("camera_shot", d.shotType));
      if (d.angle) out.push(hiddenPrompt("camera_angle", d.angle));
      break;
    case "panel":
      if (d.panelSize) out.push(hiddenPrompt("panel_size", d.panelSize));
      if (d.format) out.push(hiddenPrompt("panel_format", d.format));
      if (d.borderStyle) out.push(hiddenPrompt("panel_border", d.borderStyle));
      if (d.narrativeRole && d.narrativeRole !== "auto") out.push(hiddenPrompt("narrative_role", d.narrativeRole));
      break;
    case "object":
      if (d.size) out.push(hiddenPrompt("object_size", d.size));
      if (d.state) out.push(hiddenPrompt("object_state", d.state));
      if (d.layer) out.push(hiddenPrompt("layer", d.layer));
      break;
    default:
      break;
  }

  return out.filter(Boolean);
}

/** Bloco markdown para injetar no prompt final (oculto ao utilizador). */
export function renderHiddenOptionsBlock(node) {
  const parts = hiddenPromptsForNode(node);
  if (!parts.length) return "";
  const name = node.data?.name || node.data?.text || node.type;
  return `[${name}] ${parts.join(" ")}`;
}

export function renderAllHiddenOptionsBlock(nodes = []) {
  const lines = [];
  for (const n of nodes) {
    const block = renderHiddenOptionsBlock(n);
    if (block) lines.push(`- ${block}`);
  }
  if (!lines.length) return "";
  return [
    "## HIDDEN OPTION DIRECTIVES (from UI chip selections — mandatory)",
    ...lines,
    "",
  ].join("\n");
}
