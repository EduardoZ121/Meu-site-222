const fs = require("fs/promises");
const crypto = require("crypto");
const { formidable } = require("formidable");
const Stripe = require("stripe");
const {
  countryFromRequest,
  getPackagesForRegion,
  getCreditCostsForRegion,
  getRegionConfig,
  resolvePricingRegion,
} = require("./pricingRegions.cjs");
const { handleAdminRoute } = require("./lib/adminHandlers.cjs");
const {
  ADMIN_EMAILS,
  upsertGoogleUser,
  touchUser,
  getUserById,
  addCredits,
  recordPurchase,
  storageEnabled,
} = require("./lib/usersDb.cjs");
const { spendCredits } = require("./lib/creditsDb.cjs");
const {
  createPending,
  getPending,
  pollPending,
  newPendingId,
} = require("./lib/pendingPredictions.cjs");
const { formatGenerationError } = require("./lib/generationErrors.cjs");
const { handleCreationsRoute } = require("./lib/creationsRoutes.cjs");
const { handlePromptAssistRoute } = require("./lib/promptAssist.cjs");
const PADRAO_STYLES_LIST = require("./lib/padraoStylesData.cjs");
const { finalizeImagePrompt } = require("./lib/imageQualityPrompts.cjs");
const { getProPreset, listProPresets } = require("./lib/proPresetsData.cjs");
const {
  isS3Configured,
  isTrustedS3MediaUrl,
  createVideoPresignedUpload,
  createImagePresignedUpload,
  getS3Config,
} = require("./lib/s3Upload.cjs");
const {
  getBlobReadWriteToken,
  isBlobConfigured,
  isBlobDisabled,
} = require("./lib/blobEnv.cjs");

function blobDisabledResponse(res) {
  return json(res, 410, {
    detail: "Vercel Blob está desligado neste projeto. Uploads usam POST directo (fotos comprimidas).",
    blob_disabled: true,
  });
}
const { listPosterTemplates } = require("./lib/posterTemplatesData.cjs");
const { improvePrompt } = require("./lib/promptAssist.cjs");

function getPadraoStyle(styleId) {
  return PADRAO_STYLES_LIST.find((s) => s.id === String(styleId || "").trim()) || null;
}

function isAdminEmail(email) {
  return ADMIN_EMAILS.has(String(email || "").trim().toLowerCase());
}

function sessionSecret() {
  return (
    process.env.RP_SESSION_SECRET
    || crypto.createHash("sha256").update(`${process.env.REPLICATE_API_TOKEN || ""}|${process.env.VERCEL_URL || "local"}`).digest("hex")
  );
}

