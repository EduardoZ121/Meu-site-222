import { useState, useEffect, useRef } from "react";
import {
  Wand2, Image as ImageIcon, Scissors, Maximize2, Palette,
  Eraser, FileText, Camera, Film, Layers, Lightbulb, Brush, RefreshCw, Shirt,
} from "lucide-react";

const ICONS = {
  studio: Wand2,
  clothes: Shirt,
  art: Palette,
  upscale: Maximize2,
  bg_remove: Scissors,
  restore: RefreshCw,
  colorize: Brush,
  inpaint: Eraser,
  posters: FileText,
  carousel: Layers,
  wizard: Lightbulb,
  video: Film,
  pro: Camera,
  default: ImageIcon,
};

const HAS_PHOTO = new Set([
  "studio", "clothes", "art", "pro",
  "bg_remove", "upscale", "restore", "colorize",
  "inpaint", "posters", "carousel", "wizard", "video",
]);

function CssThumb({ id, premium }) {
  const Icon = ICONS[id] || ICONS.default;
  const code = (id || "x").charCodeAt(0) % 6;
  const gradients = [
    "from-violet-600/40 via-[#12121a] to-[#08080c]",
    "from-violet-500/35 via-indigo-950/50 to-[#08080c]",
    "from-blue-600/20 via-violet-950/40 to-[#08080c]",
    "from-violet-700/30 via-[#14141c] to-[#08080c]",
    "from-purple-600/35 via-[#101018] to-[#08080c]",
    "from-violet-500/25 via-blue-950/30 to-[#08080c]",
  ];
  const minH = premium ? "min-h-[120px]" : "min-h-[88px]";

  return (
    <div
      className={`relative w-full h-full ${minH} bg-gradient-to-br ${gradients[code]} flex items-center justify-center overflow-hidden`}
    >
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "20px 20px",
        }}
      />
      <Icon
        className={`relative z-10 text-violet-200/75 ${premium ? "w-12 h-12" : "w-10 h-10"}`}
        strokeWidth={1.5}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(168,85,247,0.25),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(59,130,246,0.12),transparent_50%)]" />
    </div>
  );
}

export default function ToolThumb({ id, name, variant = "default" }) {
  const premium = variant === "premium";
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    setLoaded(false);
    setErrored(false);
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [id]);

  if (!HAS_PHOTO.has(id) || errored) {
    return <CssThumb id={id} premium={premium} />;
  }

  const minH = premium ? "min-h-[120px]" : "min-h-[88px]";

  return (
    <div className={`relative w-full h-full ${minH} overflow-hidden bg-[#0a0a0f]`}>
      {!loaded && (
        <div className="rp-tool-thumb-shimmer absolute inset-0 z-10 pointer-events-none" aria-hidden />
      )}
      <img
        ref={imgRef}
        src={`/images/tools/${id}.jpg`}
        alt={name || id}
        className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setErrored(true);
          setLoaded(true);
        }}
        data-testid={`tool-thumb-${id}`}
      />
    </div>
  );
}
