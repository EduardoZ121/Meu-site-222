import { Outlet, useLocation, useOutletContext } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import StudioTopBar from "../components/StudioTopBar";
import { getWorkspaceHeaderKey } from "../lib/dashboardRouteMode";

/**
 * Layout de sessão/estúdio — substitui o header global; workspace ocupa o viewport disponível.
 */
export default function StudioWorkspaceLayout() {
  const { openMobileNav } = useOutletContext() || {};
  const { pathname } = useLocation();
  const titleKey = getWorkspaceHeaderKey(pathname);

  return (
    <div
      className="flex-1 min-w-0 flex flex-col min-h-0 h-[100dvh] md:h-full md:min-h-screen"
      data-testid="studio-workspace-layout"
    >
      <StudioTopBar
        titleKey={titleKey}
        onOpenNav={openMobileNav}
        showNavButton
      />
      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y px-4 sm:px-5 md:px-8 py-5 md:py-6"
          data-testid="studio-workspace-main"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