/** Signed session JWT substitute (HMAC over base64url JSON). */
function signSession(user) {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 45; // 45d
  const body = Buffer.from(JSON.stringify({ ...user, exp }), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", sessionSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verifySessionToken(token) {
  try {
    const i = token.lastIndexOf(".");
    if (i <= 0) return null;
    const str = token.slice(0, i);
    const sig = token.slice(i + 1);
    const expect = crypto.createHmac("sha256", sessionSecret()).update(str).digest("base64url");
    if (sig.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
    const payload = JSON.parse(Buffer.from(str, "base64url").toString("utf8"));
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    const { exp, ...user } = payload;
    return user;
  } catch {
    return null;
  }
}

async function verifyGoogleCredential(credential) {
  const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  if (!r.ok) return null;
  const d = await r.json();
  const email = String(d.email || "").trim().toLowerCase();
  if (!email) return null;
  return {
    sub: d.sub,
    email,
    name: d.name || email.split("@")[0],
    picture: d.picture || null,
    email_verified: d.email_verified === "true" || d.email_verified === true,
  };
}

async function routeAuth(path, fields, req) {
  if (path === "auth/google") {
    const credential = fields.credential || fields.id_token;
    if (!credential) {
      const err = new Error("credential em falta.");
      err.status = 400;
      throw err;
    }
    const g = await verifyGoogleCredential(credential);
    if (!g) {
      const err = new Error("Credencial Google inválida ou expirada.");
      err.status = 401;
      throw err;
    }
    const region = regionFromRequest(req, fields);
    const dbUser = await upsertGoogleUser(g, req, { pricing_region: region });
    const unlimited = isAdminEmail(g.email) || Boolean(dbUser?.is_unlimited);
    const user = dbUser || {
      id: `google_${g.sub}`,
      email: g.email,
      name: g.name,
      avatar_url: g.picture || null,
      role: unlimited ? "admin" : "user",
      lang: "en",
      credits: unlimited ? 999999999 : 50,
      is_unlimited: unlimited,
      referral_code: "",
      email_verified: !!g.email_verified,
      created_at: new Date().toISOString(),
      pricing_region: region,
    };
    if (dbUser) {
      user.role = unlimited ? "admin" : dbUser.role;
      user.is_unlimited = unlimited;
      if (unlimited) user.credits = 999999999;
    }
    return { token: signSession(user), user };
  }

  // Email/password: sem base de dados no servidorless — o cliente usa contas locais (localStorage).
  const err = new Error("Conta por email neste servidor não está disponível; usa registo/login local no navegador.");
  err.status = 404;
  throw err;
}

const functionConfig = {
  api: {
    bodyParser: false,
  },
};

const {
  QWEN_EDIT_MODEL,
  isNsfwStyleId,
  resolveArtisticLabModel,
} = require("./lib/artisticStudioEngines.cjs");

function isArtisticExperimentalStyleId(styleId) {
  return isNsfwStyleId(styleId);
}

function resolveArtisticStudioModel({ styleId, hasPhoto, userDoc }) {
  const experimental = isArtisticExperimentalStyleId(styleId);
  if (experimental) {
    const adminOk = userDoc?.role === "admin" || userDoc?.nsfw_allowed;
    if (!adminOk) {
      const err = new Error("Este estilo requer permissão NSFW na conta.");
      err.status = 403;
      throw err;
    }
    if (!hasPhoto) {
      const err = new Error("AI Lab exige uma foto (Qwen Image Edit edita a referência).");
      err.status = 400;
      throw err;
    }
    return resolveArtisticLabModel();
  }
  return { modelKey: "standard", modelId: MODELS.standard, label: MODELS.standard };
}

const MODELS = {
  standard: "xai/grok-imagine-image",
  pro: "black-forest-labs/flux-2-klein-9b",
  artistic: "black-forest-labs/flux-2-klein-9b",
  kontext: "black-forest-labs/flux-kontext-max",
  qwen: QWEN_EDIT_MODEL,
  video: "xai/grok-imagine-video",
  video_edit: "wan-video/wan-2.7-videoedit",
  bg_remove: "851-labs/background-remover",
  upscale: "philz1337x/clarity-upscaler",
  inpaint: "black-forest-labs/flux-fill-pro",
};

function regionFromRequest(req, fields = {}) {
  const client = text(fields, "pricing_region", req?.headers?.["x-pricing-region"] || "");
  return resolvePricingRegion({
    countryCode: countryFromRequest(req),
    clientRegion: client,
  });
}

const GROK_SUPPORTED = new Set(["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "2:1", "1:2"]);
const FLUX_SUPPORTED = new Set(["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9", "9:21"]);

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Skip-Auto-Poll");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
}

function json(res, status, data) {
  setCors(res);
  res.status(status).json(data);
}

function normalizeRatio(ratio = "1:1", modelKey = "standard") {
  if (modelKey === "qwen") {
    if (!ratio || ["match", "match_input_image", "original"].includes(ratio)) return "match_input_image";
    if (GROK_SUPPORTED.has(ratio) || ratio === "match_input_image") return ratio;
    return { "4:5": "3:4", "5:4": "4:3", "21:9": "16:9", "9:21": "9:16" }[ratio] || "3:4";
  }
  if (!ratio || ["match", "match_input_image", "original"].includes(ratio)) {
    return modelKey === "pro" || modelKey === "artistic" || modelKey === "kontext" ? "match_input_image" : "1:1";
  }
  if (modelKey === "standard" || modelKey === "video") {
    if (GROK_SUPPORTED.has(ratio)) return ratio;
    return { "4:5": "3:4", "5:4": "4:3", "21:9": "2:1", "9:21": "1:2" }[ratio] || "1:1";
  }
  if (FLUX_SUPPORTED.has(ratio)) return ratio;
  return { "4:5": "3:4", "5:4": "4:3", "2:1": "21:9", "1:2": "9:21" }[ratio] || "1:1";
}

function first(value) {
  return Array.isArray(value) ? value[0] : value;
}

function text(fields, key, fallback = "") {
  const value = first(fields[key]);
  return value == null ? fallback : String(value);
}

function fileOf(files, key) {
  return first(files[key]);
}

/**
 * Detects HEIC/HEIF by ISOBMFF brand (bytes 4-12 = "ftyp<brand>"). Works
 * regardless of the file extension — Samsung "high efficiency" mode and
 * iCloud sync routinely save HEIF with a `.jpg` name.
 */
function sniffIsHeifLike(headBuf) {
  if (!headBuf || headBuf.length < 12) return false;
  if (headBuf[4] !== 0x66 || headBuf[5] !== 0x74 || headBuf[6] !== 0x79 || headBuf[7] !== 0x70) {
    return false;
  }
  const brand = headBuf.slice(8, 12).toString("ascii");
  return /^(heic|heix|hevc|hevx|mif1|msf1|heim|heis|hevm|hevs)$/i.test(brand);
}

/**
 * Best-effort conversion of uploaded image files to JPEG when the browser
 * delivered something the AI model can't read (HEIC/HEIF disguised as .jpg,
 * exotic colorspaces, etc.). Mutates `files` in place — replaces filepath,
 * mimetype and originalFilename. Failures are swallowed so the original file
 * is still attempted; the model just sees the original bytes in that case.
 */
async function normalizeUploadedImages(files) {
  if (!files || typeof files !== "object") return;
  let sharp;
  try {
    sharp = require("sharp");
  } catch {
    return; // sharp not available — leave files untouched
  }

  const fsp = require("fs/promises");
  const os = require("os");
  const pathMod = require("path");

  for (const key of Object.keys(files)) {
    const entries = Array.isArray(files[key]) ? files[key] : [files[key]];
    for (const file of entries) {
      if (!file || !file.filepath) continue;
      const mime = String(file.mimetype || "").toLowerCase();
      const name = String(file.originalFilename || "");
      // Skip videos entirely.
      if (mime.startsWith("video/") || /\.(mp4|mov|webm|m4v)$/i.test(name)) continue;
      try {
        const headFd = await fsp.open(file.filepath, "r");
        const headBuf = Buffer.alloc(16);
        await headFd.read(headBuf, 0, 16, 0);
        await headFd.close();

        const isHeifByMagic = sniffIsHeifLike(headBuf);
        const isHeifByName = /\.(heic|heif)$/i.test(name) || /image\/(heic|heif)/i.test(mime);

        // Also check if file is very large (>4 MB) — compress even if it's
        // standard JPEG/PNG. Samsung Galaxy cameras produce 8–20 MB JPEGs and
        // the browser canvas compression can fail silently.
        const fileStat = await fsp.stat(file.filepath).catch(() => null);
        const isOversized = fileStat && fileStat.size > 4 * 1024 * 1024;
        const isImage = mime.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp|avif|heic|heif)$/i.test(name);

        if (!isHeifByMagic && !isHeifByName && !isOversized) continue;
        if (!isHeifByMagic && !isHeifByName && !isImage) continue;

        // Convert HEIF/HEIC → JPEG, or compress oversized images via sharp.
        // Always rotate (EXIF orientation) and cap at 2048px so AI models
        // get a clean, reasonably-sized JPEG.
        const outPath = pathMod.join(
          os.tmpdir(),
          `rp-norm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`,
        );
        const pipeline = sharp(file.filepath, { failOn: "none" }).rotate();

        // Only resize if oversized or HEIF (which can have huge dimensions)
        if (isOversized || isHeifByMagic || isHeifByName) {
          pipeline.resize({
            width: 2048,
            height: 2048,
            fit: "inside",
            withoutEnlargement: true,
          });
        }

        await pipeline
          .jpeg({ quality: 88, mozjpeg: true })
          .toFile(outPath);

        const outStat = await fsp.stat(outPath).catch(() => null);
        if (outStat && outStat.size > 0) {
          file.filepath = outPath;
          file.mimetype = "image/jpeg";
          file.originalFilename = name.replace(/\.[a-z0-9]{2,5}$/i, "") + ".jpg";
        }
      } catch {
        /* leave file untouched on any failure */
      }
    }
  }
}

async function readJsonRequestBody(req) {
  // Vercel often pre-parses JSON; the stream is then empty and messages never arrive.
  const pre = req.body;
  if (pre && typeof pre === "object" && !Buffer.isBuffer(pre)) {
    return pre;
  }
  if (typeof pre === "string" && pre.trim()) {
    try {
      return JSON.parse(pre);
    } catch {
      const err = new Error("JSON inválido.");
      err.status = 400;
      throw err;
    }
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!String(raw).trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    const err = new Error("JSON inválido.");
    err.status = 400;
    throw err;
  }
}

/** URLs públicas Vercel Blob (evita SSRF). Aceita .public.blob e .blob.vercel-storage.com */
function trustedBlobMediaUrl(raw) {
  const u = String(raw || "").trim();
  if (!u.startsWith("https://")) return null;
  if (/^https:\/\/[a-z0-9_-]{1,120}\.public\.blob\.vercel-storage\.com\/.+/i.test(u)) return u;
  if (/^https:\/\/[a-z0-9][a-z0-9.-]{0,200}\.blob\.vercel-storage\.com\/.+/i.test(u)) return u;
  return null;
}

function trustedBlobImageUrl(raw) {
  return trustedBlobMediaUrl(raw);
}

/** Blob ou S3/CloudFront (URLs públicas aceites pelo Replicate). */
function trustedMediaUrl(raw) {
  const u = String(raw || "").trim();
  return trustedBlobMediaUrl(u) || (isTrustedS3MediaUrl(u) ? u : null);
}

/** URLs de resultado Replicate — só para proxy de panorâmica (evita SSRF aberto). */
function trustedPanoramaProxyUrl(raw) {
  const u = String(raw || "").trim();
  if (trustedMediaUrl(u)) return u;
  if (/^https:\/\/(pbxt|replicate)\.replicate\.delivery\/.+/i.test(u)) return u;
  if (/^https:\/\/replicate\.com\/api\/models\/.+\/predictions\/.+/i.test(u)) return u;
  return null;
}

async function requireAdminSession(req) {
  const { user, isLocal } = resolveSessionUser(req);
  if (!user?.id || isLocal) {
    const err = new Error("Só administradores podem usar esta ferramenta.");
    err.status = 403;
    throw err;
  }
  const dbUser = storageEnabled() ? await getUserById(user.id) : null;
  const email = String(dbUser?.email || user.email || "").toLowerCase();
  const adminOk = dbUser?.role === "admin" || isAdminEmail(email);
  if (!adminOk) {
    const err = new Error("Só administradores podem usar esta ferramenta.");
    err.status = 403;
    throw err;
  }
  return { user, dbUser };
}

function buildVideoEditPrompt(userPrompt) {
  const base = String(userPrompt || "").trim();
  if (base.length < 3) {
    const err = new Error("Descreve a edição que queres (mín. 3 caracteres).");
    err.status = 400;
    throw err;
  }
  const guard = (
    "Preserve the exact same person: identical face, facial features, eyes, skin tone, hair, "
    + "body shape, body proportions, pose, and natural motion in every frame. "
    + "Apply only the requested visual change. Photorealistic, temporally consistent, "
    + "no identity drift, no morphing artifacts, no extra limbs or duplicated body parts."
  );
  return `${base}. ${guard}`;
}

async function resolveVideoRef(files, fields, fileKey = "video", urlKey = "video_url") {
  const fromUrl = trustedMediaUrl(text(fields, urlKey, ""));
  if (fromUrl) return fromUrl;
  const file = fileOf(files, fileKey);
  if (!file) return null;
  const st = await fs.stat(file.filepath).catch(() => null);
  if (st && st.size > 50 * 1024 * 1024) {
    const err = new Error("Vídeo muito grande. Máximo 50MB.");
    err.status = 413;
    throw err;
  }
  const VERCEL_INLINE_VIDEO_MAX = 3.2 * 1024 * 1024;
  if (st && st.size > VERCEL_INLINE_VIDEO_MAX) {
    const hadUrl = Boolean(String(text(fields, urlKey, "")).trim());
    let msg = "Vídeo demasiado grande para envio direto ao servidor.";
    if (isBlobConfigured() || isS3Configured()) {
      msg = hadUrl
        ? "URL do vídeo na nuvem inválida ou inacessível. Recarrega a página (Ctrl+F5) e tenta Gerar outra vez."
        : "O upload para a nuvem não concluiu. Aguarda «Pronto para gerar» ou recarrega (Ctrl+F5) e tenta outra vez.";
    } else {
      msg += " Configura Vercel Blob (BLOB_READ_WRITE_TOKEN) ou usa um clip até ~3 MB.";
    }
    const err = new Error(msg);
    err.status = 413;
    throw err;
  }
  const mime = file.mimetype || "video/mp4";
  if (!/^video\//i.test(mime) && mime !== "application/octet-stream") {
    const err = new Error("Formato inválido — usa MP4 ou MOV.");
    err.status = 400;
    throw err;
  }
  const buffer = await fs.readFile(file.filepath);
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

async function videoEditInput(fields, files) {
  const video = await resolveVideoRef(files, fields, "video", "video_url");
  if (!video) {
    const err = new Error("Envia um vídeo (MP4/MOV, idealmente 2–10 segundos).");
    err.status = 400;
    throw err;
  }
  const userPrompt = text(fields, "prompt", "").trim();
  const prompt = buildVideoEditPrompt(userPrompt);
  const resolution = text(fields, "resolution", "1080p");
  const aspectRatio = text(fields, "aspect_ratio", "auto");
  const audioSetting = text(fields, "audio_setting", "origin");
  const input = {
    video,
    prompt,
    resolution: resolution === "720p" ? "720p" : "1080p",
    aspect_ratio: aspectRatio || "auto",
    audio_setting: audioSetting === "auto" ? "auto" : "origin",
  };
  const dur = Number(text(fields, "duration", ""));
  if (Number.isFinite(dur) && dur >= 2 && dur <= 10) input.duration = Math.round(dur);
  const ref = await resolveImageRef(files, fields, "reference_image", "reference_image_url");
  if (ref) input.reference_image = ref;
  return { input, prompt: userPrompt };
}

async function resolveImageRef(files, fields, fileKey, urlKey) {
  const fromUrl = trustedMediaUrl(text(fields, urlKey, ""));
  if (fromUrl) return fromUrl;
  return fileToDataUri(fileOf(files, fileKey));
}

/** Upload de vídeo pelo servidor → Vercel Blob (fallback quando o browser não consegue PUT direto). */
/** Upload de imagem pelo servidor → Vercel Blob (fallback quando o browser não consegue PUT directo). */
async function routeUploadImageBlob(req, res) {
  if (isBlobDisabled()) return blobDisabledResponse(res);
  try {
    const blobToken = getBlobReadWriteToken();
    if (!blobToken) {
      return json(res, 503, { detail: "Armazenamento Blob não configurado." });
    }
    const auth = req.headers.authorization || "";
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (!m?.[1]?.trim()) return json(res, 401, { detail: "Não autenticado." });
    const bearer = m[1].trim();
    if (!bearer.startsWith("local:") && !verifySessionToken(bearer)) {
      return json(res, 401, { detail: "Sessão inválida ou expirada." });
    }
    const maxBytes = 12 * 1024 * 1024;
    const { files } = await parseBody(req, { maxFileSize: maxBytes + 512 * 1024 });
    await normalizeUploadedImages(files);
    const file = fileOf(files, "photo") || fileOf(files, "image");
    if (!file?.filepath) {
      return json(res, 400, { detail: "Envia uma imagem (JPEG, PNG ou WEBP)." });
    }
    const st = await fs.stat(file.filepath).catch(() => null);
    if (!st?.size) return json(res, 400, { detail: "Ficheiro de imagem inválido." });
    if (st.size > maxBytes) {
      return json(res, 413, { detail: "Imagem muito grande. Máximo 12 MB." });
    }
    let fn = String(file.originalFilename || "photo.jpg").replace(/[^\w.\-]+/g, "_");
    if (!/\.[a-z0-9]{2,5}$/i.test(fn)) fn += ".jpg";
    const pathname = `rp/${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${fn.slice(0, 80)}`;
    const mime = file.mimetype || "image/jpeg";
    const buf = await fs.readFile(file.filepath);
    const { put } = require("@vercel/blob");
    const blob = await put(pathname, buf, {
      access: "public",
      token: blobToken,
      contentType: mime,
    });
    return json(res, 200, { url: blob.url });
  } catch (err) {
    return json(res, err.status || 500, {
      detail: err.message || "Falha ao guardar imagem na nuvem.",
    });
  }
}

async function routeUploadVideoBlob(req, res) {
  if (isBlobDisabled()) return blobDisabledResponse(res);
  try {
    const blobToken = getBlobReadWriteToken();
    if (!blobToken) {
      return json(res, 503, { detail: "Armazenamento Blob não configurado." });
    }
    const auth = req.headers.authorization || "";
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (!m?.[1]?.trim()) return json(res, 401, { detail: "Não autenticado." });
    const bearer = m[1].trim();
    if (!bearer.startsWith("local:") && !verifySessionToken(bearer)) {
      return json(res, 401, { detail: "Sessão inválida ou expirada." });
    }
    const { MAX_VIDEO_BYTES, transcodeVideoToH264, shouldAttemptTranscode } = require("./lib/videoTranscode.cjs");
    const { files } = await parseBody(req, { maxFileSize: MAX_VIDEO_BYTES + 4 * 1024 * 1024 });
    const file = fileOf(files, "video");
    if (!file?.filepath) {
      return json(res, 400, { detail: "Envia um vídeo (MP4/MOV)." });
    }
    const st = await fs.stat(file.filepath).catch(() => null);
    if (!st?.size) return json(res, 400, { detail: "Ficheiro de vídeo inválido." });
    if (st.size > MAX_VIDEO_BYTES) {
      return json(res, 413, { detail: "Vídeo muito grande. Máximo 50MB." });
    }
    let uploadPath = file.filepath;
    let converted = false;
    if (shouldAttemptTranscode(file.originalFilename, file.mimetype)) {
      const out = await transcodeVideoToH264(file.filepath);
      if (out?.outputPath) {
        uploadPath = out.outputPath;
        converted = true;
      }
    }
    let fn = String(file.originalFilename || "video.mp4").replace(/[^\w.\-]+/g, "_");
    if (converted) fn = fn.replace(/\.[^.]+$/, "") + ".mp4";
    if (!/\.[a-z0-9]{2,5}$/i.test(fn)) fn += ".mp4";
    const pathname = `rp/${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${fn.slice(0, 80)}`;
    const mime = converted ? "video/mp4" : (file.mimetype || "video/mp4");
    const buf = await fs.readFile(uploadPath);
    if (converted && uploadPath !== file.filepath) {
      await fs.unlink(uploadPath).catch(() => {});
    }
    const { put } = require("@vercel/blob");
    const blob = await put(pathname, buf, {
      access: "public",
      token: blobToken,
      contentType: mime,
    });
    return json(res, 200, { url: blob.url });
  } catch (err) {
    return json(res, err.status || 500, {
      detail: err.message || "Falha ao guardar vídeo na nuvem.",
    });
  }
}

async function routeBlobPrepare(req, res) {
  if (isBlobDisabled()) return blobDisabledResponse(res);
  try {
    const blobToken = getBlobReadWriteToken();
    if (!blobToken) {
      return json(res, 503, { detail: "Armazenamento Blob não configurado neste ambiente." });
    }
    const auth = req.headers.authorization || "";
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (!m?.[1]?.trim()) return json(res, 401, { detail: "Não autenticado." });
    const bearer = m[1].trim();
    if (!bearer.startsWith("local:") && !verifySessionToken(bearer)) {
      return json(res, 401, { detail: "Sessão inválida ou expirada." });
    }
    const body = await readJsonRequestBody(req);
    const isVideo = String(body.kind || body.media_kind || "").toLowerCase() === "video";
    let fn = String(body.filename || (isVideo ? "upload.mp4" : "upload.jpg")).replace(/[^\w.\-]+/g, "_");
    if (!/\.[a-z0-9]{2,5}$/i.test(fn)) fn += isVideo ? ".mp4" : ".jpg";
    fn = fn.slice(0, 100);
    const pathname = `rp/${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${fn}`;
    // eslint-disable-next-line global-require
    const { generateClientTokenFromReadWriteToken } = require("@vercel/blob/client");
    const clientToken = await generateClientTokenFromReadWriteToken({
      token: blobToken,
      pathname,
      access: "public",
      maximumSizeInBytes: isVideo ? 52 * 1024 * 1024 : 12 * 1024 * 1024,
      allowedContentTypes: isVideo
        ? [
          "video/mp4",
          "video/quicktime",
          "video/webm",
          "application/octet-stream",
        ]
        : [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
          "image/avif",
          "image/bmp",
          "image/heic",
          "image/heif",
          "application/octet-stream",
        ],
      addRandomSuffix: true,
    });
    return json(res, 200, { clientToken, pathname });
  } catch (err) {
    return json(res, err.status || 500, { detail: err.message || "Falha ao preparar upload." });
  }
}

async function parseBody(req, opts = {}) {
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("multipart/form-data")) {
    // Samsung/iPhone HEIF files can be 8–20 MB and the browser often can't
    // compress them (canvas fails on HEIC). Accept up to 12 MB so the server-
    // side sharp conversion can handle them. The old 4.2 MB cap caused
    // "Imagem muito grande" for perfectly valid phone photos.
    const form = formidable({
      multiples: true,
      maxFileSize: opts.maxFileSize ?? 12 * 1024 * 1024,
      maxFields: 200,
      maxFieldsSize: 4 * 1024 * 1024,
      allowEmptyFiles: true,
    });
    try {
      const [fields, files] = await form.parse(req);
      return { fields, files };
    } catch (e) {
      throw e;
    }
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  const body = raw ? JSON.parse(raw) : {};
  return { fields: body, files: {} };
}

async function fileToDataUri(file) {
  if (!file) return null;
  const st = await fs.stat(file.filepath).catch(() => null);
  if (!st || !st.size) return null;

  // If the file is too large for a data URI, try to compress it with sharp
  // before giving up. This handles Samsung HEIF photos that survived
  // normalizeUploadedImages (already JPEG) but are still >4 MB, and also
  // regular large JPEGs the browser couldn't shrink enough.
  const DATA_URI_HARD_CAP = 5.5 * 1024 * 1024;
  const DATA_URI_COMPRESS_THRESHOLD = 4 * 1024 * 1024;

  let filepath = file.filepath;
  let mime = file.mimetype || "image/jpeg";

  if (st.size > DATA_URI_COMPRESS_THRESHOLD) {
    try {
      const sharp = require("sharp");
      const pathMod = require("path");
      const os = require("os");
      const outPath = pathMod.join(
        os.tmpdir(),
        `rp-duri-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`,
      );
      await sharp(file.filepath, { failOn: "none" })
        .rotate()
        .resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 82, mozjpeg: true })
        .toFile(outPath);
      const outSt = await fs.stat(outPath).catch(() => null);
      if (outSt && outSt.size > 0 && outSt.size < st.size) {
        filepath = outPath;
        mime = "image/jpeg";
      }
    } catch {
      // sharp compression failed — fall through with original
    }
  }

  const finalSt = await fs.stat(filepath).catch(() => null);
  if (finalSt && finalSt.size > DATA_URI_HARD_CAP) {
    const err = new Error(
      "Imagem ainda demasiado grande após compressão (~"
      + Math.round(finalSt.size / 1024 / 1024)
      + " MB). Tenta com uma foto mais pequena ou reduz a resolução.",
    );
    err.status = 413;
    throw err;
  }

  const buffer = await fs.readFile(filepath);
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

const { extractUrls } = require("./lib/creationMedia.cjs");

async function replicateFetch(url, options = {}) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    const err = new Error("REPLICATE_API_TOKEN not configured");
    err.status = 500;
    throw err;
  }
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data.detail || data.error || `Replicate error ${response.status}`);
    err.status = response.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function createPrediction(modelId, input) {
  const [owner, name] = modelId.split("/");
  try {
    return await replicateFetch(`https://api.replicate.com/v1/models/${owner}/${name}/predictions`, {
      method: "POST",
      body: JSON.stringify({ input }),
    });
  } catch (err) {
    if (![404, 422].includes(err.status)) throw err;
    const model = await replicateFetch(`https://api.replicate.com/v1/models/${owner}/${name}`);
    const version = model?.latest_version?.id;
    if (!version) throw err;
    return await replicateFetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      body: JSON.stringify({ version, input }),
    });
  }
}

