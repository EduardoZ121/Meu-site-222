import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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

export default function GoogleAuthButton({ onCredential, label = "Continuar com Google" }) {
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
            else toast.error("Não foi possível validar a conta Google.");
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
      .catch(() => toast.error("Falhou a carregar Google Login."));

    return () => { cancelled = true; };
  }, [onCredential]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <button
        type="button"
        disabled
        className="w-full border border-rp-border px-4 py-3 text-rp-mute2 text-[11px] font-mono uppercase tracking-[0.14em] opacity-70"
      >
        Google Login · falta Client ID
      </button>
    );
  }

  return (
    <div className="w-full">
      <div ref={buttonRef} className="min-h-[44px] w-full overflow-hidden" aria-label={label} />
      {!ready && (
        <button
          type="button"
          disabled
          className="w-full border border-rp-border px-4 py-3 text-rp-mute2 text-[11px] font-mono uppercase tracking-[0.14em] opacity-70"
        >
          A carregar Google...
        </button>
      )}
    </div>
  );
}
