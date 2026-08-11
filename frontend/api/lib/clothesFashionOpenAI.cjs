const { generateOpenAIImageEditDetailed } = require("./openaiPoster.cjs");
const { loadImageBuffer } = require("./posterImagePrep.cjs");
const { aspectToOpenAISize, openAISizeToAspectRatio } = require("./posterEngine.cjs");
const { pickRandomFashionPrompt } = require("./clothesFashionPrompts.cjs");

async function detectAspectRatio(imageRef) {
  const buf = await loadImageBuffer(imageRef);
  if (!buf?.length) return "4:5";
  try {
    const sharp = require("sharp");
    const meta = await sharp(buf, { failOn: "none" }).metadata();
    const w = Number(meta.width) || 0;
    const h = Number(meta.height) || 0;
    if (!w || !h) return "4:5";
    const ratio = w / h;
    if (ratio > 1.25) return "16:9";
    if (ratio > 1.05) return "4:3";
    if (ratio < 0.8) return "2:3";
    if (ratio < 0.95) return "4:5";
    return "1:1";
  } catch {
    return "4:5";
  }
}

async function generateFashionClothesImage(personRef, garmentRef) {
  const picked = pickRandomFashionPrompt();
  const aspect = await detectAspectRatio(personRef);
  const size = aspectToOpenAISize(aspect);

  if (!personRef || !garmentRef) {
    const err = new Error("Modo Fashion: envia foto da pessoa e foto da roupa.");
    err.status = 400;
    throw err;
  }

  const result = await generateOpenAIImageEditDetailed({
    prompt: picked.prompt,
    size,
    imageRefs: [personRef, garmentRef],
    inputFidelity: "high",
    preferMultipart: true,
  });

  return {
    url: result.url,
    modelUsed: result.modelUsed || "openai/gpt-image-1.5",
    prompt: picked.prompt,
    aspectRatio: openAISizeToAspectRatio(size),
    styleId: picked.id,
  };
}

module.exports = {
  generateFashionClothesImage,
  detectAspectRatio,
};
