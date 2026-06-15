/** Smart manga generation — story-driven pages, distinct panel beats, cinematic cameras */

import { uid } from "./mangaFlowData";
import { NODE_DEFAULTS, NODE_COLORS } from "./nodeDefaults";
import { buildEdgeSemanticData } from "../../lib/mangaFlowSemantics";
import { wizardHiddenLines } from "../../lib/mangaWizardPromptLibrary";

function node(type, x, y, data = {}) {
  return { id: uid(type.slice(0, 4)), type, position: { x, y }, data: { ...NODE_DEFAULTS[type], _color: NODE_COLORS[type], ...data } };
}

function edge(srcId, tgtId, prompt, condition, srcNode, tgtNode) {
  const semanticFields =
    srcNode && tgtNode ? buildEdgeSemanticData(srcNode, tgtNode, prompt || "") : {};
  const label = prompt
    ? (prompt.length > 28 ? prompt.slice(0, 26) + "…" : prompt)
    : semanticFields.connectionType || "";
  return {
    id: `e_${srcId}_${tgtId}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    source: srcId, target: tgtId, type: "smoothstep", animated: true,
    data: { prompt: prompt || "", condition: condition || null, ...semanticFields },
    label,
    labelStyle: { fill: "#C4B5FD", fontSize: 11, fontFamily: "'Inter Tight', sans-serif" },
    labelBgStyle: { fill: "#111118", fillOpacity: 0.92 },
    labelBgPadding: [6, 4], labelBgBorderRadius: 6,
  };
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN(arr, n) { const s = [...arr].sort(() => Math.random() - 0.5); return s.slice(0, n); }

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
  dialogue: { shot: "medium", angle: "over_shoulder" },
  action: { shot: "wide", angle: "dutch_angle" },
  emotion: { shot: "close_up", angle: "eye_level" },
  dramatic: { shot: "extreme_close_up", angle: "low_angle" },
  reveal: { shot: "wide", angle: "low_angle" },
};

const CAMERA_DEFAULT_SEQUENCE = {
  varied: ["establishing", "dialogue", "action", "emotion", "dramatic", "reveal"],
  close_ups: ["emotion", "dramatic", "emotion", "dialogue"],
  wide_shots: ["establishing", "reveal", "establishing", "action"],
  dynamic_angles: ["action", "dramatic", "reveal", "action"],
  over_shoulder: ["dialogue", "dialogue", "action", "emotion"],
  birds_eye: ["establishing", "reveal", "establishing", "dramatic"],
};

const SHOT_TO_PERSON_CAMERA = {
  establishing: "wide",
  wide: "wide",
  medium: "medium",
  close_up: "close_up",
  extreme_close_up: "extreme_close_up",
  panoramic: "wide",
};

const ANGLE_TO_PERSON_CAMERA = {
  eye_level: null,
  low_angle: "low_angle",
  high_angle: "high_angle",
  dutch_angle: "dutch_angle",
  birds_eye: "birds_eye",
  worms_eye: "low_angle",
  over_shoulder: "over_shoulder",
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

const PANEL_BEAT_ROLES = [
  "establishing — set the scene and location",
  "setup — introduce situation or characters",
  "rising action — tension or movement begins",
  "focus — character reaction or key detail close-up",
  "climax beat — peak action or emotion",
  "fallout — consequence or aftermath",
  "transition — bridge to next page",
  "reveal — new information or twist",
];

const PACING_PANEL_WEIGHT = {
  slow: [0, 1, 2, 3],
  normal: [0, 1, 2, 3],
  fast: [2, 3, 3, 3],
  cinematic: [0, 2, 3, 3],
};

function getArcText(genre, pageIndex, totalPages) {
  const arcs = STORY_ARCS[genre] || STORY_ARCS.action;
  const idx = Math.min(Math.floor((pageIndex / Math.max(1, totalPages)) * arcs.length), arcs.length - 1);
  return arcs[idx];
}

function getContext(pageIndex, totalPages, pacing) {
  const ratio = pageIndex / Math.max(1, totalPages);
  if (pacing === "fast" && ratio > 0.2) return ratio < 0.75 ? "fight" : "action";
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

function parseStoryBeats(storyPrompt, synopsis, keyMoments) {
  const fromMoments = String(keyMoments || "")
    .split(/\n|;|•|·/)
    .map((s) => s.trim())
    .filter((s) => s.length > 4);
  if (fromMoments.length) return fromMoments;

  const text = String(storyPrompt || synopsis || "").trim();
  if (!text) return [];

  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);
}

function getPanelBeat({
  beats, genre, pageIndex, totalPages, panelIndex, panelsPerPage, arcText, pacing,
}) {
  const globalIdx = pageIndex * panelsPerPage + panelIndex;
  if (beats.length > globalIdx) return beats[globalIdx];
  if (beats.length > pageIndex) {
    const role = PANEL_BEAT_ROLES[panelIndex % PANEL_BEAT_ROLES.length];
    return `${beats[pageIndex]} — ${role}`;
  }

  const weights = PACING_PANEL_WEIGHT[pacing] || PACING_PANEL_WEIGHT.normal;
  const roleIdx = weights[panelIndex % weights.length] ?? panelIndex;
  const role = PANEL_BEAT_ROLES[roleIdx % PANEL_BEAT_ROLES.length];
  return `${arcText}: ${role}`;
}

function resolvePersonCamera(cam) {
  const angleKey = ANGLE_TO_PERSON_CAMERA[cam.angle];
  if (angleKey) return angleKey;
  return SHOT_TO_PERSON_CAMERA[cam.shot] || "medium";
}

function getPanelCamera(cameraDefault, panelIndex, ctx) {
  const seq = CAMERA_DEFAULT_SEQUENCE[cameraDefault] || CAMERA_DEFAULT_SEQUENCE.varied;
  const camKey = seq[panelIndex % seq.length] || (ctx === "fight" ? "action" : "dialogue");
  return CAMERA_BY_MOMENT[camKey] || CAMERA_BY_MOMENT.dialogue;
}

function splitDialogueLines(sampleDialogue, genre, count) {
  const raw = String(sampleDialogue || "").trim();
  if (raw) {
    const lines = raw.split(/\n|"/).map((s) => s.trim()).filter((s) => s.length > 2);
    if (lines.length) return lines;
  }
  const fallback = {
    action: ["Let's go!", "I won't lose!", "Watch out!", "It's over!", "Not yet!", "Give me strength!"],
    romance: ["I... I like you.", "Don't leave me.", "You're beautiful.", "Stay with me.", "I'm sorry..."],
    horror: ["What was that?!", "Don't look back!", "We need to leave NOW!", "It's coming...", "Help!"],
    comedy: ["WHAT?!", "That's not how it works!", "Run!!", "Hahahaha!", "Seriously?!"],
    drama: ["Why did you lie?", "I trusted you.", "It's not that simple.", "I'm leaving.", "Forgive me."],
  };
  return fallback[genre] || fallback.action;
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
    narration = "third_person", quality = "ultra", extraInstructions = "",
  } = answers;

  const numPages = Math.min(Math.max(1, Number(pageCount)), 20);
  const ppp = Math.min(Math.max(2, Number(panelsPerPage)), 8);
  const charsWithNames = characters.filter((c) => c.name?.trim());
  const genreEffects = EFFECTS_BY_GENRE[genre] || EFFECTS_BY_GENRE.action;
  const toneEmotions = EMOTIONS_BY_TONE[tone] || EMOTIONS_BY_TONE.epic;
  const panelPositions = PANEL_LAYOUTS[ppp] || PANEL_LAYOUTS[4];
  const panelSizes = PANEL_SIZES_MAP[panelStyle] || PANEL_SIZES_MAP.classic_grid;
  const storyBeats = parseStoryBeats(storyPrompt, synopsis, keyMoments);
  const dialogueLines = splitDialogueLines(sampleDialogue, genre, numPages * ppp);
  const storySynopsis = [synopsis, storyPrompt].filter(Boolean).join(" ").trim();

  const pages = [];

  for (let p = 0; p < numPages; p++) {
    const pageId = uid("pg");
    const arcText = getArcText(genre, p, numPages);
    const ctx = getContext(p, numPages, pacing);
    const timeOfDay = getTimeOfDay(p, numPages);
    const nodes = [];
    const edges_arr = [];

    const panelNodes = [];
    for (let i = 0; i < Math.min(ppp, panelPositions.length); i++) {
      const pos = panelPositions[i];
      const size = panelSizes[i % panelSizes.length] || "medium";
      const momentDesc = getPanelBeat({
        beats: storyBeats,
        genre,
        pageIndex: p,
        totalPages: numPages,
        panelIndex: i,
        panelsPerPage: ppp,
        arcText,
        pacing,
      });
      const pn = node("panel", pos.x, pos.y, {
        panelSize: size,
        format: i === 0 && p === 0 ? "wide" : "rectangle",
        name: `P${p + 1}.${i + 1}`,
        momentDesc,
        promptOverride: momentDesc,
      });
      nodes.push(pn);
      panelNodes.push(pn);
    }

    const sceneX = 550;
    const pageStoryBit = storyBeats[p] || arcText;
    const scn = node("scenario", sceneX, 40, {
      name: pageStoryBit.slice(0, 60),
      timeOfDay,
      weather: p === numPages - 1 ? "clear" : weather,
      mood: tone,
      lighting,
      description: [
        location || "Scene",
        era,
        pageStoryBit,
        worldDetails ? worldDetails.slice(0, 120) : "",
        storySynopsis ? storySynopsis.slice(0, 150) : "",
      ].filter(Boolean).join(" — "),
    });
    nodes.push(scn);

    const maxCharsPerPage = Math.min(charsWithNames.length || 1, ctx === "fight" ? 3 : 2);
    const pageChars = charsWithNames.length > 0
      ? pickN(charsWithNames, maxCharsPerPage)
      : [{ name: "Protagonist", appearance: "", personality: "", role: "protagonist" }];

    const charNodes = [];
    pageChars.forEach((ch, ci) => {
      const poses = POSES_BY_CONTEXT[ctx] || POSES_BY_CONTEXT.calm;
      const cn = node("person", sceneX, 180 + ci * 200, {
        name: ch.name,
        pose: pick(poses),
        emotion: pick(toneEmotions),
        cameraAngle: "medium",
        clothing: ch.appearance || "",
        actionDesc: `${pageStoryBit}. ${ch.personality || ""} ${ch.powers ? `(${ch.powers})` : ""}`.trim(),
        speech: ch.catchphrase && p === 0 && ci === 0 ? ch.catchphrase : "",
        speechType: bubbleStyle !== "normal" ? bubbleStyle : "speech",
      });
      nodes.push(cn);
      charNodes.push(cn);
      edges_arr.push(edge(cn.id, scn.id, `${ch.name} in this scene — ${pageStoryBit.slice(0, 80)}`, null, cn, scn));
    });

    panelNodes.forEach((pn, i) => {
      const ch = pageChars[i % pageChars.length];
      const charNode = charNodes.find((c) => c.data.name === ch.name) || charNodes[0];
      if (!charNode) return;

      const panelBeat = pn.data.momentDesc;
      const panelCam = getPanelCamera(cameraDefault, i, ctx);

      const actionVerbs = {
        calm: "observes",
        tense: "watches tensely in",
        fight: "fights within",
        action: "moves through",
        emotional: "reacts emotionally in",
        romantic: "connects with someone in",
      };
      edges_arr.push(
        edge(
          charNode.id,
          pn.id,
          `${ch.name} ${actionVerbs[ctx] || "appears in"} panel: ${panelBeat}`,
          null,
          charNode,
          pn,
        ),
      );

      const camN = node("camera", pn.position.x + 180, pn.position.y + 20, {
        shotType: panelCam.shot,
        angle: panelCam.angle,
        focusTarget: ch.name,
      });
      nodes.push(camN);
      edges_arr.push(edge(camN.id, pn.id, `Cinematic framing for panel ${i + 1}`, null, camN, pn));
      edges_arr.push(edge(charNode.id, camN.id, "", null, charNode, camN));
    });

    if (charNodes.length >= 2) {
      const interactionsByCtx = {
        calm: ["talking with", "walking alongside"],
        tense: ["arguing with", "staring down"],
        fight: ["clashing with", "blocking", "fighting"],
        action: ["chasing", "racing against"],
        emotional: ["comforting", "reaching out to"],
        romantic: ["holding hands with", "looking at"],
      };
      const interaction = pick(interactionsByCtx[ctx] || interactionsByCtx.calm);
      edges_arr.push(edge(charNodes[0].id, charNodes[1].id, `${pageChars[0].name} ${interaction} ${pageChars[1].name}`, null, charNodes[0], charNodes[1]));
    }

    pageChars.forEach((ch, ci) => {
      if (ch.weapon && charNodes[ci]) {
        const objNode = node("object", 800, 180 + ci * 200, {
          name: ch.weapon,
          description: `${ch.name}'s weapon/item`,
          size: "medium",
        });
        nodes.push(objNode);
        edges_arr.push(edge(charNodes[ci].id, objNode.id, `${ch.name} wielding ${ch.weapon}`, null, charNodes[ci], objNode));
      }
    });

    if (charNodes.length > 0 && dialogueStyle !== "minimal") {
      const lineIdx = p * panelNodes.length;
      const line = dialogueLines[lineIdx % dialogueLines.length];
      const speechN = node("speech", 800, 50, {
        text: line,
        bubbleType: "speech",
        style: bubbleStyle,
        tailDirection: bubblePosition === "auto" ? "left" : bubblePosition,
      });
      nodes.push(speechN);
      edges_arr.push(edge(charNodes[0].id, speechN.id, "Says this line", null, charNodes[0], speechN));
      if (panelNodes[0]) edges_arr.push(edge(speechN.id, panelNodes[0].id, "Dialogue in first panel", null, speechN, panelNodes[0]));
    }

    if (narrationBox !== "none" && (p === 0 || p === numPages - 1)) {
      const narrText = p === 0
        ? (synopsis.slice(0, 100) || storyPrompt.slice(0, 100) || "The story begins...")
        : `End of chapter — ${arcText}`;
      const narrN = node("speech", 800, 400, {
        text: narrText,
        bubbleType: "narration",
        style: "normal",
      });
      nodes.push(narrN);
      if (panelNodes[0]) edges_arr.push(edge(narrN.id, panelNodes[0].id, "Narration box", null, narrN, panelNodes[0]));
    }

    if ((ctx === "fight" || ctx === "action") && genreEffects.length) {
      const fx = node("effect", 800, 350, {
        effectType: pick(genreEffects),
        intensity: ctx === "fight" ? "strong" : "medium",
      });
      nodes.push(fx);
      const targetPanel = panelNodes[panelNodes.length - 1] || panelNodes[0];
      if (targetPanel) edges_arr.push(edge(fx.id, targetPanel.id, "Action effects in this panel", null, fx, targetPanel));
      if (charNodes[0]) edges_arr.push(edge(fx.id, charNodes[0].id, "Effect on character", null, fx, charNodes[0]));
    }

    pages.push({
      id: pageId,
      name: `Page ${p + 1} — ${arcText}`,
      pageBeat: pageStoryBit,
      nodes,
      edges: edges_arr,
    });
  }

  return {
    pages,
    storyMeta: {
      synopsis: storySynopsis || synopsis,
      storyPrompt,
      genre,
      tone,
      pacing,
      format,
      mainStyle,
      artStyle,
      transitions,
      characters: charsWithNames,
    },
    // Hidden wizard context — gets prepended to every panel/page generation as
    // anchor directives so chip selections never get diluted by generic AI output.
    wizardContext: {
      hiddenDirective: [
        `WIZARD CONTEXT (binding for every panel of this project):`,
        `- Format: ${format}; main style: ${mainStyle}; art style: ${artStyle.replace(/_/g, " ")}.`,
        `- Genre: ${genre.replace(/_/g, " ")}; tone: ${tone}; pacing: ${pacing}; narration: ${narration?.replace(/_/g, " ") || "third person"}.`,
        `- Visual: ${detailLevel?.replace(/_/g, " ") || "detailed"} detail, ${lighting || "dramatic"} lighting, ${colorPalette?.replace(/_/g, " ") || "monochrome"} palette, ${quality || "ultra"} quality.`,
        `- Dialogue style: ${dialogueStyle || "natural"}; bubbles: ${bubbleStyle || "normal"} at ${bubblePosition || "auto"}; SFX: ${sfxStyle || "japanese"}.`,
        `- World: ${location || "unspecified"}, ${era?.replace(/_/g, " ") || "modern"} era, ${weather || "clear"} weather.${worldDetails ? ` Notes: ${worldDetails}.` : ""}`,
        ...wizardHiddenLines({
          genre, tone, artStyle, mainStyle, pacing, panelStyle, lighting, colorPalette,
        }).map((l) => `- ${l}`),
        characters?.filter((c) => c.name).length
          ? `- Locked cast (use ONLY these characters, never invent NPCs): ${characters.filter((c) => c.name).map((c) => `${c.name} [${c.role}]`).join(", ")}.`
          : "",
        storyPrompt ? `- Story (must follow plot beats): ${String(storyPrompt).slice(0, 600)}` : "",
        keyMoments ? `- Key moments to hit: ${String(keyMoments).slice(0, 300)}` : "",
        extraInstructions ? `- User extra: ${String(extraInstructions).slice(0, 200)}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      raw: {
        format, mainStyle, genre, tone, pacing, narration,
        artStyle, detailLevel, lighting, colorPalette, quality,
        dialogueStyle, bubbleStyle, bubblePosition, sfxStyle,
        location, era, weather, worldDetails,
        storyPrompt, synopsis, keyMoments, extraInstructions,
      },
    },
  };
}
