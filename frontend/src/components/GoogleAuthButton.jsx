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
          error_callback: (err) => {
            const type = String(err?.type || err || "");
            if (/popup_closed|user_cancelled/i.test(type)) return;
            const origin = typeof window !== "undefined" ? window.location.origin : "";
            console.warn("[Google Login]", type, err);
            toast.error(
              type.includes("origin") || type.includes("client")
                ? `Google bloqueou este domínio (${origin}). Confirma em Google Cloud → Credenciais → Origens: ${origin}`
                : "Google bloqueou o login. No Google Cloud: Utilizadores de teste (modo Teste) ou Publicar app. Ver docs/GOOGLE-LOGIN.md",
              { duration: 14000 },
            );
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
    // Sem client ID configurado — não mostrar botão partido aos utilizadores.
    return null;
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
