import fs from "node:fs";

const p = process.argv[2];
if (!p) process.exit(1);
const buf = fs.readFileSync(p);
const text = buf.toString("latin1");
const mvhd = text.indexOf("mvhd");
if (mvhd < 0) {
  console.log("mvhd not found");
  process.exit(0);
}
const off = mvhd + 4;
const version = buf[off];
let timescale = 0;
let duration = 0;
if (version === 0) {
  timescale = buf.readUInt32BE(off + 12);
  duration = buf.readUInt32BE(off + 16);
} else if (version === 1) {
  timescale = buf.readUInt32BE(off + 20);
  const hi = buf.readUInt32BE(off + 24);
  const lo = buf.readUInt32BE(off + 28);
  duration = hi * 2 ** 32 + lo;
}
const sec = timescale ? duration / timescale : 0;
console.log(JSON.stringify({
  file: p.split(/[\\/]/).pop(),
  sizeMB: (buf.length / (1024 * 1024)).toFixed(1),
  durationSec: Math.round(sec * 10) / 10,
  timescale,
  duration,
}));
