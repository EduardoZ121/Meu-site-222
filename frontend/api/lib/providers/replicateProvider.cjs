/** Replicate API — provider adapter (predictions). */

const PROVIDER_ID = "replicate";

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
  return replicateFetch(`https://api.replicate.com/v1/predictions/${id}`);
}

function isConfigured() {
  return Boolean(String(process.env.REPLICATE_API_TOKEN || "").trim());
}

/** Normalize Replicate prediction to shared job shape. */
function normalizeJobInfo(prediction) {
  if (!prediction) {
    return { status: "failed", output: null, error: "Empty prediction" };
  }
  const raw = String(prediction.status || "").toLowerCase();
  let status = "processing";
  if (raw === "succeeded") status = "succeeded";
  else if (raw === "failed" || raw === "canceled" || raw === "cancelled") status = "failed";
  else if (raw === "starting") status = "starting";
  return {
    status,
    output: prediction.output ?? null,
    error: prediction.error || (status === "failed" ? "Generation failed" : null),
    provider: PROVIDER_ID,
    raw_status: prediction.status,
  };
}

async function submitJob({ modelId, input }) {
  const prediction = await createPrediction(modelId, input);
  return {
    id: prediction.id,
    provider: PROVIDER_ID,
    raw: prediction,
  };
}

async function getJobStatus(jobId) {
  const prediction = await getPrediction(jobId);
  return normalizeJobInfo(prediction);
}

module.exports = {
  PROVIDER_ID,
  isConfigured,
  replicateFetch,
  createPrediction,
  getPrediction,
  normalizeJobInfo,
  submitJob,
  getJobStatus,
};
