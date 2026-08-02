import {
  Bell,
  Clapperboard,
  Coins,
  Heart,
  ImageIcon,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";

/**
 * Resolve ícone + tom visual a partir do tipo da notificação.
 * Vídeo nunca reutiliza o ícone de imagem.
 */
export function resolveNotificationVisual(n) {
  const type = String(n?.type || "");
  const creationType = String(n?.creationType || n?.typeLabel || "").toLowerCase();
  const href = String(n?.href || "").toLowerCase();
  const titleKey = String(n?.titleKey || "").toLowerCase();

  const isVideo =
    creationType === "video"
    || creationType.includes("video")
    || href.includes("/video")
    || titleKey.includes("video");

  if (type === "generation") {
    if (isVideo) {
      return { Icon: Clapperboard, tone: "video", label: "video" };
    }
    return { Icon: ImageIcon, tone: "image", label: "image" };
  }

  if (type === "generation_failed") {
    return { Icon: TriangleAlert, tone: "error", label: "error" };
  }

  if (type === "credits_refund") {
    return { Icon: RotateCcw, tone: "credits", label: "refund" };
  }

  if (type === "credits_spent" || type === "credits_low") {
    return { Icon: Coins, tone: "credits", label: "credits" };
  }

  if (type === "favorite") {
    return { Icon: Heart, tone: "favorite", label: "favorite" };
  }

  return { Icon: Bell, tone: "info", label: "info" };
}
