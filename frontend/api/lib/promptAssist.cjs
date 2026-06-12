/** Wizard compose + theme suggestions (OpenAI). Ported from backend/services/openai_service.py */

const WIZ_MAP = {
  q1: {
    "1": "flyer / professional poster",
    "2": "logo / visual identity",
    "3": "concept art / illustration",
    "4": "character (anime / realistic / cartoon)",
    "5": "landscape / scenery",
    "6": "product photography / mockup",
    "7": "realistic portrait / professional headshot",
    "8": "social media post (Instagram / TikTok)",
    "9": "album cover / music artwork",
    "10": "book cover",
    "11": "fashion editorial",
    "12": "food / restaurant photography",
    "13": "interior design / architecture render",
    "14": "advertising campaign visual",
    "15": "movie / TV show key art",
    "16": "fantasy / sci-fi scene",
    "17": "pet / animal portrait",
    "18": "vehicle / automotive shot",
    "19": "abstract / conceptual artwork",
    "20": "other",
  },
  q2: {
    "1": "anime / japanese manga style",
    "2": "realistic / photographic",
    "3": "artistic / digital painting",
    "4": "3D render (Pixar / Disney style)",
    "5": "sketch / hand drawn",
    "6": "minimalist / flat design",
    "7": "cyberpunk / futuristic neon",
    "8": "vintage / retro 70s-80s",
    "9": "watercolor",
    "10": "oil painting",
    "11": "comic book / graphic novel",
    "12": "low-poly geometric",
    "13": "vaporwave / Y2K",
    "14": "brutalist editorial",
    "15": "luxury / high-fashion editorial",
    "16": "documentary / film still",
  },
  q3: {
    "1": "3:4",
    "2": "1:1",
    "3": "16:9",
    "4": "9:16",
    "5": "4:5",
    "6": "21:9",
  },
  q4: {
    "1": "golden hour warm sunset lighting",
    "2": "soft overcast diffused lighting",
    "3": "hard studio key and fill lighting",
    "4": "neon cyberpunk practical lighting",
    "5": "Rembrandt dramatic side lighting",
    "6": "low-key noir lighting",
    "7": "high-key beauty fashion lighting",
    "8": "volumetric god rays",
    "9": "moonlit blue hour",
    "10": "natural window light",
  },
  q5: {
    "1": "85mm portrait shallow depth of field",
    "2": "35mm documentary wide framing",
    "3": "24mm environmental wide shot",
    "4": "50mm natural eye-level perspective",
    "5": "100mm macro detail shot",
    "6": "anamorphic 2.39:1 cinematic framing",
    "7": "aerial drone establishing shot",
    "8": "low-angle hero perspective",
    "9": "top-down flat lay",
    "10": "Dutch angle dynamic framing",
  },
  q6: {
    "1": "warm earthy color palette",
    "2": "cool teal and orange grade",
    "3": "monochrome black and white high contrast",
    "4": "pastel soft dreamy palette",
    "5": "neon saturated pop colors",
    "6": "muted desaturated film look",
    "7": "luxury gold and black palette",
    "8": "melancholic blue mood",
    "9": "vibrant tropical colors",
    "10": "clinical clean white palette",
  },
  q8: {
    "1": "8K photorealistic ultra sharp",
    "2": "editorial magazine finish",
    "3": "cinematic film still quality",
    "4": "Unreal Engine 3D render quality",
    "5": "fine art gallery print quality",
    "6": "commercial product hero shot quality",
  },
};

function normalizeWizardAnswers(raw) {
  const out = {};
  for (const [k, v] of Object.entries(raw || {})) {
    const s = String(v).trim();
    if (!s) continue;
    out[k] = WIZ_MAP[k]?.[s] || s;
  }
  return out;
}

function openAiKey() {
  return String(process.env.OPENAI_API_KEY || "").trim();
}

