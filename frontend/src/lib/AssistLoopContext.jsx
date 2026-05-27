import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./auth";
import { getAssistLoopAgentId, isAssistLoopEnabled, loadAssistLoopScript } from "./assistLoop";

const AssistLoopContext = createContext({
  enabled: false,
  ready: false,
  openSofia: () => {},
});

export function useAssistLoop() {
  return useContext(AssistLoopContext);
}

export function AssistLoopProvider({ children }) {
  const { user } = useAuth();
  const agentId = getAssistLoopAgentId();
  const enabled = isAssistLoopEnabled();
  const widgetRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) {
      document.body.classList.remove("rp-assistloop-menu");
      setReady(false);
      return undefined;
    }

    document.body.classList.add("rp-assistloop-menu");
    let cancelled = false;

    (async () => {
      try {
        const AssistLoopWidget = await loadAssistLoopScript();
        if (cancelled) return;

        const instance = AssistLoopWidget.init({
          agentId,
          restoreOpenState: false,
          position: "right",
          identityMode: "optional",
          identityProvider: async () => {
            if (!user?.id) return { chatUserId: null, identityToken: null };
            return {
              chatUserId: String(user.id),
              identityToken: null,
            };
          },
          theme: {
            primaryColor: "#7C3AED",
            bubbleSize: "56px",
            backgroundColor: "#0B0B0C",
          },
        });

        widgetRef.current = instance;
        setReady(true);
      } catch (err) {
        console.warn("[AssistLoop]", err?.message || err);
        document.body.classList.remove("rp-assistloop-menu");
        setReady(false);
      }
    })();

    return () => {
      cancelled = true;
      document.body.classList.remove("rp-assistloop-menu");
    };
  }, [enabled, agentId, user?.id]);

  const openSofia = useCallback(() => {
    const widget = widgetRef.current;
    if (widget && typeof widget.open === "function") {
      widget.open();
      return true;
    }
    return false;
  }, []);

  const value = useMemo(
    () => ({
      enabled,
      ready,
      openSofia,
    }),
    [enabled, ready, openSofia],
  );

  return <AssistLoopContext.Provider value={value}>{children}</AssistLoopContext.Provider>;
}
