import { useScrollToResultOnComplete } from "../lib/useScrollToResultOnComplete";

/** Wraps the result preview column; scrolls into view when generation completes. */
export default function StudioResultAnchor({ busy, ready, children, className = "", anchorRef }) {
  const scrollRef = useScrollToResultOnComplete(ready, busy);

  const setRef = (node) => {
    scrollRef.current = node;
    if (typeof anchorRef === "function") anchorRef(node);
    else if (anchorRef) anchorRef.current = node;
  };

  return (
    <div
      ref={setRef}
      className={`scroll-mt-28 studio-result-anchor ${className}`.trim()}
      data-testid="studio-result-anchor"
    >
      {children}
    </div>
  );
}
