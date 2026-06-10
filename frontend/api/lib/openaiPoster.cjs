/**
 * OpenAI gpt-image-1 — geração e edição (JSON + multipart fallback).
 */

const { loadImageBuffer } = require("./posterImagePrep.cjs");
const { getOpenAIKey, openaiConfigured } = require("./openaiEnv.cjs");

const MODELS = ["gpt-image-1.5", "gpt-image-1"];

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

async function imageRefToPngBuffer(imageRef, options = {}) {
  const ref = String(imageRef || "").trim();
  if (!ref) return null;
  const buf = await loadImageBuffer(ref);
  if (!buf?.length) return null;
  const maxSide = Math.max(512, Math.min(1536, Number(options.maxSide) || 1024));
  try {
    const sharp = require("sharp");
    return sharp(buf, { failOn: "none" })
      .rotate()
      .resize({ width: maxSide, height: maxSide, fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
  } catch {
    return buf;
  }
}

async function imageRefsToEditBuffers(imageRefs, options = {}) {
  const refs = Array.isArray(imageRefs) ? imageRefs.filter(Boolean) : [];
  const out = [];
  for (const ref of refs) {
    // eslint-disable-next-line no-await-in-loop
    const buf = await imageRefToPngBuffer(ref, options);
    if (buf?.length) out.push(buf);
  }
  return out;
}

async function openaiPosterRequestJson(apiKey, path, body) {
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

async function openaiPosterRequestMultipart(apiKey, path, fields, imageBuffers = []) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (v != null && v !== "") form.append(k, String(v));
  }
  const buffers = Array.isArray(imageBuffers) ? imageBuffers : [imageBuffers].filter(Boolean);
  for (let i = 0; i < buffers.length; i += 1) {
    const buf = buffers[i];
    if (buf?.length) {
      const blob = new Blob([buf], { type: "image/png" });
      form.append("image[]", blob, `reference-${i + 1}.png`);
    }
  }
  const res = await fetch(`https://api.openai.com/v1/images/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
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

function buildOpenAIError(lastErr) {
  if (lastErr) return lastErr;
  if (!openaiConfigured()) {
    const err = new Error(
      "Motor GPT indisponível — não foi possível ler OPENAI_API_KEY no servidor.",
    );
    err.status = 503;
    return err;
  }
  const err = new Error("Motor GPT falhou.");
  err.status = 502;
  return err;
}

async function requestOpenAIImage(key, {
  prompt,
  size,
  imageUrl,
  imageRef,
  imageUrls = [],
  imageRefs = [],
  inputFidelity = "low",
  preferMultipart = false,
}) {
  const payload = {
    model: MODELS[0],
    prompt: String(prompt || "").slice(0, 32000),
    size,
    n: 1,
    quality: "high",
    output_format: "png",
  };

  const urls = imageUrls.length
    ? imageUrls
    : imageUrl
      ? [imageUrl]
      : imageRef
        ? [imageUrl || imageRef]
        : [];
  const refs = imageRefs.length
    ? imageRefs
    : imageRef
      ? [imageRef]
      : [];

  let lastErr = null;

  for (const model of MODELS) {
    const base = { ...payload, model };

    if (urls.length || refs.length) {
      const resolvedUrls = urls.length
        ? urls
        : await Promise.all(refs.map((r) => toOpenAIImageUrl(r)));

      const jsonBody = {
        ...base,
        input_fidelity: inputFidelity,
        background: "opaque",
        images: resolvedUrls.filter(Boolean).map((u) => ({ image_url: u })),
      };

      let result = await openaiPosterRequestJson(key, "edits", jsonBody);
      if (!result.res.ok) {
        const msg = result.data?.error?.message || `OpenAI ${result.res.status}`;
        const tryMultipart = /content.?type|multipart|image|invalid|unsupported|required/i.test(msg)
          || result.res.status === 415
          || result.res.status === 400;

        if (tryMultipart) {
          const pngBufs = [];
          for (const ref of refs.length ? refs : [imageRef || imageUrl].filter(Boolean)) {
            // eslint-disable-next-line no-await-in-loop
            const b = await imageRefToPngBuffer(ref);
            if (b?.length) pngBufs.push(b);
          }
          if (pngBufs.length) {
            result = await openaiPosterRequestMultipart(key, "edits", {
              model,
              prompt: base.prompt,
              size,
              n: "1",
              quality: "high",
              output_format: "png",
              input_fidelity: inputFidelity,
              background: "opaque",
            }, pngBufs);
          }
        }
      }

      if (result.res.ok) {
        return {
          url: await parseOpenAIImageResponse(result.res, result.data),
          modelUsed: `openai/${model}`,
        };
      }

      lastErr = new Error(String(result.data?.error?.message || `OpenAI ${result.res.status}`));
      lastErr.status = result.res.status >= 400 && result.res.status < 600 ? result.res.status : 502;
    } else {
      const result = await openaiPosterRequestJson(key, "generations", base);
      if (result.res.ok) {
        return {
          url: await parseOpenAIImageResponse(result.res, result.data),
          modelUsed: `openai/${model}`,
        };
      }
      lastErr = new Error(String(result.data?.error?.message || `OpenAI ${result.res.status}`));
      lastErr.status = result.res.status >= 400 && result.res.status < 600 ? result.res.status : 502;
    }

    const retryable = /model|not found|does not exist|access/i.test(lastErr.message);
    if (!retryable || model === MODELS[MODELS.length - 1]) break;
  }

  throw buildOpenAIError(lastErr);
}

async function generateOpenAIImageEditDetailed(options = {}) {
  const { key } = getOpenAIKey();
  if (!key) throw buildOpenAIError(null);

  const {
    prompt,
    size = "1024x1536",
    imageRef = null,
    imageRefs = [],
    imageUrls = [],
    inputFidelity = "low",
    preferMultipart = false,
  } = options;

  return requestOpenAIImage(key, {
    prompt,
    size,
    imageRef,
    imageRefs,
    imageUrls,
    inputFidelity,
    preferMultipart,
  });
}

async function generateOpenAIPosterImageWithKey(key, prompt, size, imageRef, inputFidelity = "low") {
  const imageUrl = imageRef ? await toOpenAIImageUrl(imageRef) : null;
  return requestOpenAIImage(key, { prompt, size, imageUrl, imageRef: imageRef || null, inputFidelity });
}

async function generateOpenAIPosterImageDetailed(prompt, size = "1024x1536", imageRef = null, options = {}) {
  const { key } = getOpenAIKey();
  if (!key) throw buildOpenAIError(null);

  const inputFidelity = options.inputFidelity || "low";

  if (imageRef && !(await toOpenAIImageUrl(imageRef))) {
    const err = new Error("Não foi possível ler a foto/logo para o Motor GPT.");
    err.status = 400;
    throw err;
  }

  return generateOpenAIPosterImageWithKey(key, prompt, size, imageRef, inputFidelity);
}

async function generateOpenAIPosterImage(prompt, size = "1024x1536", imageRef = null) {
  const result = await generateOpenAIPosterImageDetailed(prompt, size, imageRef);
  return result.url;
}

module.exports = {
  generateOpenAIPosterImage,
  generateOpenAIPosterImageDetailed,
  generateOpenAIImageEditDetailed,
  toOpenAIImageUrl,
  openaiConfigured,
};
