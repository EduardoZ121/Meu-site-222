import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { normalizeCreation, primaryResultUrl } from "./creationUrls";
import { useI18n } from "./i18n";
import { useAuth } from "./auth";

/**
 * Atualiza resultado / créditos quando uma geração em segundo plano termina.
 */
export function useStudioBackgroundGeneration({ onComplete, enabled = true }) {
  const { t } = useI18n();
  const { refresh } = useAuth();
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!enabled) return undefined;

    const onOk = async (event) => {
      const creation = normalizeCreation(event.detail);
      if (!primaryResultUrl(creation)) return;
      onCompleteRef.current?.(creation);
      const spent = creation?.credits_spent ?? 0;
      toast.success(t("common_generated", { n: spent }));
      try {
        await refresh();
      } catch {
        /* ignore */
      }
    };

    const onFail = (event) => {
      const msg = String(event.detail?.error || "").trim();
      if (msg) toast.error(msg, { duration: 9000 });
    };

    window.addEventListener("rp:creation-succeeded", onOk);
    window.addEventListener("rp:prediction-failed", onFail);
    return () => {
      window.removeEventListener("rp:creation-succeeded", onOk);
      window.removeEventListener("rp:prediction-failed", onFail);
    };
  }, [enabled, refresh, t]);
}
