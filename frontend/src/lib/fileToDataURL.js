/** Convert a File to a data URL using FileReader.
 * More reliable than URL.createObjectURL on mobile Chrome Android,
 * which sometimes fails to render blob: URLs for compressed images.
 */
export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}
