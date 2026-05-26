import { useState, useEffect } from "react";
import {
  Copy, Dices, Lightbulb, Loader2, RefreshCw, Sparkles, X,
} from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { toast } from "sonner";
import { localSuggestions, randomSuggestPrompt } from "../../lib/suggestPromptPools";

const PRESET_KEYS = [
  "sug_preset_portrait", "sug_preset_brand", "sug_preset_editorial",
  "sug_preset_travel", "sug_preset_surreal", "sug_preset_still",
];

export default function SuggestPromptModal({ open, onOpenChange, onApply }) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const uiLang = lang || user?.lang || "en";
  const [theme, setTheme] = useState("");
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState("random");

  useEffect(() => {
    if (!open) {
      setTheme("");
      setItems([]);
      setBusy(false);
      setMode("random");
    }
  }, [open]);

  const fetchSuggestions = async (th) => {
    setBusy(true);
    try {
      const { data } = await api.post("/suggest", { theme: th, lang: uiLang });
      setItems(data.prompts?.length ? data.prompts : localSuggestions(th, 8, uiLang));
    } catch {
      setItems(localSuggestions(th, 8, uiLang));
      toast.info(t("sug_local_fallback"));
    } finally {
      setBusy(false);
    }
  };

  const generateRandom = (seed = theme) => {
    const base = seed.trim();
    setItems(Array.from({ length: 8 }, () => randomSuggestPrompt(base, uiLang)));
  };

  const copyPrompt = async (prompt) => {
    await navigator.clipboard.writeText(prompt);
    toast.success(t("sug_copied"));
  };

  const applyPrompt = (p) => {
    onApply(p);
    onOpenChange(false);
    toast.success(t("sug_applied"));
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      data-testid="suggest-prompt-modal"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-label={t("common_close")}
        onClick={() => onOpenChange(false)}
      />
      <div className="relative w-full sm:max-w-[720px] max-h-[92vh] overflow-hidden rounded-t-2xl sm:rounded-2xl border border-[rgba(147,51,234,0.35)] bg-[#111118] shadow-[0_0_40px_rgba(147,51,234,0.25)] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(147,51,234,0.2)] shrink-0">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-[#A855F7]" />
            <p className="text-white text-[13px] font-medium font-['Inter_Tight']">
              {t("studio_suggest")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:text-white hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 sm:p-6">
          <p className="text-[#9CA3AF] text-[12px] mb-4">{t("sug_modal_desc")}</p>

          <div className="inline-flex rounded-lg border border-[#2E2E30] p-0.5 bg-[#0A0A0F] mb-4">
            <button
              type="button"
              onClick={() => setMode("random")}
              className={`px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider ${
                mode === "random" ? "bg-[#9333EA] text-white" : "text-[#9CA3AF]"
              }`}
            >
              {t("sug_mode_random")}
            </button>
            <button
              type="button"
              onClick={() => setMode("guided")}
              className={`px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider ${
                mode === "guided" ? "bg-[#9333EA] text-white" : "text-[#9CA3AF]"
              }`}
            >
              {t("sug_mode_guided")}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (mode === "random" || theme.trim().length >= 2)) {
                  mode === "random" ? generateRandom(theme) : fetchSuggestions(theme);
                }
              }}
              placeholder={t("sug_theme_placeholder")}
              className="flex-1 bg-[#0A0A0F] border border-[rgba(147,51,234,0.25)] focus:border-[#9333EA] rounded-xl text-white text-[13px] px-3 py-2.5 focus:outline-none"
              data-testid="suggest-modal-theme"
            />
            <button
              type="button"
              onClick={() => (mode === "random" ? generateRandom(theme) : fetchSuggestions(theme))}
              disabled={busy || (mode === "guided" && theme.trim().length < 2)}
              className="px-4 py-2.5 rounded-xl bg-[#9333EA] hover:bg-[#A855F7] disabled:opacity-50 text-white text-[12px] font-medium flex items-center justify-center gap-2 shrink-0"
              data-testid="suggest-modal-go"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === "random" ? (
                <Dices className="w-4 h-4" />
              ) : (
                <Lightbulb className="w-4 h-4" />
              )}
              {mode === "random" ? t("sug_surprise_me") : t("sug_button")}
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            {PRESET_KEYS.map((key) => {
              const label = t(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setTheme(label);
                    generateRandom(label);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-[rgba(147,51,234,0.25)] text-[#9CA3AF] hover:text-white text-[10px]"
                >
                  {label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => generateRandom("")}
              className="px-2.5 py-1 rounded-lg border border-[rgba(147,51,234,0.4)] text-[#C4B5FD] text-[10px] flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> {t("sug_random_short")}
            </button>
          </div>

          {items.length > 0 && (
            <div className="grid grid-cols-1 gap-2 max-h-[40vh] overflow-y-auto pr-1" data-testid="suggest-modal-results">
              {items.map((p, i) => (
                <div
                  key={`${i}-${p.slice(0, 24)}`}
                  className="p-3 rounded-xl border border-[rgba(147,51,234,0.2)] bg-[#0A0A0F] hover:border-[#9333EA]/50 transition-colors"
                >
                  <p className="text-white text-[13px] leading-snug mb-3">{p}</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => applyPrompt(p)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#9333EA]/20 border border-[rgba(147,51,234,0.35)] text-[#C4B5FD] text-[10px] font-medium hover:bg-[#9333EA]/30"
                      data-testid={`suggest-modal-use-${i}`}
                    >
                      <Sparkles className="w-3 h-3" /> {t("sug_use_short")}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyPrompt(p)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[rgba(147,51,234,0.2)] text-[#9CA3AF] text-[10px] hover:text-white"
                    >
                      <Copy className="w-3 h-3" /> {t("sug_copy_btn")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