async function getPrediction(id) {
  return await replicateFetch(`https://api.replicate.com/v1/predictions/${id}`);
}

function predictionResponse(result) {
  const prediction = result.prediction || result;
  const out = {
    prediction_id: result.prediction_id || prediction.id || prediction.uuid,
    credits_spent: result.credits_spent || 0,
    type: result.type || "image",
  };
  if (result.new_balance != null) out.new_balance = result.new_balance;
  if (result.server_billing) out.server_billing = true;
  return out;
}

function resolveSessionUser(req) {
  const auth = req.headers.authorization || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return { user: null, token: null, isLocal: false };
  const token = m[1].trim();
  if (token.startsWith("local:")) return { user: null, token, isLocal: true };
  const sessionUser = verifySessionToken(token);
  return { user: sessionUser, token, isLocal: false };
}

function userLang(req, fields) {
  return text(fields, "lang", req?.headers?.["x-lang"] || "en").slice(0, 2).toLowerCase() || "en";
}

/**
 * Gasta créditos no servidor, submete ao Replicate e regista pending (contas Google + Mongo/KV).
 * Contas locais ou sem storage: fluxo legado (créditos só no cliente após sucesso).
 */
async function submitBillableGeneration(req, fields, {
  cost,
  type,
  modelId,
  input,
  prompt,
  aspectRatio,
  modelUsed,
  spendDescription,
}) {
  const { user, isLocal } = resolveSessionUser(req);
  const lang = userLang(req, fields);

  if (storageEnabled() && user?.id && !isLocal) {
    const dbUser = await getUserById(user.id);
    if (dbUser?.banned) {
      const err = new Error("Conta suspensa.");
      err.status = 403;
      throw err;
    }
    if (dbUser?.is_unlimited) {
      const prediction = await createPrediction(modelId, input);
      const pending = await createPending({
        id: newPendingId(),
        user_id: user.id,
        replicate_prediction_id: prediction.id,
        type,
        prompt: prompt || input?.prompt || "",
        model_used: modelUsed || modelId,
        aspect_ratio: aspectRatio || input?.aspect_ratio || "1:1",
        credits_spent: 0,
        balance_after_spend: dbUser.credits ?? 999999999,
        lang,
      });
      return {
        prediction_id: pending.id,
        credits_spent: 0,
        type,
        new_balance: dbUser.credits ?? 999999999,
        server_billing: true,
      };
    }
    const balance = dbUser?.credits ?? user.credits ?? 0;
    if (balance < cost) {
      const err = new Error("Créditos insuficientes.");
      err.status = 402;
      throw err;
    }

    const newBalance = await spendCredits(user.id, cost, spendDescription || "Geração");
    let prediction;
    try {
      prediction = await createPrediction(modelId, input);
    } catch (e) {
      await addCredits(user.id, cost, "refund", `Refund: submit failed (${String(e.message || e).slice(0, 80)})`);
      const err = new Error(formatGenerationError(e.message || "submit failed", lang));
      err.status = e.status && e.status >= 400 && e.status < 600 ? e.status : 502;
      throw err;
    }

    const pending = await createPending({
      id: newPendingId(),
      user_id: user.id,
      replicate_prediction_id: prediction.id,
      type,
      prompt: prompt || input?.prompt || "",
      model_used: modelUsed || modelId,
      aspect_ratio: aspectRatio || input?.aspect_ratio || "1:1",
      credits_spent: cost,
      balance_after_spend: newBalance,
      lang,
    });

    return {
      prediction_id: pending.id,
      credits_spent: cost,
      type,
      new_balance: newBalance,
      server_billing: true,
    };
  }

  const meta = withMeta(input, cost, type);
  const prediction = await createPrediction(modelId, meta.input);
  return predictionResponse({ prediction, ...meta });
}

