import { Navigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { isAdminUser } from "../../lib/isAdmin";
import BrandCampaign from "./BrandCampaign";

/** Campanha On-Brand — apenas administradores (oculto do público por enquanto). */
export default function BrandCampaignGate() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-[40vh] bg-rp-bg" />;
  if (!isAdminUser(user)) {
    return <Navigate to="/app/tools" replace />;
  }
  return <BrandCampaign />;
}
