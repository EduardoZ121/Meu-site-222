import { useEffect, useRef, useState } from "react";
import { checkRegisteredEmail } from "./checkRegisteredEmail";

/**
 * Debounced email lookup — exists → login; new → register.
 */
export function useAuthEmailStatus(email, { enabled = true } = {}) {
  const [status, setStatus] = useState("idle");
  const [info, setInfo] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      setInfo(null);
      return undefined;
    }

    const normalized = String(email || "").trim().toLowerCase();
    if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setStatus("idle");
      setInfo(null);
      return undefined;
    }

    setStatus("checking");
    timerRef.current = setTimeout(async () => {
      const data = await checkRegisteredEmail(normalized);
      setInfo(data);
      if (data.exists) setStatus("exists");
      else if (data.can_register) setStatus("new");
      else setStatus("idle");
    }, 450);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [email, enabled]);

  return { status, info };
}
