const { buildSiteKnowledge } = require("./siteKnowledge.cjs");
const { getUserById } = require("./usersDb.cjs");
const { PERSONA, firstName, getFewShot } = require("./supportPersona.cjs");

const MAX_HISTORY = 16;
const MAX_OUTPUT_TOKENS = 1100;

function supportEmail() {
  return String(process.env.SUPPORT_EMAIL || "suporte@remakepix.com").trim();
}

function modelId() {
  return String(process.env.SUPPORT_AI_MODEL || "gpt-4o").trim();
}

function pageLabel(path, lang) {
  const p = String(path || "").trim();
  const map = {
    "/app/generate": { pt: "Estúdio (Gerar)", en: "Studio (Generate)" },
    "/app/tools": { pt: "Ferramentas", en: "Tools" },
    "/app/posters": { pt: "Pôsteres", en: "Posters" },
    "/app/billing": { pt: "Faturação", en: "Billing" },
    "/app/settings": { pt: "Definições", en: "Settings" },
  };
  const entry = map[p];
  if (!entry) return p || (lang === "en" ? "dashboard" : "painel");
  return entry[lang] || entry.pt;
}

function buildSystemPrompt({ lang, user, dbUser, page }) {
  const { origin, tools, pages } = buildSiteKnowledge();
  const credits = dbUser?.credits ?? user?.credits ?? "?";
  const unlimited = dbUser?.is_unlimited || user?.is_unlimited;
  const support = supportEmail();
  const persona = PERSONA[lang] || PERSONA.pt;
  const name = firstName(user, dbUser);
  const nameLine = name
    ? lang === "en"
      ? `The user's first name is ${name}. Use it naturally, not every sentence.`
      : lang === "es"
        ? `El usuario se llama ${name}. Úsalo con naturalidad.`
        : lang === "fr"
          ? `L'utilisateur s'appelle ${name}. Utilise son prénom naturellement.`
          : `O utilizador chama-se ${name}. Usa o nome com naturalidade, não em todas as frases.`
    : lang === "en"
      ? "You don't know their name yet — don't invent one."
      : "Ainda não sabes o nome — não inventes um.";

  const langRule =
    lang === "en"
      ? "Write in natural English."
      : lang === "es"
        ? "Escribe en español natural."
        : lang === "fr"
          ? "Écris en français naturel."
          : "Escreve em português de Portugal (tu), coloquial mas profissional — como uma colega prestável no chat.";

  const onPage = page
    ? `They are currently on: ${pageLabel(page, lang)} (${origin}${page}). Reference that if relevant.`
    : "";

  return `You are ${persona.name}, ${persona.role}. You are NOT a generic chatbot — you are a real human-style guide who works with this product every day.

${langRule}
${nameLine}
${onPage}

## How you sound (mandatory)
- Warm, direct, specific — like WhatsApp with a creative friend who knows the product.
- React to EXACTLY what they said last. Mirror their energy (casual if they're casual).
- Short paragraphs. Max 1–2 emoji per message, only when it feels natural.
- Give ONE clear next step + link when useful: [texto](${origin}/path)
- Ask one follow-up question when it helps unblock them.

## Never do this
- Never open with "Como assistente de IA" / "I'm an AI language model" / "Estou aqui para ajudar com todas as suas necessidades".
- Never dump the full tool list unless they ask "what can I do" or "list tools".
- Never reply in English if they wrote in Portuguese (unless they switch language).
- Never refuse creative help — you CAN suggest prompts, Remake Pixel tools, step-by-step flows.
- Never send users to external generators (Perchance, Omnieditor, etc.) — everything happens inside Remake Pixel.

## Product facts
- Site: ${origin}
- User credits: ${unlimited ? "unlimited (admin)" : credits}
- You cannot click Generate for them or change credits. Billing/refunds → ${support}

## Prompt help
- Image generator wants English prompts. Offer one tailored prompt they can copy.
- Deep link: ${origin}/app/generate?prompt= plus encodeURIComponent-style (spaces as %20).
- No prompts? Suggest free [Assistente 5 perguntas](${origin}/app/wizard) or [Sugestões](${origin}/app/suggest).
- Video: ${origin}/app/video (foto ou texto → clipe ~6s).

## Tools (reference when relevant)
${tools}

## Pages
${pages}`;
}

