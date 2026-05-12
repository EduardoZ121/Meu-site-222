import { useState } from "react";
import { Lightbulb, Loader2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useI18n } from "../../lib/i18n";
import { toast } from "sonner";

const PRESETS = [
  "Cinematic portrait",
  "Brand campaign",
  "Editorial fashion",
  "Travel photography",
  "Surreal dream",
  "Minimal still life",
];

export default function Suggest() {
  const navigate = useNavigate();
  const { lang } = useI18n();
  const [theme, setTheme] = useState("");
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);

  const fetchSuggestions = async (t) => {
    setBusy(true);
    try {
      const { data } = await api.post("/suggest", { theme: t, lang });
      setItems(data.prompts || []);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-[1000px] mx-auto" data-testid="suggest-page">
      <p className="eyebrow mb-3">Suggest</p>
      <h1 className="heading-xl mb-10">A nudge in the <span className="italic text-rp-lavender">right direction</span>.</h1>

      <div className="flex gap-3 mb-6">
        <input value={theme} onChange={(e) => setTheme(e.target.value)} onKeyDown={(e) => e.key === "Enter" && theme.trim() && fetchSuggestions(theme)} placeholder="Theme — e.g. lonely architecture, midnight diner…" className="field-input flex-1" data-testid="suggest-theme" />
        <button onClick={() => fetchSuggestions(theme)} disabled={busy || theme.length < 2} className="btn-primary disabled:opacity-50" data-testid="suggest-go">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />} Suggest
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-12">
        {PRESETS.map((p) => (
          <button key={p} onClick={() => { setTheme(p); fetchSuggestions(p); }} className="px-3 py-1.5 border border-rp-border text-rp-mute hover:text-rp-text text-[11px] font-mono uppercase tracking-[0.14em]" data-testid={`preset-${p.replace(/\s+/g, '-')}`}>{p}</button>
        ))}
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="suggest-results">
          {items.map((p, i) => (
            <button key={i} onClick={() => navigate(`/app/generate?prompt=${encodeURIComponent(p)}`)} className="text-left p-6 border border-rp-border hover:border-rp-purple bg-rp-surface transition-all group" data-testid={`suggestion-${i}`}>
              <p className="font-heading text-lg text-rp-text leading-tight mb-3 group-hover:text-rp-lavender transition-colors">{p}</p>
              <div className="flex items-center gap-2 text-rp-mute2 text-[10px] font-mono uppercase tracking-[0.16em]">
                <Sparkles className="w-3 h-3" /> Use this prompt
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
