/**
 * Prepara imagem para envio ao servidor.
 *
 * MINIMAL VERSION — don't over-process. The server has sharp and handles
 * HEIF conversion + compression. Just normalize the MIME type and return.
 * Previous versions tried canvas compression + HEIF sniffing + Blob offload
 * and broke uploads for everyone.
 */

import { normalizeImageFile } from "./imageCompress";

/**
 * @param {File|Blob} file
 * @param {{ maxBytes?: number, maxSize?: number, force?: boolean }} [opts]
 * @returns {Promise<File>}
 */
export async function prepareImageForUpload(file, opts = {}) {
  if (!file) return file;

  // Just normalize the MIME type (e.g. octet-stream → image/jpeg based on extension)
  const work = file instanceof File
    ? normalizeImageFile(file)
    : normalizeImageFile(
        new File([file], "upload.jpg", { type: file.type || "application/octet-stream" }),
      );

  return work;
}
