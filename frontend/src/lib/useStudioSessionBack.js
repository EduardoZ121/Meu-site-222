import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useStudioNav } from "./StudioNavContext";

/**
 * Regista handler de voltar da sessão (limpa automaticamente no unmount).
 * Aceita função ou path string (ex.: "/app/tools").
 * Paths usam navigate(..., { replace: true }) para não empilhar hubs por cima
 * do trap (no APK isso fazia o voltar saltar várias sessões).
 *
 * @param {string|Function|null|undefined} handlerOrPath
 * @param {boolean} [enabled=true] — false = não regista (ex.: VideoFlow a redireccionar)
 */
export function useStudioSessionBack(handlerOrPath, enabled = true) {
  const navigate = useNavigate();
  const { registerSessionBack } = useStudioNav();
  const handlerRef = useRef(handlerOrPath);
  handlerRef.current = handlerOrPath;

  useEffect(() => {
    if (!enabled || handlerOrPath == null) {
      return registerSessionBack(null);
    }

    return registerSessionBack(() => {
      const h = handlerRef.current;
      if (typeof h === "function") {
        h();
        return;
      }
      if (typeof h === "string" && h) {
        navigate(h, { replace: true });
      }
    });
  }, [registerSessionBack, navigate, enabled, handlerOrPath == null]);
}
