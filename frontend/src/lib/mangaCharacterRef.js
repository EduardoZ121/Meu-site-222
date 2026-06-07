/** Resolve foto de referência do personagem para upload (Grok/Qwen). */

export function characterHasReference(character) {
  if (!character) return false;
  if (character._refFile instanceof Blob && character._refFile.size > 0) return true;
  const url = character.sheets?.front || character.thumb;
  return Boolean(url && String(url).length > 20);
}

export async function getCharacterPhotoBlob(character) {
  if (!character) return null;
  if (character._refFile instanceof Blob && character._refFile.size > 0) {
    return character._refFile;
  }
  const url = character.sheets?.front || character.thumb;
  if (!url || typeof url !== "string") return null;
  if (url.startsWith("data:") && url.length > 120_000) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return blob.size > 0 ? blob : null;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* IDENTITY ISOLATION — per-character signatures (Multi-Character Consistency) */
/* -------------------------------------------------------------------------- */

/**
 * Deterministic short identity tag for a character node.
 * Used in prompts so the model has a stable per-character anchor that
 * never collides with other characters in the same graph.
 *
 * Format: ID:XXXX  (4 chars, stable across renders of the same node)
 */
export function getCharacterIdentityTag(node) {
  if (!node) return "ID:0000";
  const base = [
    node.id || "",
    node.data?.name || "",
    node.data?.refPersistUrl || node.data?.refImageUrl || "",
  ].join("|");
  let h = 5381;
  for (let i = 0; i < base.length; i += 1) {
    h = ((h << 5) + h) ^ base.charCodeAt(i);
  }
  const hex = (h >>> 0).toString(36).toUpperCase().padStart(4, "0").slice(-4);
  return `ID:${hex}`;
}

/**
 * Per-character locked identity card — every character node generates its
 * OWN object so prompts can keep references isolated and impossible to mix.
 */
export function buildCharacterIdentityCard(node, slot = null) {
  if (!node) return null;
  const d = node.data || {};
  const name = (d.name && String(d.name).trim()) || "Character";
  const hasRef = Boolean(d.refImage || d.refImageUrl || d.refPersistUrl);
  const tag = getCharacterIdentityTag(node);
  const isSupport = node.type === "support";
  const roleLabel = isSupport ? "SUPPORT (secondary)" : "PRIMARY";
  const traits = [];
  if (d.clothing) traits.push(`outfit: ${String(d.clothing).slice(0, 160)}`);
  if (d.refInstructions) traits.push(String(d.refInstructions).slice(0, 200));
  if (d.actionDesc) traits.push(`action notes: ${String(d.actionDesc).slice(0, 120)}`);

  return {
    nodeId: node.id,
    name,
    tag,
    role: isSupport ? "support" : "primary",
    slot,
    hasRef,
    lockedIdentity: true,
    visualTraits: traits,
    /** Hidden semantic block — used by the prompt composer, never UI. */
    identityBlock: [
      `• ${name} [${tag}] (${roleLabel})${slot ? ` → reference image ${slot} ONLY` : " → described identity only"}.`,
      slot
        ? `  Bind image ${slot} as the sole visual source for ${name}: same face shape, eyes, nose, mouth, hair color, hair style, skin tone, ethnicity, body proportions and outfit. Never reuse this image for any other character.`
        : `  ${name} has no reference photo: do NOT invent a generic anime face. Use only the textual traits below; if no traits, keep ${name} OUT of the panel rather than guess.`,
      isSupport
        ? `  Role: secondary/support — present with own independent identity, never blends with the primary, but composition centers on the primary.`
        : `  Role: primary — main focus of compositions and action.`,
      traits.length ? `  Visual traits (locked): ${traits.join("; ")}.` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

/**
 * Build identity cards for every character node — used to ensure each
 * character keeps its OWN independent context (no cross-character bleed).
 */
export function buildCharacterIdentityCards(personNodes, refSlots = []) {
  const slotMap = new Map();
  for (const s of refSlots || []) {
    if (s?.node?.id) slotMap.set(s.node.id, s.slot);
  }
  return (personNodes || [])
    .map((p) => buildCharacterIdentityCard(p, slotMap.get(p.id) || null))
    .filter(Boolean);
}