function offlineReply({ lang, user, dbUser, userText }) {
  const { origin } = buildSiteKnowledge();
  const credits = dbUser?.credits ?? user?.credits ?? 0;
  const unlimited = dbUser?.is_unlimited || user?.is_unlimited;
  const bal = unlimited ? "∞" : String(credits);
  const name = firstName(user, dbUser);
  const hey = name ? (lang === "en" ? `Hey ${name}` : lang === "es" ? `Hola ${name}` : lang === "fr" ? `Salut ${name}` : `Olá ${name}`) : (lang === "en" ? "Hey" : lang === "es" ? "Hola" : lang === "fr" ? "Salut" : "Olá");

  if (lang === "en") {
    return `${hey}! I'm Sofia from Remake Pixel — you have ${bal} credits.\n\nTell me what you're trying to make (portrait, poster, remove background…) and I'll point you to the right place with a direct link.`;
  }
  if (lang === "es") {
    return `${hey}! Soy Sofia de Remake Pixel — tienes ${bal} créditos.\n\nCuéntame qué quieres crear y te digo el camino más rápido con enlace directo.`;
  }
  if (lang === "fr") {
    return `${hey} ! Je suis Sofia chez Remake Pixel — tu as ${bal} crédits.\n\nDis-moi ce que tu veux faire et je te guide avec un lien direct.`;
  }
  return `${hey}! Sou a Sofia do Remake Pixel — tens ${bal} créditos.\n\nConta-me o que queres fazer (retrato, poster, tirar fundo…) e eu digo-te o caminho mais rápido com link para abrires já.`;
}

async function openAiChat(messages) {
  const key = String(process.env.OPENAI_API_KEY || "").trim();
  if (!key) {
    const err = new Error("OPENAI_API_KEY not configured");
    err.status = 503;
    throw err;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 28000);
  let res;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: modelId(),
        messages,
        max_tokens: MAX_OUTPUT_TOKENS,
        temperature: 0.82,
        presence_penalty: 0.15,
        frequency_penalty: 0.2,
      }),
    });
  } catch (e) {
    if (e?.name === "AbortError") {
      const err = new Error("OpenAI timeout");
      err.status = 504;
      throw err;
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error?.message || `OpenAI error ${res.status}`);
    err.status = res.status === 429 ? 429 : 502;
    throw err;
  }

  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) {
    const err = new Error("Empty response from AI");
    err.status = 502;
    throw err;
  }
  return text;
}

function sanitizeHistory(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && String(m.content || "").trim())
    .slice(-MAX_HISTORY)
    .map((m) => ({
      role: m.role,
      content: String(m.content).slice(0, 3500),
    }));
}

async function runSupportChat({ messages, lang, user, page }) {
  const history = sanitizeHistory(messages);
  const lastUser = [...history].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    const err = new Error("Mensagem em falta.");
    err.status = 400;
    throw err;
  }

  const dbUser = user?.id ? await getUserById(user.id) : null;
  const langCode = lang || "en";
  const { origin } = buildSiteKnowledge();
  const name = firstName(user, dbUser);

  try {
    const system = buildSystemPrompt({ lang: langCode, user, dbUser, page });
    const fewShot = getFewShot(langCode, origin, name);
    const apiMessages = [
      { role: "system", content: system },
      ...fewShot,
      ...history,
    ];
    const reply = await openAiChat(apiMessages);
    return {
      reply,
      model: modelId(),
      support_email: supportEmail(),
    };
  } catch (e) {
    if (e.status === 503 || e.status === 502 || e.status === 429 || e.status === 504) {
      return {
        reply: offlineReply({ lang: langCode, user, dbUser, userText: lastUser.content }),
        model: "offline-fallback",
        support_email: supportEmail(),
        fallback: true,
      };
    }
    throw e;
  }
}

module.exports = { runSupportChat, supportEmail, offlineReply, firstName };
