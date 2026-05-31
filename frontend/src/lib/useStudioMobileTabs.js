import { useCallback, useState } from "react";

/** Mobile create/result panel switcher for studio tools. */
export function useStudioMobileTabs(initialTab = "create", breakpoint = "xl") {
  const [mobileTab, setMobileTab] = useState(initialTab);
  const wide = breakpoint === "lg" ? "lg" : "xl";

  const panelVisibility = useCallback(
    (tab) => (mobileTab !== tab ? `hidden ${wide}:block` : ""),
    [mobileTab, wide],
  );

  const focusResultPanel = useCallback(() => {
    setMobileTab("result");
    window.requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent("rp:scroll-to-result"));
    });
  }, []);

  return { mobileTab, setMobileTab, panelVisibility, focusResultPanel };
}
