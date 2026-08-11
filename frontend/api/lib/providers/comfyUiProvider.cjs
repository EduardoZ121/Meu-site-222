/**
 * Direct ComfyUI HTTP API — used by AI Lab on Vast.ai dedicated pods.
 * Docs: https://github.com/comfyanonymous/ComfyUI/wiki/API
 */
const crypto = require("crypto");

const PROVIDER_ID = "vast";
const RESOLVE_TTL_MS = 45_000;
let _resolved = null;
let _resolvedAt = 0;

function config() {
  const baseUrl = String(process.env.COMFYUI_BASE_URL || "").trim().replace(/\/$/, "");
  const instanceId = String(process.env.VAST_INSTANCE_ID || "").trim();
  const bearerToken = String(
    process.env.COMFYUI_BEARER_TOKEN || process.env.VAST_OPEN_BUTTON_TOKEN || "",
  ).trim();
  return { baseUrl, instanceId, bearerToken };
}

async function resolveConnection() {
  if (_resolved && Date.now() - _resolvedAt < RESOLVE_TTL_MS) return _resolved;

  const manual = config();
  let { baseUrl, bearerToken, instanceId } = manual;
  const apiKey = String(process.env.VAST_API_KEY || "").trim();

  if (apiKey && instanceId) {
    try {
      const res = await fetch(`https://console.vast.ai/api/v0/instances/${instanceId}/`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(20_000),
      });
      const data = await res.json().catch(() => ({}));
      const inst = data.instances || data;
      const hostPort = inst?.ports?.["8188/tcp"]?.[0]?.HostPort;
      const ip = inst?.public_ipaddr;
      if (ip && hostPort) {
        baseUrl = `http://${ip}:${hostPort}`;
      } else if (instanceId) {
        baseUrl = `https://${instanceId}-8188.proxy.vast.ai`;
      }
      if (inst?.jupyter_token) bearerToken = String(inst.jupyter_token);
    } catch {
      if (instanceId) baseUrl = `https://${instanceId}-8188.proxy.vast.ai`;
    }
  } else if (instanceId) {
    baseUrl = `https://${instanceId}-8188.proxy.vast.ai`;
  }

  _resolved = { baseUrl, bearerToken, instanceId };
  _resolvedAt = Date.now();
  return _resolved;
}

function vastTlsDispatcher() {
  if (vastTlsDispatcher._agent) return vastTlsDispatcher._agent;
  try {
    const { Agent } = require("undici");
    vastTlsDispatcher._agent = new Agent({ connect: { rejectUnauthorized: false } });
    return vastTlsDispatcher._agent;
  } catch {
    return undefined;
  }
}

function isConfigured() {
  const { baseUrl, instanceId } = config();
  if (baseUrl) return true;
  return Boolean(process.env.VAST_API_KEY && instanceId);
}

const FETCH_TIMEOUT_MS = 90_000;

