const { fitImageRefToAspect } = require("./fitImageToAspect.cjs");

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
 * Prepara referência única para Grok: aspecto + logo opcional.
 */
async function preparePosterReference(photoRef, logoRef, aspectRatio) {
  let ref = photoRef || null;
  if (ref && logoRef) {
    ref = await compositeLogoOnReference(ref, logoRef);
  } else if (!ref && logoRef) {
    ref = logoRef;
  }
  if (ref && aspectRatio) {
    ref = await fitImageRefToAspect(ref, aspectRatio);
  }
  return ref;
}

module.exports = {
  compositeLogoOnReference,
  preparePosterReference,
  loadImageBuffer,
};
