import { createContext, useCallback, useContext, useMemo, useState } from "react";

const StudioNavContext = createContext(null);

/**
 * Permite que páginas do workspace registem um handler de "voltar" interno
 * (ex.: grelha → variantes → editor) antes de sair para /app/tools.
 */
export function StudioNavProvider({ children }) {
  const [sessionBackHandler, setSessionBackHandler] = useState(null);

  const registerSessionBack = useCallback((handler) => {
    setSessionBackHandler(() => handler || null);
    return () => {
      setSessionBackHandler((current) => (current === handler ? null : current));
    };
  }, []);

  const value = useMemo(
    () => ({ sessionBackHandler, registerSessionBack }),
    [sessionBackHandler, registerSessionBack],
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
