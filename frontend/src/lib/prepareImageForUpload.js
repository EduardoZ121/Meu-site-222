/**
 * prepareImageForUpload — REWRITTEN FROM ZERO
 *
 * Does ONE thing: returns the file. That's it.
 * Server-side sharp handles HEIF conversion, compression, rotation.
 */

export async function prepareImageForUpload(file) {
  return file || null;
}
