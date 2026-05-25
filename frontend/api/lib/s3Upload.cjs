const crypto = require("crypto");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

function getS3Config() {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_S3_REGION || process.env.AWS_REGION || "eu-west-1";
  const cloudFront = String(process.env.AWS_CLOUDFRONT_DOMAIN || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "");
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!bucket || !accessKeyId || !secretAccessKey) return null;
  return { bucket, region, cloudFront, accessKeyId, secretAccessKey };
}

function isS3Configured() {
  return Boolean(getS3Config());
}

function publicUrlForKey(key) {
  const cfg = getS3Config();
  if (!cfg) return null;
  const safeKey = String(key).replace(/^\/+/, "");
  if (cfg.cloudFront) {
    return `https://${cfg.cloudFront}/${safeKey}`;
  }
  return `https://${cfg.bucket}.s3.${cfg.region}.amazonaws.com/${safeKey}`;
}

/** URLs públicas do bucket ou CloudFront (para Replicate). */
function isTrustedS3MediaUrl(raw) {
  const u = String(raw || "").trim();
  if (!u.startsWith("https://")) return false;
  const cfg = getS3Config();
  if (!cfg) return false;
  try {
    const host = new URL(u).hostname.toLowerCase();
    if (cfg.cloudFront && host === cfg.cloudFront.toLowerCase()) return true;
    if (host === `${cfg.bucket}.s3.${cfg.region}.amazonaws.com`.toLowerCase()) return true;
    if (host.startsWith(`${cfg.bucket.toLowerCase()}.s3.`) && host.endsWith(".amazonaws.com")) return true;
  } catch {
    return false;
  }
  return false;
}

function sanitizeFilename(name, fallback = "video.mp4") {
  let fn = String(name || fallback).replace(/[^\w.\-]+/g, "_").slice(0, 96);
  if (!/\.[a-z0-9]{2,5}$/i.test(fn)) fn += ".mp4";
  return fn;
}

function sanitizeImageFilename(name, fallback = "photo.jpg") {
  let fn = String(name || fallback).replace(/[^\w.\-]+/g, "_").slice(0, 96);
  if (!/\.[a-z0-9]{2,5}$/i.test(fn)) fn += ".jpg";
  return fn;
}

async function createVideoPresignedUpload({ filename, contentType, contentLength, userId }) {
  const cfg = getS3Config();
  if (!cfg) {
    const err = new Error("Upload S3 não configurado neste ambiente.");
    err.status = 503;
    throw err;
  }
  const size = Number(contentLength) || 0;
  if (size > MAX_VIDEO_BYTES) {
    const err = new Error("Vídeo demasiado grande (máx. 80 MB).");
    err.status = 413;
    throw err;
  }
  const ct = String(contentType || "video/mp4").toLowerCase();
  if (!ct.startsWith("video/") && ct !== "application/octet-stream") {
    const err = new Error("Formato inválido — usa MP4 ou MOV.");
    err.status = 400;
    throw err;
  }

  const safe = sanitizeFilename(filename);
  const uid = String(userId || "anon").replace(/[^\w-]/g, "").slice(0, 48) || "anon";
  const key = `rp/videos/${uid}/${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${safe}`;

  const client = new S3Client({
    region: cfg.region,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });

  const command = new PutObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
    ContentType: ct === "application/octet-stream" ? "video/mp4" : ct,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 900 });

  return {
    method: "PUT",
    uploadUrl,
    publicUrl: publicUrlForKey(key),
    key,
    headers: {
      "Content-Type": ct === "application/octet-stream" ? "video/mp4" : ct,
    },
    maxBytes: MAX_VIDEO_BYTES,
  };
}

async function createImagePresignedUpload({ filename, contentType, contentLength, userId }) {
  const cfg = getS3Config();
  if (!cfg) {
    const err = new Error("Upload S3 não configurado neste ambiente.");
    err.status = 503;
    throw err;
  }
  const size = Number(contentLength) || 0;
  if (size > MAX_IMAGE_BYTES) {
    const err = new Error("Imagem demasiado grande (máx. 12 MB).");
    err.status = 413;
    throw err;
  }
  const ct = String(contentType || "image/jpeg").toLowerCase();
  if (!ct.startsWith("image/") && ct !== "application/octet-stream") {
    const err = new Error("Formato inválido — usa JPEG ou PNG.");
    err.status = 400;
    throw err;
  }

  const safe = sanitizeImageFilename(filename);
  const uid = String(userId || "anon").replace(/[^\w-]/g, "").slice(0, 48) || "anon";
  const key = `rp/images/${uid}/${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${safe}`;

  const client = new S3Client({
    region: cfg.region,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });

  const resolvedCt = ct === "application/octet-stream" ? "image/jpeg" : ct;
  const command = new PutObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
    ContentType: resolvedCt,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 900 });

  return {
    method: "PUT",
    uploadUrl,
    publicUrl: publicUrlForKey(key),
    key,
    headers: { "Content-Type": resolvedCt },
    maxBytes: MAX_IMAGE_BYTES,
  };
}

module.exports = {
  MAX_VIDEO_BYTES,
  MAX_IMAGE_BYTES,
  getS3Config,
  isS3Configured,
  isTrustedS3MediaUrl,
  publicUrlForKey,
  createVideoPresignedUpload,
  createImagePresignedUpload,
};
