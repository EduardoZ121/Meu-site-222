/**
 * Character consistency for prompts — seed + DNA string (embeddings optional later).
 */

const BODY_EN = {
  slim: "slim build",
  athletic: "athletic build",
  curvy: "curvy proportions",
  muscular: "muscular build",
  chibi: "chibi super-deformed proportions",
};

export function characterConsistencyScore(character) {
  if (!character) return 0;
  const sheets = character.sheets || {};
  let n = 0;
  if (sheets.front) n += 25;
  if (sheets.profile) n += 20;
  if (sheets.threeQuarter) n += 20;
  if (sheets.back) n += 15;
  const expr = sheets.expressions || {};
  n += Math.min(20, Object.keys(expr).filter(Boolean).length * 5);
  if (character.thumb && !sheets.front) n += 10;
  return Math.min(100, n);
}

export function buildCharacterDnaString(character, outfitId) {
  if (!character) return "";
  const outfit = (character.outfitSlots || []).find((o) => o.id === outfitId)
    || (character.outfitSlots || []).find((o) => o.isDefault);
  const parts = [
    `[CHARACTER DNA] ${character.name}`,
    character.tag || character.description || "",
    BODY_EN[character.bodyType] || character.bodyType || "consistent design",
  ];
  if (outfit) parts.push(`outfit: ${outfit.name} (${outfit.category || "casual"})`);
  if (character.consistencyLock) {
    parts.push(
      "LOCK: same face, hair, eyes, skin tone across panels",
      `seed anchor ${character.seedBase ?? 0}`,
    );
  }
  if (character.faceEmbedding) {
    parts.push("facial embedding locked (IP-Adapter style)");
  }
  return parts.filter(Boolean).join(". ");
}

export function characterRefHint(character) {
  const score = characterConsistencyScore(character);
  if (score >= 60) return "strong reference sheet, match all angles";
  if (score >= 25) return "use front reference, keep face identical";
  return "text-only character lock, describe face in detail";
}
