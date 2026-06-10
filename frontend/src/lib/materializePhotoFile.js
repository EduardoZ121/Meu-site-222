/**
 * Garante File em memória para upload — crítico no Android (handle do input expira).
 */

import { stabilizePickedImageFile } from "./stabilizePickedFile";

/**
 * @param {File|Blob} file
 * @returns {Promise<File>}
 */
export async function materializePhotoFile(file) {
  if (!file) throw new Error("no file");
  const { file: stable } = await stabilizePickedImageFile(file, { attempts: 6 });
  return stable;
}
