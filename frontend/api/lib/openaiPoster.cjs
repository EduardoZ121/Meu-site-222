/**
 * Pôsteres via OpenAI gpt-image-1 — texto e foto (JSON API, funciona na Vercel).
 */

const { loadImageBuffer } = require("./posterImagePrep.cjs");
const { getOpenAIKey } = require("./openaiEnv.cjs");

const MODELS = ["gpt-image-1", "gpt-image-1.5"];

async function toOpenAIImageUrl(imageRef) {
  const ref = String(imageRef || "").trim();
  if (!ref) return null;
  if (ref.startsWith("data:")) return ref;
  if (/^https?:\/\//i.test(ref)) return ref;

  const buf = await loadImageBuffer(ref);
  if (!buf?.length) return null;

  try {
    const sharp = require("sharp");
    const png = await sharp(buf, { failOn: "none" }).rotate().png().toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return `data:image/png;base64,${buf.toString("base64")}`;
  }
}

async function openaiPosterRequest(apiKey, path, body) {
  const res = await fetch(`https://api.openai.com/v1/images/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return { res, data: await res.json().catch(() => ({})) };
}

async function parseOpenAIImageResponse(res, data) {
  if (!res.ok) {
    const msg = data?.error?.message || data?.error?.code || `OpenAI ${res.status}`;
    const err = new Error(String(msg));
    err.status = res.status >= 400 && res.status < 600 ? res.status : 502;
    throw err;
  }

  const item = data?.data?.[0];
  if (item?.url) return item.url;
  if (item?.b64_json) return `data:image/png;base64,${item.b64_json}`;

  const err = new Error("OpenAI não devolveu imagem.");
  err.status = 502;
  throw err;
}

async function generateOpenAIPosterImageWithKey(key, prompt, size, imageUrl) {
  let lastErr = null;

  for (const model of MODELS) {
    const payload = {
      model,
      prompt: String(prompt || "").slice(0, 32000),
      size,
      n: 1,
      quality: "high",
      output_format: "png",
    };

    let result;
    if (imageUrl) {
      result = await openaiPosterRequest(key, "edits", {
        ...payload,
        input_fidelity: "high",
        images: [{ image_url: imageUrl }],
      });
    } else {
      result = await openaiPosterRequest(key, "generations", payload);
    }

    if (result.res.ok) {
      return {
        url: await parseOpenAIImageResponse(result.res, result.data),
        modelUsed: `openai/${model}`,
      };
    }

    const msg = result.data?.error?.message || `OpenAI ${result.res.status}`;
    lastErr = new Error(String(msg));
    lastErr.status = result.res.status >= 400 && result.res.status < 600 ? result.res.status : 502;

    const retryable = /model|not found|does not exist|access/i.test(msg);
    if (!retryable || model === MODELS[MODELS.length - 1]) break;
  }

  throw lastErr || new Error("Motor GPT falhou.");
}

async function generateOpenAIPosterImageDetailed(prompt, size = "1024x1536", imageRef = null) {
  const { key } = getOpenAIKey();
  if (!key) {
    const err = new Error("Motor GPT indisponível — falta OPENAI_API_KEY na Vercel (Production).");
    err.status = 503;
    throw err;
  }

  const imageUrl = imageRef ? await toOpenAIImageUrl(imageRef) : null;
  if (imageRef && !imageUrl) {
    const err = new Error("Não foi possível ler a foto/logo para o Motor GPT.");
    err.status = 400;
    throw err;
  }

  return generateOpenAIPosterImageWithKey(key, prompt, size, imageUrl);
}

async function generateOpenAIPosterImage(prompt, size = "1024x1536", imageRef = null) {
  const result = await generateOpenAIPosterImageDetailed(prompt, size, imageRef);
  return result.url;
}

module.exports = {
  generateOpenAIPosterImage,
  generateOpenAIPosterImageDetailed,
  toOpenAIImageUrl,
};
