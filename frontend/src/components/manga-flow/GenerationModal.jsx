import { useState, useCallback } from "react";
import { X, Wand2, Download, Copy, Loader2, Sparkles, Image as ImageIcon, AlertCircle } from "lucide-react";
import { buildFinalPrompt } from "./buildFlowPrompt";
import { uploadPost, api, pollPrediction, trackPendingPrediction } from "../../lib/api";
import { toast } from "sonner";

const MODELS = [
  { id: "grok", name: "Fast Engine", desc: "Quick, good quality", apiModel: "standard" },
  { id: "flux", name: "Flux Pro (Recommended)", desc: "Best consistency", badge: "★", apiModel: "pro" },
  { id: "gpt_image", name: "Premium", desc: "Maximum quality", apiModel: "gpt_image" },
];
const QUALITY = [
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
  { id: "ultra", label: "Ultra", badge: "★" },
];
const ASPECTS = [
  { id: "3:4", label: "Portrait (3:4)" },
  { id: "4:5", label: "Manga (4:5)" },
  { id: "1:1", label: "Square" },
  { id: "9:16", label: "Story (9:16)" },
  { id: "16:9", label: "Cinematic" },
];
const STYLES = [
  { id: "manga", label: "Manga B&W" },
  { id: "anime", label: "Anime Color" },
  { id: "comic", label: "Comic Book" },
  { id: "realistic", label: "Realistic" },
  { id: "ghibli", label: "Studio Ghibli" },
  { id: "webtoon", label: "Webtoon" },
];

