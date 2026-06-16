const fs = require("fs/promises");
const crypto = require("crypto");
const { formidable } = require("formidable");
const Stripe = require("stripe");
const {
  countryFromRequest,
  getPackagesForRegion,
  getPremiumPackagesForRegion,
  getSubscriptionPlansForRegion,
  getCreditCostsForRegion,
  getRegionConfig,
  resolvePricingRegion,
} = require("./pricingRegions.cjs");
const { handleAdminRoute } = require("./lib/adminHandlers.cjs");
const {
  checkEmailRegistration,
  registerEmailUser,
  loginEmailUser,
  requestPasswordReset,
  resetPasswordWithToken,
} = require("./lib/emailAuth.cjs");
const {
  ADMIN_EMAILS,
  upsertGoogleUser,
  touchUser,
  getUserById,
  repairUserAccountIfNeeded,
  isAdminEmail,
  addCredits,
  addPremiumCredits,
  fulfillStripeCheckoutSession,
  recordCreation,
  storageEnabled,
} = require("./lib/usersDb.cjs");
const { spendCredits, spendPremiumCredits, spendableStandardCredits } = require("./lib/creditsDb.cjs");
const {
  getSubscriptionPlan,
  isSubscriptionActive,
  activateSubscriptionFromCheckout,
  PLAN_ID: CREATOR_PLAN_ID,
} = require("./lib/creatorSubscription.cjs");
const { posterHqPremiumCost, getPosterHqPremiumCostPerOutput } = require("./lib/premiumCredits.cjs");
const {
  createPending,
  getPending,
  pollPending,
  newPendingId,
  completePendingWithUrls,
  updatePending,
  isOpenAIPosterJob,
  registerFluxFallbackHandler,
} = require("./lib/pendingPredictions.cjs");
const {
  resolvePosterModel,
  buildNanoBananaPosterInput,
  buildPosterTextManifest,
  buildPosterLogoInstruction,
  aspectToOpenAISize,
  openAISizeToAspectRatio,
  POSTER_FULL_BLEED_GUARD,
} = require("./lib/posterEngine.cjs");
const { preparePosterReference, preparePosterReferenceForOpenAI } = require("./lib/posterImagePrep.cjs");
const { isIgRefPosterTemplate } = require("./lib/posterLayoutCover.cjs");
const { buildIgRefPosterGeneration, getIgRefTemplate } = require("./lib/posterIgRefGenerate.cjs");
const { generateOpenAIPosterImageDetailed } = require("./lib/openaiPoster.cjs");
const { generateFashionClothesImage } = require("./lib/clothesFashionOpenAI.cjs");
const { formatGenerationError } = require("./lib/generationErrors.cjs");
const { appendAspectOutputInstruction, MATCH_ASPECT } = require("./lib/aspectOutputPrompt.cjs");
const { fitImageRefToAspect, detectNearestGrokAspect } = require("./lib/fitImageToAspect.cjs");
const { handleCreationsRoute } = require("./lib/creationsRoutes.cjs");
const { handlePromptAssistRoute } = require("./lib/promptAssist.cjs");
const PADRAO_STYLES_BASE = require("./lib/padraoStylesData.cjs");
const PADRAO_STYLE_EXTENSIONS = require("./lib/padraoStyleExtensions.cjs");
const PADRAO_STYLES_LIST = [...PADRAO_STYLES_BASE, ...PADRAO_STYLE_EXTENSIONS];
const { finalizeImagePrompt } = require("./lib/imageQualityPrompts.cjs");
const {
  PHOTO_EDIT_IDENTITY_BLOCK,
  appendPhotoEditIdentity,
  appendProRetouchIdentity,
  upgradePadraoPrompt,
  buildStudioMultiCombineBlock,
  buildStudioDualPersonBlock,
  buildMangaDualCharacterBlock,
  buildMangaComicSheetBlock,
} = require("./lib/identityPrompts.cjs");
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
  blobPutOptions,
} = require("./lib/blobEnv.cjs");

function blobDisabledResponse(res) {
  return json(res, 410, {
    detail: "Vercel Blob está desligado neste projeto. Uploads usam POST directo (fotos comprimidas).",
    blob_disabled: true,
  });
}
const { listPosterTemplates, getPosterTemplateById } = require("./lib/posterTemplatesData.cjs");
const { improvePrompt } = require("./lib/promptAssist.cjs");
const { signSession, verifySessionToken } = require("./lib/sessionToken.cjs");
const { loginWithGoogleCredential, handleGoogleRedirectCallback } = require("./lib/googleAuth.cjs");
const {
  computeVideoGenerateCost,
  computeVideoEditCostFromConfig,
  computeArtisticEffectSurcharge,
  restoreCostForLevel,
  customPurchaseAmountCents,
  getPricingMeta,
  getSurcharges,
} = require("./lib/creditPricing.cjs");

function getPadraoStyle(styleId) {
  return PADRAO_STYLES_LIST.find((s) => s.id === String(styleId || "").trim()) || null;
}

async function routeAuth(path, fields, req) {
  if (path === "auth/register") {
    const region = regionFromRequest(req, fields);
    const user = await registerEmailUser({
      email: text(fields, "email", ""),
      password: text(fields, "password", ""),
      name: text(fields, "name", ""),
      referral_code: text(fields, "referral_code", ""),
      pricing_region: region,
    }, req);
    return { token: signSession(user), user };
  }

  if (path === "auth/login") {
    const user = await loginEmailUser({
      email: text(fields, "email", ""),
      password: text(fields, "password", ""),
    }, req);
    return { token: signSession(user), user };
  }

  if (path === "auth/google") {
    return loginWithGoogleCredential(fields.credential || fields.id_token, req, fields);
  }

  const err = new Error("Pedido de autenticação inválido.");
  err.status = 404;
  throw err;
}

const functionConfig = {
  api: {
    bodyParser: false,
  },
};

const {
  QWEN_EDIT_MODEL: ARTISTIC_QWEN_MODEL,
  isNsfwStyleId,
  resolveArtisticStudioModel: pickArtisticStudioModel,
} = require("./lib/artisticStudioEngines.cjs");

function isArtisticExperimentalStyleId(styleId) {
  return isNsfwStyleId(styleId);
}

function resolveArtisticStudioModel({ styleId, hasPhoto, styleCat }) {
  const picked = pickArtisticStudioModel({ styleId, hasPhoto, styleCat });
  if (picked) return picked;
  return { modelKey: "standard", modelId: MODELS.standard, label: MODELS.standard };
}

const QWEN_EDIT_MODEL =
  String(process.env.ARTISTIC_LAB_QWEN_MODEL || "").trim() || "qwen/qwen-image-edit-2511";

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

function nearestFluxAspect(ratio) {
  const r = String(ratio || "1:1").trim();
  if (FLUX_SUPPORTED.has(r)) return r;
  if (r === "4:5" || r === "3:4") return "3:4";
  if (r === "5:4") return "4:3";
  return "1:1";
}

function buildFluxFallbackInputFromPending(pending) {
  const imageUrl = pending.fallback_image_url;
  if (!imageUrl) return null;
  const basePrompt = pending.fallback_prompt || pending.prompt || "";
  const aspectRatio = nearestFluxAspect(pending.aspect_ratio);
  let fluxPrompt = finalizeImagePrompt(appendPhotoEditIdentity(basePrompt), {
    modelKey: "pro",
    hasPersonPhoto: true,
    photoEdit: true,
  });
  fluxPrompt = appendAspectOutputInstruction(fluxPrompt, aspectRatio);
  return {
    prompt: fluxPrompt,
    aspect_ratio: aspectRatio,
    images: [imageUrl],
    disable_safety_checker: true,
  };
}

async function buildFluxEasyFallbackInput(grokInput, basePrompt) {
  const mainImage = grokInput?.image || grokInput?.images?.[0];
  if (!mainImage) return null;
  const aspectRatio = nearestFluxAspect(grokInput.aspect_ratio);
  let fluxPrompt = finalizeImagePrompt(appendPhotoEditIdentity(basePrompt), {
    modelKey: "pro",
    hasPersonPhoto: true,
    photoEdit: true,
  });
  fluxPrompt = appendAspectOutputInstruction(fluxPrompt, aspectRatio);
  return {
    prompt: fluxPrompt,
    aspect_ratio: aspectRatio,
    images: [mainImage],
    disable_safety_checker: true,
  };
}

registerFluxFallbackHandler(async (pending) => {
  const fluxInput = buildFluxFallbackInputFromPending(pending);
  if (!fluxInput) return null;
  const prediction = await createPrediction(MODELS.pro, fluxInput);
  return {
    replicate_prediction_id: prediction.id,
    model_used: MODELS.pro,
  };
});

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
    return "match_input_image";
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

