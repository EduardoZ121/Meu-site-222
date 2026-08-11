import fs from "node:fs";
import path from "node:path";

const imagePath = process.argv[2];
const chunkSize = 15000;
const b64 = fs.readFileSync(imagePath).toString("base64");
const name = path.basename(imagePath);
const chunks = [];
for (let i = 0; i < b64.length; i += chunkSize) {
  chunks.push(b64.slice(i, i + chunkSize));
}

const payload = {
  method: "Runtime.evaluate",
  params: {
    awaitPromise: true,
    returnByValue: true,
    expression: `function(chunks, name) {
      const b64 = chunks.join('');
      const bin = atob(b64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      const file = new File([arr], name, { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]');
      if (!input) return 'no input';
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return 'ok files=' + input.files.length;
    }`,
    arguments: [{ value: chunks }, { value: name }],
  },
};

const out = path.join(path.dirname(imagePath), "cdp-upload-once.json");
fs.writeFileSync(out, JSON.stringify(payload));
console.log(out, JSON.stringify(payload).length, "chunks", chunks.length);
