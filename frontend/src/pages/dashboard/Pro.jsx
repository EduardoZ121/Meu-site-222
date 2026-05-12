import { useEffect, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { toast } from "sonner";
import PhotoUpload from "../../components/PhotoUpload";
import ResultPanel from "../../components/ResultPanel";

export default function Pro() {
  const { refresh, user } = useAuth();
  const [presets, setPresets] = useState([]);
  const [category, setCategory] = useState("realism");
  const [preset, setPreset] = useState("ultra_real");
  const [aspect, setAspect] = useState("4:5");
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get("/public/pro-presets").then((r) => setPresets(r.data.presets || []));
  }, []);

  const cats = ["realism", "mood", "enhance"];
  const filtered = presets.filter((p) => p.category === category);
  const cost = 18;

  const generate = async () => {
    if (!photo) { toast.error("Upload a photo first"); return; }
    setBusy(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append("photo", photo);
      fd.append("preset_id", preset);
      fd.append("aspect_ratio", aspect);
      const { data } = await api.post("/generate/pro", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(data.creation);
      toast.success(`Done — ${data.creation.credits_spent} credits.`);
      await refresh();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Generation failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto" data-testid="pro-page">
      <p className="eyebrow mb-3">Pro</p>
      <h1 className="heading-xl mb-10">Photorealistic <span className="italic text-rp-lavender">refinement</span>.</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">Your photo</label>
          <div className="max-w-[420px] mb-10">
            <PhotoUpload value={photo} onChange={setPhoto} testId="pro-photo" />
          </div>

          <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">Direction</label>
          <div className="flex gap-2 mb-5">
            {cats.map((c) => (
              <button key={c} onClick={() => setCategory(c)} className={`px-4 py-2 border text-[11px] font-mono uppercase tracking-[0.16em] ${category === c ? "border-rp-purple text-rp-lavender" : "border-rp-border text-rp-mute hover:text-rp-text"}`} data-testid={`procat-${c}`}>{c}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-10">
            {filtered.map((p) => (
              <button key={p.id} onClick={() => setPreset(p.id)} className={`text-left p-4 border transition-all ${preset === p.id ? "border-rp-purple bg-rp-purple/10" : "border-rp-border hover:border-rp-mute"}`} data-testid={`preset-${p.id}`}>
                <p className="font-heading text-base text-rp-text mb-1">{p.label}</p>
                <p className="text-[10px] font-mono text-rp-mute2 uppercase tracking-[0.14em]">{p.category}</p>
              </button>
            ))}
          </div>

          <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">Aspect ratio</label>
          <div className="flex flex-wrap gap-2 mb-10">
            {["1:1", "4:5", "3:2", "9:16", "16:9"].map((a) => (
              <button key={a} onClick={() => setAspect(a)} className={`px-4 py-2 border text-[11px] font-mono uppercase tracking-[0.12em] ${aspect === a ? "border-rp-purple text-rp-lavender bg-rp-purple/10" : "border-rp-border text-rp-mute hover:text-rp-text"}`} data-testid={`pro-aspect-${a}`}>{a}</button>
            ))}
          </div>

          <button onClick={generate} disabled={busy || !photo || (user?.credits ?? 0) < cost} className="btn-primary w-full disabled:opacity-50" data-testid="pro-generate">
            {busy ? (<><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>) : (<><Camera className="w-4 h-4" /> Refine · {cost} credits</>)}
          </button>
        </div>

        <aside className="lg:sticky lg:top-[88px] self-start">
          <p className="eyebrow mb-4">Last result</p>
          <ResultPanel creation={result} loading={busy} onChange={setResult} emptyLabel="Upload, choose a preset, generate." />
        </aside>
      </div>
    </div>
  );
}
