/**
 * Normaliza rácios da UI para valores aceites pela API.
 * A UI pode mostrar 4:5, 21:9, etc.; o envio usa o rácio suportado pelo modelo.
 */

const MATCH_SENTINELS = new Set(["match", "match_input_image", "original"]);

const UI_TO_QWEN = {
  "4:5": "3:4",
  "5:4": "4:3",
  "21:9": "16:9",
  "9:21": "9:16",
  "2:1": "16:9",
  "1:2": "9:16",
};

const UI_TO_STANDARD = {
  "4:5": "3:4",
  "5:4": "4:3",
  "21:9": "2:1",
  "9:21": "1:2",
};

const UI_TO_FLUX = {
  "4:5": "3:4",
  "5:4": "4:3",
  "2:1": "21:9",
  "1:2": "9:21",
};

const QWEN_OK = new Set(["1:1", "9:16", "4:3", "3:4", "match_input_image"]);
const STANDARD_OK = new Set(["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "2:1", "1:2"]);
const FLUX_OK = new Set(["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9", "9:21"]);

/**
 * @param {string} ratio
 * @param {{ model?: "qwen"|"standard"|"video"|"artistic"|"pro"|"kontext"|"flux", hasPhoto?: boolean }} [opts]
 */
export function apiAspectRatio(ratio = "1:1", opts = {}) {
  const { model = "standard", hasPhoto = false } = opts;
  const r = String(ratio ?? "").trim();

  if (!r || MATCH_SENTINELS.has(r)) {
    if (hasPhoto) return "match_input_image";
    if (model === "qwen") return "3:4";
    if (model === "artistic" || model === "pro" || model === "kontext") return "1:1";
    return "1:1";
  }

  if (model === "qwen") {
    if (QWEN_OK.has(r)) return r;
    return UI_TO_QWEN[r] || "3:4";
  }

  if (model === "standard" || model === "video") {
    if (STANDARD_OK.has(r)) return r;
    return UI_TO_STANDARD[r] || "1:1";
  }

  if (model === "artistic" || model === "pro" || model === "kontext") {
    if (MATCH_SENTINELS.has(r) || r === "match_input_image") return "match_input_image";
    if (FLUX_OK.has(r)) return r;
    return UI_TO_FLUX[r] || "1:1";
  }

  if (FLUX_OK.has(r)) return r;
  return UI_TO_FLUX[r] || "1:1";
}

/** @deprecated use apiAspectRatio(r, { model: "qwen" }) */
export function mangaApiAspect(ratio) {
  return apiAspectRatio(ratio, { model: "qwen" });
}
