import { useState } from "react";
import { Check } from "lucide-react";
import { ARTISTIC_STYLE_COVER_BY_ID } from "../../lib/artisticStyleCovers";
import {
  Camera,
  Sparkles,
  Sun,
  Aperture,
  Frame,
  Gem,
  Star,
  Mountain,
  Grid3X3,
  Shapes,
  Waves,
  Zap,
  Brush,
  Droplets,
  Pencil,
  Cloud,
  Minus,
  Square,
  Type,
  Diamond,
  Circle,
  Moon,
} from "lucide-react";

const ICONS = {
  camera: Camera,
  sparkles: Sparkles,
  sun: Sun,
  aperture: Aperture,
  frame: Frame,
  gem: Gem,
  star: Star,
  mountain: Mountain,
  grid: Grid3X3,
  shapes: Shapes,
  waves: Waves,
  zap: Zap,
  brush: Brush,
  droplet: Droplets,
  pencil: Pencil,
  cloud: Cloud,
  lines: Minus,
  tiles: Grid3X3,
  minus: Minus,
  square: Square,
  type: Type,
  diamond: Diamond,
  circle: Circle,
  moon: Moon,
};

export default function ArtisticStyleCard({ style, selected, onSelect }) {
  const Icon = ICONS[style.icon] || Sparkles;
  const [a, b, c] = style.gradient || ["#111118", "#9333EA", "#06B6D4"];
  const coverSrc = ARTISTIC_STYLE_COVER_BY_ID[style.id];
  const [coverFailed, setCoverFailed] = useState(false);
  const showCover = coverSrc && !coverFailed;

  return (
    <button
      type="button"
      onClick={() => onSelect(style.id)}
      className={`group relative w-full text-left rounded-xl overflow-hidden border transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-12px_rgba(147,51,234,0.45)] ${
        selected
          ? "border-[#9333EA] shadow-[0_0_20px_rgba(147,51,234,0.35)] ring-1 ring-[#A855F7]/50"
          : "border-[rgba(147,51,234,0.2)] hover:border-[rgba(147,51,234,0.45)]"
      }`}
      style={{ background: "#111118" }}
      data-testid={`artistic-style-${style.id}`}
    >
      <div
        className="relative aspect-[4/5] overflow-hidden"
        style={
          showCover
            ? { background: "#0A0A0F" }
            : { background: `linear-gradient(145deg, ${a} 0%, ${b} 55%, ${c} 100%)` }
        }
      >
        {showCover ? (
          <img
            src={coverSrc}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-[center_22%] transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
            onError={() => setCoverFailed(true)}
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_50%)]" />
            <div className="absolute inset-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <Icon className="w-10 h-10 text-white/35" strokeWidth={1.25} />
            </div>
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
      </div>

      {selected && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#9333EA] flex items-center justify-center shadow-lg shadow-[#9333EA]/50">
          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
        </div>
      )}

      <div className="p-3 border-t border-white/5">
        <p className="text-white text-[12px] font-medium font-['Inter_Tight'] leading-tight">{style.label}</p>
        <p className="text-[#9CA3AF] text-[10px] mt-1 line-clamp-2 leading-snug">{style.desc}</p>
      </div>
    </button>
  );
}
