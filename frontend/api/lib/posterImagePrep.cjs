const { fitImageRefToAspect, fitImageRefToPixelSize } = require("./fitImageToAspect.cjs");

async function loadImageBuffer(imageRef) {
  const ref = String(imageRef || "");
  if (ref.startsWith("data:")) {
    const comma = ref.indexOf(",");
    if (comma < 0) return null;
    return Buffer.from(ref.slice(comma + 1), "base64");
  }
  if (/^https?:\/\//i.test(ref)) {
    const res = await fetch(ref);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  }
  return null;
}

/**
 * Coloca o logo no canto superior-esquerdo da foto de referência (Grok só aceita 1 imagem).
 *
 * @param {string} photoRef
 * @param {string} logoRef
 * @returns {Promise<string>}
 */
async function compositeLogoOnReference(photoRef, logoRef) {
  let sharp;
  try {
    sharp = require("sharp");
  } catch {
    return photoRef;
  }

  const photoBuf = await loadImageBuffer(photoRef);
  const logoBuf = await loadImageBuffer(logoRef);
  if (!photoBuf?.length || !logoBuf?.length) return photoRef;

  try {
    const base = sharp(photoBuf, { failOn: "none" }).rotate();
    const meta = await base.metadata();
    const w = meta.width || 1080;
    const logoMaxW = Math.max(64, Math.round(w * 0.14));
    const logo = await sharp(logoBuf, { failOn: "none" })
      .rotate()
      .resize({ width: logoMaxW, withoutEnlargement: true })
      .png()
      .toBuffer();
    const logoMeta = await sharp(logo).metadata();
    const pad = Math.round(w * 0.03);
    const left = pad;
    const top = pad;

    const out = await base
      .composite([{ input: logo, left, top }])
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer();

    return `data:image/jpeg;base64,${out.toString("base64")}`;
  } catch {
    return photoRef;
  }
}

/**
 * Fashion: painel esquerdo = pessoa, direito = roupa (referência dupla numa só imagem).
 */
async function compositeFashionSideBySide(photoRef, garmentRef) {
  let sharp;
  try {
    sharp = require("sharp");
  } catch {
    return photoRef;
  }

  const photoBuf = await loadImageBuffer(photoRef);
  const garmentBuf = await loadImageBuffer(garmentRef);
  if (!photoBuf?.length || !garmentBuf?.length) return photoRef;

  try {
    const panelW = 540;
    const panelH = 720;
    const person = await sharp(photoBuf, { failOn: "none" })
      .rotate()
      .resize(panelW, panelH, { fit: "cover", position: "attention" })
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer();
    const garment = await sharp(garmentBuf, { failOn: "none" })
      .rotate()
      .resize(panelW, panelH, { fit: "cover", position: "centre" })
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer();

    const out = await sharp({
      create: {
        width: panelW * 2,
        height: panelH,
        channels: 3,
        background: { r: 245, g: 240, b: 232 },
      },
    })
      .composite([
        { input: person, left: 0, top: 0 },
        { input: garment, left: panelW, top: 0 },
      ])
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer();

    return `data:image/jpeg;base64,${out.toString("base64")}`;
  } catch {
    return photoRef;
  }
}

/**
 * Prepara referência única para Grok: aspecto + logo opcional.
 */
async function preparePosterReference(photoRef, logoRef, aspectRatio, options = {}) {
  let ref = photoRef || null;
  if (options.fashion && ref && logoRef) {
    ref = await compositeFashionSideBySide(ref, logoRef);
  } else if (ref && logoRef) {
    ref = await compositeLogoOnReference(ref, logoRef);
  } else if (!ref && logoRef) {
    ref = logoRef;
  }
  if (ref && aspectRatio) {
    ref = await fitImageRefToAspect(ref, aspectRatio, {
      position: options.subjectPosition || "bottom",
    });
  }
  return ref;
}

/**
 * Prepara referência para OpenAI GPT Image — dimensões EXACTAS do size (ex. 1024x1536).
 * Evita letterbox preto quando o rácio da foto não coincide com o output da API.
 */
async function preparePosterReferenceForOpenAI(photoRef, logoRef, openaiSize, options = {}) {
  let ref = photoRef || null;
  if (options.fashion && ref && logoRef) {
    ref = await compositeFashionSideBySide(ref, logoRef);
  } else if (ref && logoRef) {
    ref = await compositeLogoOnReference(ref, logoRef);
  } else if (!ref && logoRef) {
    ref = logoRef;
  }

  const parts = String(openaiSize || "").split("x").map((n) => Number(n));
  const w = parts[0];
  const h = parts[1];
  if (ref && w > 0 && h > 0) {
    ref = await fitImageRefToPixelSize(ref, w, h, options.subjectPosition || "bottom");
  }
  return ref;
}

module.exports = {
  compositeLogoOnReference,
  compositeFashionSideBySide,
  preparePosterReference,
  preparePosterReferenceForOpenAI,
  loadImageBuffer,
};
