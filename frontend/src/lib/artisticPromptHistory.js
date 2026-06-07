const STORAGE_KEY = "remakepix_artistic_prompt_history";
const MAX = 10;

export function readArtisticPromptHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((s) => typeof s === "string" && s.trim()) : [];
  } catch {
    return [];
  }
}

export function pushArtisticPromptHistory(prompt) {
  const text = String(prompt || "").trim();
  if (text.length < 3) return readArtisticPromptHistory();
  const prev = readArtisticPromptHistory().filter((p) => p !== text);
  const next = [text, ...prev].slice(0, MAX);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
  return next;
}
