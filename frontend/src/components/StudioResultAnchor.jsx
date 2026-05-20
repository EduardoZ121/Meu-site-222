import { useScrollToResultOnComplete } from "../lib/useScrollToResultOnComplete";

/** Wraps the result preview column; scrolls into view when generation completes. */
export default function StudioResultAnchor({ busy, ready, children, className = "" }) {
  const ref = useScrollToResultOnComplete(ready, busy);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
