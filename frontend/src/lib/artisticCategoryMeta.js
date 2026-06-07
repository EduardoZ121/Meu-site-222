import {
  Camera,
  Sparkles,
  Shapes,
  Brush,
  Zap,
  Frame,
  LayoutGrid,
  Mountain,
  Clock,
  FlaskConical,
} from "lucide-react";

export const ARTISTIC_CATEGORY_META = {
  photography: { icon: Camera, emoji: "📷" },
  anime_manga: { icon: Sparkles, emoji: "🎌" },
  cartoon: { icon: Shapes, emoji: "🧸" },
  illustration: { icon: Brush, emoji: "🖌" },
  digital: { icon: Zap, emoji: "🌌" },
  classic: { icon: Frame, emoji: "🖼" },
  modern: { icon: LayoutGrid, emoji: "✨" },
  fantasy: { icon: Mountain, emoji: "⚔" },
  vintage: { icon: Clock, emoji: "📼" },
  nsfw: { icon: FlaskConical, emoji: "🔥" },
};

export function getCategoryMeta(catId) {
  return ARTISTIC_CATEGORY_META[catId] || { icon: Sparkles, emoji: "✦" };
}
