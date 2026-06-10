import { useEffect } from "react";
import { toast } from "sonner";
import { CLIENT_BUILD_ID } from "../lib/buildInfo";

/** Avisa quando o browser tem JS antigo em cache. */
export default function BuildVersionGuard() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/health", { cache: "no-store" });
        if (!r.ok || cancelled) return;
        const data = await r.json();
        const serverBuild = String(data.build || "");
        if (!serverBuild || serverBuild === CLIENT_BUILD_ID) return;
        toast.error("Nova versão disponível. Recarrega a página.", {
          duration: 15000,
          id: "rp-build-mismatch",
          action: {
            label: "Recarregar",
            onClick: () => window.location.reload(),
          },
        });
      } catch {
        /* offline */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
