/**
 * Collects manga-flow reference images and builds FormData + endpoint for generation.
 * Supports: 2 character refs → manga-interaction; single ref → manga-panel.
 */

function hasRef(node) {
  const d = node?.data;
  return Boolean(d?.refImage instanceof File || d?.refImageUrl);
}

function nodeLabel(node, fallback) {
  const d = node?.data || {};
  return (d.name && String(d.name).trim()) || fallback;
}

/** Stable order: canvas position (top-left first), then id. */
export function sortNodesForRefs(nodes) {
  return [...nodes].sort((a, b) => {
    const ay = a.position?.y ?? 0;
    const by = b.position?.y ?? 0;
    if (ay !== by) return ay - by;
    const ax = a.position?.x ?? 0;
    const bx = b.position?.x ?? 0;
    if (ax !== bx) return ax - bx;
    return String(a.id).localeCompare(String(b.id));
  });
}

export function collectMangaRefNodes(nodes) {
  const sorted = sortNodesForRefs(nodes);
  return {
    persons: sorted.filter((n) => n.type === "person" && hasRef(n)),
    scenarios: sorted.filter((n) => n.type === "scenario" && hasRef(n)),
    objects: sorted.filter((n) => n.type === "object" && hasRef(n)),
  };
}

/**
 * Resolve ref to File for multipart upload (blob URL or stored File).
 */
export async function resolveNodeRefFile(node, filenameBase = "ref") {
  const d = node?.data || {};
  if (d.refPersistUrl && typeof d.refPersistUrl === "string") {
    return { remoteUrl: d.refPersistUrl };
  }
  if (d.refImage instanceof File) return d.refImage;

  const url = d.refImageUrl;
  if (!url || typeof url !== "string") return null;

  if (url.startsWith("data:")) {
    const res = await fetch(url);
    const blob = await res.blob();
    const ext = (blob.type || "image/png").split("/")[1] || "png";
    return new File([blob], `${filenameBase}.${ext}`, { type: blob.type || "image/png" });
  }

  if (url.startsWith("blob:")) {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const ext = (blob.type || "image/png").split("/")[1] || "png";
    return new File([blob], `${filenameBase}.${ext}`, { type: blob.type || "image/png" });
  }

  // Remote URL — caller may pass as photo_url instead
  return { remoteUrl: url };
}

async function appendRefToFormData(fd, fieldName, node, filenameBase) {
  const resolved = await resolveNodeRefFile(node, filenameBase);
  if (!resolved) return false;
  if (resolved.remoteUrl) {
    fd.append(`${fieldName}_url`, resolved.remoteUrl);
    return true;
  }
  fd.append(fieldName, resolved, `${filenameBase}.png`);
  return true;
}

/**
 * @returns {{ endpoint: string, refSlots: Array<{ slot: number, role: string, label: string }>, warning?: string, error?: string }}
 */
