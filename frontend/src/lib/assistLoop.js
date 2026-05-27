const SCRIPT_SRC = "https://assistloop.ai/assistloop-widget.js";
const SCRIPT_ATTR = "data-assistloop-widget";

/** Agent ID from CRA build, Vercel AssistLoop integration, or runtime injection. */
export function getAssistLoopAgentId() {
  const react = String(process.env.REACT_APP_ASSISTLOOP_AGENT_ID || "").trim();
  if (react) return react;

  const next = String(process.env.NEXT_PUBLIC_ASSISTLOOP_AGENT_ID || "").trim();
  if (next) return next;

  if (typeof window !== "undefined") {
    const runtime = window.__ASSISTLOOP_WIDGET_ENV__ || {};
    const runtimeId = String(
      runtime.REACT_APP_ASSISTLOOP_AGENT_ID || runtime.NEXT_PUBLIC_ASSISTLOOP_AGENT_ID || "",
    ).trim();
    if (runtimeId) return runtimeId;
  }

  return "";
}

export function isAssistLoopEnabled() {
  return getAssistLoopAgentId().length > 0;
}

let scriptPromise = null;

export function loadAssistLoopScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("AssistLoop requires a browser environment."));
  }
  if (window.AssistLoopWidget) {
    return Promise.resolve(window.AssistLoopWidget);
  }
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[${SCRIPT_ATTR}]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.AssistLoopWidget));
      existing.addEventListener("error", () => reject(new Error("AssistLoop script failed to load.")));
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.setAttribute(SCRIPT_ATTR, "1");
    script.onload = () => {
      if (window.AssistLoopWidget) resolve(window.AssistLoopWidget);
      else reject(new Error("AssistLoop widget API missing after load."));
    };
    script.onerror = () => reject(new Error("AssistLoop script failed to load."));
    document.body.appendChild(script);
  });

  return scriptPromise;
}
