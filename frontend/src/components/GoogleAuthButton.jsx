import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useI18n } from "../lib/i18n";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve(window.google);
      return;
    }
    const existing = document.querySelector("script[data-google-identity]");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "true";
    script.onload = () => resolve(window.google);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function GoogleAuthButton({ onCredential, label }) {
  const { t } = useI18n();
  const resolvedLabel = label ?? t("login_google");
  const buttonRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!GOOGLE_CLIENT_ID) return undefined;

    loadGoogleScript()
      .then((google) => {
        if (cancelled || !buttonRef.current) return;
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response?.credential) onCredential(response.credential);
            else toast.error(t("login_google_fail"));
          },
        });
        google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          type: "standard",
          shape: "rectangular",
          text: "continue_with",
          width: buttonRef.current.offsetWidth || 360,
        });
        setReady(true);
      })
      .catch(() => toast.error(t("login_google_fail")));

    return () => { cancelled = true; };
  }, [onCredential, t]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <button
        type="button"
        disabled
        className="w-full border border-rp-border px-4 py-3 text-rp-mute2 text-[11px] font-mono uppercase tracking-[0.14em] opacity-70"
      >
        Google Login · missing Client ID
      </button>
    );
  }

  return (
    <div className="w-full">
      <div ref={buttonRef} className="min-h-[44px] w-full overflow-hidden" aria-label={resolvedLabel} />
      {!ready && (
        <button
          type="button"
          disabled
          className="w-full border border-rp-border px-4 py-3 text-rp-mute2 text-[11px] font-mono uppercase tracking-[0.14em] opacity-70"
        >
          {t("loading")}
        </button>
      )}
    </div>
  );
}
