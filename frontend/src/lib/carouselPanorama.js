/** Panoramic seamless Instagram carousel — one wide image split into vertical panels. */

const PANEL_POSITION = {
  0: "LEFT segment (start of the panorama)",
  middle: "CENTER segment (middle of the panorama)",
  last: "RIGHT segment (end of the panorama)",
};

function apiBase() {
  const raw = String(process.env.REACT_APP_BACKEND_URL || "").trim().replace(/\/$/, "");
  if (
    typeof window !== "undefined"
    && window.location?.protocol === "https:"
    && raw.startsWith("http:")
  ) {
    return "/api";
  }
  return raw ? `${raw}/api` : "/api";
}

export function parseAspectRatio(ratio = "4:5") {
  const m = String(ratio || "4:5").match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/);
  if (!m) return { w: 4, h: 5 };
  return { w: Number(m[1]), h: Number(m[2]) };
}

/** Best generation aspect for N panels of given panel ratio (model-specific). */
export function panoramicGenerationAspect(slideCount, panelAspect = "4:5", modelKey = "standard") {
  const { w, h } = parseAspectRatio(panelAspect);
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
  if (index === 0) return PANEL_POSITION[0];
  if (index === total - 1) return PANEL_POSITION.last;
  return PANEL_POSITION.middle;
}

export function buildPanoramicPrompt({
  campaignBrief = "",
  slides = [],
  styleSuffix = "",
  keepCharacter = true,
  keepLighting = true,
  keepPalette = true,
}) {
  const n = slides.length;
  const continuity = [];
  if (keepCharacter) continuity.push("ONE consistent main character/subject across the entire panorama");
  if (keepLighting) continuity.push("unified lighting and shadow direction");
  if (keepPalette) continuity.push("unified color palette and grading");

  const panelLines = slides.map((slide, i) => {
    const text = typeof slide === "string" ? slide : (slide?.text || "").trim();
    const role = typeof slide === "object" ? slide.role : "";
    const roleBit = role ? ` [${role}]` : "";
    return `Panel ${i + 1}/${n} — ${panelPositionLabel(i, n)}${roleBit}: ${text}`;
  });

  const parts = [
    "Seamless Instagram carousel — ONE single continuous horizontal ultra-wide photograph/composition.",
    `Divide mentally into exactly ${n} equal vertical panels (slides). The image must read as ONE unbroken panorama, not separate images.`,
    "Background, environment, gradients and set design connect perfectly across every panel boundary — zero seams, zero scene resets.",
    "Main subject MUST cross panel cuts naturally (body, limbs or props partially continue into adjacent panels).",
    "Editorial typography may split across panels (letters continuing from one panel to the next).",
    "Premium advertising campaign, cinematic, photorealistic, modern editorial layout.",
    "CRITICAL: Do NOT generate collage, grid, triptych frames, white gaps, borders or distinct cards per panel.",
  ];

  if (continuity.length) {
    parts.push(`Continuity: ${continuity.join("; ")}.`);
  }
  if (campaignBrief.trim()) {
    parts.push(`Campaign context: ${campaignBrief.trim()}`);
  }
  parts.push(...panelLines);
  if (styleSuffix.trim()) parts.push(styleSuffix.trim());
  parts.push("Output: one unified horizontal artwork only, ready to crop into equal vertical Instagram slides.");

  return parts.join(" ");
}

/** Load image via fetch→blob (evita CORS no canvas) com proxy same-origin como fallback. */
async function fetchPanoramaBlob(imageUrl) {
  try {
    const direct = await fetch(imageUrl, { mode: "cors", credentials: "omit" });
    if (direct.ok) return direct.blob();
  } catch {
    /* tenta proxy */
  }

  const headers = {};
  try {
    const token = localStorage.getItem("rp_token");
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    /* ignore */
  }

  const proxyUrl = `${apiBase()}/carousel/panorama-image?url=${encodeURIComponent(imageUrl)}`;
  const proxied = await fetch(proxyUrl, { credentials: "same-origin", headers });
  if (!proxied.ok) {
    let detail = "";
    try {
      const j = await proxied.json();
      detail = j?.detail || "";
    } catch {
      /* ignore */
    }
    throw new Error(
      detail
        || "Não foi possível carregar a panorâmica para dividir em slides. Tenta outra vez.",
    );
  }
  return proxied.blob();
}

function loadImageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Imagem panorâmica inválida ou corrompida."));
    };
    img.src = objectUrl;
  });
}

function centerCropRect(srcW, srcH, targetW, targetH) {
  const targetRatio = targetW / targetH;
  const srcRatio = srcW / srcH;
  let cropW = srcW;
  let cropH = srcH;
  if (srcRatio > targetRatio) {
    cropW = srcH * targetRatio;
  } else {
    cropH = srcW / targetRatio;
  }
  const x = (srcW - cropW) / 2;
  const y = (srcH - cropH) / 2;
  return { x, y, cropW, cropH };
}

/**
 * Split a wide panorama into N vertical slides, each cropped to panelAspect (e.g. 4:5).
 * @returns {Promise<string[]>} blob: URLs for each slide
 */
export async function splitPanoramaToSlides(imageUrl, slideCount, panelAspect = "4:5") {
  const n = Math.max(2, Math.min(10, slideCount));
  const blob = await fetchPanoramaBlob(imageUrl);
  const img = await loadImageFromBlob(blob);
  const { w: aw, h: ah } = parseAspectRatio(panelAspect);
  const sliceW = img.width / n;
  const urls = [];

  for (let i = 0; i < n; i += 1) {
    const sx = Math.round(i * sliceW);
    const sw = Math.round((i === n - 1 ? img.width : (i + 1) * sliceW) - sx);
    const { x, y, cropW, cropH } = centerCropRect(sw, img.height, aw, ah);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(aw * 80);
    canvas.height = Math.round(ah * 80);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("O browser não suporta canvas para dividir o carrossel.");

    try {
      ctx.drawImage(
        img,
        sx + x,
        y,
        cropW,
        cropH,
        0,
        0,
        canvas.width,
        canvas.height,
      );
    } catch (e) {
      throw new Error(
        e?.message?.includes("tainted")
          ? "Bloqueio de segurança ao cortar a imagem. Recarrega e tenta de novo."
          : `Falha ao cortar o painel ${i + 1}.`,
      );
    }

    // eslint-disable-next-line no-await-in-loop
    const blobUrl = await new Promise((resolve, reject) => {
      try {
        canvas.toBlob(
          (b) => {
            if (!b) {
              reject(new Error(`Falha ao exportar slide ${i + 1}.`));
              return;
            }
            resolve(URL.createObjectURL(b));
          },
          "image/jpeg",
          0.92,
        );
      } catch (e) {
        reject(new Error(`Falha ao exportar slide ${i + 1}: ${e?.message || "erro de canvas"}`));
      }
    });
    urls.push(blobUrl);
  }

  return urls;
}

export function revokePanoramaBlobUrls(urls) {
  (urls || []).forEach((u) => {
    if (typeof u === "string" && u.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(u);
      } catch {
        /* ignore */
      }
    }
  });
}