async function comfyFetch(pathSuffix, options = {}) {
  const conn = await resolveConnection();
  let { baseUrl, bearerToken } = conn;
  if (!baseUrl) {
    const err = new Error("COMFYUI_BASE_URL / VAST_INSTANCE_ID not configured");
    err.status = 500;
    throw err;
  }

  const urls = [baseUrl];
  const proxyUrl = conn.instanceId
    ? `https://${conn.instanceId}-8188.proxy.vast.ai`
    : null;
  if (proxyUrl && proxyUrl !== baseUrl) urls.push(proxyUrl);

  let lastErr;
  for (const tryUrl of urls) {
    try {
      return await comfyFetchOnce(tryUrl, bearerToken, pathSuffix, options);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

async function comfyFetchOnce(baseUrl, bearerToken, pathSuffix, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (bearerToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${bearerToken}`;
  }
  const fetchOpts = {
    ...options,
    headers,
    signal: options.signal || AbortSignal.timeout(FETCH_TIMEOUT_MS),
  };
  let res;
  const tlsBypass = /\.proxy\.vast\.ai$/i.test(new URL(baseUrl).hostname);
  const prevTls = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  if (tlsBypass) process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  try {
    res = await fetch(`${baseUrl}${pathSuffix}`, fetchOpts);
  } finally {
    if (tlsBypass) {
      if (prevTls === undefined) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      else process.env.NODE_TLS_REJECT_UNAUTHORIZED = prevTls;
    }
  }
  const ct = String(res.headers.get("content-type") || "");
  const data = ct.includes("json")
    ? await res.json().catch(() => ({}))
    : await res.text().catch(() => "");
  if (!res.ok) {
    const msg = typeof data === "object" && data
      ? (data.error?.message || data.error || data.message || JSON.stringify(data).slice(0, 300))
      : String(data).slice(0, 200);
    const err = new Error(msg || `ComfyUI HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

function viewUrl(filename, subfolder = "", type = "output") {
  const baseUrl = _resolved?.baseUrl || config().baseUrl;
  const q = new URLSearchParams({
    filename,
    subfolder,
    type,
  });
  return `${baseUrl}/view?${q.toString()}`;
}

function extractHistoryImages(entry) {
  const urls = [];
  const outputs = entry?.outputs || {};
  for (const node of Object.values(outputs)) {
    for (const img of node?.images || []) {
      if (!img?.filename) continue;
      urls.push(viewUrl(img.filename, img.subfolder || "", img.type || "output"));
    }
  }
  return urls;
}

function queueHasPrompt(queuePayload, promptId) {
  const lists = [queuePayload?.queue_running, queuePayload?.queue_pending].filter(Array.isArray);
  for (const list of lists) {
    for (const item of list) {
      const id = item?.[1] ?? item?.prompt_id ?? item?.[3];
      if (id === promptId) return true;
    }
  }
  return false;
}

async function uploadImageFromDataUrl(dataUrl, filename = "input_ref.png") {
  const m = String(dataUrl || "").match(/^data:([^;]+);base64,(.+)$/);
  if (!m) {
    const err = new Error("Imagem inválida (data URL esperado).");
    err.status = 400;
    throw err;
  }
  const buf = Buffer.from(m[2], "base64");
  const form = new FormData();
  form.append("image", new Blob([buf], { type: m[1] }), filename);
  form.append("overwrite", "true");
  await comfyFetch("/upload/image", { method: "POST", body: form });
}

function pickModelList(nodeInfo, nodeName, field) {
  const list = nodeInfo?.[nodeName]?.input?.required?.[field]?.[0];
  return Array.isArray(list) ? list : [];
}

/** Live checkpoint / UNET lists from the running ComfyUI pod. */
async function listInstalledModels() {
  const [ckptInfo, unetInfo] = await Promise.all([
    comfyFetch("/object_info/CheckpointLoaderSimple").catch(() => ({})),
    comfyFetch("/object_info/UNETLoader").catch(() => ({})),
  ]);
  return {
    checkpoints: pickModelList(ckptInfo, "CheckpointLoaderSimple", "ckpt_name"),
    unets: pickModelList(unetInfo, "UNETLoader", "unet_name"),
  };
}

async function checkHealth() {
  if (!isConfigured()) {
    return {
      ok: false,
      configured: false,
      provider: PROVIDER_ID,
      message: "COMFYUI_BASE_URL em falta na Vercel",
    };
  }
  try {
    const conn = await resolveConnection();
    const stats = await comfyFetch("/system_stats");
    return {
      ok: true,
      configured: true,
      provider: PROVIDER_ID,
      instance_id: conn.instanceId || null,
      base_url: conn.baseUrl,
      message: "ComfyUI online",
      stats,
    };
  } catch (e) {
    return {
      ok: false,
      configured: true,
      provider: PROVIDER_ID,
      instance_id: config().instanceId || null,
      message: String(e.message || e).slice(0, 240),
    };
  }
}

async function submitRawJob({ workflow, imageDataUrl, imageName = "input_ref.png" }) {
  if (!workflow || typeof workflow !== "object") {
    const err = new Error("Workflow ComfyUI inválido.");
    err.status = 400;
    throw err;
  }
  if (imageDataUrl && String(imageDataUrl).startsWith("data:")) {
    await uploadImageFromDataUrl(imageDataUrl, imageName);
  }
  const clientId = crypto.randomUUID();
  const data = await comfyFetch("/prompt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow, client_id: clientId }),
  });
  if (!data?.prompt_id) {
    const err = new Error("ComfyUI não devolveu prompt_id.");
    err.status = 502;
    throw err;
  }
  return {
    id: data.prompt_id,
    provider: PROVIDER_ID,
    client_id: clientId,
    number: data.number,
  };
}

async function getJobStatus(promptId) {
  const id = String(promptId || "").trim();
  if (!id) {
    return { status: "failed", error: "job_id em falta", provider: PROVIDER_ID };
  }

  const history = await comfyFetch(`/history/${id}`).catch(() => ({}));
  const entry = history?.[id];
  if (entry) {
    const statusStr = entry.status?.status_str;
    if (statusStr === "error") {
      const msgs = entry.status?.messages;
      const errText = Array.isArray(msgs)
        ? msgs.map((m) => (Array.isArray(m) ? m.join(": ") : String(m))).join("; ")
        : "ComfyUI execution error";
      return {
        status: "failed",
        error: errText,
        provider: PROVIDER_ID,
        raw_status: statusStr,
      };
    }
    const urls = extractHistoryImages(entry);
    const started = entry.status?.messages?.find?.((m) => m?.[0] === "execution_start");
    const ended = entry.status?.messages?.find?.((m) => m?.[0] === "execution_success");
    let execution_time_ms = null;
    if (started?.[1]?.timestamp && ended?.[1]?.timestamp) {
      execution_time_ms = Math.max(0, ended[1].timestamp - started[1].timestamp);
    }
    return {
      status: "succeeded",
      output: urls.length ? urls : entry,
      provider: PROVIDER_ID,
      raw_status: "COMPLETED",
      execution_time_ms,
  };
  }

  const queue = await comfyFetch("/queue").catch(() => ({}));
  if (queueHasPrompt(queue, id)) {
    const pending = Array.isArray(queue.queue_pending) ? queue.queue_pending.length : 0;
    return {
      status: pending > 0 ? "starting" : "processing",
      provider: PROVIDER_ID,
      raw_status: pending > 0 ? "IN_QUEUE" : "RUNNING",
      queue_position: pending > 0 ? pending : null,
    };
  }

  return {
    status: "processing",
    provider: PROVIDER_ID,
    raw_status: "PENDING",
    status_text: "A aguardar ComfyUI…",
  };
}

function isComfyViewUrl(url) {
  try {
    const u = new URL(String(url));
    return /\/view$/i.test(u.pathname) && u.searchParams.has("filename");
  } catch {
    return false;
  }
}

/** Download ComfyUI /view output with Bearer auth (browser cannot load these URLs). */
async function downloadViewImage(viewUrl) {
  const conn = await resolveConnection();
  const u = new URL(viewUrl);
  const pathSuffix = `${u.pathname}${u.search}`;
  const candidates = [viewUrl];
  if (conn.baseUrl) candidates.push(`${conn.baseUrl}${pathSuffix}`);

  let lastErr;
  for (const tryUrl of [...new Set(candidates)]) {
    try {
      const headers = {};
      if (conn.bearerToken) headers.Authorization = `Bearer ${conn.bearerToken}`;
      const hostname = new URL(tryUrl).hostname;
      const tlsBypass = /\.proxy\.vast\.ai$/i.test(hostname);
      const prevTls = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      if (tlsBypass) process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
      let res;
      try {
        res = await fetch(tryUrl, {
          headers,
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });
      } finally {
        if (tlsBypass) {
          if (prevTls === undefined) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
          else process.env.NODE_TLS_REJECT_UNAUTHORIZED = prevTls;
        }
      }
      if (!res.ok) {
        lastErr = new Error(`ComfyUI view HTTP ${res.status}`);
        continue;
      }
      const ct = (res.headers.get("content-type") || "image/png").split(";")[0].trim();
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 128) {
        lastErr = new Error("ComfyUI view: imagem vazia");
        continue;
      }
      return { buf, contentType: ct };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("Falha ao descarregar imagem do ComfyUI");
}

/** Mirror pod /view URLs to permanent S3/Blob storage for browser display. */
async function mirrorOutputUrls(urls, opts = {}) {
  if (!Array.isArray(urls) || !urls.length) return [];
  const { mirrorUrlsToBlob } = require("../creationMedia.cjs");
  const prepared = [];
  for (const url of urls) {
    if (isComfyViewUrl(url)) {
      try {
        const { buf, contentType } = await downloadViewImage(url);
        prepared.push(`data:${contentType};base64,${buf.toString("base64")}`);
      } catch (e) {
        console.warn("[comfyUi] mirror download failed:", e?.message);
      }
    } else {
      prepared.push(url);
    }
  }
  if (!prepared.length) return [];
  return mirrorUrlsToBlob(prepared, opts);
}

module.exports = {
  PROVIDER_ID,
  config,
  resolveConnection,
  isConfigured,
  isComfyViewUrl,
  checkHealth,
  listInstalledModels,
  submitRawJob,
  getJobStatus,
  downloadViewImage,
  mirrorOutputUrls,
  loadWorkflowTemplate: require("./runpodProvider.cjs").loadWorkflowTemplate,
};
