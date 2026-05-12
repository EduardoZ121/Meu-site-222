import { useState } from "react";
import { Lightbulb, Loader2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useI18n } from "../../lib/i18n";
import { toast } from "sonner";
import useTitle from "../../lib/useTitle";

const PRESET_KEYS = [
  "sug_preset_portrait", "sug_preset_brand", "sug_preset_editorial",
  "sug_preset_travel", "sug_preset_surreal", "sug_preset_still",
];

export default function Suggest() {
  const { t, lang } = useI18n();
  useTitle(t("sidebar_suggest"));
  const navigate = useNavigate();
  const [theme, setTheme] = useState("");
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);

  const fetchSuggestions = async (th) => {
    setBusy(true);
    try {
      const { data } = await api.post("/suggest", { theme: th, lang });
      setItems(data.prompts || []);
    } catch (err) { toast.error(err?.response?.data?.detail || t("failed")); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-[1000px] mx-auto" data-testid="suggest-page">
      <p className="eyebrow mb-3">{t("sug_eyebrow")}</p>
      <h1 className="heading-xl mb-10">{t("sug_title_a")} <span className="italic text-rp-lavender">{t("sug_title_b")}</span>{t("sug_title_dot")}</h1>

      <div className="flex gap-3 mb-6">
        <input value={theme} onChange={(e) => setTheme(e.target.value)} onKeyDown={(e) => e.key === "Enter" && theme.trim() && fetchSuggestions(theme)} placeholder={t("sug_theme_placeholder")} className="field-input flex-1" data-testid="suggest-theme" />
        <button onClick={() => fetchSuggestions(theme)} disabled={busy || theme.length < 2} className="btn-primary disabled:opacity-50" data-testid="suggest-go">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />} {t("sug_button")}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-12">
        {PRESET_KEYS.map((k) => {
          const label = t(k);
          return (
            <button key={k} onClick={() => { setTheme(label); fetchSuggestions(label); }} className="px-3 py-1.5 border border-rp-border text-rp-mute hover:text-rp-text text-[11px] font-mono uppercase tracking-[0.14em]" data-testid={`preset-${k}`}>{label}</button>
          );
        })}
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="suggest-results">
          {items.map((p, i) => (
            <button key={i} onClick={() => navigate(`/app/generate?prompt=${encodeURIComponent(p)}`)} className="text-left p-6 border border-rp-border hover:border-rp-purple bg-rp-surface transition-all group" data-testid={`suggestion-${i}`}>
              <p className="font-heading text-lg text-rp-text leading-tight mb-3 group-hover:text-rp-lavender transition-colors">{p}</p>
              <div className="flex items-center gap-2 text-rp-mute2 text-[10px] font-mono uppercase tracking-[0.16em]">
                <Sparkles className="w-3 h-3" /> {t("sug_use")}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
