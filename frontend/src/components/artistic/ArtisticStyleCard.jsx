import { useState } from "react";
import { Check } from "lucide-react";
import { ARTISTIC_STYLE_COVER_BY_ID } from "../../lib/artisticStyleCovers";
import { getArtisticStyleBadge } from "../../lib/artisticStyleBadges";
import { useI18n } from "../../lib/i18n";
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

const BADGE_CLASS = {
  popular: "art-style-badge art-style-badge--popular",
  new: "art-style-badge art-style-badge--new",
  pro: "art-style-badge art-style-badge--pro",
  experimental: "art-style-badge art-style-badge--experimental",
};

export default function ArtisticStyleCard({ style, selected, onSelect }) {
  const { t } = useI18n();
  const Icon = ICONS[style.icon] || Sparkles;
  const [a, b, c] = style.gradient || ["#111118", "#9333EA", "#06B6D4"];
  const coverSrc = ARTISTIC_STYLE_COVER_BY_ID[style.id];
  const [coverFailed, setCoverFailed] = useState(false);
  const showCover = coverSrc && !coverFailed;
  const badge = getArtisticStyleBadge(style);

  return (
    <button
      type="button"
      onClick={() => onSelect(style.id)}
      className={`art-style-card group ${selected ? "art-style-card--selected" : ""}`}
      data-testid={`artistic-style-${style.id}`}
    >
      <div
        className="art-style-card__preview"
        style={
          showCover
            ? { background: "#06060a" }
            : { background: `linear-gradient(145deg, ${a} 0%, ${b} 55%, ${c} 100%)` }
        }
      >
        {showCover ? (
          <img
            src={coverSrc}
            alt=""
            className="art-style-card__img"
            loading="lazy"
            decoding="async"
            onError={() => setCoverFailed(true)}
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.14),transparent_55%)]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon className="w-12 h-12 text-white/30" strokeWidth={1.15} />
            </div>
          </>
        )}
        <div className="art-style-card__overlay" />
        {badge && (
          <span className={BADGE_CLASS[badge]}>
            {t(`art_badge_${badge}`)}
          </span>
        )}
        {selected && (
          <span className="art-style-card__check">
            <Check className="w-4 h-4 text-white" strokeWidth={3} />
          </span>
        )}
      </div>
      <div className="art-style-card__body">
        <p className="art-style-card__title">{style.label}</p>
        <p className="art-style-card__desc">{style.desc}</p>
      </div>
    </button>
  );
}
