import { useEffect } from "react";
import { useStudioNav } from "./StudioNavContext";

/** Regista handler de voltar da sessão (limpa automaticamente no unmount). */
export function useStudioSessionBack(handler) {
  const { registerSessionBack } = useStudioNav();

  useEffect(() => {
    if (!handler) return registerSessionBack(null);
    return registerSessionBack(handler);
  }, [handler, registerSessionBack]);
}
