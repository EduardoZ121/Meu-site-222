import {
  Wand2, Image as ImageIcon, Scissors, Maximize2, Sparkles, Palette,
  Eraser, FileText, Camera, Film, Layers, Lightbulb, Brush, RefreshCw,
} from "lucide-react";

const ICONS = {
  studio: Wand2, clothes: Brush, art: Sparkles, upscale: Maximize2,
  bg_remove: Scissors, restore: RefreshCw, colorize: Palette,
  inpaint: Eraser, posters: FileText, carousel: Layers,
  wizard: Lightbulb, video: Film, pro: Camera, default: ImageIcon,
};

/**
 * Pure-CSS abstract thumbnail. No external images, no plagiarism.
 * Each tier uses a unique gradient + a large lucide icon.
 */
export default function ToolThumb({ id, name, accent = "purple" }) {
  const Icon = ICONS[id] || ICONS.default;
  // Deterministic gradient based on first letter
  const code = (id || "x").charCodeAt(0) % 6;
  const gradients = [
    "from-[#7C3AED]/35 via-[#1A1A2E]/50 to-[#0B0B0C]",
    "from-[#9333EA]/30 via-[#13131A] to-[#0B0B0C]",
    "from-[#C4B5FD]/15 via-[#2E1A4E]/40 to-[#0B0B0C]",
    "from-[#7C3AED]/25 via-[#1F1F2E] to-[#0B0B0C]",
    "from-[#5B21B6]/35 via-[#1A1A1F] to-[#0B0B0C]",
    "from-[#8B5CF6]/30 via-[#13131A] to-[#0B0B0C]",
  ];
  const grad = gradients[code];

  return (
    <div className={`relative w-full h-full bg-gradient-to-br ${grad} flex items-center justify-center overflow-hidden`}>
      {/* Subtle dotted texture */}
      <div className="absolute inset-0 opacity-[0.08]" style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
        backgroundSize: "16px 16px",
      }} />
      {/* Large icon */}
      <Icon className="w-16 h-16 text-[#C4B5FD]/70 relative z-10" strokeWidth={1.2} />
      {/* Glow ring */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.18),transparent_70%)]" />
    </div>
  );
}
