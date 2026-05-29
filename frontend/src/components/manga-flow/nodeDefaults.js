/** Default data and colors for every card type */

export const NODE_COLORS = {
  person:   { bg: "rgba(147,51,234,0.15)", border: "#9333EA" },
  scenario: { bg: "rgba(20,184,166,0.15)", border: "#14B8A6" },
  object:   { bg: "rgba(250,204,21,0.15)", border: "#FACC15" },
  speech:   { bg: "rgba(96,165,250,0.15)", border: "#60A5FA" },
  effect:   { bg: "rgba(251,146,60,0.15)", border: "#FB923C" },
  camera:   { bg: "rgba(244,114,182,0.15)", border: "#F472B6" },
  panel:    { bg: "rgba(163,163,163,0.12)", border: "#A3A3A3" },
};

export const NODE_DEFAULTS = {
  person: {
    name: "", pose: "standing", emotion: "normal", cameraAngle: "medium",
    clothing: "", speech: "", speechType: "speech", actionDesc: "",
    refImage: null, refImageUrl: null, refPersistUrl: null, refUploading: false,
  },
  scenario: {
    name: "", timeOfDay: "day", weather: "clear", mood: "neutral",
    lighting: "bright", description: "",
    refImage: null, refImageUrl: null, refPersistUrl: null, refUploading: false,
  },
  object: {
    name: "", description: "", size: "medium", state: "normal",
    interaction: "",
    refImage: null, refImageUrl: null, refPersistUrl: null, refUploading: false,
  },
  speech: {
    text: "", bubbleType: "speech", style: "normal", tailDirection: "left",
    refImage: null, refImageUrl: null,
  },
  effect: {
    effectType: "motion_lines", intensity: "medium", color: "#FFFFFF",
    refImage: null, refImageUrl: null,
  },
  camera: {
    shotType: "medium", angle: "eye_level", focusTarget: "",
    refImage: null, refImageUrl: null,
  },
  panel: {
    panelSize: "medium", format: "rectangle", borderStyle: "thin",
    narrativeRole: "auto", momentDesc: "",
    refImage: null, refImageUrl: null,
  },
};

export const PERSON_POSES = ["standing","running","sitting","jumping","fighting","hugging","looking_back","kneeling","leaning","crouching","walking","flying","falling","dancing","sleeping","pointing"];
export const PERSON_EMOTIONS = ["normal","happy","angry","sad","surprised","serious","blushing","crying","laughing","scared","disgusted","confused","determined","smirking","embarrassed","exhausted"];
export const PERSON_CAMERA = ["extreme_close_up","close_up","medium_close","medium","medium_full","full_body","wide","front_view","side_view","back_view","three_quarter_view","top_view","low_angle","high_angle","dutch_angle","over_shoulder","birds_eye","worms_eye","dynamic_perspective"];

export const SCENARIO_TIME = ["day","sunset","night","dawn","midnight","noon","golden_hour","twilight"];
export const SCENARIO_WEATHER = ["clear","rain","storm","snow","fog","windy","hail","cloudy"];
export const SCENARIO_MOOD = ["neutral","tense","romantic","mysterious","epic","melancholic","chaotic","peaceful","horror","comedic"];
export const SCENARIO_LIGHTING = ["bright","dark","dramatic","soft","neon","candlelight","moonlight","spotlight"];

export const OBJECT_SIZES = ["tiny","small","medium","large","huge"];
export const OBJECT_STATES = ["normal","broken","glowing","wet","burning","frozen","rusty","shiny","bloody","transparent"];

export const SPEECH_TYPES = ["speech","thought","scream","whisper","narration"];
export const SPEECH_STYLES = ["normal","jagged","cloud","burst","drip","electric"];
export const SPEECH_TAILS = ["left","right","top","bottom","none"];

export const EFFECT_TYPES = ["motion_lines","impact","sparkle","explosion","speed_lines","smoke","fire","lightning","aura","rain_drops","shockwave","hearts","sweat_drop","anger_vein"];
export const EFFECT_INTENSITY = ["subtle","medium","strong","extreme"];

export const CAMERA_SHOTS = ["extreme_close_up","close_up","medium","wide","establishing","panoramic"];
export const CAMERA_ANGLES = ["eye_level","front_view","side_view","back_view","three_quarter_view","top_view","low_angle","high_angle","dutch_angle","birds_eye","worms_eye","over_shoulder","dynamic_perspective"];

export const PANEL_SIZES = ["small","medium","large","full_page","double_spread"];
export const PANEL_FORMATS = ["square","rectangle","tall","wide","dynamic","circle","diagonal"];
export const PANEL_BORDERS = ["thick","thin","none","artistic","double","rough"];
