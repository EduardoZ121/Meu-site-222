import { useEffect } from "react";
import { toast } from "sonner";
import { CLIENT_BUILD_ID } from "../lib/buildInfo";
import {
  markStaleBuildToastShown,
  shouldShowStaleBuildToast,
} from "../lib/clientBuildSync";

/** Avisa 1× por deploy quando o browser ainda tem JS antigo após reload automático. */
export default function BuildVersionGuard() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/health", { cache: "no-store" });
        if (!r.ok || cancelled) return;
        const data = await r.json();
        const serverBuild = String(data.build || "");
        if (!shouldShowStaleBuildToast(serverBuild)) return;

        markStaleBuildToastShown(serverBuild);
        toast.error("Nova versão disponível. Recarrega a página.", {
          duration: 12000,
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
