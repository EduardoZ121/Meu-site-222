import { Megaphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { canAccessVideoFeatures } from "../../lib/isAdmin";
import { queuePosterForMotionFlyer } from "../../lib/posterMotionFlyerBridge";

/**
 * Opcional — leva o póster gerado para Motion Flyer (admin preview).
 * Só renderiza quando há imagem pronta e o utilizador tem acesso ao Motion Flyer.
 */
export default function PosterMotionFlyerButton({
  imageUrl,
  creationId = "",
  aspectRatio = "",
  className = "",
  testId = "poster-motion-flyer-cta",
  compact = false,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

  const url = String(imageUrl || "").trim();
  if (!url || !canAccessVideoFeatures(user)) return null;

  const handleClick = () => {
    queuePosterForMotionFlyer({ imageUrl: url, creationId, aspectRatio });
    navigate("/app/motion-flyer");
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`min-h-10 flex-1 flex items-center justify-center gap-1 rounded border border-fuchsia-500/40 text-fuchsia-200 hover:border-fuchsia-400 hover:text-white text-[10px] uppercase tracking-wider transition-colors ${className}`}
        data-testid={testId}
        title={t("post_mfly_cta_hint")}
      >
        <Megaphone className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline">{t("post_mfly_cta")}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-fuchsia-500/35 bg-fuchsia-500/10 text-fuchsia-100 hover:bg-fuchsia-500/20 hover:border-fuchsia-400/60 text-[12.5px] font-medium transition-colors ${className}`}
      data-testid={testId}
    >
      <Megaphone className="w-4 h-4 shrink-0" />
      <span>{t("post_mfly_cta")}</span>
    </button>
  );
}
