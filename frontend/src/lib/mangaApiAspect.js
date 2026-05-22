/** Ratios aceites pela API (Grok / Qwen). UI pode mostrar 4:5; envio usa 3:4. */

const API_ASPECT = new Set(["1:1", "9:16", "4:3", "3:4", "match_input_image"]);

const UI_TO_API = {
  "4:5": "3:4",
  "5:4": "4:3",
  "2:1": "16:9",
  "1:2": "9:16",
  "21:9": "16:9",
  "9:21": "9:16",
};

export function mangaApiAspect(ratio = "3:4") {
  const r = String(ratio || "3:4").trim();
  if (API_ASPECT.has(r)) return r;
  return UI_TO_API[r] || "3:4";
}
