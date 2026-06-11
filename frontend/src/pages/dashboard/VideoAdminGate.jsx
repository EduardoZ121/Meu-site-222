import { Navigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { canAccessVideoFeatures } from "../../lib/isAdmin";

/** Bloqueia /app/video* para contas normais — só admin. */
export default function VideoAdminGate({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-[40vh] bg-rp-bg" />;
  if (!canAccessVideoFeatures(user)) return <Navigate to="/app/tools" replace />;
  return children;
}
