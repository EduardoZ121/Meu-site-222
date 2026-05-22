import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import StudioTopBar from "../components/StudioTopBar";
import { getWorkspaceHeaderKey } from "../lib/dashboardRouteMode";

/**
 * Layout de sessão/estúdio — header próprio, viewport cheio, sem header global nem menu lateral mobile.
 */
export default function StudioWorkspaceLayout() {
  const { pathname } = useLocation();
  const titleKey = getWorkspaceHeaderKey(pathname);

  return (
    <div
      className="rp-workspace-layout flex-1 min-w-0 w-full max-w-[100vw] flex flex-col min-h-0 h-full overflow-hidden"
      data-testid="studio-workspace-layout"
    >
      <StudioTopBar titleKey={titleKey} />
      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="rp-workspace-main flex-1 min-h-0 w-full max-w-full overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y"
          data-testid="studio-workspace-main"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
