import { useCallback, useEffect, useRef } from "react";
import { scrollElementIntoStudioView } from "./scrollToStudioResult";

/**
 * Quando a geração termina (busy → idle) e `ready` é true, faz scroll ao painel de resultado.
 * Só corre com o componente montado (utilizador ainda na sessão) e separador visível.
 * Também reage a `rp:scroll-to-result` (disparado ao concluir poll na API).
 */
export function useScrollToResultOnComplete(ready, busy) {
  const ref = useRef(null);
  const wasBusyRef = useRef(false);
  const pendingScrollRef = useRef(false);

  const performScroll = useCallback(() => {
    if (typeof document === "undefined") return;
    if (document.visibilityState === "hidden") return;
    scrollElementIntoStudioView(ref.current);
  }, []);

  useEffect(() => {
    const onRequest = () => {
      pendingScrollRef.current = true;
    };
    window.addEventListener("rp:scroll-to-result", onRequest);
    return () => window.removeEventListener("rp:scroll-to-result", onRequest);
  }, []);

  useEffect(() => {
    if (busy) {
      wasBusyRef.current = true;
      return undefined;
    }

    const shouldScroll =
      (wasBusyRef.current && ready)
      || (pendingScrollRef.current && ready);

    if (!shouldScroll) return undefined;

    wasBusyRef.current = false;
    pendingScrollRef.current = false;

    const delays = [80, 320, 720, 1200];
    const timers = delays.map((ms) => window.setTimeout(performScroll, ms));

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [ready, busy, performScroll]);

  return ref;
}