function withMeta(input, cost, type = "image") {
  return { input, credits_spent: cost, type };
}

function truthyField(fields, key) {
  const v = String(text(fields, key, "")).trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "on";
}

function buildColorizePrompt(fields) {
  const style = text(fields, "style", "natural");
  const vibe = text(fields, "vibe", "moderno");
  const custom = text(fields, "custom_prompt", "").trim();
  const preserveSkin = truthyField(fields, "preserve_skin");
  const enhanceDetails = truthyField(fields, "enhance_details");
  const styleMap = {
    natural: "natural lifelike colors true to era — accurate skies, foliage, fabrics; balanced color temperature",
    cinematic: "cinematic film grading with rich teal-and-orange contrast, gentle film grain, magazine cover quality",
    vibrant: "bold saturated colors that pop, warm sunshine highlights, vivid greens and blues",
    historic: "authentic period-correct colors for an old photograph: faithful clothing dyes, sepia-washed shadows, soft warm light",
  };
  const vibeMap = {
    moderno: "Modern, clean digital finish.",
    vintage: "Subtle vintage film stock feel — slight halation, mild fade, warm midtones.",
  };
  const parts = [
    "Colorize this black-and-white photograph in a fully photo-real way. "
    + "Keep the subject, composition, expressions, framing and grain exactly the same. "
    + "Do not invent new objects or change the scene.",
    `Color treatment: ${styleMap[style] || styleMap.natural}.`,
  ];
  if (preserveSkin) {
    parts.push("Skin tones must be realistic and flattering, with natural undertones — never orange, never green.");
  }
  if (enhanceDetails) {
    parts.push("Recover fine micro-detail in hair, fabric textures and eyes while keeping the colorization soft and believable.");
  }
  parts.push(vibeMap[vibe] || vibeMap.moderno);
  if (custom) parts.push(`Additional intent: ${custom}`);
  parts.push("Output a photo-real, professionally graded color image.");
  return parts.join(" ");
}

function buildRestorePrompt(fields) {
  const level = text(fields, "level", "medio");
  const custom = text(fields, "custom_prompt", "").trim();
  const enhanceFaces = truthyField(fields, "enhance_faces");
  const recoverColors = truthyField(fields, "recover_colors");
  const removeNoise = truthyField(fields, "remove_noise");
  const sharpen = truthyField(fields, "sharpen");
  const intensity = {
    leve: "Apply a SUBTLE restoration",
    medio: "Apply a balanced professional restoration",
    profundo: "Apply a DEEP full restoration as if recovered by a master archivist",
  };
  const parts = [
    `${intensity[level] || intensity.medio} of this photograph while keeping the subject's identity, pose, expression `
    + "and composition pixel-perfect identical. Do not change faces, clothing, or background layout.",
  ];
  if (enhanceFaces) {
    parts.push("Restore facial features with natural skin texture, sharp eyes, well-defined lips and eyebrows; preserve the original likeness.");
  }
  if (recoverColors) {
    parts.push("Recover natural film-like colors with accurate skin tones; if the photo is black-and-white, gently colorize realistically without oversaturation.");
  }
  if (removeNoise) {
    parts.push("Remove scratches, dust spots, stains, mold, creases, JPEG artifacts and grain.");
  }
  if (sharpen) {
    parts.push("Increase overall sharpness and micro-detail clarity, especially on faces, hair and fabric textures.");
  }
  if (custom) parts.push(`Additional intent: ${custom}`);
  parts.push("Output a photo-real, magazine-quality finish.");
  return parts.join(" ");
}

function buildClothesPrompt(fields, hasGarment) {
  const userPrompt = text(fields, "prompt", "").trim();
  const changeType = text(fields, "change_type", "full");
  if (hasGarment) {
    let p = (
      "The image shows TWO photos side by side: a person on the LEFT and a clothing/outfit reference on the RIGHT. "
      + "Output a single photo of ONLY the person from the LEFT, now wearing the outfit shown on the RIGHT. "
      + "Preserve the person's identity, face, hair, body proportions and pose. "
      + "Match the clothing's style, color, fabric and details precisely. "
      + "Discard the garment-side panel and any background from the right photo. "
      + "Photorealistic, natural lighting, clean background."
    );
    if (userPrompt) p += ` Additional notes: ${userPrompt}`;
    return p;
  }
  if (!userPrompt) {
    return "Change outfit while preserving face, body pose and identity. Photorealistic, natural lighting.";
  }
  const prefix = {
    full: "Change the outfit. Replace all clothing with: ",
    piece: "Add/replace this specific clothing piece: ",
    color: "Keep the same outfit but change the color/style to: ",
    tryon: "Show the person wearing: ",
  };
  return (
    `${prefix[changeType] || prefix.full}${userPrompt}. `
    + "Preserve identity, face, body proportions and pose. Photorealistic, natural lighting."
  );
}

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    const err = new Error("STRIPE_SECRET_KEY not configured");
    err.status = 500;
    throw err;
  }
  return new Stripe(key);
}

function creationFromPrediction(prediction) {
  const urls = extractUrls(prediction.output);
  return {
    id: prediction.id,
    type: prediction.input?.__type || "image",
    prompt: prediction.input?.prompt || "Remake Pixel generation",
    model_used: "Motor IA",
    aspect_ratio: prediction.input?.aspect_ratio || "1:1",
    result_urls: urls,
    credits_spent: prediction.input?.__cost || 0,
    is_favorite: false,
    is_public: false,
    created_at: new Date().toISOString(),
  };
}

