import { useState } from "react";
import { Film, Loader2 } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { toast } from "sonner";
import PhotoUpload from "../../components/PhotoUpload";
import ResultPanel from "../../components/ResultPanel";
import useTitle from "../../lib/useTitle";

export default function Video() {
  useTitle("Video");
  const { refresh, user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState("16:9");
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const cost = 20;

  const generate = async () => {
    if (prompt.trim().length < 3) { toast.error("Describe the motion you want."); return; }
    setBusy(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append("prompt", prompt);
      fd.append("aspect_ratio", aspect);
      if (photo) fd.append("photo", photo);
      const { data } = await api.post("/generate/video", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(data.creation);
      toast.success("Video ready.");
      await refresh();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Video failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto" data-testid="video-page">
      <p className="eyebrow mb-3">Video · 6s</p>
      <h1 className="heading-xl mb-10">An idea, <span className="italic text-rp-lavender">in motion</span>.</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">Prompt</label>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={5} placeholder="A woman walks through tall grass, slow motion, golden hour…" className="field-input resize-none mb-8" data-testid="video-prompt" />

          <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">Starting frame (optional)</label>
          <div className="max-w-[320px] mb-10">
            <PhotoUpload value={photo} onChange={setPhoto} testId="video-photo" />
          </div>

          <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">Aspect ratio</label>
          <div className="flex flex-wrap gap-2 mb-10">
            {["16:9", "9:16", "1:1", "4:5"].map((a) => (
              <button key={a} onClick={() => setAspect(a)} className={`px-4 py-2 border text-[11px] font-mono uppercase ${aspect === a ? "border-rp-purple text-rp-lavender bg-rp-purple/10" : "border-rp-border text-rp-mute hover:text-rp-text"}`}>{a}</button>
            ))}
          </div>

          <button onClick={generate} disabled={busy || prompt.length < 3 || (user?.credits ?? 0) < cost} className="btn-primary w-full disabled:opacity-50" data-testid="video-generate">
            {busy ? (<><Loader2 className="w-4 h-4 animate-spin" /> Rendering… (up to 2 min)</>) : (<><Film className="w-4 h-4" /> Render · {cost} credits</>)}
          </button>
        </div>

        <aside className="lg:sticky lg:top-[88px] self-start">
          <p className="eyebrow mb-4">Last clip</p>
          <ResultPanel creation={result} loading={busy} onChange={setResult} emptyLabel="Describe a movement, render." />
        </aside>
      </div>
    </div>
  );
}
