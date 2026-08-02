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
 */
export function StudioNavProvider({ children }) {
  const [sessionBackHandler, setSessionBackHandler] = useState(null);
  const handlerRef = useRef(null);
  const trapArmedRef = useRef(false);
  const ignoreNextPopRef = useRef(false);

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

  const performStudioBack = useCallback(() => {
    const handler = handlerRef.current;
    if (typeof handler === "function") {
      handler();
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    const onPop = () => {
      if (ignoreNextPopRef.current) {
        ignoreNextPopRef.current = false;
        trapArmedRef.current = false;
        return;
      }

      const handler = handlerRef.current;
      trapArmedRef.current = false;

      if (typeof handler !== "function") return;

      handler();

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
