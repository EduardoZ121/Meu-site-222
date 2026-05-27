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

function improveModelId() {
  return String(process.env.PROMPT_ENHANCE_MODEL || process.env.SUPPORT_AI_MODEL || "gpt-4o").trim();
}

function improveMaxTokens(tool) {
  if (tool.startsWith("video")) return 380;
  if (tool === "poster") return 420;
  if (tool === "pro") return 240;
  if (tool === "inpaint" || tool === "clothes" || tool === "restore") return 260;
  return 320;
}

async function chatJson({ system, user, maxTokens = 520, temperature = 0.9, model = "gpt-4o-mini" }) {
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
      model,
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

async function chatText({ system, user, maxTokens = 420, temperature = 0.85, model = "gpt-4o-mini" }) {
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
      model,
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

function buildImproveSystemPrompt(context = {}) {
  const tool = String(context.tool || "studio").trim();
  const styleLabel = String(context.style_label || "").trim();
  const styleSuffix = String(context.style_suffix || "").trim();
  const imageMode = Boolean(context.image_mode);
  const motion = String(context.motion || "").trim();
  const durationSec = String(context.duration_sec || "").trim();
  const aspectRatio = String(context.aspect_ratio || "").trim();
  const presetLabel = String(context.preset_label || "").trim();
  const changeType = String(context.change_type || "").trim();
  const templateCategory = String(context.template_category || "").trim();

  const baseRules =
    "Keep ALL user-requested subjects, wardrobe (bikini, lingerie, swimwear, etc.), poses, actions, and intent — never remove or censor them. "
    + "Respond ONLY with the improved English prompt — no quotes, labels, or explanations.";

  if (tool === "video_text") {
    return (
      "You are a senior AI video director writing prompts for text-to-video generation (6–15 second clips). "
      + "Transform the user's idea into ONE vivid English scene description with clear subject action, environment, "
      + "lighting, atmosphere, and camera feel. Optimize for short-form motion — one cohesive moment, not a long story. "
      + "Do NOT append duration, aspect ratio, or motion-style tags. "
      + baseRules
    );
  }

  if (tool === "video_image") {
    return (
      "You are a senior AI video director writing prompts for image-to-video animation. "
      + "The user uploaded a reference frame — describe how that scene should MOVE and evolve: subtle motion, "
      + "camera drift, environmental animation, subject gestures. Preserve the identity and composition of the frame. "
      + "Do NOT append duration, aspect ratio, or motion-style tags. "
      + baseRules
    );
  }

  if (tool === "video_edit") {
    return (
      "You are an expert at video-to-video editing instructions. "
      + "Rewrite the user's request as precise edit directions for a short clip (max ~15s): what to change visually "
      + "(style, color grade, objects, atmosphere, VFX, wardrobe, background) while stating what must be preserved. "
      + "Be concrete and achievable in one pass. "
      + baseRules
    );
  }

  if (tool === "poster") {
    return (
      "You are a world-class graphic designer writing prompts for AI poster generation. "
      + "Enhance layout intent, typography hierarchy, mood, color story, and visual impact while keeping every "
      + "user-specified text, brand, and subject. Legible text and print-quality finish. "
      + (templateCategory ? `Category: ${templateCategory}. ` : "")
      + baseRules
    );
  }

  if (tool === "pro") {
    return (
      "You are a professional photo retouching director. "
      + "Turn the user's extra instructions into precise English retouch notes for an identity-preserving edit. "
      + "Focus on skin, lighting, color, wardrobe, background cleanup — never change the person's identity. "
      + (presetLabel ? `Active preset: ${presetLabel}. ` : "")
      + baseRules
    );
  }

  if (tool === "edit" || tool === "studio_edit") {
    return (
      "You are an expert at image-edit prompts. "
      + "Describe ONLY the changes to apply to the uploaded photo. Start with preserving the same person, face, body, and pose. "
      + "Then specify wardrobe, background, lighting, or object changes clearly. "
      + baseRules
    );
  }

  if (tool === "inpaint") {
    return (
      "You are an expert inpainting prompt writer. "
      + "Describe what should appear ONLY inside the masked region — background replacement, object removal, or texture fill. "
      + "Keep instructions local to the painted area; preserve the rest of the photo. "
      + baseRules
    );
  }

  if (tool === "clothes") {
    return (
      "You are a fashion styling prompt expert. "
      + "Clarify the outfit change: garment type, fabric, color, fit, and style. "
      + "The person's face, body, and pose must stay the same. "
      + (changeType ? `Change type: ${changeType}. ` : "")
      + baseRules
    );
  }

  if (tool === "restore") {
    return (
      "You are a photo restoration expert. "
      + "Turn the user's notes into precise restoration instructions: damage removal, face recovery, color recovery, sharpness. "
      + "Natural, archival look — no artificial plastic skin. "
      + baseRules
    );
  }

  if (tool === "artistic") {
    let system =
      "You are an expert at crafting image generation prompts for Remake Pixel Artistic Studio. "
      + "The visual style preset is applied separately — sharpen the USER's intent (subject, outfit, action, environment). "
      + baseRules;
    if (styleLabel) system += ` Active style name: ${styleLabel}.`;
    if (styleSuffix) {
      system += ` Align mood with this style recipe (do not repeat verbatim): ${styleSuffix.slice(0, 400)}.`;
    }
    if (imageMode) {
      system +=
        " Mode: IMAGE EDIT on a reference photo — output ONLY the list of changes to apply. "
        + "Start with 'Keep the same person, face, body, and pose.'";
    } else {
      system += " Mode: TEXT-TO-IMAGE — describe the full scene to generate.";
    }
    return system;
  }

  let system =
    "You are a senior creative director crafting world-class AI image prompts. "
    + "Transform the user's text (any language) into one vivid English prompt with subject, environment, "
    + "lighting, lens/framing, palette, and quality boosters (photorealistic, 8k, cinematic when appropriate). "
    + baseRules;

  if (motion) system += ` (Motion style ${motion} is added separately — do not mention it.)`;
  if (durationSec) system += ` (Duration ${durationSec}s is added separately — do not mention it.)`;
  if (aspectRatio) system += ` (Aspect ${aspectRatio} is set separately — do not mention it.)`;

  return system;
}

async function improvePrompt(prompt, lang = "en", context = {}) {
  const trimmed = String(prompt || "").trim();
  if (trimmed.length < 3) return trimmed;
  const tool = String(context.tool || "studio").trim();
  const system = buildImproveSystemPrompt(context);
  try {
    const improved = await chatText({
      system,
      user: trimmed,
      maxTokens: improveMaxTokens(tool),
      temperature: 0.78,
      model: improveModelId(),
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

async function maybeImprovePrompt(prompt, enabled, lang, context = {}) {
  if (!enabled) return String(prompt || "").trim();
  return improvePrompt(prompt, lang, context);
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

async function wizardCompose(answers) {
  const normalized = normalizeWizardAnswers(answers);
  try {
    return await chatText({
      system:
        "You are a senior creative director writing world-class image-generation prompts. "
        + "Given JSON of user answers, produce ONE strong English prompt (90–140 words) with subject, style, lighting, "
        + "palette, lens/framing, and quality boosters. Single paragraph only — no quotes or labels.",
      user: JSON.stringify(normalized),
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
    const lang = String(body.lang || sessionUser.lang || "en").slice(0, 2);
    const context = {
      tool: String(body.tool || "studio").trim(),
      style_id: String(body.style_id || "").trim(),
      style_label: String(body.style_label || "").trim(),
      style_suffix: String(body.style_suffix || "").trim(),
      image_mode: body.image_mode === true || body.image_mode === "true" || body.image_mode === 1,
      motion: String(body.motion || "").trim(),
      duration_sec: String(body.duration_sec || "").trim(),
      aspect_ratio: String(body.aspect_ratio || "").trim(),
      preset_label: String(body.preset_label || "").trim(),
      change_type: String(body.change_type || "").trim(),
      template_category: String(body.template_category || "").trim(),
    };
    const improved = await improvePrompt(raw, lang, context);
    const changed = improved.trim() !== raw.trim();
    await touchUser(sessionUser.id, req, { action: "prompt_improve" });
    json(res, 200, { prompt: improved, enhanced: changed, tool: context.tool || null });
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
  maybeImprovePrompt,
  composeMangaPrompt: () => require("./mangaPrompt.cjs").composeMangaPrompt,
};
