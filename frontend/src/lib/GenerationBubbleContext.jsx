import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { normalizeCreation, primaryResultUrl } from "./creationUrls";
import { activeBackgroundJobsCount } from "./bgGeneration";

const BUSY_KEY = "rp-gen-bubble-busy";
const READY_KEY = "rp-gen-bubble-ready";

const GenerationBubbleContext = createContext(null);

function readBusyFlag() {
  try {
    return sessionStorage.getItem(BUSY_KEY) === "1";
  } catch {
    return false;
  }
}

function writeBusyFlag(on) {
  try {
    if (on) sessionStorage.setItem(BUSY_KEY, "1");
    else sessionStorage.removeItem(BUSY_KEY);
  } catch {
    /* ignore */
  }
}

function readReadyResult() {
  try {
    const raw = sessionStorage.getItem(READY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const normalized = normalizeCreation(parsed);
    if (!primaryResultUrl(normalized) && !normalized?.id) return null;
    return normalized;
  } catch {
    return null;
  }
}

function writeReadyResult(creation) {
  try {
    if (!creation) {
      sessionStorage.removeItem(READY_KEY);
      return;
    }
    const normalized = normalizeCreation(creation);
    if (!primaryResultUrl(normalized) && !normalized?.id) return;
    sessionStorage.setItem(READY_KEY, JSON.stringify(normalized));
  } catch {
    /* ignore */
  }
}

function hasPendingJobs() {
  return activeBackgroundJobsCount() > 0;
}

export function GenerationBubbleProvider({ children }) {
  const [busy, setBusy] = useState(() => readBusyFlag() || hasPendingJobs());
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(() => readReadyResult());
  const onChangeRef = useRef(null);

  const applyBusy = useCallback((on) => {
    setBusy(Boolean(on));
    writeBusyFlag(Boolean(on));
  }, []);

  const applyResult = useCallback((creation) => {
    if (!creation) {
      setResult(null);
      writeReadyResult(null);
      return;
    }
    const normalized = normalizeCreation(creation);
    if (!primaryResultUrl(normalized) && !normalized?.id) return;
    setResult(normalized);
    writeReadyResult(normalized);
  }, []);

  /**
   * Pages call this while mounted. Unmount must NOT clear busy/result —
   * navigation away keeps the shell bubble alive.
   */
  const report = useCallback(({ busy: nextBusy, progress: nextProgress, result: nextResult, onChange } = {}) => {
    if (typeof onChange === "function") onChangeRef.current = onChange;
    if (typeof nextProgress === "number" && Number.isFinite(nextProgress)) {
      setProgress(nextProgress);
    }

    if (nextBusy) {
      applyBusy(true);
      // New run: drop previous ready thumb so the spinner is unambiguous.
      if (nextResult == null) applyResult(null);
    }

    if (nextResult) {
      applyResult(nextResult);
      applyBusy(false);
      return;
    }

    if (nextBusy === false) {
      // Local page finished; bg jobs may still be running (e.g. Motion Flyer).
      if (hasPendingJobs()) applyBusy(true);
      else applyBusy(false);
    }
  }, [applyBusy, applyResult]);

  const dismiss = useCallback(() => {
    applyBusy(false);
    applyResult(null);
    setProgress(0);
    const cb = onChangeRef.current;
    onChangeRef.current = null;
    try {
      cb?.(null);
    } catch {
      /* ignore */
    }
  }, [applyBusy, applyResult]);

  const setResultFromUi = useCallback((creation) => {
    if (creation == null) {
      dismiss();
      return;
    }
    applyResult(creation);
    applyBusy(false);
  }, [applyBusy, applyResult, dismiss]);

  // Global completion / failure — keeps bubble correct after route changes.
  useEffect(() => {
    const onSucceeded = (event) => {
      const creation = event?.detail;
      if (!creation) return;
      const normalized = normalizeCreation(creation);
      if (!primaryResultUrl(normalized) && !normalized?.id) return;
      applyResult(normalized);
      applyBusy(false);
      setProgress(0);
    };
    const onFailed = () => {
      if (!hasPendingJobs()) applyBusy(false);
    };
    const onFinished = (event) => {
      const status = event?.detail?.status;
      if (status === "failed" && !hasPendingJobs()) applyBusy(false);
      if (status === "succeeded" && hasPendingJobs()) applyBusy(true);
    };

    window.addEventListener("rp:creation-succeeded", onSucceeded);
    window.addEventListener("rp:prediction-failed", onFailed);
    window.addEventListener("rp:prediction-finished", onFinished);
    return () => {
      window.removeEventListener("rp:creation-succeeded", onSucceeded);
      window.removeEventListener("rp:prediction-failed", onFailed);
      window.removeEventListener("rp:prediction-finished", onFinished);
    };
  }, [applyBusy, applyResult]);

  // Recover busy after remount / refresh while predictions still track in localStorage.
  useEffect(() => {
    const tick = () => {
      if (hasPendingJobs()) applyBusy(true);
    };
    tick();
    const id = window.setInterval(tick, 2500);
    return () => window.clearInterval(id);
  }, [applyBusy]);

  const value = useMemo(
    () => ({
      busy,
      progress,
      result,
      report,
      dismiss,
      setResultFromUi,
    }),
    [busy, progress, result, report, dismiss, setResultFromUi],
  );

  return (
    <GenerationBubbleContext.Provider value={value}>
      {children}
    </GenerationBubbleContext.Provider>
  );
}

export function useGenerationBubble() {
  const ctx = useContext(GenerationBubbleContext);
  if (!ctx) {
    throw new Error("useGenerationBubble must be used within GenerationBubbleProvider");
  }
  return ctx;
}

export function useGenerationBubbleOptional() {
  return useContext(GenerationBubbleContext);
}
