import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

let gsiInitialized = false;

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
  const onCredentialRef = useRef(onCredential);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    let cancelled = false;
    if (!GOOGLE_CLIENT_ID) return undefined;

    loadGoogleScript()
      .then((google) => {
        if (cancelled || !buttonRef.current) return;

        if (!gsiInitialized) {
          google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response) => {
              if (response?.credential) onCredentialRef.current?.(response.credential);
              else toast.error("Não foi possível validar a conta Google.");
            },
            ux_mode: "popup",
            auto_select: false,
            error_callback: (err) => {
              const type = String(err?.type || err || "");
              if (/popup_closed|user_cancelled/i.test(type)) return;
              const origin = typeof window !== "undefined" ? window.location.origin : "";
              console.warn("[Google Login]", type, err);
              toast.error(
                type.includes("origin") || type.includes("client")
                  ? `Google bloqueou este domínio (${origin}). Confirma em Google Cloud → Credenciais → Origens autorizadas: ${origin}`
                  : "Google bloqueou o login. Verifica Utilizadores de teste (modo Teste) ou publica a app OAuth.",
                { duration: 14000 },
              );
            },
          });
          gsiInitialized = true;
        }

        google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          type: "standard",
          shape: "rectangular",
          text: "continue_with",
          width: Math.max(buttonRef.current.offsetWidth || 0, 320),
        });
        setReady(true);
      })
      .catch(() => toast.error("Falhou a carregar Google Login."));

    return () => { cancelled = true; };
  }, []);

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
      {!ready && (
        <button
          type="button"
          disabled
          className="w-full border border-rp-border px-4 py-3 text-rp-mute2 text-[11px] font-mono uppercase tracking-[0.14em] opacity-70 mb-2"
        >
          A carregar Google...
        </button>
      )}
      <div
        ref={buttonRef}
        className={`min-h-[44px] w-full overflow-hidden rounded-lg bg-white ${ready ? "" : "hidden"}`}
        aria-label={label}
        data-testid="google-auth-button"
      />
    </div>
  );
}
