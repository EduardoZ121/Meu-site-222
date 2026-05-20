import { useEffect, useRef } from "react";

/**
 * When generation finishes (busy → idle) and `ready` is true, scrolls the anchor into view.
 * Use on the result panel / aside wrapper.
 */
export function useScrollToResultOnComplete(ready, busy) {
  const ref = useRef(null);
  const wasBusyRef = useRef(false);

  useEffect(() => {
    if (busy) {
      wasBusyRef.current = true;
      return;
    }
    if (!wasBusyRef.current || !ready) return;
    wasBusyRef.current = false;

    const timer = window.setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);

    return () => window.clearTimeout(timer);
  }, [ready, busy]);

  return ref;
}
