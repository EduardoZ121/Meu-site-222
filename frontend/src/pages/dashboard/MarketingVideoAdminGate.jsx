import { Navigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { canAccessVideoFeatures } from "../../lib/isAdmin";

/** Admin-only preview — Vídeos de Marketing com IA */
export default function MarketingVideoAdminGate({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-[40vh] bg-rp-bg" />;
  if (!canAccessVideoFeatures(user)) return <Navigate to="/app/tools" replace />;
  return children;
}
