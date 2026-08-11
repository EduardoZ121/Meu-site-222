/** Anexa foto principal + referências ao FormData (image_1 … image_4). */
export function appendStudioPhotos(fd, photos, { mainKey = "photo" } = {}) {
  const list = (Array.isArray(photos) ? photos : [photos]).filter(Boolean);
  if (!list.length) return 0;
  fd.append(mainKey, list[0]);
  list.slice(1).forEach((file, i) => {
    fd.append(`image_${i + 1}`, file);
  });
  return list.length;
}

/** Primeira foto de um valor single ou array. */
export function primaryStudioPhoto(photos) {
  if (Array.isArray(photos)) return photos[0] || null;
  return photos || null;
}