function Chips({ label, options, value, onChange }) {
  return (
    <div className="mfg-field">
      <label className="mfg-label">{label}</label>
      <div className="mfg-chips">
        {options.map((opt) => {
          const id = typeof opt === "string" ? opt : opt.id;
          return (
            <button key={id} onClick={() => onChange(id)} className={`mfg-chip ${value === id ? "mfg-chip--active" : ""}`} type="button">
              {typeof opt === "string" ? opt : opt.label}
              {opt.badge && <span className="mfg-chip__badge">{opt.badge}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function GenerationModal({ nodes, edges, onClose, onResult }) {
  const [model, setModel] = useState("grok");
  const [quality, setQuality] = useState("high");
  const [aspect, setAspect] = useState("3:4");
  const [style, setStyle] = useState("manga");
  const [extraInstructions, setExtraInstructions] = useState("");
  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);

  const finalPrompt = buildFinalPrompt(nodes, edges, { model, quality, aspect, style, extraInstructions });
  const modelDef = MODELS.find(m => m.id === model) || MODELS[0];

  const copyPrompt = () => {
    navigator.clipboard.writeText(finalPrompt).then(() => toast.success("Prompt copied!")).catch(() => toast.error("Copy failed"));
  };

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    setResultUrl(null);
    setProgress(5);

    try {
      // Build FormData for the API
      const fd = new FormData();
      fd.append("prompt_final", finalPrompt);
      fd.append("aspect_ratio", aspect);
      fd.append("model_key", modelDef.apiModel || "standard");

      // Attach first character reference image if available
      const personNode = nodes.find(n => n.type === "person" && n.data?.refImageUrl);
      if (personNode?.data?.refImage instanceof File) {
        fd.append("photo", personNode.data.refImage, "character-ref.png");
      }

      setProgress(15);

      // Submit to API
      const { data: submitData } = await uploadPost("/generate/manga-panel", fd, {
        timeout: 120000,
        headers: { "X-Skip-Auto-Poll": "1" },
      });

      setProgress(30);

      if (!submitData?.prediction_id) {
        // Direct result (no polling needed)
        const directUrl = submitData?.creation?.result_urls?.[0];
        if (directUrl) {
          setResultUrl(directUrl);
          setProgress(100);
          toast.success(`Generated! ${submitData?.credits_spent || 0} credits`);
          if (onResult) onResult(directUrl);
          return;
        }
        throw new Error(submitData?.detail || "No prediction ID returned");
      }

      // Poll for result
      trackPendingPrediction(submitData.prediction_id, {
        credits_spent: submitData.credits_spent || 15,
        type: "manga",
      });

      setProgress(40);

      const polled = await pollPrediction(submitData.prediction_id, {
        credits_spent: submitData.credits_spent || 15,
        type: "manga",
        timeoutMs: 300000,
        onTick: (sec) => setProgress(Math.min(90, 40 + Math.round((sec / 120) * 50))),
      });

      const url = polled?.creation?.result_urls?.[0];
      if (!url) throw new Error("Generation finished but no image returned");

      setResultUrl(url);
      setProgress(100);
      toast.success(`Generated! ${polled?.creation?.credits_spent || submitData.credits_spent || 0} credits`);
      if (onResult) onResult(url);

    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "Generation failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  }, [finalPrompt, aspect, modelDef, nodes, onResult]);

  return (
    <div className="mfg-overlay" data-testid="generation-modal">
      <div className="mfg-modal">
        <div className="mfg-header">
          <div className="flex items-center gap-3">
            <div className="mfg-header__icon"><Sparkles className="w-5 h-5" /></div>
            <div>
              <h2 className="mfg-header__title">Generate Manga Page</h2>
              <p className="mfg-header__sub">{nodes.length} cards · {edges.length} connections</p>
            </div>
          </div>
          <button onClick={onClose} className="mfg-close"><X className="w-5 h-5" /></button>
        </div>

        <div className="mfg-body">
          <div className="mfg-settings">
            <div className="mfg-section">
              <h3 className="mfg-section__title">Model & Quality</h3>
              <Chips label="AI Model" options={MODELS} value={model} onChange={setModel} />
              <Chips label="Quality" options={QUALITY} value={quality} onChange={setQuality} />
              <Chips label="Aspect Ratio" options={ASPECTS} value={aspect} onChange={setAspect} />
            </div>
            <div className="mfg-section">
              <h3 className="mfg-section__title">Style</h3>
              <Chips label="Art Style" options={STYLES} value={style} onChange={setStyle} />
              <div className="mfg-field">
                <label className="mfg-label">Extra Instructions</label>
                <textarea value={extraInstructions} onChange={(e) => setExtraInstructions(e.target.value)}
                  placeholder="e.g. 'style of Eiichiro Oda', 'cinematic composition'..."
                  className="mfg-textarea" rows={3} />
              </div>
            </div>
          </div>

          <div className="mfg-preview">
            <div className="mfg-preview__card">
              {resultUrl ? (
                <img src={resultUrl} alt="Generated manga" className="mfg-preview__img" crossOrigin="anonymous" />
              ) : generating ? (
                <div className="mfg-preview__loading">
                  <Loader2 className="w-10 h-10 animate-spin text-[#A855F7]" />
                  <p className="mfg-preview__loading-text">Generating with {modelDef.name}...</p>
                  <div className="mfg-progress-bar"><div className="mfg-progress-bar__fill" style={{ width: `${progress}%` }} /></div>
                  <p className="mfg-preview__loading-hint">{progress}% · May take 30-120s</p>
                </div>
              ) : (
                <div className="mfg-preview__empty">
                  <ImageIcon className="w-12 h-12 text-[#2E2E30]" />
                  <p className="mfg-preview__empty-text">Your manga page appears here</p>
                </div>
              )}
            </div>

            {error && (
              <div className="mfg-error"><AlertCircle className="w-4 h-4" /><span>{error}</span></div>
            )}

            {showPrompt && (
              <div className="mfg-prompt-preview">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-[#5A5A5E] uppercase tracking-wider font-mono">Final Prompt</span>
                  <button onClick={copyPrompt} className="manga-flow-btn" style={{ padding: "4px 10px", fontSize: 11 }}><Copy className="w-3 h-3" /> Copy</button>
                </div>
                <pre className="mfg-prompt-text">{finalPrompt}</pre>
              </div>
            )}

            <div className="mfg-actions">
              <button onClick={() => setShowPrompt(!showPrompt)} className="manga-flow-btn" style={{ flex: 1 }}>
                {showPrompt ? "Hide Prompt" : "Preview Prompt"}
              </button>
              <button onClick={copyPrompt} className="manga-flow-btn" style={{ flex: 1 }}>
                <Copy className="w-4 h-4" /> Copy
              </button>
            </div>

            <button onClick={handleGenerate} disabled={generating || !nodes.length} className="mfg-generate-btn">
              {generating ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</> : <><Wand2 className="w-5 h-5" /> Generate with {modelDef.name}</>}
            </button>

            {resultUrl && (
              <a href={resultUrl} download="manga-page.png" target="_blank" rel="noreferrer" className="mfg-download-btn">
                <Download className="w-4 h-4" /> Download Image
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
