import { useAuth } from "../../lib/auth";
import BrandCampaign from "./BrandCampaign";

/** Campanha On-Brand — disponível para todos os utilizadores autenticados. */
export default function BrandCampaignGate() {
  const { loading } = useAuth();
  if (loading) return <div className="min-h-[40vh] bg-rp-bg" />;
  return <BrandCampaign />;
}
