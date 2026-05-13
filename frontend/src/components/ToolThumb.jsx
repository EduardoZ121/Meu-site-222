import {
  Wand2, Image as ImageIcon, Scissors, Maximize2, Sparkles, Palette,
  Eraser, FileText, Camera, Film, Layers, Lightbulb, Brush, RefreshCw, Shirt,
} from "lucide-react";
import { TOOL_PREVIEWS } from "../lib/toolPreviews";

const ICONS = {
  studio: Wand2, clothes: Shirt, art: Palette, upscale: Maximize2,
  bg_remove: Scissors, restore: RefreshCw, colorize: Brush,
  inpaint: Eraser, posters: FileText, carousel: Layers,
  wizard: Lightbulb, video: Film, pro: Camera, default: ImageIcon,
};

export default function ToolThumb({ id, name }) {
  const Icon = ICONS[id] || ICONS.default;
  const image = TOOL_PREVIEWS[id];
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

  if (image) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-[#0B0B0C]">
        <img
          src={image}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0B0B0C] via-[#0B0B0C]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#7C3AED]/15 via-transparent to-[#0B0B0C]/60" />
        <div className="absolute top-3 left-3 w-9 h-9 rounded-full bg-[#0B0B0C]/70 backdrop-blur-md border border-[#7C3AED]/30 flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#C4B5FD]" strokeWidth={1.5} />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full bg-gradient-to-br ${grad} flex items-center justify-center overflow-hidden`}>
      <div className="absolute inset-0 opacity-[0.08]" style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
        backgroundSize: "16px 16px",
      }} />
      <Icon className="w-16 h-16 text-[#C4B5FD]/70 relative z-10" strokeWidth={1.2} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.18),transparent_70%)]" />
    </div>
  );
}