export function planMangaGeneration(nodes) {
  const { persons, scenarios, objects } = collectMangaRefNodes(nodes);
  const refSlots = [];

  if (persons.length > 2) {
    return {
      endpoint: null,
      refSlots: [],
      error:
        "Máximo de 2 imagens de referência por geração (personagens). Remove uma foto ou gera em duas etapas.",
    };
  }

  if (persons.length >= 2) {
    const labelA = nodeLabel(persons[0], "Personagem 1");
    const labelB = nodeLabel(persons[1], "Personagem 2");
    refSlots.push({
      slot: 1,
      role: "character",
      label: labelA,
      characterName: labelA,
      node: persons[0],
      field: "photo",
    });
    refSlots.push({
      slot: 2,
      role: "character",
      label: labelB,
      characterName: labelB,
      node: persons[1],
      field: "photo_b",
    });
    let warning;
    if (scenarios.length > 0) {
      warning =
        "Dois personagens com foto: o cenário usa apenas o texto do prompt (a API aceita 2 imagens).";
    }
    return { endpoint: "/generate/manga-interaction", refSlots, warning };
  }

  if (persons.length === 1 && scenarios.length >= 1) {
    refSlots.push({
      slot: 1,
      role: "character",
      label: nodeLabel(persons[0], "Personagem"),
      node: persons[0],
      field: "photo",
    });
    refSlots.push({
      slot: 2,
      role: "scenario",
      label: nodeLabel(scenarios[0], "Cenário"),
      node: scenarios[0],
      field: "photo_b",
    });
    return { endpoint: "/generate/manga-interaction", refSlots };
  }

  if (persons.length === 1) {
    refSlots.push({
      slot: 1,
      role: "character",
      label: nodeLabel(persons[0], "Personagem"),
      node: persons[0],
      field: "photo",
    });
    return { endpoint: "/generate/manga-panel", refSlots };
  }

  if (scenarios.length >= 1) {
    refSlots.push({
      slot: 1,
      role: "scenario",
      label: nodeLabel(scenarios[0], "Cenário"),
      node: scenarios[0],
      field: "photo",
    });
    let warning;
    if (scenarios.length > 1) {
      warning = "Várias fotos de cenário: só a primeira (por posição no canvas) é enviada à API.";
    }
    return { endpoint: "/generate/manga-panel", refSlots, warning };
  }

  if (objects.length >= 1) {
    refSlots.push({
      slot: 1,
      role: "object",
      label: nodeLabel(objects[0], "Objeto"),
      node: objects[0],
      field: "photo",
    });
    if (objects.length > 1) {
      return {
        endpoint: "/generate/manga-panel",
        refSlots,
        warning: "Vários objetos com foto: só o primeiro é enviado como referência visual.",
      };
    }
    return { endpoint: "/generate/manga-panel", refSlots };
  }

  return { endpoint: "/generate/manga-panel", refSlots: [] };
}

export async function appendMangaRefsToFormData(fd, refSlots) {
  const missing = [];
  const charSlots = refSlots.filter((s) => s.role === "character");
  for (const slot of refSlots) {
    const ok = await appendRefToFormData(fd, slot.field, slot.node, `manga-ref-${slot.slot}`);
    if (!ok) missing.push(slot.label);
  }
  if (charSlots[0]?.characterName) fd.append("ref_a_name", charSlots[0].characterName);
  if (charSlots[1]?.characterName) fd.append("ref_b_name", charSlots[1].characterName);
  return missing;
}

export function buildReferenceSlotPromptSection(refSlots) {
  if (!refSlots?.length) return "";

  const lines = ["## REFERENCE IMAGE SLOTS (API — follow exactly)", ""];
  for (const s of refSlots) {
    if (s.role === "character") {
      const who = s.characterName || s.label;
      lines.push(
        `Image ${s.slot} = "${who}" ONLY: use this image as the sole identity source for ${who}. Preserve EXACT face, hair color, hair style, skin tone, ethnicity, body proportions and outfit. Never assign this face to any other character.`,
      );
    } else if (s.role === "scenario") {
      lines.push(
        `Image ${s.slot} (${s.label}): BACKGROUND/ENVIRONMENT reference — match architecture, lighting, color palette and atmosphere. Characters must be drawn in this setting.`,
      );
    } else {
      lines.push(
        `Image ${s.slot} (${s.label}): OBJECT reference — match shape, color and details from this image.`,
      );
    }
  }
  if (refSlots.length === 2 && refSlots.every((s) => s.role === "character")) {
    lines.push("");
    const a = refSlots[0].characterName || refSlots[0].label;
    const b = refSlots[1].characterName || refSlots[1].label;
    lines.push(
      `Identity lock: "${a}" (image 1) and "${b}" (image 2) are different people in the same scene. Do NOT merge or swap faces. ${a} must look exactly like image 1; ${b} must look exactly like image 2. No random NPCs.`,
    );
  }
  lines.push("");
  return lines.join("\n");
}
