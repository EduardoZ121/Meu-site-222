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
