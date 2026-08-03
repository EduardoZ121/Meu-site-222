const GPT_HQ_STYLES = require("./gptHqStylesData.json");

function getGptHqStyle(styleId) {
  const id = String(styleId || "").trim();
  return GPT_HQ_STYLES.find((s) => s.id === id) || null;
}

function listGptHqStyles() {
  return GPT_HQ_STYLES.map((s) => ({ ...s }));
}

/** Public catalogue — prompts stay server-side. */
function listGptHqStylesPublic() {
  return GPT_HQ_STYLES.map((s) => ({
    id: s.id,
    name: s.name,
    label: s.label || s.name,
    cover: s.cover || "",
    cost: Number(s.cost) > 0 ? Math.round(Number(s.cost)) : 50,
    comingSoon: Boolean(s.comingSoon),
    has_prompt: Boolean(String(s.prompt || "").trim()) && !s.comingSoon,
    category: s.category || "enhance",
  }));
}

module.exports = {
  GPT_HQ_STYLES,
  getGptHqStyle,
  listGptHqStyles,
  listGptHqStylesPublic,
};
