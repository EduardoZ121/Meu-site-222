import { Outlet, useLocation } from "react-router-dom";
import StudioTopBar from "../components/StudioTopBar";
import { getWorkspaceHeaderKey } from "../lib/dashboardRouteMode";
import { StudioNavProvider } from "../lib/StudioNavContext";
import { useStudioScrollToTopOnNavigate } from "../lib/useStudioScrollToTopOnNavigate";

/**
 * Layout de sessão/estúdio — header próprio, viewport cheio, sem header global nem menu lateral mobile.
 * Sem AnimatePresence no main — evita ecrã preto quando a animação de opacity fica presa em 0.
 */
export default function StudioWorkspaceLayout() {
  useStudioScrollToTopOnNavigate();
  const { pathname } = useLocation();
  const titleKey = getWorkspaceHeaderKey(pathname);

  return (
    <StudioNavProvider>
      <div
        className="rp-workspace-layout flex-1 min-w-0 w-full max-w-[100vw] flex flex-col min-h-0 h-full overflow-hidden"
        data-testid="studio-workspace-layout"
      >
        <StudioTopBar titleKey={titleKey} />
        <main
          key={pathname}
          className="rp-workspace-main rp-workspace-main--compact flex-1 min-h-0 w-full max-w-full overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y"
          data-studio-scroll-root=""
          data-testid="studio-workspace-main"
        >
          <Outlet />
        </main>
      </div>
    </StudioNavProvider>
  );
}