async function imageInput(fields, files, modelKey, prompt, opts = {}) {
  const primary =
    (await resolveImageRef(files, fields, "photo", "photo_url"))
    || (await resolveImageRef(files, fields, "image", "image_url"));
  const input = {
    prompt: finalizeImagePrompt(prompt, {
      modelKey,
      posterFood: opts.posterFood,
      poster: opts.poster,
      hasPersonPhoto: opts.hasPersonPhoto ?? Boolean(primary && !opts.posterFood),
    }),
    aspect_ratio: normalizeRatio(text(fields, "aspect_ratio", "1:1"), modelKey),
  };
  if (["standard", "pro", "artistic"].includes(modelKey)) {
    const n = Number(text(fields, "num_outputs", 1)) || 1;
    if (modelKey !== "standard") input.num_outputs = n;
    else if (n > 1) input.num_outputs = n;
  }
  if (modelKey === "qwen") {
    input.go_fast = false;
    input.disable_safety_checker = true;
    input.output_format = "webp";
    input.output_quality = 95;
    if (opts.experimental) {
      input.aspect_ratio = "match_input_image";
    } else if (!input.aspect_ratio || input.aspect_ratio === "1:1") {
      input.aspect_ratio = "match_input_image";
    }
  }
  if (primary) {
    if (modelKey === "standard" || modelKey === "video") input.image = primary;
    else if (modelKey === "kontext") input.input_image = primary;
    else if (modelKey === "qwen") input.image = [primary];
    else input.images = [primary];
  }
  if (opts.experimental && modelKey === "qwen" && !input.image) {
    const err = new Error("AI Lab: envia uma foto de referência.");
    err.status = 400;
    throw err;
  }
  return input;
}

function buildCarouselContinuity(fields, slideIndex, total) {
  const parts = [];
  if (truthyField(fields, "keep_character")) {
    parts.push("the SAME main subject/character, identical face and outfit as the rest of the series");
  }
  if (truthyField(fields, "keep_lighting")) {
    parts.push("the SAME lighting setup, time of day and shadow direction");
  }
  if (truthyField(fields, "keep_palette")) {
    parts.push("the SAME color palette and grading across all slides");
  }
  if (truthyField(fields, "smooth_transitions") && total > 1 && slideIndex > 0) {
    parts.push("smooth visual continuity from the previous slide, like a magazine editorial sequence");
  }
  if (!parts.length) return "";
  return `Preserve ${parts.join(", ")}. This is slide ${slideIndex + 1} of ${total} in a coherent Instagram carousel.`;
}

const CAROUSEL_ROLE_HINTS = {
  cover: "Instagram carousel COVER slide — strong hook, scroll-stopping composition.",
  content: "Middle slide — advance the story clearly for the viewer.",
  detail: "Detail slide — close-up, product focus or emotional beat.",
  cta: "Final slide — clear call-to-action and closing frame.",
};

function buildCarouselSlidePrompt(fields, slideIndex, total) {
  const slidePrompt = text(fields, "slide_prompt", "").trim();
  if (!slidePrompt) throw new Error("Descrição do slide em falta.");
  const campaign = text(fields, "campaign_brief", "").trim();
  const styleSuffix = text(fields, "style_suffix", "").trim();
  const role = text(fields, "slide_role", "content").trim() || "content";
  const continuity = buildCarouselContinuity(fields, slideIndex, total);
  const parts = [];
  if (campaign) parts.push(`Campaign / post context: ${campaign}`);
  parts.push(CAROUSEL_ROLE_HINTS[role] || CAROUSEL_ROLE_HINTS.content);
  parts.push(slidePrompt);
  if (styleSuffix) parts.push(styleSuffix);
  if (continuity) parts.push(continuity);
  parts.push("Editorial Instagram carousel, photorealistic, no random unrelated elements.");
  return parts.join(" ");
}

function parseAspectPair(ratio = "4:5") {
  const m = String(ratio || "4:5").match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/);
  if (!m) return { w: 4, h: 5 };
  return { w: Number(m[1]), h: Number(m[2]) };
}

function panoramicGenerationAspect(slideCount, panelAspect, modelKey) {
  const { w, h } = parseAspectPair(panelAspect);
  const tw = Math.max(2, slideCount) * w;
  const th = h;
  const ratio = tw / th;
  if (modelKey === "pro" || modelKey === "artistic") {
    if (ratio >= 2.1) return "21:9";
    if (ratio >= 1.7) return "16:9";
    return "3:2";
  }
  if (ratio >= 2.2) return "2:1";
  if (ratio >= 1.55) return "16:9";
  return "3:2";
}

function panelPositionLabel(index, total) {
  if (index === 0) return "LEFT segment (start of the panorama)";
  if (index === total - 1) return "RIGHT segment (end of the panorama)";
  return "CENTER segment (middle of the panorama)";
}

function buildCarouselPanoramicPrompt(fields) {
  let slides = [];
  try {
    const raw = text(fields, "slides_json", "[]");
    slides = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    slides = [];
  }
  if (!Array.isArray(slides) || slides.length < 2) {
    throw new Error("Mínimo 2 slides para carrossel panorâmico.");
  }
  const n = slides.length;
  const campaign = text(fields, "campaign_brief", "").trim();
  const styleSuffix = text(fields, "style_suffix", "").trim();
  const continuityBits = [];
  if (truthyField(fields, "keep_character")) {
    continuityBits.push("ONE consistent main character/subject across the entire panorama");
  }
  if (truthyField(fields, "keep_lighting")) {
    continuityBits.push("unified lighting and shadow direction");
  }
  if (truthyField(fields, "keep_palette")) {
    continuityBits.push("unified color palette and grading");
  }

  const parts = [
    "Seamless Instagram carousel — ONE single continuous horizontal ultra-wide photograph/composition.",
    `Divide mentally into exactly ${n} equal vertical panels (slides). The image must read as ONE unbroken panorama, not separate images.`,
    "Background, environment, gradients and set design connect perfectly across every panel boundary — zero seams, zero scene resets.",
    "Main subject MUST cross panel cuts naturally (body, limbs or props partially continue into adjacent panels).",
    "Editorial typography may split across panels (letters continuing from one panel to the next).",
    "Premium advertising campaign, cinematic, photorealistic, modern editorial layout.",
    "CRITICAL: Do NOT generate collage, grid, triptych frames, white gaps, borders or distinct cards per panel.",
  ];
  if (continuityBits.length) parts.push(`Continuity: ${continuityBits.join("; ")}.`);
  if (campaign) parts.push(`Campaign context: ${campaign}`);

  slides.forEach((slide, i) => {
    const slidePrompt = String(slide?.text || slide?.prompt || slide || "").trim();
    if (!slidePrompt) throw new Error(`Descrição do painel ${i + 1} em falta.`);
    const role = String(slide?.role || "content").trim();
    const roleBit = role ? ` [${role}]` : "";
    parts.push(`Panel ${i + 1}/${n} — ${panelPositionLabel(i, n)}${roleBit}: ${slidePrompt}`);
  });

  if (styleSuffix) parts.push(styleSuffix);
  parts.push("Output: one unified horizontal artwork only, ready to crop into equal vertical Instagram slides.");
  return parts.join(" ");
}

async function carouselPanoramicImageInput(fields, files, modelKey, prompt, slideCount) {
  const panelAspect = text(fields, "aspect_ratio", "4:5");
  const wideAspect = panoramicGenerationAspect(slideCount, panelAspect, modelKey);
  const input = {
    prompt: finalizeImagePrompt(prompt, { modelKey }),
    aspect_ratio: normalizeRatio(wideAspect, modelKey),
    num_outputs: 1,
  };
  const refUrl = await resolveImageRef(files, fields, "photo", "photo_url");
  if (refUrl) input.image = refUrl;
  return input;
}

async function carouselSlideImageInput(fields, files, modelKey, prompt) {
  const input = {
    prompt: finalizeImagePrompt(prompt, { modelKey }),
    aspect_ratio: normalizeRatio(text(fields, "aspect_ratio", "4:5"), modelKey),
    num_outputs: 1,
  };
  const prevUrl = text(fields, "previous_slide_url", "").trim();
  const refUrl =
    (await resolveImageRef(files, fields, "slide_photo", "slide_photo_url"))
    || (await resolveImageRef(files, fields, "photo", "photo_url"));
  const imageRef = prevUrl || refUrl;
  if (imageRef) {
    input.image = imageRef;
  }
  return input;
}

