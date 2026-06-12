import { useState } from "react";
import { Copy, Dices, Lightbulb, Loader2, RefreshCw, Send, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useI18n } from "../../lib/i18n";
import { localSuggestions, randomSuggestPrompt } from "../../lib/suggestPromptPools";
import { toast } from "sonner";
import useTitle from "../../lib/useTitle";
import StudioHelpTip from "../../components/studio/StudioHelpTip";

const PRESET_KEYS = [
  "sug_preset_portrait", "sug_preset_brand", "sug_preset_editorial",
  "sug_preset_travel", "sug_preset_surreal", "sug_preset_still",
];

export default function Suggest() {
  const { t, lang } = useI18n();
  useTitle(t("sidebar.suggest"));
  const navigate = useNavigate();
  const [theme, setTheme] = useState("");
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState("random");

  const fetchSuggestions = async (th) => {
    setBusy(true);
    try {
      const { data } = await api.post("/suggest", { theme: th, lang });
      setItems(data.prompts?.length ? data.prompts : localSuggestions(th, 8, lang));
    } catch {
      setItems(localSuggestions(th, 8, lang));
      toast.info(t("sug_local_fallback"));
    }
    finally { setBusy(false); }
  };

  const generateRandom = (seed = theme) => {
    const base = seed.trim();
    setItems(Array.from({ length: 8 }, () => randomSuggestPrompt(base, lang)));
  };

  const copyPrompt = async (prompt) => {
    await navigator.clipboard.writeText(prompt);
    toast.success(t("sug_copied"));
  };

  const sendToStudio = (prompt) => navigate(`/app/generate?prompt=${encodeURIComponent(prompt)}`);

  return (
    <div className="max-w-[1000px] mx-auto" data-testid="suggest-page">
      <div className="flex items-start gap-3 mb-5">
        <div className="flex-1 min-w-0">
          <p className="eyebrow mb-3">{t("sug_eyebrow")}</p>
          <h1 className="heading-xl">
            {t("sug_title_a")}{" "}
            <span className="italic text-rp-lavender">{t("sug_title_b")}</span>
            {t("sug_title_dot")}
          </h1>
        </div>
        <StudioHelpTip helpKey="help_page_suggest" size="lg" testId="suggest-page-help" className="mt-8 shrink-0" />
      </div>
      <p className="body-text max-w-[620px] mb-8">{t("sug_desc")}</p>

      <div className="inline-flex rounded-full border border-rp-border bg-rp-surface p-1 mb-6">
        <button
          type="button"
          onClick={() => setMode("random")}
          className={`px-4 py-2 rounded-full text-[11px] font-mono uppercase tracking-[0.12em] ${mode === "random" ? "bg-rp-text text-rp-bg" : "text-rp-mute hover:text-rp-text"}`}
        >
          {t("sug_mode_random")}
        </button>
        <button
          type="button"
          onClick={() => setMode("guided")}
          className={`px-4 py-2 rounded-full text-[11px] font-mono uppercase tracking-[0.12em] ${mode === "guided" ? "bg-rp-text text-rp-bg" : "text-rp-mute hover:text-rp-text"}`}
        >
          {t("sug_mode_guided")}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && theme.trim() && fetchSuggestions(theme)}
          placeholder={t("sug_theme_placeholder")}
          className="field-input flex-1"
          data-testid="suggest-theme"
        />
        <button
          type="button"
          onClick={() => (mode === "random" ? generateRandom(theme) : fetchSuggestions(theme))}
          disabled={busy || (mode === "guided" && theme.length < 2)}
          className="btn-primary disabled:opacity-50"
          data-testid="suggest-go"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "random" ? <Dices className="w-4 h-4" /> : <Lightbulb className="w-4 h-4" />}
          {mode === "random" ? t("sug_surprise_me") : t("sug_button")}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {PRESET_KEYS.map((k) => {
          const label = t(k);
          return (
            <button
              key={k}
              type="button"
              onClick={() => {
                setTheme(label);
                generateRandom(label);
              }}
              className="px-3 py-1.5 border border-rp-border text-rp-mute hover:text-rp-text text-[11px] font-mono uppercase tracking-[0.14em]"
              data-testid={`preset-${k}`}
            >
              {label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => generateRandom("")}
          className="px-3 py-1.5 border border-rp-purple/40 text-rp-lavender hover:text-rp-text text-[11px] font-mono uppercase tracking-[0.14em]"
        >
          <RefreshCw className="inline w-3 h-3 mr-1" /> {t("sug_full_random")}
        </button>
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="suggest-results">
          {items.map((p, i) => (
            <div
              key={i}
              className="text-left p-5 border border-rp-border hover:border-rp-purple bg-rp-surface transition-all group"
              data-testid={`suggestion-${i}`}
            >
              <p className="font-heading text-lg text-rp-text leading-tight mb-4 group-hover:text-rp-lavender transition-colors">{p}</p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => sendToStudio(p)}
                  className="inline-flex items-center gap-2 text-rp-lavender text-[10px] font-mono uppercase tracking-[0.16em] border border-rp-purple/30 px-3 py-2 hover:border-rp-purple"
                >
                  <Sparkles className="w-3 h-3" /> {t("sug_use")}
                </button>
                <button
                  type="button"
                  onClick={() => copyPrompt(p)}
                  className="inline-flex items-center gap-2 text-rp-mute hover:text-rp-text text-[10px] font-mono uppercase tracking-[0.16em] border border-rp-border px-3 py-2"
                >
                  <Copy className="w-3 h-3" /> {t("sug_copy_btn")}
                </button>
                <button
                  type="button"
                  onClick={() => sendToStudio(`${p} --ar 4:5`)}
                  className="inline-flex items-center gap-2 text-rp-mute hover:text-rp-text text-[10px] font-mono uppercase tracking-[0.16em] border border-rp-border px-3 py-2"
                >
                  <Send className="w-3 h-3" /> {t("sug_feed_ar")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
