import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { scrollStudioToTop } from "./scrollToStudioResult";

/** Resets the app scroll container when the route changes (hub or workspace). */
export function useStudioScrollToTopOnNavigate() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    scrollStudioToTop("auto");
  }, [pathname]);
}