async function routePost(path, fields, files, req) {
  const region = regionFromRequest(req, fields);
  const CREDIT = getCreditCostsForRegion(region);

  if (path === "generate/image") {
    let prompt = text(fields, "prompt", "").trim();
    if (!prompt) throw new Error("Escreve um prompt.");
    const lang = text(fields, "lang", "en").slice(0, 2);
    if (truthyField(fields, "improve_prompt")) {
      prompt = await improvePrompt(prompt, lang, {});
    }
    const input = await imageInput(fields, files, "standard", prompt);
    return submitBillableGeneration(req, fields, {
      cost: CREDIT.image,
      type: "image",
      modelId: MODELS.standard,
      input,
      prompt,
      aspectRatio: input.aspect_ratio,
      modelUsed: MODELS.standard,
      spendDescription: "Estúdio: imagem",
    });
  }

  if (path === "generate/edit") {
    const prompt = text(fields, "prompt", "professional photo edit, preserve identity");
    const input = await imageInput(fields, files, "standard", prompt);
    return submitBillableGeneration(req, fields, {
      cost: CREDIT.edit,
      type: "image",
      modelId: MODELS.standard,
      input,
      prompt,
      aspectRatio: input.aspect_ratio,
      modelUsed: MODELS.standard,
      spendDescription: "Estúdio: editar foto",
    });
  }

  if (path === "generate/easy") {
    const styleId = text(fields, "style_id", "").trim();
    const padrao = getPadraoStyle(styleId);
    const subject = text(fields, "subject", "the person").trim() || padrao?.subject || "the person";
    const extra = text(fields, "extra_prompt", "").trim();
    let prompt;
    if (padrao?.prompt) {
      prompt = padrao.prompt.replace(/\[subject\]/gi, subject);
      if (extra) prompt = `${prompt}\n\n${extra}`;
    } else {
      prompt = `Apply the ${styleId || "editorial"} style to ${subject}. Preserve identity, face, pose and expression. ${extra}`;
    }
    const input = await imageInput(fields, files, "standard", prompt);
    return submitBillableGeneration(req, fields, {
      cost: CREDIT.easy,
      type: "image",
      modelId: MODELS.standard,
      input,
      prompt,
      aspectRatio: input.aspect_ratio,
      modelUsed: MODELS.standard,
      spendDescription: "Estúdio: estilo pronto",
    });
  }

  if (path === "generate/pro") {
    const presetId = text(fields, "preset_id", "ultra_real");
    const preset = getProPreset(presetId);
    const extra = text(fields, "extra_prompt", "").trim();
    const intensity = Number(text(fields, "intensity", "70"));
    let prompt = preset?.prompt
      || "Professional portrait retouch. Preserve identity and natural facial features.";
    if (extra) prompt += `\n\nAdditional instructions: ${extra}`;
    if (Number.isFinite(intensity)) {
      if (intensity < 34) prompt += "\n\nApply a very subtle, gentle enhancement.";
      else if (intensity > 66) prompt += "\n\nApply a stronger visible enhancement while strictly preserving identity.";
    }
    const input = await imageInput(fields, files, "pro", prompt);
    return submitBillableGeneration(req, fields, {
      cost: CREDIT.pro,
      type: "image",
      modelId: MODELS.pro,
      input,
      prompt,
      aspectRatio: input.aspect_ratio,
      modelUsed: MODELS.pro,
      spendDescription: "Retoque Pro",
    });
  }

  if (path === "generate/artistic") {
    const style = text(fields, "style_id", "artistic");
    const extra = text(fields, "extra_prompt", "");
    const prompt = `Transform this image into ${style} art style. Preserve identity and composition. ${extra}`;
    const input = await imageInput(fields, files, "standard", prompt);
    return submitBillableGeneration(req, fields, {
      cost: CREDIT.artistic,
      type: "artistic",
      modelId: MODELS.standard,
      input,
      prompt,
      aspectRatio: input.aspect_ratio,
      modelUsed: MODELS.standard,
      spendDescription: "Estilos artísticos",
    });
  }

  if (path === "generate/artistic-studio") {
    const styleId = text(fields, "style_id", "").trim();
    const experimental = isArtisticExperimentalStyleId(styleId);
    let promptFinal = text(fields, "prompt_final", "").trim();
    if (!promptFinal) throw new Error("Prompt em falta.");
    const hasPhoto = Boolean(files.photo || text(fields, "photo_url", "").trim());
    const { user, isLocal } = resolveSessionUser(req);
    let userDoc = null;
    if (storageEnabled() && user?.id && !isLocal) {
      userDoc = await getUserById(user.id);
    } else if (user?.email && ADMIN_EMAILS.has(String(user.email).toLowerCase())) {
      userDoc = { email: user.email, role: "admin", nsfw_allowed: true };
    }
    const { modelKey, modelId, label: modelLabel } = resolveArtisticStudioModel({
      styleId,
      hasPhoto,
      userDoc,
    });
    const input = await imageInput(fields, files, modelKey, promptFinal, { experimental });
    return submitBillableGeneration(req, fields, {
      cost: CREDIT.artistic,
      type: "artistic",
      modelId,
      input,
      prompt: promptFinal,
      aspectRatio: input.aspect_ratio,
      modelUsed: modelLabel,
      spendDescription: isArtisticExperimentalStyleId(styleId)
        ? "Estúdio artístico · AI Lab (Qwen)"
        : "Estúdio artístico",
    });
  }

  if (path === "generate/poster") {
    const placeholdersRaw = text(fields, "placeholders", "{}");
    let placeholders = {};
    try { placeholders = typeof placeholdersRaw === "string" ? JSON.parse(placeholdersRaw) : placeholdersRaw; } catch {}
    const promptFinal = text(fields, "prompt_final", "").trim();
    let prompt = promptFinal;
    if (!prompt) {
      prompt = text(fields, "prompt_template", "");
      if (prompt) {
        for (const [key, value] of Object.entries(placeholders || {})) {
          const safeValue = String(value || "").trim();
          if (safeValue) prompt = prompt.split(key).join(safeValue);
        }
      } else {
        prompt = `Professional premium poster design. Template: ${text(fields, "template_id", "poster")}. Text details: ${JSON.stringify(placeholders)}.`;
      }
      prompt += " Legible typography, strong hierarchy, print quality.";
    }
    const selected = text(fields, "model_key", "grok");
    const modelKey = selected === "flux2" || selected === "gpt_image" ? "pro" : "standard";
    const perImage = selected === "gpt_image" ? CREDIT.posterPremium : selected === "flux2" ? CREDIT.posterPro : CREDIT.posterFast;
    const count = Number(text(fields, "num_outputs", 1)) || 1;
    const templateId = text(fields, "template_id", "");
    const templateCategory = text(fields, "template_category", "").trim().toLowerCase();
    const posterFood = templateCategory === "food" || String(templateId).startsWith("food_");
    const photoRef = await resolveImageRef(files, fields, "photo", "photo_url");
    const hasPersonPhoto = Boolean(photoRef) && !posterFood;
    const input = await imageInput(fields, files, modelKey, prompt, {
      posterFood,
      poster: true,
      hasPersonPhoto,
    });
    const cost = perImage * count;
    return submitBillableGeneration(req, fields, {
      cost,
      type: "poster",
      modelId: MODELS[modelKey],
      input,
      prompt,
      aspectRatio: input.aspect_ratio,
      modelUsed: MODELS[modelKey],
      spendDescription: "Pôster",
    });
  }

  if (path === "generate/manga-interaction") {
    let promptFinal = text(fields, "prompt_final", "").trim();
    if (!promptFinal) throw new Error("Prompt em falta.");
    const photoA = await resolveImageRef(files, fields, "photo", "photo_url");
    const photoB = await resolveImageRef(files, fields, "photo_b", "photo_b_url");
    if (!photoA || !photoB) {
      const err = new Error(
        "Interação exige duas fotos de referência (frente de cada personagem). Faz upload PNG nos dois.",
      );
      err.status = 400;
      throw err;
    }
    const cost = Math.max(1, Number(CREDIT.mangaPanel) || 15);
    const aspect = normalizeRatio(text(fields, "aspect_ratio", "4:5"), "qwen");
    const input = {
      prompt: finalizeImagePrompt(promptFinal, { modelKey: "qwen" }),
      image: [photoA, photoB],
      aspect_ratio: aspect === "match_input_image" ? "3:4" : aspect,
      go_fast: false,
      disable_safety_checker: true,
      output_format: "webp",
      output_quality: 95,
    };
    return submitBillableGeneration(req, fields, {
      cost,
      type: "manga",
      modelId: QWEN_EDIT_MODEL,
      input,
      prompt: promptFinal,
      aspectRatio: input.aspect_ratio,
      modelUsed: "Qwen Image Edit 2511",
      spendDescription: "MANGA STUDIO · interação (2 refs)",
    });
  }

  if (path === "generate/manga-panel" || path === "generate/manga-page" || path === "generate/manga-chapter") {
    let promptFinal = text(fields, "prompt_final", "").trim();
    if (!promptFinal) throw new Error("Prompt em falta.");
    const mode = path.replace("generate/manga-", "");
    const costMap = {
      panel: CREDIT.mangaPanel ?? 15,
      page: CREDIT.mangaPage ?? 40,
      chapter: CREDIT.mangaChapter ?? 150,
    };
    const cost = Math.max(1, Number(costMap[mode]) || 15);
    const selected = text(fields, "model_key", "grok");
    const hasPhoto = Boolean(files.photo || text(fields, "photo_url", "").trim());
    let modelKey = "standard";
    if (selected === "gpt_image" || selected === "flux2") modelKey = "pro";

    const aspectDefault = mode === "chapter" ? "9:16" : mode === "page" ? "3:4" : text(fields, "aspect_ratio", "4:5");
    const input = await imageInput(fields, files, modelKey, promptFinal);
    input.aspect_ratio = normalizeRatio(
      text(fields, "aspect_ratio", "").trim() || aspectDefault,
      modelKey,
    );
    const spendLabels = {
      panel: "MANGA STUDIO · painel",
      page: "MANGA STUDIO · página",
      chapter: "MANGA STUDIO · capítulo",
    };
    const modelId = MODELS[modelKey];
    return submitBillableGeneration(req, fields, {
      cost,
      type: "manga",
      modelId,
      input,
      prompt: promptFinal,
      aspectRatio: input.aspect_ratio,
      modelUsed: modelId,
      spendDescription: spendLabels[mode] || "MANGA STUDIO",
    });
  }

  if (path === "generate/carousel-panoramic") {
    const selected = text(fields, "model_key", "grok");
    let slides = [];
    try {
      slides = JSON.parse(text(fields, "slides_json", "[]"));
    } catch {
      slides = [];
    }
    const totalSlides = slides.length;
    if (totalSlides < 2 || totalSlides > 10) {
      const err = new Error("Entre 2 e 10 slides no carrossel panorâmico.");
      err.status = 400;
      throw err;
    }
    const modelKey = selected === "gpt_image" ? "pro" : "standard";
    const replicateModel = selected === "gpt_image" ? MODELS.pro : MODELS.standard;
    const perSlide = selected === "gpt_image" ? CREDIT.carouselPremiumPerSlide : CREDIT.carouselFastPerSlide;
    const cost = perSlide * totalSlides;
    const composed = buildCarouselPanoramicPrompt(fields);
    const input = await carouselPanoramicImageInput(fields, files, modelKey, composed, totalSlides);
    return submitBillableGeneration(req, fields, {
      cost,
      type: "carousel",
      modelId: replicateModel,
      input,
      prompt: composed,
      aspectRatio: input.aspect_ratio,
      modelUsed: replicateModel,
      spendDescription: `Carrossel panorâmico (${totalSlides} slides)`,
    });
  }

  if (path === "generate/carousel-slide") {
    const slideIndex = Number(text(fields, "slide_index", 0)) || 0;
    const totalSlides = Number(text(fields, "total_slides", 1)) || 1;
    const selected = text(fields, "model_key", "grok");
    const modelKey = selected === "gpt_image" ? "pro" : "standard";
    const replicateModel = selected === "gpt_image" ? MODELS.pro : MODELS.standard;
    const perSlide = selected === "gpt_image" ? CREDIT.carouselPremiumPerSlide : CREDIT.carouselFastPerSlide;
    const composed = buildCarouselSlidePrompt(fields, slideIndex, totalSlides);
    const input = await carouselSlideImageInput(fields, files, modelKey, composed);
    return submitBillableGeneration(req, fields, {
      cost: perSlide,
      type: "carousel",
      modelId: replicateModel,
      input,
      prompt: composed,
      aspectRatio: input.aspect_ratio,
      modelUsed: replicateModel,
      spendDescription: `Carrossel slide ${slideIndex + 1}/${totalSlides}`,
    });
  }

  if (path === "generate/carousel") {
    const err = new Error("Atualiza a página — o carrossel gera uma imagem por slide.");
    err.status = 400;
    throw err;
  }

  if (path === "generate/video") {
    const prompt = text(fields, "prompt", "").trim();
    if (!prompt) throw new Error("Descreve o vídeo.");
    const input = await imageInput(fields, files, "video", prompt);
    return submitBillableGeneration(req, fields, {
      cost: CREDIT.video,
      type: "video",
      modelId: MODELS.video,
      input,
      prompt,
      aspectRatio: input.aspect_ratio,
      modelUsed: MODELS.video,
      spendDescription: "Vídeo IA",
    });
  }

  if (path === "generate/video-edit") {
    await requireAdminSession(req);
    const { input, prompt } = await videoEditInput(fields, files);
    const cost = CREDIT.videoEdit ?? Math.max(CREDIT.video || 70, 85);
    return submitBillableGeneration(req, fields, {
      cost,
      type: "video",
      modelId: MODELS.video_edit,
      input,
      prompt,
      aspectRatio: input.aspect_ratio,
      modelUsed: MODELS.video_edit,
      spendDescription: "Editor vídeo",
    });
  }

  if (path === "tools/bg-remove") {
    const image = await resolveImageRef(files, fields, "photo", "photo_url");
    const input = { image };
    return submitBillableGeneration(req, fields, {
      cost: CREDIT.bgRemove,
      type: "image",
      modelId: MODELS.bg_remove,
      input,
      prompt: "Remover fundo",
      spendDescription: "Remover fundo",
    });
  }

  if (path === "tools/upscale") {
    const image = await resolveImageRef(files, fields, "photo", "photo_url");
    const input = {
      image,
      scale_factor: Number(text(fields, "scale", 2)) || 2,
    };
    return submitBillableGeneration(req, fields, {
      cost: CREDIT.upscale,
      type: "image",
      modelId: MODELS.upscale,
      input,
      prompt: "Upscale",
      spendDescription: "Upscale",
    });
  }

  if (path === "tools/restore") {
    const prompt = buildRestorePrompt(fields);
    const input = await imageInput(fields, files, "standard", prompt);
    return submitBillableGeneration(req, fields, {
      cost: CREDIT.restore,
      type: "image",
      modelId: MODELS.standard,
      input,
      prompt,
      aspectRatio: input.aspect_ratio,
      modelUsed: MODELS.standard,
      spendDescription: "Restaurar foto",
    });
  }

  if (path === "tools/colorize") {
    const prompt = buildColorizePrompt(fields);
    const input = await imageInput(fields, files, "standard", prompt);
    return submitBillableGeneration(req, fields, {
      cost: CREDIT.colorize,
      type: "image",
      modelId: MODELS.standard,
      input,
      prompt,
      aspectRatio: input.aspect_ratio,
      modelUsed: MODELS.standard,
      spendDescription: "Colorir P&B",
    });
  }

  if (path === "tools/clothes") {
    const person = await resolveImageRef(files, fields, "photo", "photo_url");
    const garment = await resolveImageRef(files, fields, "garment", "garment_url");
    const composed = truthyField(fields, "composed");
    const hasGarment = Boolean(garment) && !composed;
    const prompt = buildClothesPrompt(fields, hasGarment);
    const input = { prompt };
    if (composed || !garment) {
      if (person) input.image = person;
    } else if (person && garment) {
      input.images = [person, garment];
    } else if (person) {
      input.image = person;
    }
    return submitBillableGeneration(req, fields, {
      cost: CREDIT.clothes,
      type: "image",
      modelId: MODELS.standard,
      input,
      prompt,
      spendDescription: "Trocar roupa",
    });
  }

  if (path === "tools/inpaint") {
    const image = await resolveImageRef(files, fields, "photo", "photo_url");
    const mask = await resolveImageRef(files, fields, "mask", "mask_url");
    const prompt = text(fields, "prompt", "background");
    const input = {
      image,
      mask,
      prompt,
      output_format: "jpg",
    };
    return submitBillableGeneration(req, fields, {
      cost: CREDIT.inpaint,
      type: "image",
      modelId: MODELS.inpaint,
      input,
      prompt,
      spendDescription: "Inpaint",
    });
  }

  if (path === "stripe/checkout") {
    const packageId = text(fields, "package", "starter");
    const region = regionFromRequest(req, fields);
    const cfg = getRegionConfig(region);
    const pkg = cfg.packages[packageId];
    if (!pkg) {
      const err = new Error("Pacote inválido.");
      err.status = 400;
      throw err;
    }
    const origin = fields.origin || "https://remakepix.com";
    const stripe = stripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: cfg.currency,
          unit_amount: pkg.amount_cents,
          product_data: {
            name: `Remake Pixel — ${pkg.name} (${pkg.credits} créditos)`,
            description: pkg.tagline,
          },
        },
        quantity: 1,
      }],
      metadata: {
        package: packageId,
        credits: String(pkg.credits),
        pricing_region: region,
      },
      success_url: `${origin}/app/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/app/billing?checkout=cancel`,
    });
    return { checkout_url: session.url, pricing_region: region };
  }

  const err = new Error("Endpoint não encontrado.");
  err.status = 404;
  throw err;
}

