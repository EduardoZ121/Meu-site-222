/**
 * Materializa um File escolhido no browser numa cópia em memória reutilizável.
 * iOS Safari / Android Chrome podem invalidar o handle original depois do 1.º
 * arrayBuffer()/FormData — a 2.ª geração com a mesma foto falhava em silêncio.
 */
export async function materializeUploadFile(file) {
  if (!file || typeof file.arrayBuffer !== "function") return file;
  try {
    const buf = await file.arrayBuffer();
    if (!buf || buf.byteLength === 0) {
      throw new Error("EMPTY_FILE");
    }
    const type = file.type || "application/octet-stream";
    return new File([buf], file.name || "upload", {
      type,
      lastModified: file.lastModified || Date.now(),
    });
  } catch (err) {
    const msg = err?.message === "EMPTY_FILE"
      ? "A foto não pôde ser lida. Escolhe outra vez a imagem."
      : "Não foi possível preparar a foto. Remove e escolhe outra vez.";
    const e = new Error(msg);
    e.code = "FILE_STALE";
    throw e;
  }
}
