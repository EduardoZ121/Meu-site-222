import fs from "node:fs";

const imagePath = process.argv[2];
const chunkSize = 15000;
const b64 = fs.readFileSync(imagePath).toString("base64");
const name = imagePath.split(/[/\\]/).pop();
const chunks = [];
for (let i = 0; i < b64.length; i += chunkSize) {
  chunks.push(b64.slice(i, i + chunkSize));
}

const outDir = "C:/Users/eduar/OneDrive/Desktop/Meu-site-222/frontend/scripts/output/instagram-posts/cdp-chunks";
fs.mkdirSync(outDir, { recursive: true });

const steps = [
  { expression: "window.__b64parts = []; window.__uploadName = " + JSON.stringify(name) + "; 'init'" },
  ...chunks.map((c, i) => ({
    expression: `window.__b64parts.push(${JSON.stringify(c)}); 'chunk ${i + 1}/${chunks.length}'`,
  })),
  {
    expression: `(function(){
      const b64 = window.__b64parts.join('');
      const bin = atob(b64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      const file = new File([arr], window.__uploadName, { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]');
      if (!input) return 'no input';
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      delete window.__b64parts;
      return 'ok files=' + input.files.length;
    })()`,
  },
];

steps.forEach((s, i) => {
  fs.writeFileSync(`${outDir}/step-${String(i).padStart(2, "0")}.json`, JSON.stringify(s));
});
console.log(`Wrote ${steps.length} steps to ${outDir}`);
