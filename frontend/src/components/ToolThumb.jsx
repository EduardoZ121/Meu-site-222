import { useState } from "react";
import {
  Wand2, Image as ImageIcon, Scissors, Maximize2, Sparkles, Palette,
  Eraser, FileText, Camera, Film, Layers, Lightbulb, Brush, RefreshCw, Shirt,
} from "lucide-react";

const ICONS = {
  studio: Wand2, clothes: Shirt, art: Palette, upscale: Maximize2,
  bg_remove: Scissors, restore: RefreshCw, colorize: Brush,
  inpaint: Eraser, posters: FileText, carousel: Layers,
  wizard: Lightbulb, video: Film, pro: Camera, default: ImageIcon,
};

// Tools that have a real preview image in /public/images/tools/.
// IDs not in this set fall back to the abstract gradient + icon thumbnail.
const HAS_PHOTO = new Set([
  "studio", "clothes", "art", "pro",
  "bg_remove", "upscale", "restore", "colorize",
  "inpaint", "posters", "carousel",
]);

function CssThumb({ id }) {
  const Icon = ICONS[id] || ICONS.default;
  const code = (id || "x").charCodeAt(0) % 6;
  const gradients = [
    "from-[#7C3AED]/35 via-[#1A1A2E]/50 to-[#0B0B0C]",
    "from-[#9333EA]/30 via-[#13131A] to-[#0B0B0C]",
    "from-[#C4B5FD]/15 via-[#2E1A4E]/40 to-[#0B0B0C]",
    "from-[#7C3AED]/25 via-[#1F1F2E] to-[#0B0B0C]",
    "from-[#5B21B6]/35 via-[#1A1A1F] to-[#0B0B0C]",
    "from-[#8B5CF6]/30 via-[#13131A] to-[#0B0B0C]",
  ];
  return (
    <div className={`relative w-full h-full bg-gradient-to-br ${gradients[code]} flex items-center justify-center overflow-hidden`}>
      <div className="absolute inset-0 opacity-[0.08]" style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
        backgroundSize: "16px 16px",
      }} />
      <Icon className="w-16 h-16 text-[#C4B5FD]/70 relative z-10" strokeWidth={1.2} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.18),transparent_70%)]" />
    </div>
  );
}

/** Tool card preview thumbnail.
 *  - Real photo via /public/images/tools/{id}.jpg when present.
 *  - Falls back to a pure-CSS gradient + icon otherwise.
 *  Includes a dark overlay so the title text stays readable in any image.
 */
export default function ToolThumb({ id, name }) {
  const [errored, setErrored] = useState(false);
  if (!HAS_PHOTO.has(id) || errored) return <CssThumb id={id} />;
  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0B0B0C]">
      <img
        src={`/images/tools/${id}.jpg`}
        alt={name || id}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={() => setErrored(true)}
        data-testid={`tool-thumb-${id}`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0C] via-[#0B0B0C]/30 to-transparent pointer-events-none" />
    </div>
  );
}