function buildVideoEditPrompt(userPrompt, options = {}) {
  const { buildVideoEditPromptText } = require("./lib/videoEditPrompts.cjs");
  return buildVideoEditPromptText(userPrompt, options);
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

async function resolveVideoEditMediaUrl(files, fields) {
  let fromUrl = trustedMediaUrl(text(fields, "video_url", ""));
  if (fromUrl) return fromUrl;
  const file = fileOf(files, "video");
  if (file) {
    fromUrl = await uploadFormVideoToBlob(file);
    if (fromUrl) return fromUrl;
  }
  const hadUrl = Boolean(String(text(fields, "video_url", "")).trim());
  let msg = "Envia um vídeo (MP4/MOV, idealmente 2–10 segundos).";
  if (isBlobConfigured() || isS3Configured()) {
    msg = hadUrl
      ? "URL do vídeo na nuvem inválida ou inacessível. Recarrega a página (Ctrl+F5) e tenta Gerar outra vez."
      : "O upload para a nuvem não concluiu. Aguarda «Pronto para gerar» ou recarrega (Ctrl+F5) e tenta outra vez.";
  } else {
    msg += " Configura Vercel Blob (BLOB_READ_WRITE_TOKEN) na Vercel.";
  }
  const err = new Error(msg);
  err.status = file || hadUrl ? 413 : 400;
  throw err;
}

async function videoEditInput(fields, files) {
  const video = await resolveVideoEditMediaUrl(files, fields);
  const preset = text(fields, "video_preset", "").trim();
  const userPrompt = text(fields, "prompt", "").trim();
  const prompt = buildVideoEditPrompt(userPrompt, { preset });
  const resolution = text(fields, "resolution", "original");
  const aspectRatio = text(fields, "aspect_ratio", "auto");
  const audioSetting = text(fields, "audio_setting", "origin");
  const { mapResolutionForModel } = require("./lib/videoEditPricing.cjs");
  const input = {
    video,
    prompt,
    resolution: mapResolutionForModel(resolution),
    aspect_ratio: aspectRatio || "auto",
    audio_setting: audioSetting === "auto" ? "auto" : "origin",
  };
  const dur = Number(text(fields, "duration", ""));
  if (Number.isFinite(dur) && dur >= 2 && dur <= 10) input.duration = Math.round(dur);
  const ref = await resolveImageRef(files, fields, "reference_image", "reference_image_url");
  if (ref) input.reference_image = ref;
  return { input, prompt: userPrompt };
}

async function grokVideoEditInput(fields, files) {
  const { buildGrokEditInput } = require("./lib/videoModels.cjs");
  const GROK_MAX_SEC = 8;
  const fromUrl = await resolveVideoEditMediaUrl(files, fields);
  const dur = Math.round(Number(text(fields, "duration", String(GROK_MAX_SEC))));
  if (dur !== GROK_MAX_SEC) {
    const err = new Error(`Grok só gera clips até ${GROK_MAX_SEC} segundos.`);
    err.status = 400;
    throw err;
  }
  const userPrompt = text(fields, "prompt", "").trim();
  if (userPrompt.length < 3) {
    const err = new Error("Descreve a edição (mín. 3 caracteres).");
    err.status = 400;
    throw err;
  }
  const prompt = `${userPrompt.trim()}. Keep everything else in the scene unchanged unless explicitly requested.`;
  const input = buildGrokEditInput({ video: fromUrl, prompt });
  return { input, prompt: userPrompt };
}

async function klingVideoEditInput(fields, files) {
  const { buildKlingEditInput } = require("./lib/videoModels.cjs");
  const video = await resolveVideoEditMediaUrl(files, fields);
  const preset = text(fields, "video_preset", "").trim();
  const userPrompt = text(fields, "prompt", "").trim();
  const prompt = buildVideoEditPrompt(userPrompt, { preset });
  const resolution = text(fields, "resolution", "original");
  const audioSetting = text(fields, "audio_setting", "origin");
  const ref = await resolveImageRef(files, fields, "reference_image", "reference_image_url");
  const input = buildKlingEditInput({
    video,
    prompt,
    referenceImage: ref,
    resolution,
    keepOriginalSound: audioSetting !== "auto",
  });
  return { input, prompt: userPrompt };
}

async function videoExtendInput(fields, files) {
  const video = await resolveVideoRef(files, fields, "video", "video_url");
  if (!video) {
    const err = new Error("Envia um vídeo (MP4/MOV, idealmente 2–10 segundos).");
    err.status = 400;
    throw err;
  }
  const userPrompt = text(fields, "prompt", "").trim();
  if (userPrompt.length < 3) {
    const err = new Error("Descreve o que acontece a seguir (mín. 3 caracteres).");
    err.status = 400;
    throw err;
  }
  const { buildVideoExtendPrompt, buildWanExtendInput } = require("./lib/videoModels.cjs");
  const { validateVideoExtendOptions } = require("./lib/videoExtendPricing.cjs");
  const prompt = buildVideoExtendPrompt(userPrompt);
  const opts = validateVideoExtendOptions({
    resolution: text(fields, "resolution", "1080p"),
    duration: text(fields, "duration", "6"),
  });
  const input = buildWanExtendInput({
    firstClip: video,
    prompt,
    duration: opts.duration,
    resolution: opts.resolution,
  });
  return { input, prompt: userPrompt };
}

async function resolveImageRef(files, fields, fileKey, urlKey) {
  const fromUrl = trustedMediaUrl(text(fields, urlKey, ""));
  if (fromUrl) return fromUrl;
  return fileToDataUri(fileOf(files, fileKey));
}

/** 1–5 images: image_0 (main) … image_4 (references). Also accepts image_0_url … */
async function resolveMarketingVideoImages(files, fields, max = 5) {
  const urls = [];
  for (let i = 0; i < max; i += 1) {
    const fromUrl = trustedMediaUrl(text(fields, `image_${i}_url`, ""));
    if (fromUrl) {
      urls.push(fromUrl);
      continue;
    }
    const file = fileOf(files, `image_${i}`);
    if (!file) continue;
    const blobUrl = await uploadFormImageToBlob(file);
    if (blobUrl) {
      urls.push(blobUrl);
      continue;
    }
    const dataUri = await fileToDataUri(file);
    if (dataUri) urls.push(dataUri);
  }
  return urls;
}

/** Upload de vídeo pelo servidor → Vercel Blob (fallback quando o browser não consegue PUT direto). */
/** Upload de imagem pelo servidor → Vercel Blob (fallback quando o browser não consegue PUT directo). */
async function routeUploadImageBlob(req, res) {
  if (isBlobDisabled()) return blobDisabledResponse(res);
  try {
    if (!isBlobConfigured()) {
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
    const blob = await put(pathname, buf, blobPutOptions({ contentType: mime }));
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
    if (!isBlobConfigured()) {
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
    const blob = await put(pathname, buf, blobPutOptions({ contentType: mime }));
    return json(res, 200, { url: blob.url });
  } catch (err) {
    return json(res, err.status || 500, {
      detail: err.message || "Falha ao guardar vídeo na nuvem.",
    });
  }
}

/** Vídeo multipart → URL pública Blob (Grok exige HTTPS, não data: URI). */
async function uploadFormVideoToBlob(file) {
  if (!file?.filepath || !isBlobConfigured()) return null;
  const { MAX_VIDEO_BYTES, transcodeVideoToH264, shouldAttemptTranscode } = require("./lib/videoTranscode.cjs");
  const st = await fs.stat(file.filepath).catch(() => null);
  if (!st?.size || st.size > MAX_VIDEO_BYTES) return null;
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
  const blob = await put(pathname, buf, blobPutOptions({ contentType: mime }));
  return blob.url;
}

/** Imagem multipart → URL pública Blob (Seedance / Replicate preferem HTTPS). */
async function uploadFormImageToBlob(file) {
  if (!file?.filepath || !isBlobConfigured()) return null;
  const maxBytes = 12 * 1024 * 1024;
  let st = await fs.stat(file.filepath).catch(() => null);
  if (!st?.size || st.size > maxBytes) return null;

  let filepath = file.filepath;
  let mime = file.mimetype || "image/jpeg";

  if (st.size > 2 * 1024 * 1024) {
    try {
      const sharp = require("sharp");
      const pathMod = require("path");
      const os = require("os");
      const outPath = pathMod.join(
        os.tmpdir(),
        `rp-mvimg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`,
      );
      await sharp(file.filepath, { failOn: "none" })
        .rotate()
        .resize({ width: 1536, height: 1536, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 85, mozjpeg: true })
        .toFile(outPath);
      const outSt = await fs.stat(outPath).catch(() => null);
      if (outSt?.size) {
        filepath = outPath;
        mime = "image/jpeg";
        st = outSt;
      }
    } catch {
      /* keep original */
    }
  }

  let fn = String(file.originalFilename || "photo.jpg").replace(/[^\w.\-]+/g, "_");
  if (!/\.[a-z0-9]{2,5}$/i.test(fn)) fn += ".jpg";
  const pathname = `rp/mv/${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${fn.slice(0, 80)}`;
  const buf = await fs.readFile(filepath);
  const { put } = require("@vercel/blob");
  const blob = await put(pathname, buf, blobPutOptions({ contentType: mime }));
  return blob.url;
}

const VIDEO_BLOB_CONTENT_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
];
const MAX_VIDEO_BLOB_BYTES = 500 * 1024 * 1024;

function injectAuthFromClientPayload(req, clientPayload) {
  if (req.headers.authorization) return;
  if (!clientPayload) return;
  try {
    const parsed = JSON.parse(clientPayload);
    const token = String(parsed.token || "").trim();
    if (token) req.headers.authorization = `Bearer ${token}`;
  } catch {
    /* ignore */
  }
}

async function routeVideoUpload(req, res) {
  if (isBlobDisabled()) return blobDisabledResponse(res);
  try {
    const blobToken = getBlobReadWriteToken();
    if (!blobToken) {
      return json(res, 503, {
        detail: "Armazenamento Blob não configurado. Liga remakepix-blob ao projeto na Vercel.",
      });
    }
    const body = await readJsonRequestBody(req);
    // eslint-disable-next-line global-require
    const { handleUpload } = require("@vercel/blob/client");
    const jsonResponse = await handleUpload({
      body,
      request: req,
      token: blobToken,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        injectAuthFromClientPayload(req, clientPayload);
        const auth = req.headers.authorization || "";
        const m = auth.match(/^Bearer\s+(.+)$/i);
        if (!m?.[1]?.trim()) {
          const err = new Error("Não autenticado.");
          err.status = 401;
          throw err;
        }
        const bearer = m[1].trim();
        if (!bearer.startsWith("local:") && !verifySessionToken(bearer)) {
          const err = new Error("Sessão inválida ou expirada.");
          err.status = 401;
          throw err;
        }
        if (String(pathname || "").includes("..")) {
          const err = new Error("Nome de ficheiro inválido.");
          err.status = 400;
          throw err;
        }
        return {
          allowedContentTypes: VIDEO_BLOB_CONTENT_TYPES,
          addRandomSuffix: true,
          maximumSizeInBytes: MAX_VIDEO_BLOB_BYTES,
          tokenPayload: clientPayload,
        };
      },
      onUploadCompleted: async () => {
        /* URL devolvida ao browser pelo SDK upload(); webhook opcional */
      },
    });
    return json(res, 200, jsonResponse);
  } catch (err) {
    return json(res, err.status || 400, { detail: err.message || "Falha no upload de vídeo." });
  }
}

async function routeBlobPrepare(req, res) {
  if (isBlobDisabled()) return blobDisabledResponse(res);
  try {
    const blobToken = getBlobReadWriteToken();
    if (!blobToken) {
      return json(res, 503, {
        detail: "Blob ligado ao projeto mas falta BLOB_READ_WRITE_TOKEN. No dashboard Vercel: Storage → remakepix-blob → ligar ao projeto e criar token Read/Write.",
      });
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
      maximumSizeInBytes: isVideo ? 200 * 1024 * 1024 : 12 * 1024 * 1024,
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

function serverPollDeadlineMs(pending) {
  if (pending?.type === "video" || pending?.type === "marketing_video" || pending?.type === "motion_flyer") return 1_800_000;
  if (isOpenAIPosterJob(pending)) return 780_000;
  if (pending?.type === "poster") return 600_000;
  return 105_000;
}

/** Best-effort server poll after submit (cron + Vercel Pro waitUntil cover long jobs). */
function scheduleServerPendingPoll(pending) {
  if (!pending?.id) return;
  const run = async () => {
    const deadline = Date.now() + serverPollDeadlineMs(pending);
    while (Date.now() < deadline) {
      const fresh = await getPending(pending.id);
      if (!fresh || fresh.status === "completed" || fresh.status === "refunded") return;
      // eslint-disable-next-line no-await-in-loop
      const result = await pollPending(fresh, getPrediction);
      if (result.status !== "processing") return;
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 2500));
    }
  };
  try {
    const { waitUntil } = require("@vercel/functions");
    if (typeof waitUntil === "function") {
      waitUntil(run());
      return;
    }
  } catch {
    /* @vercel/functions optional */
  }
  run().catch(() => {});
}

function predictionResponse(result) {
  const prediction = result.prediction || result;
  const out = {
    prediction_id: result.prediction_id || prediction.id || prediction.uuid,
    credits_spent: result.credits_spent || 0,
    type: result.type || "image",
  };
  if (result.new_balance != null) out.new_balance = result.new_balance;
  if (result.new_premium_balance != null) out.new_premium_balance = result.new_premium_balance;
  if (result.wallet) out.wallet = result.wallet;
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

/** Seedance / marketing pipelines — sempre registam custo real (mesmo admin). */
const FORCE_BILL_GENERATION_TYPES = new Set(["motion_flyer", "marketing_video"]);

function mustForceBillGeneration(type, cost) {
  if (FORCE_BILL_GENERATION_TYPES.has(String(type || ""))) return true;
  return Number(cost) >= 120;
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
  notifyEmail: notifyEmailOpt,
  fallbackImageUrl,
  fallbackPrompt,
  fluxFallbackInput,
  pendingMeta,
}) {
  const { user, isLocal } = resolveSessionUser(req);
  const lang = userLang(req, fields);

  let notifyEmail = notifyEmailOpt;
  if (notifyEmail === undefined && storageEnabled() && user?.id && !isLocal) {
    const preUser = await getUserById(user.id);
    const { resolveGenerationNotifyEmail } = require("./lib/generationNotify.cjs");
    notifyEmail = resolveGenerationNotifyEmail(fields, preUser, { type });
  } else if (notifyEmail === undefined) {
    notifyEmail = null;
  }

  const pendingFallbackFields = fallbackImageUrl
    ? {
      fallback_image_url: fallbackImageUrl,
      fallback_prompt: fallbackPrompt || prompt || input?.prompt || "",
      primary_model: modelId,
    }
    : {};

  if (storageEnabled() && user?.id && !isLocal) {
    const dbUser = await getUserById(user.id);
    if (dbUser?.banned) {
      const err = new Error("Conta suspensa.");
      err.status = 403;
      throw err;
    }
    const forceBill = mustForceBillGeneration(type, cost);
    if (isAdminEmail(dbUser?.email) && !forceBill) {
      let prediction;
      let resolvedModelUsed = modelUsed || modelId;
      let fluxAttempted = false;
      try {
        prediction = await createPrediction(modelId, input);
      } catch (e) {
        if (fluxFallbackInput && modelId === MODELS.standard) {
          prediction = await createPrediction(MODELS.pro, fluxFallbackInput);
          resolvedModelUsed = MODELS.pro;
          fluxAttempted = true;
        } else {
          throw e;
        }
      }
      const pending = await createPending({
        id: newPendingId(),
        user_id: user.id,
        replicate_prediction_id: prediction.id,
        type,
        prompt: prompt || input?.prompt || "",
        model_used: resolvedModelUsed,
        aspect_ratio: aspectRatio || input?.aspect_ratio || "1:1",
        credits_spent: 0,
        balance_after_spend: dbUser.credits ?? 999999999,
        lang,
        notify_email: notifyEmail || null,
        ...pendingFallbackFields,
        ...(pendingMeta && typeof pendingMeta === "object" ? pendingMeta : {}),
        flux_fallback_attempted: fluxAttempted,
      });
      scheduleServerPendingPoll(pending);
      return {
        prediction_id: pending.id,
        credits_spent: 0,
        type,
        new_balance: dbUser.credits ?? 999999999,
        server_billing: true,
      };
    }
    const balance = spendableStandardCredits(dbUser) ?? dbUser?.total_standard_credits ?? dbUser?.credits ?? user.credits ?? 0;
    if (!isAdminEmail(dbUser?.email) && balance < cost) {
      const err = new Error("Créditos insuficientes.");
      err.status = 402;
      throw err;
    }

    const newBalance = await spendCredits(user.id, cost, spendDescription || "Geração", { forceBill });
    let prediction;
    let resolvedModelUsed = modelUsed || modelId;
    let fluxAttempted = false;
    try {
      prediction = await createPrediction(modelId, input);
    } catch (e) {
      if (fluxFallbackInput && modelId === MODELS.standard) {
        try {
          prediction = await createPrediction(MODELS.pro, fluxFallbackInput);
          resolvedModelUsed = MODELS.pro;
          fluxAttempted = true;
        } catch (e2) {
          if (!forceBill || !isAdminEmail(dbUser?.email)) {
            await addCredits(user.id, cost, "refund", `Refund: submit failed (${String(e2.message || e2).slice(0, 80)})`);
          }
          const err = new Error(formatGenerationError(e2.message || "submit failed", lang));
          err.status = e2.status && e2.status >= 400 && e2.status < 600 ? e2.status : 502;
          throw err;
        }
      } else {
        if (!forceBill || !isAdminEmail(dbUser?.email)) {
          await addCredits(user.id, cost, "refund", `Refund: submit failed (${String(e.message || e).slice(0, 80)})`);
        }
        const err = new Error(formatGenerationError(e.message || "submit failed", lang));
        err.status = e.status && e.status >= 400 && e.status < 600 ? e.status : 502;
        throw err;
      }
    }

    const pending = await createPending({
      id: newPendingId(),
      user_id: user.id,
      replicate_prediction_id: prediction.id,
      type,
      prompt: prompt || input?.prompt || "",
      model_used: resolvedModelUsed,
      aspect_ratio: aspectRatio || input?.aspect_ratio || "1:1",
      credits_spent: cost,
      balance_after_spend: newBalance,
      lang,
      notify_email: notifyEmail || null,
      ...pendingFallbackFields,
      ...(pendingMeta && typeof pendingMeta === "object" ? pendingMeta : {}),
      flux_fallback_attempted: fluxAttempted,
    });
    scheduleServerPendingPoll(pending);

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

function normalizeMangaModelKey(selected) {
  const key = String(selected || "").trim().toLowerCase();
  if (key === "gpt_image" || key === "flux2" || key === "flux" || key === "pro") return "pro";
  return "standard";
}

function mangaImagesCount(fields, fallback = 1) {
  const raw = text(fields, "image_count", "") || text(fields, "page_count", "") || text(fields, "num_outputs", "");
  const n = Math.round(Number(raw) || fallback || 1);
  return Math.max(1, Math.min(n, 50));
}

function mangaPerImageCost(CREDIT, modelKey) {
  return Math.max(1, Number(modelKey === "pro" ? CREDIT.pro : CREDIT.image) || 15);
}

function qwenMangaPerImageCost(CREDIT) {
  return Math.max(1, Number(CREDIT.edit ?? CREDIT.mangaPanel) || 15);
}

/** Pôster via OpenAI (síncrono) — debita créditos HQ (premium wallet). */
async function submitInstantPosterGeneration(req, fields, {
  cost,
  prompt,
  aspectRatio,
  modelUsed,
  urls,
  type = "poster",
  spendDescription = "Pôster HQ",
  usePremiumWallet = true,
}) {
  const { user, isLocal } = resolveSessionUser(req);
  const lang = userLang(req, fields);

  if (!urls?.length) {
    const err = new Error("Sem imagem gerada.");
    err.status = 502;
    throw err;
  }

  let notifyEmail = null;
  if (storageEnabled() && user?.id && !isLocal) {
    const preUser = await getUserById(user.id);
    const { resolveGenerationNotifyEmail } = require("./lib/generationNotify.cjs");
    const notifyType = usePremiumWallet ? "poster_hq" : type;
    notifyEmail = resolveGenerationNotifyEmail(fields, preUser, { type: notifyType });
    if (usePremiumWallet && !notifyEmail) {
      const err = new Error("Precisas de email na conta para receber o poster HQ.");
      err.status = 400;
      throw err;
    }
  }

  if (storageEnabled() && user?.id && !isLocal) {
    const dbUser = await getUserById(user.id);
    if (dbUser?.banned) {
      const err = new Error("Conta suspensa.");
      err.status = 403;
      throw err;
    }
    const premiumBalance = dbUser?.premium_credits ?? 0;
    const standardBalance = dbUser?.credits ?? user.credits ?? 0;
    if (usePremiumWallet) {
      if (!isAdminEmail(dbUser?.email) && premiumBalance < cost) {
        const err = new Error("Créditos HQ insuficientes.");
        err.status = 402;
        err.detail = "Insufficient premium credits";
        throw err;
      }
    } else if (!isAdminEmail(dbUser?.email) && standardBalance < cost) {
      const err = new Error("Créditos insuficientes.");
      err.status = 402;
      throw err;
    }

    let newBalance = standardBalance;
    let newPremiumBalance = premiumBalance;
    if (!isAdminEmail(dbUser?.email)) {
      if (usePremiumWallet) {
        newPremiumBalance = await spendPremiumCredits(user.id, cost, spendDescription);
      } else {
        newBalance = await spendCredits(user.id, cost, spendDescription);
      }
    }

    const pending = await createPending({
      id: newPendingId(),
      user_id: user.id,
      replicate_prediction_id: "openai-poster-sync",
      type,
      prompt: prompt || "",
      model_used: modelUsed || "openai/gpt-image-1",
      aspect_ratio: aspectRatio || "4:5",
      credits_spent: isAdminEmail(dbUser?.email) ? 0 : cost,
      balance_after_spend: usePremiumWallet ? newPremiumBalance : newBalance,
      wallet: usePremiumWallet ? "premium" : "standard",
      lang,
      notify_email: notifyEmail || null,
    });

    try {
      await completePendingWithUrls(pending, urls);
    } catch (e) {
      if (!isAdminEmail(dbUser?.email)) {
        if (usePremiumWallet) {
          await addPremiumCredits(user.id, cost, "refund", `Refund: ${type} sync failed (${String(e.message || e).slice(0, 80)})`);
        } else {
          await addCredits(user.id, cost, "refund", `Refund: ${type} sync failed (${String(e.message || e).slice(0, 80)})`);
        }
      }
      const err = new Error(formatGenerationError(e.message || "submit failed", lang));
      err.status = 502;
      throw err;
    }

    return {
      prediction_id: pending.id,
      credits_spent: isAdminEmail(dbUser?.email) ? 0 : cost,
      wallet: usePremiumWallet ? "premium" : "standard",
      type,
      new_balance: usePremiumWallet ? undefined : newBalance,
      new_premium_balance: usePremiumWallet ? newPremiumBalance : undefined,
      server_billing: true,
    };
  }

  const meta = withMeta({ prompt }, cost, type);
  return {
    prediction_id: newPendingId(),
    credits_spent: cost,
    wallet: usePremiumWallet ? "premium" : "standard",
    type,
    creation: {
      type,
      prompt: prompt || "",
      model_used: modelUsed || "openai/gpt-image-1",
      aspect_ratio: aspectRatio || "4:5",
      result_urls: urls,
      credits_spent: cost,
    },
    ...meta,
  };
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
  const POSE_LOCK =
    "Keep IDENTICAL pose, body proportions, camera angle, framing, background and lighting from the person photo. "
    + "Only clothing/outfit pixels may change — no body reshaping, no re-posing, no stance change.";
  const userPrompt = text(fields, "prompt", "").trim();
  const changeType = text(fields, "change_type", "full");
  if (hasGarment) {
    let p = (
      "Two reference images: (1) the person, (2) the clothing/outfit to wear. "
      + "Generate exactly ONE photorealistic photo of that same person now wearing the outfit from image 2. "
      + `${PHOTO_EDIT_IDENTITY_BLOCK} `
      + `${POSE_LOCK} `
      + "Copy style, color, fabric, cut, patterns and details from the garment reference. "
      + "Do NOT output a collage, split screen, diptych, or side-by-side comparison. "
      + "Do NOT show both source images in the result — only the dressed person."
    );
    if (userPrompt) p += ` Additional notes: ${userPrompt}`;
    return p;
  }
  if (!userPrompt) {
    return (
      `Change outfit only. ${PHOTO_EDIT_IDENTITY_BLOCK} ${POSE_LOCK} Photorealistic, natural lighting.`
    );
  }
  const prefix = {
    full: "Change the outfit only. Replace all clothing with: ",
    piece: "Add/replace this specific clothing piece only — keep everything else: ",
    color: "Keep the same outfit cut and pose but change the color/style to: ",
    tryon: "Show the same person in the same pose wearing: ",
  };
  return (
    `${prefix[changeType] || prefix.full}${userPrompt}. `
    + `${PHOTO_EDIT_IDENTITY_BLOCK} ${POSE_LOCK} Photorealistic, natural lighting.`
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

async function resolveStudioPhotoRefs(files, fields, maxRefs = 4) {
  const primary = (await resolveImageRef(files, fields, "photo", "photo_url"))
    || (await resolveImageRef(files, fields, "image", "image_url"));
  const refs = [];
  for (let i = 1; i <= maxRefs; i += 1) {
    const ref = await resolveImageRef(files, fields, `image_${i}`, `image_${i}_url`);
    if (ref) refs.push(ref);
  }
  return { primary, refs };
}

function buildStudioMultiImageBundle(fields, urls, userPrompt) {
  const all = (urls || []).filter(Boolean).slice(0, 5);
  if (all.length < 2) {
    const err = new Error("Combinação multi-imagem exige pelo menos 2 fotos.");
    err.status = 400;
    throw err;
  }

  let instruction = String(userPrompt || "").trim();
  if (!instruction) {
    instruction = "Place all reference subjects together in one natural photorealistic photograph.";
  } else if (all.length === 2 && instruction.length < 40) {
    instruction = (
      `${instruction}. `
      + "Both people together in one photo, full-size, same scale, side by side, "
      + "both faces sharp and clearly visible, photorealistic."
    );
  }

  let promptFinal = all.length === 2
    ? `${buildStudioDualPersonBlock()}\n\n${buildStudioMultiCombineBlock(2)}`
    : buildStudioMultiCombineBlock(all.length);
  promptFinal = `${promptFinal}\n\nScene / user request: ${instruction}`;
  promptFinal = appendPhotoEditIdentity(promptFinal);
  promptFinal = finalizeImagePrompt(promptFinal, {
    modelKey: "pro",
    hasPersonPhoto: true,
    photoEdit: true,
  });

  const aspectRaw = text(fields, "aspect_ratio", "1:1").trim().toLowerCase();
  let aspectRatio = "match_input_image";
  if (aspectRaw && !["match", "match_input_image", "original"].includes(aspectRaw)) {
    const normalized = normalizeRatio(aspectRaw, "pro");
    if (FLUX_SUPPORTED.has(normalized)) aspectRatio = normalized;
  }

  const input = {
    prompt: promptFinal,
    images: all,
    aspect_ratio: aspectRatio,
    disable_safety_checker: true,
    go_fast: false,
    output_format: "jpg",
    output_quality: 95,
    megapixels: 1,
  };
  const aspectHint = aspectRatio === "match_input_image" ? "3:4" : aspectRatio;
  input.prompt = appendAspectOutputInstruction(input.prompt, aspectHint);

  return {
    input,
    prompt: promptFinal,
    aspectRatio: aspectHint,
    modelId: MODELS.pro,
    modelUsed: "FLUX Klein · multi-ref",
  };
}

async function imageInput(fields, files, modelKey, prompt, opts = {}) {
  let primary = opts.preparedImage
    || (await resolveImageRef(files, fields, "photo", "photo_url"))
    || (await resolveImageRef(files, fields, "image", "image_url"));
  let aspectRatio = normalizeRatio(text(fields, "aspect_ratio", "1:1"), modelKey);
  if (primary && modelKey === "standard" && MATCH_ASPECT.has(aspectRatio)) {
    aspectRatio = await detectNearestGrokAspect(primary);
  }
  if (
    primary
    && !opts.preparedImage
    && modelKey === "standard"
    && aspectRatio
    && !MATCH_ASPECT.has(aspectRatio)
  ) {
    const position = opts.poster && !opts.posterFood ? "bottom" : (opts.subjectPosition || "centre");
    primary = await fitImageRefToAspect(primary, aspectRatio, { position });
  }
  const input = {
    prompt: finalizeImagePrompt(prompt, {
      modelKey,
      posterFood: opts.posterFood,
      poster: opts.poster,
      hasPersonPhoto: opts.hasPersonPhoto ?? Boolean(primary && !opts.posterFood),
      photoEdit: Boolean(opts.photoEdit && primary),
      artisticPhotoEdit: Boolean(opts.artisticPhotoEdit && primary),
      artisticTextOnly: Boolean(opts.artisticTextOnly && !primary),
    }),
    aspect_ratio: aspectRatio,
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
  if (modelKey === "kontext" || modelKey === "artistic" || modelKey === "pro") {
    if (opts.photography || opts.photoEdit || opts.artisticPhotoEdit) {
      input.disable_safety_checker = true;
    }
  }
  if (primary) {
    if (modelKey === "standard" || modelKey === "video") input.image = primary;
    else if (modelKey === "kontext") input.input_image = primary;
    else if (modelKey === "qwen") input.image = [primary];
    else input.images = [primary];
  }
  if (opts.experimental && modelKey === "qwen" && !input.image) {
    const err = new Error("Envia uma foto válida (JPEG, PNG ou WEBP).");
    err.status = 400;
    throw err;
  }
  if (input.aspect_ratio) {
    input.prompt = appendAspectOutputInstruction(input.prompt, input.aspect_ratio);
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
  if (modelKey === "pro") {
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
    const wantsImprove = truthyField(fields, "improve_prompt");
    const wantsHd = truthyField(fields, "hd_quality");
    if (wantsImprove) {
      prompt = await improvePrompt(prompt, lang, {});
    }
    if (wantsHd) {
      prompt += "\n\nUltra high detail, sharp focus, professional photography quality, 8K clarity, refined textures.";
    }
    const surcharges = getSurcharges(region);
    let imgCost = applyGenerationSurcharges(CREDIT.image, surcharges, {
      improvePrompt: wantsImprove,
      hdQuality: wantsHd,
      hdMode: "image",
    });
    const input = await imageInput(fields, files, "standard", prompt);
    return submitBillableGeneration(req, fields, {
      cost: imgCost,
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
    let prompt = text(fields, "prompt", "professional photo edit, preserve identity");
    const lang = text(fields, "lang", "en").slice(0, 2);
    const surcharges = getSurcharges(region);
    let editCost = CREDIT.edit;
    if (truthyField(fields, "improve_prompt")) {
      prompt = await improvePrompt(prompt, lang, { tool: "edit" });
      editCost += surcharges.enhancePrompt ?? 5;
    }
    const { primary, refs } = await resolveStudioPhotoRefs(files, fields);
    if (refs.length > 0) {
      if (!primary) {
        const err = new Error("Envia uma foto principal e pelo menos uma referência.");
        err.status = 400;
        throw err;
      }
      const bundle = buildStudioMultiImageBundle(fields, [primary, ...refs], prompt);
      return submitBillableGeneration(req, fields, {
        cost: editCost,
        type: "image",
        modelId: bundle.modelId,
        input: bundle.input,
        prompt: bundle.prompt,
        aspectRatio: bundle.aspectRatio,
        modelUsed: bundle.modelUsed,
        spendDescription: "Estúdio: editar foto (multi-ref)",
      });
    }
    const input = await imageInput(fields, files, "standard", prompt);
    return submitBillableGeneration(req, fields, {
      cost: editCost,
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
      prompt = upgradePadraoPrompt(padrao.prompt.replace(/\[subject\]/gi, subject));
      if (extra) prompt = `${prompt}\n\n${extra}`;
    } else {
      prompt = `Apply the ${styleId || "editorial"} style to ${subject}. Preserve identity, face, pose and expression. ${extra}`;
    }
    const input = await imageInput(fields, files, "standard", appendPhotoEditIdentity(prompt));
    const fluxFallbackInput = await buildFluxEasyFallbackInput(input, prompt);
    return submitBillableGeneration(req, fields, {
      cost: CREDIT.easy,
      type: "easy",
      modelId: MODELS.standard,
      input,
      prompt,
      aspectRatio: input.aspect_ratio,
      modelUsed: MODELS.standard,
      spendDescription: "Estúdio: estilo pronto",
      fallbackImageUrl: input.image || null,
      fallbackPrompt: input.prompt || prompt,
      fluxFallbackInput,
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
      if (intensity < 34) {
        prompt += "\n\nApply a very subtle, gentle enhancement. Do not change apparent age or add facial lines.";
      } else if (intensity > 66) {
        prompt += "\n\nApply a stronger visible enhancement while strictly preserving identity and exact apparent age — never add wrinkles, aged texture, or make the subject look older.";
      }
    }
    prompt = appendProRetouchIdentity(prompt);
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

  if (path === "generate/artistic-studio") {
    const styleId = text(fields, "style_id", "").trim();
    const experimental = isArtisticExperimentalStyleId(styleId);
    let promptFinal = text(fields, "prompt_final", "").trim();
    if (!promptFinal) throw new Error("Prompt em falta.");
    const photoRef = await resolveImageRef(files, fields, "photo", "photo_url");
    const photoFieldPresent = Boolean(fileOf(files, "photo") || text(fields, "photo_url", "").trim());
    if (photoFieldPresent && !photoRef) {
      const err = new Error(
        "Não foi possível ler a foto. Usa JPEG, PNG ou WEBP (máx. 12 MB).",
      );
      err.status = 400;
      throw err;
    }
    const hasPhoto = Boolean(photoRef);
    const styleCat = text(fields, "style_cat", "").trim();
    const { modelKey, modelId, label: modelLabel } = resolveArtisticStudioModel({
      styleId,
      hasPhoto,
      styleCat,
    });
    const useQwenPhoto = modelKey === "qwen";
    const input = await imageInput(fields, files, modelKey, promptFinal, {
      experimental: experimental || useQwenPhoto,
      photoEdit: hasPhoto,
      artisticPhotoEdit: hasPhoto,
      artisticTextOnly: !hasPhoto,
    });
    if (modelKey === "kontext" && hasPhoto) {
      input.aspect_ratio = "match_input_image";
      input.output_format = "jpg";
      input.safety_tolerance = 2;
    }
    let effects = {};
    try {
      const rawFx = text(fields, "effects_json", "{}");
      effects = typeof rawFx === "string" ? JSON.parse(rawFx) : rawFx;
    } catch {
      effects = {};
    }
    const artisticCost = CREDIT.artistic + computeArtisticEffectSurcharge(effects, region);
    return submitBillableGeneration(req, fields, {
      cost: artisticCost,
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

    const textManifest = buildPosterTextManifest(placeholders);
    if (textManifest) prompt = `${prompt}\n\n${textManifest}`;

    const selected = text(fields, "model_key", "grok");
    const perImage = selected === "gpt_image" ? CREDIT.posterPremium : selected === "flux2" ? CREDIT.posterPro : CREDIT.posterFast;
    const count = Math.max(1, Math.min(Number(text(fields, "num_outputs", 1)) || 1, 4));
    const templateId = text(fields, "template_id", "");
    const variantKey = text(fields, "variant_key", "classic");
    const templateCategory = text(fields, "template_category", "").trim().toLowerCase();
    const { user: posterUser } = resolveSessionUser(req);
    let posterSubscriber = false;
    if (posterUser?.id && storageEnabled()) {
      const pu = await getUserById(posterUser.id);
      posterSubscriber = Boolean(pu?.subscription?.active);
    }
    const tplAccess = getPosterTemplateById(templateId, { subscriberActive: posterSubscriber });
    if (tplAccess?.subscriber_only && tplAccess?.locked) {
      const err = new Error("Este template é exclusivo do plano Creator Mensal (€14/mês).");
      err.status = 403;
      throw err;
    }
    const posterFood = templateCategory === "food" || String(templateId).startsWith("food_");
    const photoRef = await resolveImageRef(files, fields, "photo", "photo_url");
    const logoRef = await resolveImageRef(files, fields, "logo", "logo_url");
    const hasPhoto = Boolean(photoRef || logoRef);
    const aspectRatio = normalizeRatio(text(fields, "aspect_ratio", "4:5"), "standard");

    const logoInstr = buildPosterLogoInstruction(Boolean(logoRef), Boolean(photoRef));
    if (logoInstr) prompt = `${prompt}\n\n${logoInstr}`;
    prompt = `${prompt}\n\n${POSTER_FULL_BLEED_GUARD}`;

    const requiresDualPhoto = truthyField(fields, "requires_dual_photo");
    const secondPersonRef = await resolveImageRef(files, fields, "image_1", "image_1_url");

    const igRefTpl = isIgRefPosterTemplate(templateId) ? getIgRefTemplate(templateId) : null;
    const igRefDual = Boolean(igRefTpl && (requiresDualPhoto || igRefTpl.requiresDualPhoto));
    const igRefPhotosReady = Boolean(
      igRefTpl
      && photoRef
      && (!igRefDual || secondPersonRef),
    );
    const igRefUsePdfEngine = Boolean(
      igRefPhotosReady
      && (selected === "flux2" || selected === "grok"),
    );
    if (igRefUsePdfEngine) {
      const igGen = buildIgRefPosterGeneration({
        templateId,
        variantKey,
        placeholders,
        promptFinal: prompt,
        requiresDualPhoto: igRefDual,
        photoRef,
        secondPersonRef,
        selected,
      });
      if (igGen) {
        if (igGen.engine === "flux") {
          igGen.input.prompt = finalizeImagePrompt(igGen.input.prompt, {
            modelKey: "pro",
            poster: true,
            hasPersonPhoto: true,
            photoEdit: true,
          });
          igGen.input.prompt = appendAspectOutputInstruction(
            igGen.input.prompt,
            igGen.input.aspect_ratio,
          );
        }
        const igPerImage = igRefDual
          ? (selected === "grok" ? CREDIT.posterFast : CREDIT.posterPro)
          : (selected === "flux2" ? CREDIT.posterPro : CREDIT.posterFast);
        const igCost = igPerImage * count;
        return submitBillableGeneration(req, fields, {
          cost: igCost,
          type: "poster",
          modelId: igGen.modelId,
          input: igGen.input,
          prompt: igGen.prompt,
          aspectRatio: igGen.aspectRatio,
          modelUsed: igGen.modelUsed,
          spendDescription: igRefDual
            ? (selected === "grok" ? "Pôster IG · 2 pessoas (económico)" : "Pôster IG · 2 pessoas")
            : (selected === "flux2" ? "Pôster IG · identidade" : "Pôster IG · identidade (económico)"),
        });
      }
    }

    if (requiresDualPhoto) {
      if (!photoRef || !secondPersonRef) {
        const err = new Error("Este estilo exige 2 fotos — uma de cada pessoa (1.ª principal, 2.ª referência).");
        err.status = 400;
        throw err;
      }
      prompt = `${buildStudioDualPersonBlock()}\n\n${prompt}`;
      prompt = appendPhotoEditIdentity(prompt);
      const dualAspectRaw = normalizeRatio(text(fields, "aspect_ratio", "4:5"), "pro");
      const dualRatio = FLUX_SUPPORTED.has(dualAspectRaw) ? dualAspectRaw : "3:4";
      const dualInput = {
        prompt: finalizeImagePrompt(prompt, {
          modelKey: "pro",
          poster: true,
          hasPersonPhoto: true,
          photoEdit: true,
        }),
        images: [photoRef, secondPersonRef],
        aspect_ratio: dualRatio,
        disable_safety_checker: true,
        go_fast: false,
        output_format: "jpg",
        output_quality: 95,
      };
      dualInput.prompt = appendAspectOutputInstruction(dualInput.prompt, dualRatio);
      const dualPerImage = selected === "gpt_image"
        ? CREDIT.posterPremium
        : (selected === "grok" ? CREDIT.posterFast : CREDIT.posterPro);
      const dualCost = dualPerImage * count;
      return submitBillableGeneration(req, fields, {
        cost: dualCost,
        type: "poster",
        modelId: MODELS.pro,
        input: dualInput,
        prompt,
        aspectRatio: dualRatio,
        modelUsed: "FLUX Klein · pôster 2 pessoas",
        spendDescription: "Pôster · 2 pessoas",
      });
    }

    const resolved = resolvePosterModel(selected);
    const cost = resolved.engine === "openai"
      ? posterHqPremiumCost(count)
      : perImage * count;

    if (resolved.engine === "openai") {
      const size = aspectToOpenAISize(aspectRatio);
      prompt = appendAspectOutputInstruction(prompt, openAISizeToAspectRatio(size));
      const preparedRef = await preparePosterReferenceForOpenAI(photoRef, logoRef, size, {
        subjectPosition: posterFood ? "centre" : "bottom",
      });
      const imageRef = preparedRef || photoRef || logoRef || null;
      const outputAspect = openAISizeToAspectRatio(size);
      const urls = [];
      let modelUsed = resolved.modelUsed;
      for (let i = 0; i < count; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const result = await generateOpenAIPosterImageDetailed(prompt, size, imageRef);
        urls.push(result.url);
        modelUsed = result.modelUsed || modelUsed;
      }
      return submitInstantPosterGeneration(req, fields, {
        cost,
        prompt,
        aspectRatio: outputAspect,
        modelUsed,
        urls,
      });
    }

    if (resolved.engine === "nano_banana") {
      const nbInput = buildNanoBananaPosterInput({
        prompt,
        aspectRatio,
        photoRef: photoRef || logoRef,
      });
      return submitBillableGeneration(req, fields, {
        cost,
        type: "poster",
        modelId: resolved.modelId,
        input: nbInput,
        prompt,
        aspectRatio: nbInput.aspect_ratio,
        modelUsed: resolved.modelUsed,
        spendDescription: "Pôster · média qualidade",
      });
    }

    const subjectPosition = posterFood ? "centre" : "bottom";
    const preparedRef = await preparePosterReference(photoRef, logoRef, aspectRatio, {
      subjectPosition,
    });
    const hasPersonPhoto = Boolean(photoRef) && !posterFood;
    const input = await imageInput(fields, files, "standard", prompt, {
      posterFood,
      poster: true,
      hasPersonPhoto,
      preparedImage: preparedRef || undefined,
      subjectPosition,
    });
    if (preparedRef) {
      input.image = preparedRef;
      delete input.images;
      delete input.input_image;
    }
    input.aspect_ratio = aspectRatio;

    const fluxFallbackInput = await buildFluxEasyFallbackInput(input, prompt);

    return submitBillableGeneration(req, fields, {
      cost,
      type: "poster",
      modelId: resolved.modelId || MODELS.standard,
      input,
      prompt,
      aspectRatio: input.aspect_ratio,
      modelUsed: resolved.modelUsed,
      spendDescription: "Pôster",
      fallbackImageUrl: input.image || photoRef || logoRef || null,
      fallbackPrompt: input.prompt || prompt,
      fluxFallbackInput,
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
    const nameA = text(fields, "ref_a_name", "Character 1");
    const nameB = text(fields, "ref_b_name", "Character 2");
    const descA = text(fields, "ref_a_desc", "");
    const descB = text(fields, "ref_b_desc", "");
    const roleA = text(fields, "ref_a_role", "primary");
    const roleB = text(fields, "ref_b_role", "support");
    const dualBlock = buildMangaDualCharacterBlock(nameA, nameB, descA, descB, roleA, roleB);
    promptFinal = `${dualBlock}\n\n${promptFinal}`;
    const imageCount = mangaImagesCount(fields, 1);
    const cost = qwenMangaPerImageCost(CREDIT) * imageCount;
    const aspect = normalizeRatio(text(fields, "aspect_ratio", "4:5"), "qwen");
    const input = {
      prompt: finalizeImagePrompt(promptFinal, { modelKey: "qwen", hasPersonPhoto: true }),
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
      spendDescription: `MANGA STUDIO · interação (2 refs) · ${imageCount} imagem${imageCount !== 1 ? "s" : ""}`,
    });
  }

  if (path === "generate/manga-panel" || path === "generate/manga-page" || path === "generate/manga-chapter") {
    let promptFinal = text(fields, "prompt_final", "").trim();
    if (!promptFinal) throw new Error("Prompt em falta.");
    const generationMode = text(fields, "generation_mode", "").trim();
    const panelCountField = parseInt(text(fields, "panel_count", "0"), 10) || 0;
    const isComicSheet = path === "generate/manga-page" || generationMode === "comic_sheet";
    if (isComicSheet) {
      const sheetBlock = buildMangaComicSheetBlock(panelCountField || 4);
      promptFinal = `${sheetBlock}\n\n${promptFinal}`;
    }
    const photoAEarly = await resolveImageRef(files, fields, "photo", "photo_url");
    const photoBEarly = await resolveImageRef(files, fields, "photo_b", "photo_b_url");
    if (photoAEarly && photoBEarly) {
      const nameA = text(fields, "ref_a_name", "Character 1");
      const nameB = text(fields, "ref_b_name", "Character 2");
      const descA = text(fields, "ref_a_desc", "");
      const descB = text(fields, "ref_b_desc", "");
      const roleA = text(fields, "ref_a_role", "primary");
      const roleB = text(fields, "ref_b_role", "support");
      const dualBlock = buildMangaDualCharacterBlock(nameA, nameB, descA, descB, roleA, roleB);
      promptFinal = `${dualBlock}\n\n${promptFinal}`;
      const imageCount = mangaImagesCount(fields, isComicSheet ? 1 : 1);
      const cost = qwenMangaPerImageCost(CREDIT) * imageCount;
      // Comic sheets force portrait 3:4 (standard manga page) so the AI lays out vertical panels.
      const requestedAspect = text(fields, "aspect_ratio", isComicSheet ? "3:4" : "4:5");
      const aspect = normalizeRatio(isComicSheet ? "3:4" : requestedAspect, "qwen");
      const input = {
        prompt: finalizeImagePrompt(promptFinal, { modelKey: "qwen", hasPersonPhoto: true }),
        image: [photoAEarly, photoBEarly],
        aspect_ratio: aspect === "match_input_image" ? "3:4" : aspect,
        go_fast: false,
        disable_safety_checker: true,
        output_format: "webp",
        output_quality: 95,
      };
      const mode = path.replace("generate/manga-", "");
      const spendLabels = {
        panel: "MANGA STUDIO · painel (2 refs)",
        page: "MANGA STUDIO · página (2 refs)",
        chapter: "MANGA STUDIO · capítulo (2 refs)",
      };
      return submitBillableGeneration(req, fields, {
        cost,
        type: "manga",
        modelId: QWEN_EDIT_MODEL,
        input,
        prompt: promptFinal,
        aspectRatio: input.aspect_ratio,
        modelUsed: "Qwen Image Edit 2511",
        spendDescription: `${spendLabels[mode] || "MANGA STUDIO · 2 refs"} · ${imageCount} imagem${imageCount !== 1 ? "s" : ""}`,
      });
    }
    const mode = path.replace("generate/manga-", "");
    const selected = text(fields, "model_key", "grok");
    const hasPhoto = Boolean(files.photo || text(fields, "photo_url", "").trim());
    const modelKey = normalizeMangaModelKey(selected);
    const imageCount = mangaImagesCount(fields, mode === "chapter" ? 4 : 1);
    const cost = mangaPerImageCost(CREDIT, modelKey) * imageCount;

    const aspectDefault = mode === "chapter" ? "9:16" : mode === "page" ? "3:4" : text(fields, "aspect_ratio", "4:5");
    const input = await imageInput(fields, files, modelKey, promptFinal);
    // Comic sheets always force portrait 3:4 regardless of user choice (manga page format).
    input.aspect_ratio = normalizeRatio(
      isComicSheet ? "3:4" : (text(fields, "aspect_ratio", "").trim() || aspectDefault),
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
      spendDescription: `${spendLabels[mode] || "MANGA STUDIO"} · ${imageCount} imagem${imageCount !== 1 ? "s" : ""}`,
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
    const {
      MODELS: VIDEO_MODELS,
      resolveToolId,
      computeVideoToolCost,
      buildWanFastInput,
      buildKlingInput,
      applyPresetPrefix,
    } = require("./lib/videoModels.cjs");
    const lang = text(fields, "lang", "en").slice(0, 2);
    const testMode = truthyField(fields, "test_mode");
    const preset = text(fields, "video_preset", "").trim();
    const rawTool = text(fields, "video_tool", "").trim();
    let prompt = text(fields, "prompt", "").trim();
    if (!prompt) throw new Error("Descreve o vídeo.");
    const photoRef = await resolveImageRef(files, fields, "photo", "photo_url");
    const refRef = await resolveImageRef(files, fields, "reference_image", "reference_image_url");
    const toolId = resolveToolId(rawTool || (photoRef ? "grok" : "kling_turbo"), {
      hasPhoto: Boolean(photoRef),
      preset,
    });
    if (preset) prompt = applyPresetPrefix(preset, prompt);
    const surcharges = getSurcharges(region);
    const duration = testMode ? 4 : Number(text(fields, "duration", "6"));
    const aspect = text(fields, "aspect_ratio", "16:9");
    let videoCost = computeVideoToolCost(CREDIT, surcharges, toolId, {
      duration,
      testMode,
      hasPhoto: Boolean(photoRef),
    });
    if (truthyField(fields, "improve_prompt") && !testMode) {
      prompt = await improvePrompt(prompt, lang, { tool: "video" });
      videoCost += surcharges.enhancePrompt ?? 5;
    }

    let modelId;
    let input;
    let aspectRatio = aspect;

    if (toolId === "grok") {
      modelId = VIDEO_MODELS.grok;
      input = await imageInput(fields, files, "video", prompt);
      aspectRatio = input.aspect_ratio;
    } else if (toolId === "kling_turbo" || toolId === "kling_elements") {
      if (toolId === "kling_elements" && !photoRef) {
        throw new Error("Envia a imagem principal.");
      }
      modelId = VIDEO_MODELS.kling_turbo;
      input = buildKlingInput({
        prompt,
        aspect,
        photo: photoRef,
        reference: refRef,
        duration,
        elements: toolId === "kling_elements",
      });
      aspectRatio = input.aspect_ratio || aspect;
    } else if (toolId === "wan_t2v_fast") {
      modelId = VIDEO_MODELS.wan_t2v_fast;
      input = buildWanFastInput({ prompt, aspect, isI2v: false });
    } else if (toolId === "wan_i2v_fast") {
      if (!photoRef) throw new Error("Envia uma imagem.");
      modelId = VIDEO_MODELS.wan_i2v_fast;
      input = buildWanFastInput({ prompt, aspect, photo: photoRef, reference: refRef, isI2v: true });
    } else {
      modelId = VIDEO_MODELS.kling_turbo;
      input = buildKlingInput({ prompt, aspect, photo: photoRef, reference: refRef, duration });
      aspectRatio = input.aspect_ratio || aspect;
    }

    return submitBillableGeneration(req, fields, {
      cost: videoCost,
      type: "video",
      modelId,
      input,
      prompt,
      aspectRatio,
      modelUsed: modelId,
      spendDescription: "Vídeo IA",
    });
  }

  if (path === "generate/video-edit") {
    const {
      applyPresetPrefix,
      MODELS: VIDEO_MODELS,
    } = require("./lib/videoModels.cjs");
    const lang = text(fields, "lang", "en").slice(0, 2);
    const preset = text(fields, "video_preset", "").trim();
    let rawPrompt = text(fields, "prompt", "").trim();
    if (truthyField(fields, "improve_prompt") && rawPrompt.length >= 3) {
      rawPrompt = await improvePrompt(rawPrompt, lang, {
        tool: "video_edit",
        video_preset: preset,
      });
    }
    if (preset && rawPrompt.length >= 3) {
      rawPrompt = applyPresetPrefix(preset, rawPrompt);
    }
    fields.prompt = rawPrompt;
    const { input, prompt } = await videoEditInput(fields, files);
    const surcharges = getSurcharges(region);
    const { validateVideoEditOptions, computeVideoEditCostForEngine } = require("./lib/videoEditPricing.cjs");
    const resOpts = validateVideoEditOptions({
      resolution: text(fields, "resolution", "original"),
      duration: text(fields, "duration", "6"),
    });
    let cost = computeVideoEditCostForEngine(CREDIT, surcharges, "wan_edit", resOpts);
    if (truthyField(fields, "improve_prompt")) {
      cost += surcharges.enhancePrompt ?? 5;
    }
    const modelId = VIDEO_MODELS.wan_edit;
    return submitBillableGeneration(req, fields, {
      cost,
      type: "video",
      modelId,
      input,
      prompt,
      aspectRatio: input.aspect_ratio,
      modelUsed: modelId,
      spendDescription: "Editor vídeo",
    });
  }

  if (path === "generate/video-extend") {
    const { MODELS: VIDEO_MODELS, buildVideoExtendPrompt } = require("./lib/videoModels.cjs");
    const lang = text(fields, "lang", "en").slice(0, 2);
    let rawPrompt = text(fields, "prompt", "").trim();
    if (rawPrompt.length < 3) throw new Error("Descreve o que acontece a seguir (mín. 3 caracteres).");
    if (truthyField(fields, "improve_prompt")) {
      rawPrompt = await improvePrompt(rawPrompt, lang, { tool: "video_extend" });
      fields.prompt = rawPrompt;
    }
    const { input, prompt } = await videoExtendInput(fields, files);
    const surcharges = getSurcharges(region);
    const { validateVideoExtendOptions, computeVideoExtendCost } = require("./lib/videoExtendPricing.cjs");
    const resOpts = validateVideoExtendOptions({
      resolution: text(fields, "resolution", "1080p"),
      duration: text(fields, "duration", "6"),
    });
    let cost = computeVideoExtendCost({
      resolution: resOpts.resolution,
      duration: resOpts.duration,
      regionId: region,
    });
    if (truthyField(fields, "improve_prompt")) {
      cost += surcharges.enhancePrompt ?? 5;
    }
    return submitBillableGeneration(req, fields, {
      cost,
      type: "video",
      modelId: VIDEO_MODELS.wan_extend,
      input,
      prompt,
      aspectRatio: "auto",
      modelUsed: VIDEO_MODELS.wan_extend,
      spendDescription: "Estender vídeo",
    });
  }

  if (path === "generate/motion-flyer") {
    const {
      runMotionFlyerPipeline,
      validateMotionFlyerDuration,
      computeMotionFlyerCost,
    } = require("./lib/motionFlyer/index.cjs");
    const { resolveMotionFlyerAspectRatio: detectAspect } = require("./lib/motionFlyer/motionFlyerAspect.cjs");
    const lang = text(fields, "lang", "pt").slice(0, 2);
    const duration = validateMotionFlyerDuration(text(fields, "duration", "10"));
    const imageUrls = await resolveMarketingVideoImages(files, fields, 1);
    if (!imageUrls.length) throw new Error("Envia o flyer (imagem).");

    const aspectMeta = await detectAspect({
      fields,
      files,
      imageUrls,
      fileOf,
      textFn: text,
    });

    const pipeline = await runMotionFlyerPipeline({
      imageUrls,
      duration,
      lang,
      aspectRatio: aspectMeta.aspectRatio,
      imageWidth: aspectMeta.width,
      imageHeight: aspectMeta.height,
    });

    const cost = computeMotionFlyerCost(region, duration);

    return submitBillableGeneration(req, fields, {
      cost,
      type: "motion_flyer",
      modelId: pipeline.modelId,
      input: pipeline.input,
      prompt: pipeline.prompt,
      aspectRatio: pipeline.aspectRatio || "9:16",
      modelUsed: pipeline.modelId,
      spendDescription: `Motion Flyer IA · ${duration}s · ${pipeline.aspectRatio || "9:16"}`,
      pendingMeta: {
        motion_flyer_duration: duration,
        motion_flyer_category: pipeline.analysis?.category || "",
        motion_flyer_aspect_ratio: pipeline.aspectRatio || aspectMeta.aspectRatio || "",
        motion_flyer_image_width: pipeline.imageWidth || aspectMeta.width || null,
        motion_flyer_image_height: pipeline.imageHeight || aspectMeta.height || null,
        motion_flyer_provider: pipeline.providerId,
        motion_flyer_prompt_id: pipeline.promptId || "",
      },
    });
  }

  if (path === "generate/marketing-video") {
    const {
      runMarketingVideoPipeline,
      validateMarketingVideoDuration,
      computeMarketingVideoCost,
    } = require("./lib/marketingVideo/index.cjs");
    const lang = text(fields, "lang", "pt").slice(0, 2);
    const mode = text(fields, "mode", "quick").trim();
    const manualCategory = mode === "quick" ? "" : text(fields, "category", "").trim();
    const visualStyle = mode === "quick" ? "random" : text(fields, "visual_style", "").trim();
    const formatId = text(fields, "format", "").trim();
    const duration = validateMarketingVideoDuration(text(fields, "duration", "15"));
    const imageUrls = await resolveMarketingVideoImages(files, fields, 5);
    if (!imageUrls.length) throw new Error("Envia pelo menos uma imagem principal.");

    const pipeline = await runMarketingVideoPipeline({
      imageUrls,
      duration,
      manualCategory,
      visualStyle,
      lang,
      formatId,
    });

    const cost = computeMarketingVideoCost(region, duration);

    return submitBillableGeneration(req, fields, {
      cost,
      type: "marketing_video",
      modelId: pipeline.modelId,
      input: pipeline.input,
      prompt: pipeline.prompt,
      aspectRatio: pipeline.aspectRatio || "9:16",
      modelUsed: pipeline.modelId,
      spendDescription: `Vídeo marketing IA · ${duration}s`,
      pendingMeta: {
        marketing_video_duration: duration,
        marketing_video_category: pipeline.analysis?.category || manualCategory,
        marketing_video_visual_style: pipeline.visualStyleId || visualStyle || "",
        marketing_video_format: formatId || "",
        marketing_video_provider: pipeline.providerId,
        marketing_video_image_count: imageUrls.length,
        marketing_video_mode: mode,
      },
    });
  }

  if (path === "tools/bg-remove") {
    const { buildBgScenePrompt, parseBgRemoveFields } = require("./lib/bgRemove.cjs");
    const image = await resolveImageRef(files, fields, "photo", "photo_url");
    if (!image) {
      const err = new Error("Envia uma foto (JPEG, PNG ou WEBP).");
      err.status = 400;
      throw err;
    }
    const { bgMode, sceneKey, bgPrompt, keepShadow, refineHair, solidColor } = parseBgRemoveFields(
      text,
      fields,
    );

    if (bgMode === "transparent" || bgMode === "solid") {
      const spend =
        bgMode === "solid"
          ? `Remover fundo (cor sólida ${solidColor})`
          : "Remover fundo (transparente)";
      return submitBillableGeneration(req, fields, {
        cost: CREDIT.bgRemove,
        type: "image",
        modelId: MODELS.bg_remove,
        input: { image },
        prompt: spend,
        spendDescription: "Remover fundo",
      });
    }

    if (bgMode !== "scene" && bgMode !== "custom") {
      const err = new Error("Modo de fundo inválido.");
      err.status = 400;
      throw err;
    }
    if (bgMode === "custom" && bgPrompt.length < 4) {
      const err = new Error("Descreve o fundo (mín. 4 caracteres).");
      err.status = 400;
      throw err;
    }

    const prompt = buildBgScenePrompt({
      bgMode,
      sceneKey,
      bgPrompt,
      keepShadow,
      refineHair,
    });

    return submitBillableGeneration(req, fields, {
      cost: CREDIT.bgRemoveScene,
      type: "image",
      modelId: MODELS.kontext,
      input: {
        input_image: image,
        prompt,
        aspect_ratio: "match_input_image",
        output_format: "jpg",
        safety_tolerance: 2,
      },
      prompt,
      aspectRatio: "match_input_image",
      modelUsed: MODELS.kontext,
      spendDescription: bgMode === "scene" ? "Remover fundo · cena" : "Remover fundo · personalizado",
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
    const level = text(fields, "level", "medio");
    const restoreCost = restoreCostForLevel(CREDIT, level);
    return submitBillableGeneration(req, fields, {
      cost: restoreCost,
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
    const mode = text(fields, "mode", "normal").trim().toLowerCase();

    if (mode === "fashion") {
      if (!person || !garment) {
        const err = new Error("Modo Fashion: envia foto da pessoa e foto da roupa.");
        err.status = 400;
        throw err;
      }
      const result = await generateFashionClothesImage(person, garment);
      return submitInstantPosterGeneration(req, fields, {
        cost: CREDIT.clothes,
        prompt: result.prompt,
        aspectRatio: result.aspectRatio || "4:5",
        modelUsed: result.modelUsed,
        urls: [result.url],
        type: "clothes",
        spendDescription: "Trocar roupa · Modo Fashion",
      });
    }

    const hasGarment = Boolean(person && garment);
    const prompt = buildClothesPrompt(fields, hasGarment);
    const input = { prompt, aspect_ratio: "match_input_image" };
    let modelId = MODELS.standard;
    let modelUsed = MODELS.standard;

    if (hasGarment) {
      input.images = [person, garment];
      modelId = MODELS.pro;
      modelUsed = MODELS.pro;
    } else if (person) {
      input.image = person;
    }

    return submitBillableGeneration(req, fields, {
      cost: CREDIT.clothes,
      type: "image",
      modelId,
      input,
      prompt,
      modelUsed,
      spendDescription: "Trocar roupa",
    });
  }

  if (path === "tools/inpaint") {
    const image = await resolveImageRef(files, fields, "photo", "photo_url");
    const mask = await resolveImageRef(files, fields, "mask", "mask_url");
    let prompt = text(fields, "prompt", "background");
    const lang = text(fields, "lang", "en").slice(0, 2);
    const surcharges = getSurcharges(region);
    let inpaintCost = CREDIT.inpaint;
    if (truthyField(fields, "improve_prompt")) {
      prompt = await improvePrompt(prompt, lang, { tool: "inpaint" });
      inpaintCost += surcharges.enhancePrompt ?? 5;
    }
    const input = {
      image,
      mask,
      prompt,
      output_format: "jpg",
    };
    return submitBillableGeneration(req, fields, {
      cost: inpaintCost,
      type: "image",
      modelId: MODELS.inpaint,
      input,
      prompt,
      spendDescription: "Inpaint",
    });
  }

  if (path === "stripe/checkout") {
    const { user: checkoutUser, isLocal: checkoutLocal } = resolveSessionUser(req);
    if (!checkoutUser || checkoutLocal) {
      const err = new Error("Inicia sessão para comprar créditos.");
      err.status = 401;
      throw err;
    }
    const wallet = text(fields, "wallet", "standard");
    const packageId = text(fields, "package", wallet === "premium" ? "hq_250" : wallet === "subscription" ? CREATOR_PLAN_ID : "starter");
    const customCreditsRaw = Number(text(fields, "custom_credits", 0));
    const region = regionFromRequest(req, fields);
    const cfg = getRegionConfig(region);

    if (wallet === "subscription" || packageId === CREATOR_PLAN_ID) {
      const subPlan = getSubscriptionPlan(region);
      if (!subPlan) {
        const err = new Error("Plano mensal indisponível nesta região.");
        err.status = 400;
        throw err;
      }
      let origin = String(fields.origin || process.env.SITE_URL || "https://www.remakepix.com").replace(/\/$/, "");
      try {
        const u = new URL(origin);
        if (u.hostname.endsWith(".vercel.app") || u.hostname === "remakepix.com") {
          origin = "https://www.remakepix.com";
        }
      } catch {
        origin = "https://www.remakepix.com";
      }
      const stripe = stripeClient();
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        customer_email: checkoutUser.email || undefined,
        line_items: [{
          price_data: {
            currency: cfg.currency,
            unit_amount: subPlan.amount_cents,
            recurring: { interval: "month" },
            product_data: {
              name: `Remake Pixel — ${subPlan.name}`,
              description: subPlan.tagline || `${subPlan.credits_per_month} créditos/mês`,
            },
          },
          quantity: 1,
        }],
        metadata: {
          user_id: checkoutUser.id,
          package: CREATOR_PLAN_ID,
          wallet: "subscription",
          pricing_region: region,
        },
        subscription_data: {
          metadata: {
            user_id: checkoutUser.id,
            package: CREATOR_PLAN_ID,
            pricing_region: region,
          },
        },
        success_url: `${origin}/app/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}&wallet=subscription`,
        cancel_url: `${origin}/app/billing?checkout=cancel`,
      });
      return { checkout_url: session.url, pricing_region: region, wallet: "subscription" };
    }

    if (wallet === "premium") {
      const hqPkg = (cfg.premium_packages || {})[packageId];
      if (!hqPkg) {
        const err = new Error("Pacote HQ inválido.");
        err.status = 400;
        throw err;
      }
      const premiumCredits = Number(hqPkg.premium_credits) || 0;
      let origin = String(fields.origin || process.env.SITE_URL || "https://www.remakepix.com").replace(/\/$/, "");
      try {
        const u = new URL(origin);
        if (u.hostname.endsWith(".vercel.app") || u.hostname === "remakepix.com") {
          origin = "https://www.remakepix.com";
        }
      } catch {
        origin = "https://www.remakepix.com";
      }
      const stripe = stripeClient();
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: checkoutUser.email || undefined,
        line_items: [{
          price_data: {
            currency: cfg.currency,
            unit_amount: hqPkg.amount_cents,
            product_data: {
              name: `Remake Pixel HQ — ${hqPkg.name} (${premiumCredits} créditos HQ)`,
              description: hqPkg.tagline || "Créditos para posters alta qualidade",
            },
          },
          quantity: 1,
        }],
        metadata: {
          user_id: checkoutUser.id,
          package: packageId,
          wallet: "premium",
          premium_credits: String(premiumCredits),
          pricing_region: region,
        },
        success_url: `${origin}/app/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}&wallet=premium`,
        cancel_url: `${origin}/app/billing?checkout=cancel`,
      });
      return { checkout_url: session.url, pricing_region: region, wallet: "premium" };
    }

    const pkg = cfg.packages[packageId];
    const hasCustom = Number.isFinite(customCreditsRaw) && customCreditsRaw > 0;
    if (!pkg && !hasCustom) {
      const err = new Error("Pacote inválido ou créditos personalizados em falta.");
      err.status = 400;
      throw err;
    }
    const meta = getPricingMeta();
    const minCredits = meta.minCustomCredits || 150;
    const credits = hasCustom ? Math.round(customCreditsRaw) : pkg.credits;
    if (credits < minCredits) {
      const err = new Error(`Mínimo de ${minCredits} créditos por compra.`);
      err.status = 400;
      throw err;
    }
    const amountCents = hasCustom ? customPurchaseAmountCents(credits) : pkg.amount_cents;
    const packageLabel = hasCustom ? "Custom" : pkg.name;
    const packageTagline = hasCustom ? `${credits} créditos personalizados` : pkg.tagline;
    const metadataPackage = hasCustom ? "custom" : packageId;
    let origin = String(fields.origin || process.env.SITE_URL || "https://www.remakepix.com").replace(/\/$/, "");
    try {
      const u = new URL(origin);
      if (u.hostname.endsWith(".vercel.app") || u.hostname === "remakepix.com") {
        origin = "https://www.remakepix.com";
      }
    } catch {
      origin = "https://www.remakepix.com";
    }
    const stripe = stripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: checkoutUser.email || undefined,
      line_items: [{
        price_data: {
          currency: cfg.currency,
          unit_amount: amountCents,
          product_data: {
            name: `Remake Pixel — ${packageLabel} (${credits} créditos)`,
            description: packageTagline,
          },
        },
        quantity: 1,
      }],
      metadata: {
        user_id: checkoutUser.id,
        package: metadataPackage,
        credits: String(credits),
        pricing_region: region,
      },
      success_url: `${origin}/app/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/app/billing?checkout=cancel`,
    });
    return { checkout_url: session.url, pricing_region: region };
  }

  if (path === "stripe/portal") {
    const { user: portalUser, isLocal: portalLocal } = resolveSessionUser(req);
    if (!portalUser || portalLocal) {
      const err = new Error("Inicia sessão para gerir a subscrição.");
      err.status = 401;
      throw err;
    }
    const dbUser = await getUserById(portalUser.id);
    if (!dbUser?.subscription?.can_manage) {
      const err = new Error("Sem subscrição activa para gerir.");
      err.status = 400;
      throw err;
    }
    const { getDb } = require("./lib/mongo.cjs");
    const db = await getDb();
    const raw = await db.collection("users").findOne(
      { id: portalUser.id },
      { projection: { stripe_customer_id: 1 } },
    );
    const customerId = raw?.stripe_customer_id;
    if (!customerId) {
      const err = new Error("Cliente Stripe em falta.");
      err.status = 400;
      throw err;
    }
    let origin = String(fields.origin || process.env.SITE_URL || "https://www.remakepix.com").replace(/\/$/, "");
    try {
      const u = new URL(origin);
      if (u.hostname.endsWith(".vercel.app") || u.hostname === "remakepix.com") {
        origin = "https://www.remakepix.com";
      }
    } catch {
      origin = "https://www.remakepix.com";
    }
    const stripe = stripeClient();
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/app/billing`,
    });
    return { portal_url: portal.url };
  }

  const err = new Error("Endpoint não encontrado.");
  err.status = 404;
  throw err;
}

async function handlePath(path, req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    if (path.startsWith("admin/") && ["GET", "POST", "PATCH", "DELETE"].includes(req.method)) {
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
      const { user } = resolveSessionUser(req);
      let subscriberActive = false;
      if (user?.id && storageEnabled()) {
        const dbUser = await getUserById(user.id);
        subscriberActive = Boolean(dbUser?.subscription?.active);
      }
      return json(res, 200, { templates: listPosterTemplates({ subscriberActive }) });
    }

    if (req.method === "GET" && path === "public/poster-models") {
      const country = countryFromRequest(req);
      const client = String(req.headers["x-pricing-region"] || "").trim();
      const region = resolvePricingRegion({ countryCode: country, clientRegion: client });
      const CREDIT = getCreditCostsForRegion(region);
      const { openaiConfigured } = require("./lib/openaiEnv.cjs");
      const openaiReady = openaiConfigured();
      const hqCost = getPosterHqPremiumCostPerOutput();
      return json(res, 200, {
        openai_ready: openaiReady,
        models: [
          {
            key: "grok",
            label: "Baixa qualidade",
            cost: CREDIT.posterFast,
            tier: "fast",
            wallet: "standard",
            supports_photo: true,
            tag: "Rápido · económico",
            available: true,
          },
          {
            key: "flux2",
            label: "Média qualidade",
            cost: CREDIT.posterPro,
            tier: "pro",
            wallet: "standard",
            supports_photo: true,
            tag: "Foto-realista",
            available: true,
          },
          {
            key: "gpt_image",
            label: "Alta qualidade",
            cost: hqCost,
            tier: "premium",
            wallet: "premium",
            supports_photo: true,
            tag: "Texto nítido · máximo detalhe",
            available: openaiReady,
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
        surcharges: getSurcharges(region),
        pricing_meta: getPricingMeta(),
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
        premium_packages: getPremiumPackagesForRegion(region),
        subscription_plans: getSubscriptionPlansForRegion(region),
        poster_hq_cost: getPosterHqPremiumCostPerOutput(),
      });
    }

    if (req.method === "GET" && (path === "marketing-video/config" || path === "marketing-video/history")) {
      const country = countryFromRequest(req);
      const client = String(req.headers["x-pricing-region"] || "").trim();
      const region = resolvePricingRegion({ countryCode: country, clientRegion: client });
      const lang = String(req.headers["x-lang"] || req.headers["accept-language"] || "pt").slice(0, 2);
      const mv = require("./lib/marketingVideo/index.cjs");
      if (path === "marketing-video/config") {
        return json(res, 200, {
          provider: mv.getMarketingVideoProvider(),
          durations: mv.ALLOWED_DURATIONS,
          duration: mv.MARKETING_VIDEO_DURATION,
          pricing: mv.getMarketingVideoPricingMap(region),
          max_images: 5,
          aspect_ratio: "9:16",
          default_format: mv.DEFAULT_FORMAT_ID,
          formats: mv.listMarketingVideoFormats(lang),
          categories: mv.listMarketingCategories(lang),
          visual_styles: mv.listVisualStyles(lang),
          prompt_variants: mv.allPromptEntries().length,
        });
      }
      const { user } = resolveSessionUser(req);
      const jobs = await mv.listMarketingVideoHistory(user?.id, { limit: 30 });
      return json(res, 200, { jobs });
    }

    if (req.method === "GET" && (path === "motion-flyer/config" || path === "motion-flyer/history")) {
      const country = countryFromRequest(req);
      const client = String(req.headers["x-pricing-region"] || "").trim();
      const region = resolvePricingRegion({ countryCode: country, clientRegion: client });
      const lang = String(req.headers["x-lang"] || req.headers["accept-language"] || "pt").slice(0, 2);
      const mf = require("./lib/motionFlyer/index.cjs");
      if (path === "motion-flyer/config") {
        return json(res, 200, {
          provider: mf.getMotionFlyerProvider(),
          durations: mf.ALLOWED_DURATIONS,
          duration: mf.MOTION_FLYER_DURATION,
          pricing: mf.getMotionFlyerPricingMap(region),
          aspect_from_image: true,
          categories: mf.listMotionFlyerCategories(lang),
          prompt_variants: mf.allPromptEntries().length,
        });
      }
      const { user } = resolveSessionUser(req);
      const jobs = await mf.listMotionFlyerHistory(user?.id, { limit: 30 });
      return json(res, 200, { jobs });
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
      const wallet = session.metadata?.wallet || "standard";
      const packageId = session.metadata?.package;
      const pricingRegion = session.metadata?.pricing_region || "intl";

      if (session.mode === "subscription" || wallet === "subscription") {
        const auth = req.headers.authorization || "";
        const tm = auth.match(/^Bearer\s+(.+)$/i);
        const tokenUser = tm ? verifySessionToken(tm[1].trim()) : null;
        if (tokenUser?.id) {
          try {
            await activateSubscriptionFromCheckout(session);
            const u = await getUserById(tokenUser.id);
            return json(res, 200, {
              id: session.id,
              paid: true,
              wallet: "subscription",
              package: packageId || CREATOR_PLAN_ID,
              subscription: u?.subscription || null,
              subscription_credits: u?.subscription_credits ?? 0,
              total_standard_credits: u?.total_standard_credits ?? u?.credits ?? 0,
              pricing_region: pricingRegion,
            });
          } catch (claimErr) {
            return json(res, claimErr.status || 500, { detail: claimErr.message || "Erro ao activar subscrição." });
          }
        }
        return json(res, 200, {
          id: session.id,
          paid: session.payment_status === "paid",
          wallet: "subscription",
          package: packageId,
          pricing_region: pricingRegion,
        });
      }

      const paid = session.payment_status === "paid";
      const isPremium = wallet === "premium";
      const units = isPremium ? premiumCredits : credits;
      if (paid && units > 0) {
        const auth = req.headers.authorization || "";
        const tm = auth.match(/^Bearer\s+(.+)$/i);
        const tokenUser = tm ? verifySessionToken(tm[1].trim()) : null;
        if (tokenUser?.id) {
          const cfg = getRegionConfig(pricingRegion);
          const pkg = !isPremium && packageId && packageId !== "custom" ? cfg.packages[packageId] : null;
          const hqPkg = isPremium && packageId ? (cfg.premium_packages || {})[packageId] : null;
          const amount = pkg
            ? pkg.amount_cents / 100
            : hqPkg
              ? hqPkg.amount_cents / 100
              : typeof session.amount_total === "number"
                ? session.amount_total / 100
                : 0;
          const currency = cfg.currency || "eur";
          try {
            const fulfilled = await fulfillStripeCheckoutSession({
              userId: tokenUser.id,
              sessionId,
              packageId,
              credits,
              premiumCredits,
              wallet,
              amount,
              currency,
              pricingRegion,
            });
            if (fulfilled?.new_balance != null || fulfilled?.new_premium_balance != null) {
              return json(res, 200, {
                id: session.id,
                paid,
                package: packageId,
                wallet,
                credits: isPremium ? 0 : credits,
                premium_credits: isPremium ? premiumCredits : 0,
                pricing_region: pricingRegion,
                new_balance: fulfilled.new_balance,
                new_premium_balance: fulfilled.new_premium_balance,
                already_claimed: fulfilled.already_claimed,
              });
            }
          } catch (claimErr) {
            return json(res, claimErr.status || 500, { detail: claimErr.message || "Erro ao creditar compra." });
          }
        }
      }
      return json(res, 200, {
        id: session.id,
        paid,
        package: packageId,
        wallet,
        credits: isPremium ? 0 : credits,
        premium_credits: isPremium ? premiumCredits : 0,
        pricing_region: pricingRegion,
      });
    }

    if (req.method === "GET" && path === "auth/check-email") {
      const url = new URL(req.url, `https://${req.headers.host || "localhost"}`);
      const email = url.searchParams.get("email") || "";
      try {
        const out = await checkEmailRegistration(email);
        return json(res, 200, out);
      } catch (err) {
        return json(res, err.status || 500, { detail: err.message || "Erro." });
      }
    }

    if (req.method === "POST" && path === "auth/forgot-password") {
      try {
        const body = await readJsonRequestBody(req);
        const out = await requestPasswordReset(body, req);
        return json(res, 200, out);
      } catch (err) {
        return json(res, err.status || 500, {
          detail: err.message || "Erro.",
          code: err.code || undefined,
        });
      }
    }

    if (req.method === "POST" && path === "auth/reset-password") {
      try {
        const body = await readJsonRequestBody(req);
        await resetPasswordWithToken(body);
        return json(res, 200, { ok: true });
      } catch (err) {
        return json(res, err.status || 500, { detail: err.message || "Erro." });
      }
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
      await repairUserAccountIfNeeded(sessionUser.id);
      const dbUser = await getUserById(sessionUser.id);
      const user = dbUser || sessionUser;
      return json(res, 200, user);
    }

    if (req.method === "PATCH" && path === "me/notifications") {
      const auth = req.headers.authorization || "";
      const m = auth.match(/^Bearer\s+(.+)$/i);
      if (!m) return json(res, 401, { detail: "Não autenticado." });
      const token = m[1].trim();
      if (token.startsWith("local:")) {
        return json(res, 503, { detail: "Preferências requerem conta no servidor." });
      }
      const sessionUser = verifySessionToken(token);
      if (!sessionUser) return json(res, 401, { detail: "Sessão inválida ou expirada." });
      const body = await readJsonRequestBody(req);
      const patch = {};
      if (body?.email_notify_generations != null) {
        patch.email_notify_generations = Boolean(body.email_notify_generations);
      }
      if (!Object.keys(patch).length) {
        return json(res, 400, { detail: "Nada para actualizar." });
      }
      const { getDb } = require("./lib/mongo.cjs");
      const db = await getDb();
      await db.collection("users").updateOne({ id: sessionUser.id }, { $set: patch });
      await touchUser(sessionUser.id, req, { action: "notifications" });
      const dbUser = await getUserById(sessionUser.id);
      return json(res, 200, dbUser || sessionUser);
    }

    if (req.method === "POST" && path === "auth/google-callback") {
      return handleGoogleRedirectCallback(req, res);
    }

    if (req.method === "POST" && path === "blob/prepare") {
      return await routeBlobPrepare(req, res);
    }

    if (req.method === "POST" && path === "video/upload") {
      return await routeVideoUpload(req, res);
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
      const { runSupportChat, offlineReply } = require("./lib/supportAssistant.cjs");
      const msgs = Array.isArray(body?.messages) ? body.messages : [];
      if (token.startsWith("local:")) {
        const lastUser = [...msgs].reverse().find((m) => m?.role === "user");
        const lang = String(body?.lang || "pt").slice(0, 2);
        return json(res, 200, {
          reply: offlineReply({
            lang,
            user: { name: "Utilizador", credits: 0 },
            dbUser: null,
            userText: lastUser?.content || "",
          }),
          model: "offline-local",
          fallback: true,
        });
      }
      const sessionUser = verifySessionToken(token);
      if (!sessionUser) return json(res, 401, { detail: "Sessão inválida ou expirada." });
      try {
        const out = await runSupportChat({
          messages: msgs,
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
      const maxFileSize = path === "generate/video-edit" || path === "generate/video-extend"
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
      const isVideoRoute = String(pathFromRequest(req) || "").includes("video-edit")
        || String(pathFromRequest(req) || "").includes("video-extend");
      if (/FUNCTION_PAYLOAD_TOO_LARGE|Request Entity Too Large/i.test(msg)) {
        return json(res, 413, {
          detail: isVideoRoute
            ? "O vídeo ultrapassou o limite do servidor (Vercel). Aguarda o upload para a nuvem antes de Gerar, ou usa um clip mais curto."
            : "O pedido é demasiado grande para o servidor. Comprime a imagem ou ativa o upload em nuvem.",
        });
      }
      return json(res, 413, {
        detail: isVideoRoute
          ? "Vídeo muito grande. Máximo 50MB. Usa MP4 (H.264) ou MOV (ideal 2–10 s) ou recarrega para ativar o upload em nuvem."
          : "A imagem é demasiado grande para o servidor. Recarrega a página (Ctrl+F5) e tenta outra vez — o site comprime automaticamente antes de enviar.",
      });
    }
    return json(res, err.status || 500, {
      detail: err.message || "Erro no servidor de geração.",
      code: err.code || undefined,
      ...(err.payload && typeof err.payload === "object" ? err.payload : {}),
    });
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
