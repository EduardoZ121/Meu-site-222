import fs from "node:fs";
import path from "node:path";

const imagePath = process.argv[2];
if (!imagePath) {
  console.error("Usage: node gen-upload-expr.mjs <image-path>");
  process.exit(1);
}

const b64 = fs.readFileSync(imagePath).toString("base64");
const name = path.basename(imagePath);
const expr = `(function(){
  const b64 = ${JSON.stringify(b64)};
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const file = new File([arr], ${JSON.stringify(name)}, { type: "image/jpeg" });
  const input = document.querySelector('input[type="file"]');
  if (!input) return "no input";
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  input.dispatchEvent(new Event("input", { bubbles: true }));
  return "ok files=" + input.files.length;
})()`;

const out = path.join(path.dirname(imagePath), "upload-expr.json");
fs.writeFileSync(out, JSON.stringify({ expression: expr }));
console.log(out);
