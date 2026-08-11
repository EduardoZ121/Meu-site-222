/** Lê a chave OpenAI — aceita nomes comuns na Vercel (sem expor o valor). */
const ENV_CANDIDATES = [
  "OPENAI_API_KEY",
  "OPENAI_KEY",
  "OPENAI_API_TOKEN",
  "OPENAI_SECRET_KEY",
];

function normalizeEnvValue(raw) {
  return String(raw || "").trim().replace(/^['"]+|['"]+$/g, "");
}

function getOpenAIKey() {
  for (const name of ENV_CANDIDATES) {
    const value = normalizeEnvValue(process.env[name]);
    if (value.length >= 8) return { key: value, source: name };
  }
  return { key: "", source: null };
}

function openaiConfigured() {
  return Boolean(getOpenAIKey().key);
}

function openaiConfigStatus() {
  const { key, source } = getOpenAIKey();
  if (key) return { ready: true, source };
  for (const name of ENV_CANDIDATES) {
    const raw = normalizeEnvValue(process.env[name]);
    if (raw.length > 0 && raw.length < 8) {
      return { ready: false, reason: "too_short", source: name, length: raw.length };
    }
  }
  return { ready: false, reason: "missing", source: null };
}

module.exports = {
  getOpenAIKey,
  openaiConfigured,
  openaiConfigStatus,
  ENV_CANDIDATES,
};
