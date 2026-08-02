import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useStudioNav } from "./StudioNavContext";

/**
 * Regista handler de voltar da sessão (limpa automaticamente no unmount).
 * Aceita função ou path string (ex.: "/app/tools").
 * Usa ref estável para o handler mudar (ex. passo do wizard) sem rearmar o histórico.
 */
export function useStudioSessionBack(handlerOrPath) {
  const navigate = useNavigate();
  const { registerSessionBack } = useStudioNav();
  const handlerRef = useRef(handlerOrPath);
  handlerRef.current = handlerOrPath;

  useEffect(() => {
    return registerSessionBack(() => {
      const h = handlerRef.current;
      if (typeof h === "function") {
        h();
        return;
      }
      if (typeof h === "string" && h) {
        navigate(h);
      }
    });
  }, [registerSessionBack, navigate]);
}
