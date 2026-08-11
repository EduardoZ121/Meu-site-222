import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { canAccessVideoFeatures } from "../../lib/isAdmin";

/** Vídeo IA — só admin até estabilizar upload e fila. */
export default function VideoAdminGate({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="min-h-[40vh] bg-rp-bg" />;
  if (!canAccessVideoFeatures(user)) {
    return (
      <Navigate
        to="/app/tools"
        replace
        state={{
          videoAccessDenied: true,
          from: loc.pathname,
          email: user?.email || "",
        }}
      />
    );
  }
  return children;
}
