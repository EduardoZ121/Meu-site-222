require("dotenv").config({ path: ".env.local" });
const key = process.env.RUNPOD_API_KEY;
const VOLUME_ID = "bps05k3kto";

async function rest(p, opt = {}) {
  const r = await fetch("https://rest.runpod.io/v1" + p, {
    ...opt,
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/json", ...(opt.headers || {}) },
  });
  const t = await r.text();
  let d; try { d = JSON.parse(t); } catch { d = t; }
  return { status: r.status, d };
}

// Download script: resumable, writes progress to /workspace/status/state.txt,
// then serves that folder over :8888 so we can poll progress via the proxy URL.
const SCRIPT = `set -e
mkdir -p /workspace/models/checkpoints /workspace/status
cd /workspace/status
cat > dl.py <<'PY'
import urllib.request, os, time
FILES = [
  ("https://huggingface.co/Comfy-Org/flux1-dev/resolve/main/flux1-dev-fp8.safetensors",
   "/workspace/models/checkpoints/flux1-dev-fp8.safetensors"),
]
def log(m): open("/workspace/status/state.txt","w").write(m+"\\n")
def dl(url, dst):
  tmp = dst + ".part"
  pos = os.path.getsize(tmp) if os.path.exists(tmp) else 0
  req = urllib.request.Request(url)
  if pos: req.add_header("Range", "bytes=%d-" % pos)
  r = urllib.request.urlopen(req, timeout=120)
  total = int(r.headers.get("Content-Length", 0)) + pos
  mode = "ab" if pos else "wb"
  done = pos; t0 = time.time(); last = 0
  with open(tmp, mode) as f:
    while True:
      chunk = r.read(4*1024*1024)
      if not chunk: break
      f.write(chunk); done += len(chunk)
      if time.time() - last > 3:
        last = time.time()
        pct = done*100/total if total else 0
        sp = done/1e6/max(1, time.time()-t0)
        log("downloading %s %.1f%% %d/%d MB %.0fMB/s" % (os.path.basename(dst), pct, done/1e6, total/1e6, sp))
  os.rename(tmp, dst)
  return os.path.getsize(dst)
try:
  sizes = []
  for url, dst in FILES:
    if os.path.exists(dst):
      sizes.append((os.path.basename(dst), os.path.getsize(dst))); continue
    sizes.append((os.path.basename(dst), dl(url, dst)))
  log("DONE " + " ".join("%s=%dMB" % (n, s//1000000) for n, s in sizes))
except Exception as e:
  log("FAILED %r" % e)
PY
log_init(){ echo starting > /workspace/status/state.txt; }
log_init
( python3 dl.py ) &
cd /workspace/status
python3 -m http.server 8888`;

(async () => {
  const body = {
    name: "remakepix-dl",
    imageName: "python:3.11-slim",
    computeType: "GPU",
    cloudType: "SECURE",
    gpuTypeIds: ["NVIDIA GeForce RTX 4090"],
    gpuCount: 1,
    containerDiskInGb: 10,
    dataCenterIds: ["US-IL-1"],
    networkVolumeId: VOLUME_ID,
    volumeMountPath: "/workspace",
    ports: ["8888/http"],
    dockerStartCmd: ["bash", "-lc", SCRIPT],
  };
  const res = await rest("/pods", { method: "POST", body: JSON.stringify(body) });
  console.log("CREATE POD status", res.status);
  console.log(JSON.stringify(res.d, null, 2).slice(0, 1200));
  const id = res.d && res.d.id;
  if (id) console.log("PROXY: https://" + id + "-8888.proxy.runpod.net/state.txt");
})().catch((e) => console.error("ERR", e.message));
