import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Wand2, Zap, Download, Heart, X, Loader2 } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { toast } from "sonner";

const ASPECT_RATIOS = [
  { value: "1:1", label: "Square" },
  { value: "9:16", label: "Story" },
  { value: "16:9", label: "Wide" },
  { value: "4:5", label: "Portrait" },
  { value: "3:2", label: "Classic" },
];

export default function Generate() {
  const { refresh, user } = useAuth();
  const [mode, setMode] = useState("advanced"); // fast | advanced
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState("1:1");
  const [num, setNum] = useState(1);
  const [styleKey, setStyleKey] = useState(null);
  const [improvePrompt, setImprovePrompt] = useState(false);
  const [styles, setStyles] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/public/styles").then((r) => setStyles(r.data.styles || [])).catch(() => {});
  }, []);

  const categories = ["all", ...Array.from(new Set(styles.map((s) => s.category)))];
  const filteredStyles = activeCategory === "all" ? styles : styles.filter((s) => s.category === activeCategory);

  const onGenerate = async () => {
    if (prompt.trim().length < 3) {
      toast.error("Tell me what to imagine — at least a few words.");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const { data } = await api.post("/generate/image", {
        prompt,
        mode,
        aspect_ratio: aspect,
        num_outputs: num,
        style_key: mode === "fast" ? styleKey : null,
        improve_prompt: improvePrompt,
      });
      setResult(data.creation);
      toast.success(`Done — ${data.creation.credits_spent} credits spent.`);
      await refresh();
    } catch (err) {
      const msg = err?.response?.data?.detail || "Generation failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const onFavorite = async () => {
    if (!result) return;
    try {
      const { data } = await api.post(`/generations/${result.id}/favorite`);
      setResult({ ...result, is_favorite: data.is_favorite });
      toast.success(data.is_favorite ? "Saved to favorites" : "Removed from favorites");
    } catch (e) { toast.error("Failed"); }
  };

  const cost = mode === "fast" ? (styleKey ? 11 : 10) : 10 * num;

  return (
    <div className="max-w-[1200px] mx-auto" data-testid="generate-page">
      <div className="mb-10">
        <p className="eyebrow mb-3">Studio</p>
        <h1 className="heading-xl">Generate.</h1>
      </div>

      {/* Mode tabs */}
      <div className="flex items-center border-b border-rp-border mb-10" data-testid="mode-tabs">
        {[
          { id: "fast", icon: Zap, label: "Fast" },
          { id: "advanced", icon: Sparkles, label: "Advanced" },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`flex items-center gap-2.5 px-6 py-4 border-b-2 transition-colors text-[12px] font-mono uppercase tracking-[0.18em] ${mode === m.id ? "border-rp-purple text-rp-lavender" : "border-transparent text-rp-mute hover:text-rp-text"}`}
            data-testid={`mode-${m.id}`}
          >
            <m.icon className="w-4 h-4" strokeWidth={1.5} /> {m.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
        {/* Left: controls */}
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A girl reading in a sunlit attic, dust in the air, 35mm grain…"
            rows={5}
            className="field-input resize-none mb-2"
            data-testid="prompt-input"
          />
          <div className="flex items-center gap-3 mb-8">
            <label className="flex items-center gap-2 text-rp-mute text-sm cursor-pointer">
              <input type="checkbox" checked={improvePrompt} onChange={(e) => setImprovePrompt(e.target.checked)} className="accent-rp-purple" data-testid="improve-prompt-toggle" />
              <Wand2 className="w-3.5 h-3.5" /> Improve with AI (free)
            </label>
            <span className="ml-auto text-[11px] font-mono text-rp-mute2">{prompt.length}/800</span>
          </div>

          {mode === "advanced" && (
            <>
              <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">Aspect ratio</label>
              <div className="flex flex-wrap gap-2 mb-8" data-testid="aspect-ratios">
                {ASPECT_RATIOS.map((a) => (
                  <button key={a.value} onClick={() => setAspect(a.value)} className={`px-4 py-2 border text-[11px] font-mono uppercase tracking-[0.12em] transition-all ${aspect === a.value ? "border-rp-purple text-rp-lavender bg-rp-purple/10" : "border-rp-border text-rp-mute hover:text-rp-text"}`} data-testid={`aspect-${a.value}`}>
                    {a.value} <span className="ml-1.5 text-rp-mute2">{a.label}</span>
                  </button>
                ))}
              </div>

              <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">Variations</label>
              <div className="flex gap-2 mb-10">
                {[1, 2, 3, 4].map((n) => (
                  <button key={n} onClick={() => setNum(n)} className={`w-12 h-12 border text-[15px] font-mono transition-all ${num === n ? "border-rp-purple text-rp-lavender bg-rp-purple/10" : "border-rp-border text-rp-mute hover:text-rp-text"}`} data-testid={`num-${n}`}>{n}</button>
                ))}
              </div>
            </>
          )}

          {mode === "fast" && (
            <>
              <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">Style preset</label>
              <div className="flex flex-wrap gap-2 mb-5">
                {categories.map((c) => (
                  <button key={c} onClick={() => setActiveCategory(c)} className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.16em] border transition-all ${activeCategory === c ? "border-rp-purple text-rp-lavender" : "border-rp-border text-rp-mute hover:text-rp-text"}`} data-testid={`cat-${c}`}>
                    {c}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-10 max-h-[400px] overflow-y-auto pr-2" data-testid="styles-grid">
                {filteredStyles.map((s) => (
                  <button key={s.id} onClick={() => setStyleKey(s.id)} className={`text-left p-4 border transition-all ${styleKey === s.id ? "border-rp-purple bg-rp-purple/10" : "border-rp-border hover:border-rp-mute"}`} data-testid={`style-${s.id}`}>
                    <p className="font-heading text-base text-rp-text mb-1">{s.label}</p>
                    <p className="text-[10px] font-mono text-rp-mute2 uppercase tracking-[0.12em]">{s.category}</p>
                  </button>
                ))}
              </div>
            </>
          )}

          <button onClick={onGenerate} disabled={generating || prompt.length < 3 || (user?.credits ?? 0) < cost} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed" data-testid="generate-button">
            {generating ? (<><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>) : (`Generate · ${cost} credits`)}
          </button>
          {error && <p className="text-red-400 text-sm mt-3" data-testid="generate-error">{error}</p>}
        </div>

        {/* Right: result preview */}
        <aside className="lg:sticky lg:top-[88px] self-start">
          <p className="eyebrow mb-4">Last result</p>
          {result ? (
            <div className="card-rp p-3" data-testid="generate-result">
              <div className="aspect-square bg-rp-bg overflow-hidden mb-3">
                <img src={result.result_urls[0]} alt="" className="w-full h-full object-cover" />
              </div>
              <p className="text-rp-mute text-[12px] mb-3 line-clamp-2">{result.prompt}</p>
              <div className="flex gap-2">
                <a href={result.result_urls[0]} target="_blank" rel="noreferrer" className="btn-secondary flex-1 !py-2.5" data-testid="result-download">
                  <Download className="w-3.5 h-3.5" /> Open
                </a>
                <button onClick={onFavorite} className={`btn-secondary !py-2.5 !px-4 ${result.is_favorite ? "!border-rp-purple !text-rp-lavender" : ""}`} data-testid="result-favorite">
                  <Heart className="w-3.5 h-3.5" fill={result.is_favorite ? "currentColor" : "none"} />
                </button>
              </div>
              {result.result_urls.length > 1 && (
                <div className="grid grid-cols-3 gap-1 mt-2">
                  {result.result_urls.slice(1).map((u, i) => (
                    <a key={i} href={u} target="_blank" rel="noreferrer" className="aspect-square overflow-hidden">
                      <img src={u} alt="" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="card-rp p-10 text-center aspect-square flex flex-col items-center justify-center">
              <Sparkles className="w-6 h-6 text-rp-mute2 mb-4" strokeWidth={1.5} />
              <p className="text-rp-mute text-sm">Your first frame will appear here.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
