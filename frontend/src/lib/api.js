import axios from "axios";

const BASE = process.env.REACT_APP_BACKEND_URL;
export const API = `${BASE}/api`;

export const api = axios.create({
  baseURL: API,
  timeout: 180000, // 3 min — image generation (Replicate Flux 2 Klein) can take 30–90s
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("rp_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("rp_token");
      localStorage.removeItem("rp_user");
    }
    return Promise.reject(err);
  }
);

/**
 * Poll a long-running prediction until it completes.
 *
 * The backend submits to Replicate and returns a `prediction_id` in ~1-2s.
 * This helper hits GET /predictions/{id} every `intervalMs` until the
 * server returns a terminal status ("succeeded" or "failed").
 *
 * @param {string} predictionId
 * @param {object} opts
 * @param {(elapsedSeconds: number) => void} opts.onTick — fired each poll
 * @param {number} opts.intervalMs — defaults to 2500
 * @param {number} opts.timeoutMs — defaults to 240000 (4 min)
 * @returns {Promise<{creation, new_balance}>}
 * @throws Error on failure or timeout. Backend has already refunded credits.
 */
export async function pollPrediction(predictionId, opts = {}) {
  const intervalMs = opts.intervalMs ?? 2500;
  const timeoutMs  = opts.timeoutMs  ?? 240000;
  const onTick     = opts.onTick;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    let res;
    try {
      res = await api.get(`/predictions/${predictionId}`);
    } catch (e) {
      // Network blip — wait then retry the poll
      await new Promise((r) => setTimeout(r, intervalMs));
      continue;
    }
    const data = res.data;
    if (data.status === "succeeded") return data;
    if (data.status === "failed") {
      const err = new Error(data.error || "Geração falhou.");
      err.new_balance = data.new_balance;
      throw err;
    }
    if (onTick) onTick(data.elapsed_seconds || Math.floor((Date.now() - start) / 1000));
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Tempo esgotado — a geração pode ainda estar em curso. Verifica a Galeria daqui a 1 min.");
}