async function chatJson({ system, user, maxTokens = 520, temperature = 0.9 }) {
  const key = openAiKey();
  if (!key) {
    const err = new Error("OPENAI_API_KEY em falta no servidor.");
    err.status = 503;
    throw err;
  }
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: maxTokens,
      temperature,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const err = new Error(`OpenAI ${res.status}`);
    err.status = 502;
    throw err;
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

async function chatText({ system, user, maxTokens = 420, temperature = 0.85 }) {
  const key = openAiKey();
  if (!key) {
    const err = new Error("OPENAI_API_KEY em falta no servidor.");
    err.status = 503;
    throw err;
  }
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: maxTokens,
      temperature,
    }),
  });
  if (!res.ok) {
    const err = new Error(`OpenAI ${res.status}`);
    err.status = 502;
    throw err;
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim().replace(/^["']|["']$/g, "") || "";
}

async function suggestPrompts(theme, lang) {
  const content = await chatJson({
    system:
      "You are a creative director for AI image prompts. Given a theme, return JSON: {\"prompts\": [6 strings]}. "
      + `Each prompt is one vivid sentence in ${lang === "en" ? "English" : "Portuguese"}. No numbering.`,
    user: `Theme: ${theme}`,
    maxTokens: 520,
    temperature: 0.95,
  });
  try {
    const data = JSON.parse(content);
    if (Array.isArray(data.prompts)) return data.prompts.map(String).slice(0, 8);
    for (const v of Object.values(data)) {
      if (Array.isArray(v)) return v.map(String).slice(0, 8);
    }
  } catch {
    /* fall through */
  }
  return content
    .split("\n")
    .map((l) => l.replace(/^[-*\d.]+\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 8);
}

const VIDEO_EDIT_PRESET_HINTS = {
  outfit:
    "Preset: OUTFIT CHANGE ONLY. Keep face, body, pose, motion, and background identical. "
    + "Replace clothing with specific garments (type, color, fabric, fit, accessories).",
  background:
    "Preset: BACKGROUND CHANGE ONLY. Keep the person, pose, motion, and subject lighting identical. "
    + "Replace only the environment/scenery behind them.",
  restyle:
    "Preset: FULL RESTYLE. Preserve identity, pose, and motion while applying the new look globally.",
};

function userAskedForQuality(text) {
  return /\b(quality|qualidade|resolution|resolução|resolu[cç][aã]o|8k|4k|hd|uhd|sharp|n[ií]tid|nitidez|detalhe|detail|crisp|clearer|melhorar qualidade|improve quality|enhance quality|upscale|mais n[ií]tido)\b/i.test(
    String(text || ""),
  );
}

function buildImproveSystemPrompt(context = {}) {
  const tool = String(context.tool || "").trim();
  const styleLabel = String(context.style_label || "").trim();
  const styleSuffix = String(context.style_suffix || "").trim();
  const imageMode = Boolean(context.image_mode);
  const videoPreset = String(context.video_preset || "").trim().toLowerCase();
  const userPrompt = String(context.user_prompt || "").trim();

  if (tool === "video_edit") {
    let system =
      "You are an expert prompt engineer for AI VIDEO EDITING (Kling O1 Edit). "
      + "The user already has a video clip and wants a targeted edit — NOT a generic quality upgrade. "
      + "Rewrite their instruction into ONE precise English edit prompt (80–140 words). "
      + "Respond ONLY with the improved prompt — no quotes, no labels, no explanations.\n\n"
      + "CRITICAL RULES:\n"
      + "1) Identify the PRIMARY edit intent (outfit/clothing, background/scene, lighting/color, or full restyle).\n"
      + "2) State explicitly what MUST stay unchanged (face, identity, body, pose, motion, camera angle).\n"
      + "3) Describe ONLY the requested change with concrete, plausible details "
      + "(garment type, color, fabric, fit, shoes; or background location, time of day, weather; etc.).\n"
      + "4) Expand vague user text with context-fitting specifics — never swap their goal for something else.\n"
      + "5) NEVER add unrelated quality/resolution boosters (8K, ultra sharp, professional photography, HDR) "
      + "unless the user explicitly asked for quality or restyle improvements.\n"
      + "6) If the user wants clothing/outfit change, focus 100% on wardrobe — do NOT mention resolution or sharpness.\n"
      + "7) Keep ALL user-requested subjects, wardrobe choices, and actions — never remove or censor them.\n\n"
      + "OUTFIT examples: 'gym wear' → fitted moisture-wicking tank top, athletic leggings, trainers; "
      + "'evening dress' → elegant floor-length fabric, neckline, color.\n"
      + "BACKGROUND examples: 'beach' → tropical shoreline, golden hour sand and sky.\n"
      + "Always write in clear imperative/descriptive English suitable for a video edit model.";

    if (videoPreset && VIDEO_EDIT_PRESET_HINTS[videoPreset]) {
      system += `\n\n${VIDEO_EDIT_PRESET_HINTS[videoPreset]}`;
    }
    if (userAskedForQuality(userPrompt)) {
      system += "\n\nThe user DID ask for quality/resolution — you may include moderate quality cues tied to their request.";
    } else {
      system += "\n\nThe user did NOT ask for quality/resolution — forbid quality-only changes.";
    }
    return system;
  }

  if (tool === "video") {
    return (
      "You are an expert at crafting AI video generation prompts. "
      + "Transform the user's idea into one vivid English prompt for text/image-to-video. "
      + "Include subject, action, camera motion, lighting, and mood. "
      + "Keep ALL user-requested subjects, wardrobe, and actions. "
      + "Do not add unrelated 8K/quality spam unless the user asked for it. "
      + "Respond ONLY with the improved English prompt, no quotes, no explanations."
    );
  }

  if (tool === "video_extend") {
    return (
      "You are an expert prompt engineer for AI VIDEO CONTINUATION (Wan 2.7 clip extension). "
      + "The user has an existing video clip and wants MORE footage that continues seamlessly. "
      + "Rewrite their instruction into ONE precise English continuation prompt (60–120 words). "
      + "Respond ONLY with the improved prompt — no quotes, no labels.\n\n"
      + "RULES:\n"
      + "1) Describe what happens NEXT after the last frame — motion, action, camera, environment.\n"
      + "2) Explicitly preserve identity, style, lighting and motion continuity from the source clip.\n"
      + "3) Expand vague text with concrete details matching user intent — never change their goal.\n"
      + "4) Do NOT ask for quality/resolution upgrades unless the user explicitly asked.\n"
      + "5) Never suggest replacing the subject or restarting the scene."
    );
  }

  let system =
    "You are an expert at crafting image generation prompts. "
    + "Take the user's prompt in any language and transform it into a single concise, "
    + "vivid English prompt for AI image generation. Include lighting, composition, "
    + "style cues, and quality descriptors. Keep ALL user-requested subjects, wardrobe "
    + "(bikini, lingerie, swimwear, etc.), poses, and actions — never remove or censor them. "
    + "Respond ONLY with the improved English prompt, no quotes, no explanations.";

  if (tool === "artistic") {
    system +=
      " Context: Remake Pixel Artistic Studio. The chosen visual style preset is applied separately; "
      + "your job is to sharpen the USER's intent (subject, outfit, action, environment).";
    if (styleLabel) system += ` Active style name: ${styleLabel}.`;
    if (styleSuffix) {
      system += ` Align mood with this style recipe (do not repeat verbatim): ${styleSuffix.slice(0, 400)}.`;
    }
    if (imageMode) {
      system +=
        " Mode: IMAGE EDIT on a reference photo — output ONLY the list of changes to apply. "
        + "Start with 'Keep the same person, face, body, pose, and apparent age.' Then describe wardrobe, "
        + "lighting, or background changes. Never add wrinkles, gray hair, or make the subject look older. "
        + "Never ask for a new character.";
    } else {
      system += " Mode: TEXT-TO-IMAGE — describe the full scene to generate.";
    }
  }
  return system;
}

async function improvePrompt(prompt, lang = "en", context = {}) {
  const trimmed = String(prompt || "").trim();
  if (trimmed.length < 3) return trimmed;
  const tool = String(context.tool || "").trim();
  const isVideoEdit = tool === "video_edit";
  const isVideoExtend = tool === "video_extend";
  const system = buildImproveSystemPrompt({ ...context, user_prompt: trimmed });
  try {
    const improved = await chatText({
      system,
      user: trimmed,
      maxTokens: isVideoEdit || isVideoExtend ? 360 : 280,
      temperature: isVideoEdit || isVideoExtend ? 0.55 : 0.8,
    });
    if (!improved || improved.length < 3) return trimmed;
    return improved;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[prompt/improve]", err?.message || err);
    }
    return trimmed;
  }
}

async function wizardCompose(answers) {
  const normalized = normalizeWizardAnswers(answers);
  if (answers.q7) normalized.q7 = String(answers.q7).trim();
  if (answers.q9) normalized.q9 = String(answers.q9).trim();
  if (answers.perchance_tags) normalized.perchance_tags = String(answers.perchance_tags).trim();
  try {
    return await chatText({
      system:
        "You are a senior creative director and prompt engineer writing world-class AI image-generation prompts. "
        + "Given JSON of user answers (project type, style, format, lighting, camera, mood, detailed subject, quality tier, optional references and Perchance tags), "
        + "produce ONE dense English prompt of 220–380 words. Include: subject and action, environment, lighting setup, camera/lens/framing, color palette/mood, "
        + "composition rules, material/texture detail, and technical quality boosters (8K, ray-traced, editorial grade, etc.). "
        + "Use professional photography and CGI vocabulary. Single flowing paragraph — no bullet lists, no quotes, no section labels.",
      user: JSON.stringify(normalized),
      maxTokens: 900,
      temperature: 0.82,
    });
  } catch {
    return Object.values(normalized).filter(Boolean).join(", ");
  }
}

async function handlePromptAssistRoute(path, req, res, { verifySessionToken, json, readJsonRequestBody, touchUser }) {
  if (req.method !== "POST") return false;
  if (
    path !== "wizard/compose"
    && path !== "suggest"
    && path !== "prompt/improve"
    && path !== "prompt/manga-compose"
    && path !== "coherence/manga-check"
  ) return false;

  const body = await readJsonRequestBody(req);

  if (path === "coherence/manga-check") {
    const { runCoherenceCheck } = require("./mangaCoherence.cjs");
    const result = runCoherenceCheck(body);
    json(res, 200, result);
    return true;
  }

  const auth = req.headers.authorization || "";
  const tm = auth.match(/^Bearer\s+(.+)$/i);
  if (!tm) {
    json(res, 401, { detail: "Não autenticado." });
    return true;
  }
  const token = tm[1].trim();
  if (token.startsWith("local:")) {
    json(res, 503, { detail: "Assistente requer conta no servidor (Google ou registo)." });
    return true;
  }
  const sessionUser = verifySessionToken(token);
  if (!sessionUser) {
    json(res, 401, { detail: "Sessão inválida ou expirada." });
    return true;
  }

  if (path === "prompt/improve") {
    const raw = String(body.prompt || "").trim();
    if (raw.length < 3) {
      json(res, 400, { detail: "Prompt demasiado curto." });
      return true;
    }
    const { getUserById, addCredits } = require("./usersDb.cjs");
    const { getSurcharges } = require("./creditPricing.cjs");
    const PROMPT_IMPROVE_COST = getSurcharges().enhancePrompt ?? 5;
    const dbUser = await getUserById(sessionUser.id);
    const balance = Number(dbUser?.credits ?? sessionUser?.credits ?? 0);
    if (!sessionUser?.is_unlimited && balance < PROMPT_IMPROVE_COST) {
      json(res, 402, { detail: `Créditos insuficientes para melhorar prompt (custo: ${PROMPT_IMPROVE_COST}).` });
      return true;
    }
    const lang = String(body.lang || sessionUser.lang || "en").slice(0, 2);
    const context = {
      tool: String(body.tool || "").trim(),
      style_id: String(body.style_id || "").trim(),
      style_label: String(body.style_label || "").trim(),
      style_suffix: String(body.style_suffix || "").trim(),
      image_mode: body.image_mode === true || body.image_mode === "true" || body.image_mode === 1,
    };
    let newBalance = balance;
    if (!sessionUser?.is_unlimited) {
      const updated = await addCredits(
        sessionUser.id,
        -PROMPT_IMPROVE_COST,
        "spend",
        "Melhorar prompt",
        { action: "prompt_improve", tool: context.tool || "generic" },
      );
      if (updated != null) newBalance = updated;
    }
    try {
      const improved = await improvePrompt(raw, lang, context);
      const changed = improved.trim() !== raw.trim();
      await touchUser(sessionUser.id, req, { action: "prompt_improve" });
      json(res, 200, {
        prompt: improved,
        enhanced: changed,
        tool: context.tool || null,
        credits_spent: sessionUser?.is_unlimited ? 0 : PROMPT_IMPROVE_COST,
        new_balance: sessionUser?.is_unlimited ? null : newBalance,
      });
    } catch (err) {
      if (!sessionUser?.is_unlimited) {
        await addCredits(
          sessionUser.id,
          PROMPT_IMPROVE_COST,
          "refund",
          "Refund: prompt improve failed",
          { action: "prompt_improve", reason: "failed" },
        );
      }
      throw err;
    }
    return true;
  }

  if (path === "prompt/manga-compose") {
    const { composeMangaPrompt } = require("./mangaPrompt.cjs");
    const mode = String(body.mode || "panel");
    let panel = body.panel;
    let panels = body.panels;
    let project = body.project;
    let character = body.character;
    let scenario = body.scenario;
    try {
      if (typeof panel === "string") panel = JSON.parse(panel);
      if (typeof panels === "string") panels = JSON.parse(panels);
      if (typeof project === "string") project = JSON.parse(project);
      if (typeof character === "string") character = JSON.parse(character);
      if (typeof scenario === "string") scenario = JSON.parse(scenario);
    } catch {
      /* use as-is */
    }
    const lang = String(body.lang || sessionUser.lang || "en").slice(0, 2);
    let prompt = "";
    try {
      prompt = await composeMangaPrompt({
        mode,
        panel,
        panels,
        project,
        character,
        scenario,
        lang,
      });
    } catch (e) {
      if (e.status === 503 && body.fallback_prompt) {
        prompt = String(body.fallback_prompt);
      } else {
        throw e;
      }
    }
    if (!prompt || prompt.length < 20) {
      json(res, 502, { detail: "Não foi possível compor o prompt." });
      return true;
    }
    await touchUser(sessionUser.id, req, { action: "manga_compose" });
    json(res, 200, { prompt, composed_by: "gpt" });
    return true;
  }

  if (path === "wizard/compose") {
    const answers = body.answers || {};
    const prompt = await wizardCompose(answers);
    await touchUser(sessionUser.id, req, { action: "wizard_compose" });
    json(res, 200, { prompt, answers_resolved: normalizeWizardAnswers(answers) });
    return true;
  }

  const theme = String(body.theme || "").trim();
  if (theme.length < 2) {
    json(res, 400, { detail: "Tema demasiado curto." });
    return true;
  }
  const lang = String(body.lang || sessionUser.lang || "en").slice(0, 2);
  const prompts = await suggestPrompts(theme, lang);
  await touchUser(sessionUser.id, req, { action: "suggest" });
  json(res, 200, { prompts });
  return true;
}

module.exports = {
  handlePromptAssistRoute,
  normalizeWizardAnswers,
  wizardCompose,
  suggestPrompts,
  improvePrompt,
  composeMangaPrompt: () => require("./mangaPrompt.cjs").composeMangaPrompt,
};
