/**
 * AI Text Playground (admin-only).
 * Corre o mesmo prompt em vários modelos (do fraco ao forte) e devolve
 * resposta + latência de cada um, para comparar qualidade/velocidade
 * e avaliar alternativas ao OpenAI (ex.: modelos abertos via OpenRouter).
 *
 * Providers:
 *  - OpenAI    (api.openai.com)      -> OPENAI_API_KEY
 *  - OpenRouter(openrouter.ai)       -> OPENROUTER_API_KEY  (dezenas de modelos, alguns grátis)
 */

const { getOpenAIKey } = require("./openaiEnv.cjs");

const CALL_TIMEOUT_MS = 45000;
const MAX_MODELS = 6;

// Catálogo sugerido "do fraco ao forte". O frontend pode enviar a sua própria lista.
const DEFAULT_MODELS = [
  "meta-llama/llama-3.2-3b-instruct:free",
  "meta-llama/llama-3.1-8b-instruct",
  "gpt-4o-mini",
  "gpt-4o",
];

function providerForModel(model) {
  const id = String(model || "").trim().toLowerCase();
  if (!id) return null;
  // Modelos OpenAI diretos não têm "/" e começam por gpt/o1/o3/chatgpt
  if (!id.includes("/") && /^(gpt-|o1|o3|o4|chatgpt)/.test(id)) return "openai";
  return "openrouter";
}

function getOpenRouterKey() {
  const candidates = ["OPENROUTER_API_KEY", "OPENROUTER_KEY", "OPEN_ROUTER_API_KEY"];
  for (const name of candidates) {
    const v = String(process.env[name] || "").trim();
    if (v.length >= 8) return v;
  }
  return "";
}

async function callChatCompletion({ endpoint, key, model, messages, temperature, maxTokens, extraHeaders }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CALL_TIMEOUT_MS);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(extraHeaders || {}),
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages,
        temperature: typeof temperature === "number" ? temperature : 0.7,
        max_tokens: maxTokens || 700,
      }),
    });
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch { /* texto não-JSON */ }
    if (!res.ok) {
      const detail = data?.error?.message || data?.detail || text || `HTTP ${res.status}`;
      const err = new Error(String(detail).slice(0, 400));
      err.status = res.status;
      throw err;
    }
    const reply = data?.choices?.[0]?.message?.content || "";
    const usage = data?.usage || null;
    return { reply: String(reply).trim(), usage };
  } finally {
    clearTimeout(timer);
  }
}

async function runOneModel(model, { messages, temperature, maxTokens }) {
  const provider = providerForModel(model);
  const started = Date.now();
  try {
    if (provider === "openai") {
      const { key } = getOpenAIKey();
      if (!key) throw Object.assign(new Error("OPENAI_API_KEY não configurada na Vercel."), { status: 503 });
      const out = await callChatCompletion({
        endpoint: "https://api.openai.com/v1/chat/completions",
        key,
        model,
        messages,
        temperature,
        maxTokens,
      });
      return { model, provider, ok: true, reply: out.reply, usage: out.usage, latency_ms: Date.now() - started };
    }
    // OpenRouter
    const key = getOpenRouterKey();
    if (!key) {
      throw Object.assign(
        new Error("OPENROUTER_API_KEY não configurada. Cria uma chave grátis em openrouter.ai e adiciona-a nas Environment Variables da Vercel."),
        { status: 503 },
      );
    }
    const out = await callChatCompletion({
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      key,
      model,
      messages,
      temperature,
      maxTokens,
      extraHeaders: {
        "HTTP-Referer": "https://remakepix.com",
        "X-Title": "Remake AI Playground",
      },
    });
    return { model, provider, ok: true, reply: out.reply, usage: out.usage, latency_ms: Date.now() - started };
  } catch (e) {
    return {
      model,
      provider,
      ok: false,
      error: e.name === "AbortError" ? `Timeout (>${Math.round(CALL_TIMEOUT_MS / 1000)}s)` : (e.message || "Erro"),
      status: e.status || 500,
      latency_ms: Date.now() - started,
    };
  }
}

async function runAiTextPlayground(body) {
  const prompt = String(body?.prompt || "").trim();
  if (!prompt) {
    const err = new Error("Escreve uma mensagem para testar.");
    err.status = 400;
    throw err;
  }
  const system = String(body?.system || "").trim();
  let models = Array.isArray(body?.models) && body.models.length
    ? body.models.map((m) => String(m || "").trim()).filter(Boolean)
    : DEFAULT_MODELS.slice();
  // dedupe + limite
  models = Array.from(new Set(models)).slice(0, MAX_MODELS);

  const temperature = typeof body?.temperature === "number" ? body.temperature : 0.7;
  const maxTokens = Number(body?.max_tokens) > 0 ? Math.min(Number(body.max_tokens), 2000) : 700;

  const messages = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: prompt });

  const results = await Promise.all(
    models.map((m) => runOneModel(m, { messages, temperature, maxTokens })),
  );

  return {
    ok: true,
    prompt,
    system: system || null,
    openrouter_configured: Boolean(getOpenRouterKey()),
    openai_configured: Boolean(getOpenAIKey().key),
    results,
  };
}

module.exports = { runAiTextPlayground, DEFAULT_MODELS };
