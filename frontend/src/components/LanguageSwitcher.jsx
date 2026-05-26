import { useEffect, useRef, useState } from "react";
import { Globe, Check } from "lucide-react";
import { useI18n } from "../lib/i18n";
import { LANG_LABELS, LANG_ORDER } from "../lib/localeStrings";
import { setLanguageAndReload } from "../lib/remakepixLanguage";

/**
 * Header language control — reads/writes remakepix_language only; reload on change.
 */
export default function LanguageSwitcher({ className = "", testId = "header-lang" }) {
  const { lang } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = (code) => {
    setOpen(false);
    if (code === lang) return;
    setLanguageAndReload(code);
  };

  return (
    <div ref={rootRef} className={`relative ${className}`} data-testid={testId}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-white/70 hover:text-white text-xs font-medium px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Globe className="w-3.5 h-3.5" strokeWidth={1.75} />
        {(lang || "en").toUpperCase()}
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-2 min-w-[180px] py-1.5 rounded-xl border border-[#2E2E30] bg-[#13131A] shadow-xl shadow-black/40 z-[100]"
        >
          {LANG_ORDER.map((code) => (
            <button
              key={code}
              type="button"
              role="option"
              aria-selected={lang === code}
              onClick={() => pick(code)}
              data-testid={`lang-option-${code}`}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ${
                lang === code
                  ? "text-white bg-[#7C3AED]/20"
                  : "text-[#8A8A8E] hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <span>{LANG_LABELS[code]}</span>
              {lang === code ? <Check className="w-3.5 h-3.5 text-[#A855F7]" /> : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
