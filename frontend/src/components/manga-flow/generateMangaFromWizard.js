/** Smart manga generation — each page is unique, follows story arc, respects all user choices */

import { uid } from "./mangaFlowData";
import { NODE_DEFAULTS, NODE_COLORS } from "./nodeDefaults";

function node(type, x, y, data = {}) {
  return { id: uid(type.slice(0, 4)), type, position: { x, y }, data: { ...NODE_DEFAULTS[type], _color: NODE_COLORS[type], ...data } };
}

function edge(src, tgt, prompt, condition) {
  return {
    id: `e_${src}_${tgt}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    source: src, target: tgt, type: "smoothstep", animated: true,
    data: { prompt, condition: condition || null },
    label: prompt ? (prompt.length > 28 ? prompt.slice(0, 26) + "…" : prompt) : "",
    labelStyle: { fill: "#C4B5FD", fontSize: 11, fontFamily: "'Inter Tight', sans-serif" },
    labelBgStyle: { fill: "#111118", fillOpacity: 0.92 },
    labelBgPadding: [6, 4], labelBgBorderRadius: 6,
  };
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN(arr, n) { const s = [...arr].sort(() => Math.random() - 0.5); return s.slice(0, n); }

// Story arc templates per genre
const STORY_ARCS = {
  action: ["Introduction — calm before the storm", "Tension builds — something is wrong", "Confrontation begins", "Intense battle / chase", "Climax — full power clash", "Turning point", "Victory or defeat", "Aftermath — new beginning"],
  romance: ["First meeting — catching eyes", "Getting to know each other", "Growing closer — shared moment", "Conflict or misunderstanding", "Separation and longing", "Reconciliation", "Confession of feelings", "Together — happy ending"],
  horror: ["Normal day — something feels off", "First sign of danger", "Investigation — deeper into mystery", "First encounter with horror", "Trapped — no escape", "Desperate fight for survival", "Revelation of the truth", "Escape or doom"],
  adventure: ["The call to adventure", "Leaving home — journey begins", "First challenge on the road", "Meeting a companion", "Major obstacle — seems impossible", "Discovery of hidden strength", "The final trial", "Return transformed"],
  fantasy: ["Ordinary world disrupted", "Discovery of magical power", "Entering the new world", "Training and growth", "Dark force revealed", "Alliance formed", "Epic magical battle", "New era begins"],
  slice_of_life: ["Morning routine — establishing daily life", "School/work — meeting friends", "Lunch break — casual conversation", "Afternoon activity together", "Small problem arises", "Working through it together", "Evening reflection", "Peaceful ending — gratitude"],
  comedy: ["Ridiculous situation starts", "Things get worse hilariously", "Failed attempt to fix it", "Everything escalates", "Unexpected ally appears", "The most absurd moment", "Somehow it works out", "Everyone laughs together"],
  drama: ["Peaceful facade — hidden tension", "Cracks begin to show", "Confrontation — truths spoken", "Emotional breakdown", "Reflection and regret", "Reaching out for help", "Forgiveness or acceptance", "Moving forward changed"],
  mystery: ["Crime scene / strange event", "First clues discovered", "Investigating suspects", "Red herring — wrong lead", "New evidence changes everything", "Confronting the suspect", "The reveal — truth exposed", "Justice served"],
  sci_fi: ["Future world established", "Anomaly detected", "Investigation begins", "Discovery changes everything", "Corporation/government interferes", "Going underground", "Final confrontation with technology", "New paradigm established"],
  thriller: ["Normal life — hidden danger", "First threat appears", "Running from the enemy", "Finding temporary safety", "Betrayal — trust broken", "Alone against all odds", "Final showdown", "Freedom — but at what cost"],
  sports: ["Training begins — the dream", "First competition", "Defeat and humiliation", "Mentor appears", "Intense training montage", "Comeback match", "Championship moment", "Victory and recognition"],
};

const POSES_BY_CONTEXT = {
  calm: ["standing", "sitting", "walking", "leaning"],
  tense: ["standing", "crouching", "looking_back", "running"],
  fight: ["fighting", "jumping", "attacking", "crouching"],
  emotional: ["kneeling", "sitting", "standing", "hugging"],
  action: ["running", "jumping", "fighting", "falling"],
  romantic: ["standing", "sitting", "walking", "hugging"],
};

const EMOTIONS_BY_TONE = {
  epic: ["determined", "serious", "angry", "surprised"],
  cute: ["happy", "blushing", "shy", "laughing"],
  dark: ["scared", "serious", "angry", "sad"],
  humor: ["surprised", "laughing", "confused", "happy"],
  dramatic: ["sad", "crying", "serious", "determined"],
  romantic: ["blushing", "happy", "shy", "sad"],
  tense: ["scared", "serious", "surprised", "angry"],
  cheerful: ["happy", "laughing", "surprised", "blushing"],
  melancholic: ["sad", "serious", "normal", "exhausted"],
  mysterious: ["serious", "normal", "confused", "determined"],
  violent: ["angry", "determined", "scared", "serious"],
  wholesome: ["happy", "blushing", "laughing", "shy"],
};

const CAMERA_BY_MOMENT = {
  establishing: { shot: "establishing", angle: "high_angle" },
  dialogue: { shot: "medium", angle: "eye_level" },
  action: { shot: "wide", angle: "dutch_angle" },
  emotion: { shot: "close_up", angle: "eye_level" },
  dramatic: { shot: "extreme_close_up", angle: "low_angle" },
  reveal: { shot: "wide", angle: "low_angle" },
};

const EFFECTS_BY_GENRE = {
  action: ["impact", "speed_lines", "shockwave", "motion_lines"],
  fantasy: ["aura", "sparkle", "lightning", "fire"],
  horror: ["smoke", "rain_drops", "shockwave"],
  romance: ["sparkle", "hearts"],
  comedy: ["sweat_drop", "anger_vein"],
  drama: ["rain_drops", "smoke"],
};

const PANEL_LAYOUTS = {
  2: [{ x: 40, y: 30 }, { x: 40, y: 300 }],
  3: [{ x: 40, y: 30 }, { x: 300, y: 30 }, { x: 40, y: 300 }],
  4: [{ x: 40, y: 30 }, { x: 300, y: 30 }, { x: 40, y: 280 }, { x: 300, y: 280 }],
  5: [{ x: 40, y: 20 }, { x: 280, y: 20 }, { x: 40, y: 200 }, { x: 280, y: 200 }, { x: 40, y: 380 }],
  6: [{ x: 40, y: 20 }, { x: 280, y: 20 }, { x: 40, y: 190 }, { x: 280, y: 190 }, { x: 40, y: 360 }, { x: 280, y: 360 }],
  8: [{ x: 30, y: 15 }, { x: 230, y: 15 }, { x: 430, y: 15 }, { x: 30, y: 170 }, { x: 230, y: 170 }, { x: 430, y: 170 }, { x: 30, y: 330 }, { x: 230, y: 330 }],
};

const PANEL_SIZES_MAP = {
  classic_grid: ["medium", "medium", "medium", "medium"],
  dynamic: ["large", "small", "medium", "small", "medium", "large"],
  full_page_splash: ["full_page", "medium", "medium"],
  mixed: ["large", "small", "small", "medium", "large"],
  vertical_strips: ["large", "large", "large"],
  asymmetric: ["large", "small", "medium", "small", "large", "medium"],
};

function getArcText(genre, pageIndex, totalPages) {
  const arcs = STORY_ARCS[genre] || STORY_ARCS.action;
  const idx = Math.min(Math.floor((pageIndex / totalPages) * arcs.length), arcs.length - 1);
  return arcs[idx];
}

function getContext(pageIndex, totalPages) {
  const ratio = pageIndex / totalPages;
  if (ratio < 0.15) return "calm";
  if (ratio < 0.3) return "tense";
  if (ratio < 0.5) return "action";
  if (ratio < 0.7) return "fight";
  if (ratio < 0.85) return "emotional";
  return "calm";
}

function getTimeOfDay(pageIndex, totalPages) {
  const times = ["day", "day", "sunset", "night", "dawn", "day", "sunset", "night"];
  return times[pageIndex % times.length];
}

export function generateMangaFromWizard(answers) {
  const {
    format = "manga", pageCount = 4, mainStyle = "shonen",
    genre = "action", synopsis = "", tone = "epic", pacing = "normal",
    characters = [], location = "", era = "modern", weather = "clear",
    worldDetails = "", panelsPerPage = 4, panelStyle = "classic_grid",
    transitions = ["cut"], cameraDefault = "varied", keyMoments = "",
    dialogueStyle = "natural", bubbleStyle = "normal", bubblePosition = "auto",
    narrationBox = "none", sfxStyle = "japanese", sampleDialogue = "",
    artStyle = "manga_bw", detailLevel = "detailed", lighting = "dramatic",
    colorPalette = "monochrome", storyPrompt = "",
  } = answers;

  const numPages = Math.min(Math.max(1, Number(pageCount)), 20);
  const ppp = Math.min(Math.max(2, Number(panelsPerPage)), 8);
  const charsWithNames = characters.filter(c => c.name?.trim());
  const genreEffects = EFFECTS_BY_GENRE[genre] || EFFECTS_BY_GENRE.action;
  const toneEmotions = EMOTIONS_BY_TONE[tone] || EMOTIONS_BY_TONE.epic;
  const panelPositions = PANEL_LAYOUTS[ppp] || PANEL_LAYOUTS[4];
  const panelSizes = PANEL_SIZES_MAP[panelStyle] || PANEL_SIZES_MAP.classic_grid;

  const pages = [];

  for (let p = 0; p < numPages; p++) {
    const pageId = uid("pg");
    const arcText = getArcText(genre, p, numPages);
    const ctx = getContext(p, numPages);
    const timeOfDay = getTimeOfDay(p, numPages);
    const nodes = [];
    const edges_arr = [];

    // Panels
    const panelNodes = [];
    for (let i = 0; i < Math.min(ppp, panelPositions.length); i++) {
      const pos = panelPositions[i];
      const size = panelSizes[i % panelSizes.length] || "medium";
      const pn = node("panel", pos.x, pos.y, { panelSize: size, format: i === 0 && p === 0 ? "wide" : "rectangle", name: `P${p + 1}.${i + 1}` });
      nodes.push(pn);
      panelNodes.push(pn);
    }

    // Scenario
    const sceneX = 550;
    const scn = node("scenario", sceneX, 40, {
      name: `${arcText}`,
      timeOfDay,
      weather: p === numPages - 1 ? "clear" : weather,
      mood: tone,
      lighting,
      description: `${location || "Scene"} — ${era}. ${arcText}. ${worldDetails ? worldDetails.slice(0, 100) : ""}`,
    });
    nodes.push(scn);

    // Characters — rotate who appears per page, ensure variety
    const maxCharsPerPage = Math.min(charsWithNames.length || 1, ctx === "fight" ? 3 : 2);
    const pageChars = charsWithNames.length > 0
      ? pickN(charsWithNames, maxCharsPerPage)
      : [{ name: "Protagonist", appearance: "", personality: "", role: "protagonist" }];

    const charNodes = [];
    pageChars.forEach((ch, ci) => {
      const poses = POSES_BY_CONTEXT[ctx] || POSES_BY_CONTEXT.calm;
      const emotion = pick(toneEmotions);
      const pose = pick(poses);
      const camTypes = Object.keys(CAMERA_BY_MOMENT);
      const camCtx = ci === 0 ? (ctx === "fight" ? "action" : ctx === "calm" ? "establishing" : "dialogue") : "emotion";

      const cn = node("person", sceneX, 180 + ci * 200, {
        name: ch.name,
        pose,
        emotion,
        cameraAngle: CAMERA_BY_MOMENT[camCtx]?.shot || "medium",
        clothing: ch.appearance || "",
        actionDesc: `${arcText}. ${ch.personality || ""}`,
        speech: ch.catchphrase && p === 0 ? ch.catchphrase : "",
        speechType: bubbleStyle !== "normal" ? bubbleStyle : "speech",
      });
      nodes.push(cn);
      charNodes.push(cn);

      // Connect to scenario
      const actionVerbs = {
        calm: ["standing in", "observing", "arriving at", "resting in"],
        tense: ["watching carefully in", "hiding in", "running through"],
        fight: ["fighting in", "attacking in", "defending in"],
        action: ["racing through", "jumping across", "charging through"],
        emotional: ["standing alone in", "crying in", "reflecting in"],
        romantic: ["walking together in", "sitting together in"],
      };
      edges_arr.push(edge(cn.id, scn.id, `${ch.name} ${pick(actionVerbs[ctx] || actionVerbs.calm)} the scene`));

      // Connect to first available panel
      if (panelNodes[ci]) {
        edges_arr.push(edge(cn.id, panelNodes[ci].id, "Featured in this panel"));
      }
    });

    // Character interactions (if 2+ chars)
    if (charNodes.length >= 2) {
      const interactionsByCtx = {
        calm: ["talking casually with", "walking alongside"],
        tense: ["arguing with", "staring down"],
        fight: ["attacking", "blocking strike from", "clashing weapons with"],
        action: ["chasing after", "racing against"],
        emotional: ["comforting", "reaching out to", "crying with"],
        romantic: ["holding hands with", "looking lovingly at"],
      };
      const interaction = pick(interactionsByCtx[ctx] || interactionsByCtx.calm);
      edges_arr.push(edge(charNodes[0].id, charNodes[1].id, `${pageChars[0].name} ${interaction} ${pageChars[1].name}`));
    }

    // Weapons/Items from character data
    pageChars.forEach((ch, ci) => {
      if (ch.weapon && charNodes[ci]) {
        const objNode = node("object", 800, 180 + ci * 200, {
          name: ch.weapon,
          description: `${ch.name}'s weapon/item`,
          size: "medium",
        });
        nodes.push(objNode);
        edges_arr.push(edge(charNodes[ci].id, objNode.id, `${ch.name} wielding ${ch.weapon}`));
      }
    });

    // Speech bubbles — unique per page
    if (charNodes.length > 0 && dialogueStyle !== "minimal") {
      const dialogueLines = {
        action: ["Let's go!", "I won't lose!", "Watch out!", "It's over!", "Not yet!", "Give me strength!"],
        romance: ["I... I like you.", "Don't leave me.", "You're beautiful.", "Stay with me.", "I'm sorry..."],
        horror: ["What was that?!", "Don't look back!", "We need to leave NOW!", "It's coming...", "Help!"],
        comedy: ["WHAT?!", "That's not how it works!", "Run!!", "Hahahaha!", "Seriously?!"],
        drama: ["Why did you lie?", "I trusted you.", "It's not that simple.", "I'm leaving.", "Forgive me."],
      };
      const lines = dialogueLines[genre] || dialogueLines.action;
      const line = lines[(p * 3 + 1) % lines.length]; // Different line per page
      const speechN = node("speech", 800, 50, {
        text: sampleDialogue ? sampleDialogue.slice(p * 30, (p + 1) * 30 + 20) || line : line,
        bubbleType: "speech",
        style: bubbleStyle,
        tailDirection: bubblePosition === "auto" ? "left" : bubblePosition,
      });
      nodes.push(speechN);
      edges_arr.push(edge(charNodes[0].id, speechN.id, "Saying this"));
    }

    // Narration box
    if (narrationBox !== "none" && (p === 0 || p === numPages - 1)) {
      const narrN = node("speech", 800, 400, {
        text: p === 0 ? (synopsis.slice(0, 80) || `The story begins...`) : "And so the chapter ends...",
        bubbleType: "narration",
        style: "normal",
      });
      nodes.push(narrN);
    }

    // Effects — contextual, not on every page
    if ((ctx === "fight" || ctx === "action") && genreEffects.length) {
      const fx = node("effect", 800, 350, {
        effectType: pick(genreEffects),
        intensity: ctx === "fight" ? "strong" : "medium",
      });
      nodes.push(fx);
      if (charNodes[0]) edges_arr.push(edge(fx.id, charNodes[0].id, "Effect surrounding character"));
    }

    // Camera — varies by context
    const camCtxKey = p === 0 ? "establishing" : p === numPages - 1 ? "dramatic" : ctx === "fight" ? "action" : ctx === "emotional" ? "emotion" : "dialogue";
    const cam = CAMERA_BY_MOMENT[camCtxKey] || CAMERA_BY_MOMENT.dialogue;
    const camN = node("camera", 800, 500, {
      shotType: cam.shot,
      angle: cam.angle,
      focusTarget: charNodes[0]?.data?.name || "Main character",
    });
    nodes.push(camN);

    pages.push({ id: pageId, name: `Page ${p + 1} — ${arcText}`, nodes, edges: edges_arr });
  }

  return { pages };
}
