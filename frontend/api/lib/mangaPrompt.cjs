/** GPT: transforma controlos do MANGA STUDIO num prompt de imagem preciso (não genérico). */

const POSE_LABELS = {
  talk: "Falar (mão no peito)",
  run: "Correr (braço para trás, perna levantada)",
  think: "Pensar (mão no queixo)",
  surprise: "Surpreso (olhos grandes, boca em O)",
  attack: "Ataque (pose de luta)",
  sit: "Sentado (joelhos no chão)",
};

function openAiKey() {
  return String(process.env.OPENAI_API_KEY || "").trim();
}

function poseLabel(id) {
  return POSE_LABELS[id] || id;
}

async function chatMangaPrompt({ system, user, maxTokens = 680 }) {
  const key = openAiKey();
  if (!key) {
    const err = new Error("OPENAI_API_KEY em falta — o servidor usa o prompt base.");
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
      temperature: 0.72,
    }),
  });
  if (!res.ok) {
    const err = new Error(`OpenAI ${res.status}`);
    err.status = 502;
    throw err;
  }
  const data = await res.json();
  return (data.choices?.[0]?.message?.content || "").trim().replace(/^["']|["']$/g, "");
}

/**
 * @param {{ mode: string, panel?: object, panels?: object[], project?: object, character?: object, scenario?: object, lang?: string }} input
 */
async function composeMangaPrompt(input) {
  const mode = String(input.mode || "panel").toLowerCase();
  const lang = String(input.lang || "en").slice(0, 2);
  const panel = input.panel || {};
  const character = input.character || null;
  const scenario = input.scenario || null;
  const project = input.project || {};

  const controlSummary = {
    mode,
    pageLayout: project.pageLayout || "horizontal",
    character: character
      ? {
          name: character.name,
          tag: character.tag,
          description: character.description,
          hasReferenceImage: Boolean(character.thumb || character.sheets?.front),
        }
      : null,
    scenario: scenario
      ? { name: scenario.name, description: scenario.description }
      : null,
    panel: {
      pose: poseLabel(panel.poseId),
      expression: panel.expression,
      angle: panel.angle,
      shot: panel.shot,
      framing: panel.framing,
      lighting: panel.lighting,
      focus: panel.focus,
      balloonText: panel.balloonText,
      balloonType: panel.balloonType,
      balloonPos: panel.balloonPos,
      letterStyle: panel.letterStyle,
      effects: panel.effects || {},
      aspect: panel.aspect,
    },
    panelsCount: Array.isArray(input.panels) ? input.panels.length : 0,
  };

  const system =
    "You are a manga/comic art director writing prompts for an AI image model (Grok Imagine). "
    + "The creator configured EVERY control in a studio UI — you must honor each choice literally. "
    + "Never output generic 'anime girl' scenes. Name the character, pose, expression, camera, lighting, scenario, "
    + "speech bubble text (if any), and manga effects. "
    + "Write ONE English prompt paragraph (120–200 words for panel, 180–260 for page, 220–300 for chapter). "
    + "Include: ink line quality, screentone optional, panel border, no watermark, no UI. "
    + "If balloon text is provided, specify bubble type and exact lettering. "
    + "Respond ONLY with the final prompt — no JSON, no labels.";

  const user =
    `Language of creator: ${lang}. Studio controls JSON:\n${JSON.stringify(controlSummary, null, 2)}`;

  return chatMangaPrompt({ system, user, maxTokens: mode === "chapter" ? 420 : mode === "page" ? 360 : 280 });
}

module.exports = { composeMangaPrompt };
