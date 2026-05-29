/**
 * Collects manga-flow reference images and builds FormData + endpoint for generation.
 * Supports: 2 character refs → manga-interaction; single ref → manga-panel.
 */

import { orderPersonsWithRefs, isCharacterNode } from "./mangaFlowGraph";
import { getCharacterIdentityTag } from "./mangaCharacterRef";

function hasRef(node) {
  const d = node?.data;
  return Boolean(
    d?.refImage instanceof File ||
    d?.refImageUrl ||
    d?.refPersistUrl,
  );
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

export function collectMangaRefNodes(nodes, edges = []) {
  const personsOrdered = orderPersonsWithRefs(nodes, edges);
  const sorted = sortNodesForRefs(nodes);
  return {
    persons: personsOrdered.length
      ? personsOrdered
      : sorted.filter((n) => isCharacterNode(n) && hasRef(n)),
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
export function planMangaGeneration(nodes, edges = []) {
  const { persons: personsRaw, scenarios, objects } = collectMangaRefNodes(nodes, edges);
  const refSlots = [];
  let extraWarning = "";

  // 3+ persons with refs: take the first two (graph reading order) and warn.
  let persons = personsRaw;
  if (personsRaw.length > 2) {
    const dropped = personsRaw.slice(2).map((p) => p.data?.name || "Personagem").join(", ");
    persons = personsRaw.slice(0, 2);
    extraWarning =
      `A API aceita 2 fotos por geração. Vou usar "${persons[0]?.data?.name || "Personagem 1"}" e "${persons[1]?.data?.name || "Personagem 2"}". Os restantes (${dropped}) não terão imagem ligada nesta geração — gera em duas etapas para incluí-los com identidade preservada.`;
  }

  if (persons.length >= 2) {
    const labelA = nodeLabel(persons[0], "Personagem 1");
    const labelB = nodeLabel(persons[1], "Personagem 2");
    const roleA = persons[0]?.type === "support" ? "support" : "primary";
    const roleB = persons[1]?.type === "support" ? "support" : "primary";
    refSlots.push({
      slot: 1,
      role: "character",
      characterRole: roleA,
      label: labelA,
      characterName: labelA,
      node: persons[0],
      field: "photo",
    });
    refSlots.push({
      slot: 2,
      role: "character",
      characterRole: roleB,
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
    if (extraWarning) {
      warning = warning ? `${warning} ${extraWarning}` : extraWarning;
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
  if (charSlots[0]?.characterName) {
    fd.append("ref_a_name", charSlots[0].characterName);
    fd.append("ref_a_role", charSlots[0].characterRole || "primary");
    const d0 = charSlots[0].node?.data;
    const desc0 = [d0?.clothing, d0?.refInstructions, d0?.actionDesc].filter(Boolean).join("; ");
    if (desc0) fd.append("ref_a_desc", desc0.slice(0, 400));
  }
  if (charSlots[1]?.characterName) {
    fd.append("ref_b_name", charSlots[1].characterName);
    fd.append("ref_b_role", charSlots[1].characterRole || "support");
    const d1 = charSlots[1].node?.data;
    const desc1 = [d1?.clothing, d1?.refInstructions, d1?.actionDesc].filter(Boolean).join("; ");
    if (desc1) fd.append("ref_b_desc", desc1.slice(0, 400));
  }
  return missing;
}

export function buildReferenceSlotPromptSection(refSlots) {
  if (!refSlots?.length) return "";

  const lines = ["## REFERENCE IMAGE SLOTS (API — follow exactly)", ""];
  const charSlots = refSlots.filter((s) => s.role === "character");
  for (const s of refSlots) {
    if (s.role === "character") {
      const who = s.characterName || s.label;
      const tag = s.node ? getCharacterIdentityTag(s.node) : `ID:CH${s.slot}`;
      const roleLbl =
        s.characterRole === "support"
          ? "SECONDARY CHARACTER (suporte)"
          : "PRIMARY CHARACTER";
      lines.push(
        `Image ${s.slot} = "${who}" [${tag}] (${roleLbl}) ONLY. This image is the sole identity source for ${who}: exact face shape, eyes, nose, mouth, hair color, hair style, skin tone, ethnicity, body proportions and outfit. Image ${s.slot} must NEVER be used for any other character, and ${who}'s face must NEVER appear on anyone else.`,
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

  if (charSlots.length >= 2) {
    lines.push("");
    lines.push("## PER-CHARACTER ISOLATION (mandatory)");
    charSlots.forEach((s) => {
      const who = s.characterName || s.label;
      const tag = s.node ? getCharacterIdentityTag(s.node) : `ID:CH${s.slot}`;
      lines.push(
        `- ${who} [${tag}] uses reference image ${s.slot} EXCLUSIVELY. Lock face, hair, skin, body and outfit from image ${s.slot}. Pose, expression and camera may change between panels — identity may NOT.`,
      );
    });
    lines.push("");
    const a = charSlots[0].characterName || charSlots[0].label;
    const b = charSlots[1].characterName || charSlots[1].label;
    const tagA = charSlots[0].node ? getCharacterIdentityTag(charSlots[0].node) : "ID:CHA";
    const tagB = charSlots[1].node ? getCharacterIdentityTag(charSlots[1].node) : "ID:CHB";
    lines.push(
      `Identity lock: "${a}" [${tagA}] (image ${charSlots[0].slot}) and "${b}" [${tagB}] (image ${charSlots[1].slot}) are DIFFERENT people sharing the same scene. Do NOT merge, swap, blend or average their faces. ${a} must look exactly like image ${charSlots[0].slot}; ${b} must look exactly like image ${charSlots[1].slot}. No random NPCs, no generic anime extras, no background faces.`,
    );
  }
  lines.push("");
  return lines.join("\n");
}
