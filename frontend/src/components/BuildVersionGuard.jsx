import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CLIENT_BUILD_ID } from "../lib/buildInfo";

/**
 * Avisa e recarrega quando o browser tem JS antigo em cache.
 */
export default function BuildVersionGuard() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/health", { cache: "no-store" });
        if (!r.ok || cancelled) return;
        const data = await r.json();
        const serverBuild = String(data.build || "");
        if (!serverBuild || serverBuild === CLIENT_BUILD_ID || dismissed) return;
        toast.error("Nova versão do site disponível. Recarrega para corrigir o upload.", {
          duration: 20000,
          id: "rp-build-mismatch",
          action: {
            label: "Recarregar agora",
            onClick: () => {
              const u = new URL(window.location.href);
              u.searchParams.set("rp_refresh", String(Date.now()));
              window.location.replace(u.toString());
            },
          },
        });
      } catch {
        /* offline — ignorar */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dismissed]);

  return null;
}