async function handlePath(path, req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    if (path.startsWith("admin/") && ["GET", "POST", "PATCH"].includes(req.method)) {
      return handleAdminRoute(path, req, res, { verifySessionToken, json, readJsonRequestBody });
    }

    if (req.method === "GET" && path === "public/padrao-styles") {
      const styles = PADRAO_STYLES_LIST.map((s) => ({ id: s.id, ...s }));
      const categories = [...new Set(styles.map((s) => s.cat))];
      return json(res, 200, { styles, categories });
    }

    if (req.method === "GET" && path === "public/pro-presets") {
      return json(res, 200, { presets: listProPresets() });
    }

    if (req.method === "GET" && path === "public/poster-templates") {
      return json(res, 200, { templates: listPosterTemplates() });
    }

    if (req.method === "GET" && path === "public/poster-models") {
      const country = countryFromRequest(req);
      const client = String(req.headers["x-pricing-region"] || "").trim();
      const region = resolvePricingRegion({ countryCode: country, clientRegion: client });
      const CREDIT = getCreditCostsForRegion(region);
      return json(res, 200, {
        models: [
          {
            key: "grok",
            label: "Motor Rápido",
            cost: CREDIT.posterFast,
            tier: "fast",
            supports_photo: true,
            tag: "Padrão · rápido",
          },
          {
            key: "flux2",
            label: "Motor Pro",
            cost: CREDIT.posterPro,
            tier: "pro",
            supports_photo: true,
            tag: "Foto-realista",
          },
          {
            key: "gpt_image",
            label: "Motor Premium",
            cost: CREDIT.posterPremium,
            tier: "premium",
            supports_photo: true,
            tag: "Qualidade Máxima",
          },
        ],
      });
    }

    if (req.method === "GET" && path === "public/pricing") {
      const country = countryFromRequest(req);
      const client = String(req.headers["x-pricing-region"] || "").trim();
      const region = resolvePricingRegion({ countryCode: country, clientRegion: client });
      const cfg = getRegionConfig(region);
      return json(res, 200, {
        region,
        country,
        currency: cfg.currency,
        symbol: cfg.symbol,
        label: cfg.label,
        checkout_note: cfg.checkoutNote,
        credit_costs: getCreditCostsForRegion(region),
      });
    }

    if (req.method === "GET" && path === "public/packages") {
      const country = countryFromRequest(req);
      const client = String(req.headers["x-pricing-region"] || "").trim();
      const region = resolvePricingRegion({ countryCode: country, clientRegion: client });
      const cfg = getRegionConfig(region);
      return json(res, 200, {
        region,
        country,
        currency: cfg.currency,
        symbol: cfg.symbol,
        label: cfg.label,
        checkout_note: cfg.checkoutNote,
        packages: getPackagesForRegion(region),
      });
    }

    if (req.method === "GET" && path === "blob/status") {
      return json(res, 200, {
        blob: isBlobConfigured(),
        blob_disabled: isBlobDisabled(),
      });
    }

    if (req.method === "GET" && path === "upload/s3/status") {
      return json(res, 410, {
        s3: false,
        disabled: true,
        detail: "Upload AWS S3 desligado. Usa fotos comprimidas e vídeos até ~3 MB.",
      });
    }

    if (req.method === "POST" && path === "upload/s3/presign-video") {
      return json(res, 410, {
        detail: "Upload AWS S3 desligado. Usa um vídeo mais curto (~3 MB).",
      });
    }

    if (req.method === "POST" && path === "upload/s3/presign-image") {
      return json(res, 410, {
        detail: "Upload AWS S3 desligado. Comprime a foto no browser.",
      });
    }

    if (req.method === "GET" && path === "carousel/panorama-image") {
      const url = new URL(req.url, `https://${req.headers.host}`);
      const imageUrl = trustedPanoramaProxyUrl(url.searchParams.get("url") || "");
      if (!imageUrl) {
        return json(res, 400, { detail: "URL da panorâmica inválida." });
      }
      const upstream = await fetch(imageUrl);
      if (!upstream.ok) {
        return json(res, 502, { detail: "Não foi possível obter a imagem gerada." });
      }
      const buf = Buffer.from(await upstream.arrayBuffer());
      setCors(res);
      res.setHeader("Content-Type", upstream.headers.get("content-type") || "image/jpeg");
      res.setHeader("Cache-Control", "private, max-age=300");
      return res.status(200).send(buf);
    }

    if (req.method === "GET" && path.startsWith("predictions/")) {
      const id = path.split("/")[1];
      const { user } = resolveSessionUser(req);
      const url = new URL(req.url, `https://${req.headers.host}`);
      const lang = (url.searchParams.get("lang") || req.headers["x-lang"] || "en").slice(0, 2);

      if (id.startsWith("rp_") && storageEnabled()) {
        const pending = await getPending(id);
        if (!pending) return json(res, 404, { detail: "Geração não encontrada." });
        if (user?.id && pending.user_id !== user.id) return json(res, 403, { detail: "Não autorizado." });
        const result = await pollPending(pending, getPrediction);
        return json(res, 200, result);
      }

      const prediction = await getPrediction(id);
      const status = prediction.status;
      if (status === "succeeded") {
        return json(res, 200, {
          status,
          creation: creationFromPrediction(prediction),
          output_urls: extractUrls(prediction.output),
        });
      }
      if (status === "failed" || status === "canceled") {
        return json(res, 200, {
          status: "failed",
          error: formatGenerationError(prediction.error || "A geração falhou.", lang),
        });
      }
      return json(res, 200, { status, elapsed_seconds: 0 });
    }

    if (req.method === "GET" && path === "stripe/session") {
      const url = new URL(req.url, `https://${req.headers.host}`);
      const sessionId = url.searchParams.get("session_id");
      if (!sessionId) return json(res, 400, { detail: "session_id em falta." });
      const stripe = stripeClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const paid = session.payment_status === "paid";
      const packageId = session.metadata?.package;
      const credits = Number(session.metadata?.credits || 0);
      const pricingRegion = session.metadata?.pricing_region || "intl";
      if (paid && credits > 0) {
        const auth = req.headers.authorization || "";
        const tm = auth.match(/^Bearer\s+(.+)$/i);
        const tokenUser = tm ? verifySessionToken(tm[1].trim()) : null;
        if (tokenUser?.id) {
          const cfg = getRegionConfig(pricingRegion);
          const pkg = cfg.packages[packageId];
          const amount = pkg ? pkg.amount_cents / 100 : 0;
          const currency = cfg.currency || "eur";
          await recordPurchase({
            userId: tokenUser.id,
            sessionId,
            packageId,
            credits,
            amount,
            currency,
            pricingRegion,
          });
          const balance = await addCredits(
            tokenUser.id,
            credits,
            "purchase",
            `Stripe purchase (${packageId || "package"})`,
            { stripe_session_id: sessionId },
          );
          if (balance != null) {
            return json(res, 200, {
              id: session.id,
              paid,
              package: packageId,
              credits,
              pricing_region: pricingRegion,
              new_balance: balance,
            });
          }
        }
      }
      return json(res, 200, {
        id: session.id,
        paid,
        package: packageId,
        credits,
        pricing_region: pricingRegion,
      });
    }

    if (req.method === "GET" && path === "auth/me") {
      const auth = req.headers.authorization || "";
      const m = auth.match(/^Bearer\s+(.+)$/i);
      if (!m) return json(res, 401, { detail: "Não autenticado." });
      const token = m[1].trim();
      if (token.startsWith("local:")) {
        return json(res, 401, { detail: "Token local — não válido no servidor." });
      }
      const sessionUser = verifySessionToken(token);
      if (!sessionUser) return json(res, 401, { detail: "Sessão inválida ou expirada." });
      await touchUser(sessionUser.id, req, { action: "me" });
      const dbUser = await getUserById(sessionUser.id);
      const user = dbUser
        ? { ...sessionUser, ...dbUser, is_unlimited: dbUser.is_unlimited || isAdminEmail(dbUser.email) }
        : sessionUser;
      return json(res, 200, user);
    }

    if (req.method === "POST" && path === "blob/prepare") {
      return await routeBlobPrepare(req, res);
    }

    if (req.method === "POST" && path === "upload/video-blob") {
      return await routeUploadVideoBlob(req, res);
    }

    if (req.method === "POST" && path === "upload/image-blob") {
      return await routeUploadImageBlob(req, res);
    }

    if (await handleCreationsRoute(path, req, res, { verifySessionToken, json })) {
      return;
    }

    if (await handlePromptAssistRoute(path, req, res, {
      verifySessionToken,
      json,
      readJsonRequestBody,
      touchUser,
    })) {
      return;
    }

    if (req.method === "POST" && path === "support/chat") {
      const body = await readJsonRequestBody(req);
      const auth = req.headers.authorization || "";
      const tm = auth.match(/^Bearer\s+(.+)$/i);
      if (!tm) return json(res, 401, { detail: "Não autenticado." });
      const token = tm[1].trim();
      if (token.startsWith("local:")) {
        return json(res, 503, {
          detail: "O assistente precisa de conta ligada ao servidor. Entra com Google ou envia email ao suporte.",
        });
      }
      const sessionUser = verifySessionToken(token);
      if (!sessionUser) return json(res, 401, { detail: "Sessão inválida ou expirada." });
      const { runSupportChat } = require("./lib/supportAssistant.cjs");
      try {
        const out = await runSupportChat({
          messages: body.messages,
          lang: body.lang || sessionUser.lang || "en",
          user: sessionUser,
          page: body.page || "",
        });
        await touchUser(sessionUser.id, req, { action: "support_chat" });
        return json(res, 200, out);
      } catch (err) {
        return json(res, err.status || 500, {
          detail: err.message || "Assistente indisponível.",
        });
      }
    }

    if (req.method === "POST") {
      const maxFileSize = path === "generate/video-edit"
        ? 54 * 1024 * 1024
        : path.startsWith("upload/")
          ? 12 * 1024 * 1024
          : 12 * 1024 * 1024; // Accept up to 12 MB — HEIF phones send 8-20 MB; sharp normalizes server-side
      const { fields, files } = await parseBody(req, { maxFileSize });
      // Normalize HEIF/HEIC → JPEG before downstream handlers consume the file
      await normalizeUploadedImages(files);
      if (path === "auth/login" || path === "auth/register" || path === "auth/google") {
        try {
          const out = await routeAuth(path, fields, req);
          return json(res, 200, out);
        } catch (err) {
          return json(res, err.status || 500, { detail: err.message || "Erro de autenticação." });
        }
      }
      const prediction = await routePost(path, fields, files, req);
      if (prediction.checkout_url) return json(res, 200, prediction);
      if (prediction.prediction_id) return json(res, 200, predictionResponse(prediction));
      return json(res, 200, predictionResponse(prediction));
    }

    return json(res, 404, { detail: "Endpoint não encontrado." });
  } catch (err) {
    const msg = String(err?.message || err || "");
    if (
      /FUNCTION_PAYLOAD_TOO_LARGE|Request Entity Too Large/i.test(msg)
      || /max file size|larger than|maxFields|maxFieldsSize|exceeded|MultipartParserError/i.test(msg)
    ) {
      const isVideoEdit = String(pathFromRequest(req) || "").includes("video-edit");
      if (/FUNCTION_PAYLOAD_TOO_LARGE|Request Entity Too Large/i.test(msg)) {
        return json(res, 413, {
          detail: isVideoEdit
            ? "O vídeo ultrapassou o limite do servidor (Vercel). Aguarda o upload para a nuvem antes de Gerar, ou usa um clip mais curto."
            : "O pedido é demasiado grande para o servidor. Comprime a imagem ou ativa o upload em nuvem.",
        });
      }
      return json(res, 413, {
        detail: isVideoEdit
          ? "Vídeo muito grande. Máximo 50MB. Usa MP4 (H.264) ou MOV (ideal 2–10 s) ou recarrega para ativar o upload em nuvem."
          : "A imagem é demasiado grande para o servidor. Recarrega a página (Ctrl+F5) e tenta outra vez — o site comprime automaticamente antes de enviar.",
      });
    }
    return json(res, err.status || 500, { detail: err.message || "Erro no servidor de geração." });
  }
}

function pathFromRequest(req) {
  const q = req.query || {};
  const dotted = q["...path"];
  if (Array.isArray(dotted)) return dotted.filter(Boolean).join("/");
  if (dotted != null && String(dotted).length) return String(dotted);
  const p = q.path;
  if (Array.isArray(p)) return p.filter(Boolean).join("/");
  if (p != null && String(p).length) return String(p);
  try {
    const url = new URL(req.url || "/", `https://${req.headers.host || "localhost"}`);
    return String(url.pathname || "")
      .replace(/^\/api\/?/i, "")
      .replace(/^\/+|\/+$/g, "");
  } catch {
    return "";
  }
}

module.exports = async function handler(req, res) {
  const path = pathFromRequest(req);
  return handlePath(path, req, res);
};

module.exports.handlePath = handlePath;
module.exports.config = functionConfig;
