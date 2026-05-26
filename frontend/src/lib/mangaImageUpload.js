import { revokeFilePreviewUrl } from "./previewDataUrl";

/** Aplica ficheiro comprimido (ImageUploadZone) ao asset Manga — sem data URL no projeto. */
export function mangaRefFromFile(file, prevThumb = null) {
  revokeFilePreviewUrl(prevThumb);
  if (!file) {
    return { _refFile: null, thumb: null };
  }
  const thumb = URL.createObjectURL(file);
  return { _refFile: file, thumb };
}

export function mangaCharacterFromUpload(character, file) {
  const { _refFile, thumb } = mangaRefFromFile(file, character.thumb);
  return {
    ...character,
    _refFile,
    thumb,
    sheets: { ...character.sheets, front: thumb },
  };
}

export function mangaScenarioFromUpload(scenario, file) {
  const { _refFile, thumb } = mangaRefFromFile(file, scenario.thumb);
  return { ...scenario, _refFile, thumb };
}
