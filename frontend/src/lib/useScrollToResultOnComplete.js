import { useCallback, useEffect, useRef } from "react";
import { scrollElementIntoStudioView } from "./scrollToStudioResult";

/**
 * Quando a geração termina (busy → idle) e `ready` é true, faz scroll ao painel de resultado.
 * Também reage a `rp:scroll-to-result` (disparado ao concluir geração na API).
 */
export function useScrollToResultOnComplete(ready, busy) {
  const ref = useRef(null);
  const wasBusyRef = useRef(false);
  const pendingScrollRef = useRef(false);

  const performScroll = useCallback(() => {
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

    const t1 = window.setTimeout(performScroll, 60);
    const t2 = window.setTimeout(performScroll, 350);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [ready, busy, performScroll]);

  return ref;
}
