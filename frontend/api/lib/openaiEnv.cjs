/** Lê a chave OpenAI — aceita nomes comuns na Vercel (sem expor o valor). */
const ENV_CANDIDATES = [
  "OPENAI_API_KEY",
  "OPENAI_KEY",
  "OPENAI_API_TOKEN",
  "OPENAI_SECRET_KEY",
];

function getOpenAIKey() {
  for (const name of ENV_CANDIDATES) {
    const value = String(process.env[name] || "").trim();
    if (value) return { key: value, source: name };
  }
  return { key: "", source: null };
}

function openaiConfigured() {
  return Boolean(getOpenAIKey().key);
}

module.exports = { getOpenAIKey, openaiConfigured, ENV_CANDIDATES };
