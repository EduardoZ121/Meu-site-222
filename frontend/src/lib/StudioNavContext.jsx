import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const StudioNavContext = createContext(null);

/**
 * Workspace back navigation.
 * - Seta do header: um passo via performStudioBack()
 * - Botão físico Voltar (APK/TWA/Android): intercepta popstate, um passo por toque
 *
 * Trap (`rpStudioBack`) + overlays (`rpOverlay`) partilham o canal popstate —
 * o onPop distingue: se ainda há `rpStudioBack` no estado actual, foi só fechar
 * overlay; senão consome a sessão (um nível).
 */
export function StudioNavProvider({ children }) {
  const [sessionBackHandler, setSessionBackHandler] = useState(null);
  const handlerRef = useRef(null);
  const trapArmedRef = useRef(false);
  const ignoreNextPopRef = useRef(false);
  const pendingExitRef = useRef(null);

  handlerRef.current = sessionBackHandler;

  const armTrap = useCallback(() => {
    if (trapArmedRef.current) return;
    try {
      if (window.history.state?.rpStudioBack) {
        trapArmedRef.current = true;
        return;
      }
      window.history.pushState(
        { ...(window.history.state || {}), rpStudioBack: true },
        "",
        window.location.href,
      );
      trapArmedRef.current = true;
    } catch {
      /* histórico indisponível */
    }
  }, []);

  /** Remove a marca sem dar history.back() (evita saltar rotas no unmount). */
  const disarmTrapQuietly = useCallback(() => {
    if (!trapArmedRef.current && !window.history.state?.rpStudioBack) return;
    trapArmedRef.current = false;
    try {
      if (window.history.state?.rpStudioBack) {
        const next = { ...(window.history.state || {}) };
        delete next.rpStudioBack;
        window.history.replaceState(next, "", window.location.href);
      }
    } catch {
      /* ignora */
    }
  }, []);

  const registerSessionBack = useCallback((handler) => {
    setSessionBackHandler(() => handler || null);
    if (handler) {
      queueMicrotask(armTrap);
    } else {
      disarmTrapQuietly();
    }
    return () => {
      setSessionBackHandler(null);
      disarmTrapQuietly();
    };
  }, [armTrap, disarmTrapQuietly]);

  /**
   * Um passo de sessão: consome o trap do histórico (se existir) e corre o handler.
   * O handler deve preferir navigate(..., { replace: true }) para não deixar fantasmas.
   */
  const performStudioBack = useCallback(() => {
    const handler = handlerRef.current;
    if (typeof handler !== "function") return false;

    const runExit = () => {
      pendingExitRef.current = null;
      try {
        handler();
      } catch {
        /* handler falhou — não rearmar */
      }
    };

    try {
      if (window.history.state?.rpStudioBack) {
        ignoreNextPopRef.current = true;
        trapArmedRef.current = false;
        pendingExitRef.current = runExit;
        window.history.back();
        // Fallback se popstate não disparar (alguns WebViews)
        window.setTimeout(() => {
          if (pendingExitRef.current === runExit) {
            ignoreNextPopRef.current = false;
            runExit();
          }
        }, 120);
        return true;
      }
    } catch {
      /* cai no exit directo */
    }

    disarmTrapQuietly();
    runExit();
    return true;
  }, [disarmTrapQuietly]);

  useEffect(() => {
    const onPop = () => {
      if (ignoreNextPopRef.current) {
        ignoreNextPopRef.current = false;
        trapArmedRef.current = false;
        const pending = pendingExitRef.current;
        pendingExitRef.current = null;
        if (typeof pending === "function") {
          pending();
        }
        return;
      }

      // Overlay fechado por cima do trap → ainda estamos no marcador da sessão.
      if (window.history.state?.rpStudioBack) {
        trapArmedRef.current = true;
        return;
      }

      const handler = handlerRef.current;
      trapArmedRef.current = false;

      if (typeof handler !== "function") return;

      try {
        handler();
      } catch {
        /* ignora */
      }

      // Se a sessão continua montada (passo interno: wizard/posters), rearmar trap.
      requestAnimationFrame(() => {
        if (handlerRef.current) armTrap();
      });
    };

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [armTrap]);

  const value = useMemo(
    () => ({
      sessionBackHandler,
      registerSessionBack,
      performStudioBack,
      armStudioBackTrap: armTrap,
    }),
    [sessionBackHandler, registerSessionBack, performStudioBack, armTrap],
  );

  return (
    <StudioNavContext.Provider value={value}>
      {children}
    </StudioNavContext.Provider>
  );
}

export function useStudioNav() {
  const ctx = useContext(StudioNavContext);
  if (!ctx) {
    throw new Error("useStudioNav must be used within StudioNavProvider");
  }
  return ctx;
}
