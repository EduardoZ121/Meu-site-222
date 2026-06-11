import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Pin, Sparkles } from "lucide-react";
import { getToolCover, getToolCoverPosition } from "../../lib/toolsCoverCatalogue";
import { cn } from "../../lib/utils";

const cardEase = [0.16, 1, 0.3, 1];

function CoverImage({ id, tier }) {
  const src = getToolCover(id, tier);
  const objectPosition = getToolCoverPosition(id);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    setLoaded(false);
    setErrored(false);
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, [src]);

  if (errored) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-violet-900/50 via-[#141418] to-black" />
    );
  }

  return (
    <>
      {!loaded && (
        <div className="rp-tool-thumb-shimmer absolute inset-0 z-[1]" aria-hidden />
      )}
      <img
        ref={imgRef}
        src={src}
        alt=""
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
        )}
        style={{ objectPosition }}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setErrored(true);
          setLoaded(true);
        }}
        data-testid={`tool-cover-${id}`}
      />
    </>
  );
}

/**
 * Card compacto estilo OpenArt — imagem dominante, nome por baixo, pin opcional.
 */
export default function ToolsHubCard({
  id,
  name,
  to,
  tier = "image",
  cost,
  isFree = false,
  isNew = false,
  isBeta = false,
  index = 0,
  pinned = false,
  onTogglePin,
  t,
  testId,
}) {
  const showCost = !isFree && cost > 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.28,
        delay: Math.min(index * 0.03, 0.24),
        ease: cardEase,
      }}
      className="h-full"
    >
      <Link
        to={to}
        className="rp-tools-hub-card group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 rounded-2xl"
        data-testid={testId || `tool-${id}`}
      >
        <div className="rp-tools-hub-card__media relative aspect-square rounded-2xl overflow-hidden bg-[#0a0a0c] border border-white/[0.08]">
          <CoverImage id={id} tier={tier} />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none z-[2]"
            aria-hidden
          />

          {onTogglePin && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTogglePin(id);
              }}
              className={cn(
                "absolute top-2 right-2 z-[4] flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-md transition-all",
                pinned
                  ? "border-violet-400/50 bg-violet-500/35 text-violet-100"
                  : "border-white/15 bg-black/35 text-white/80 hover:bg-black/50 hover:text-white",
              )}
              aria-label={pinned ? t("tools_grid.unpin") : t("tools_grid.pin")}
              aria-pressed={pinned}
              data-testid={`pin-${id}`}
            >
              <Pin
                className={cn("w-3.5 h-3.5", pinned && "fill-current")}
                strokeWidth={2}
              />
            </button>
          )}

          <div className="absolute top-2 left-2 z-[3] flex flex-wrap gap-1">
            {isNew && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide text-white bg-violet-600/90 border border-white/15">
                {t("label_new")}
              </span>
            )}
            {isBeta && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide text-amber-100 bg-amber-500/25 border border-amber-400/25">
                {t("badge_beta")}
              </span>
            )}
          </div>

          {showCost && (
            <div className="absolute bottom-2 right-2 z-[3]">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tabular-nums text-[#f4e8d4] bg-black/45 border border-white/10 backdrop-blur-md">
                <Sparkles className="w-2.5 h-2.5 text-[#c7a77a]" strokeWidth={2} />
                {cost}
              </span>
            </div>
          )}
          {isFree && (
            <div className="absolute bottom-2 right-2 z-[3]">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-200 bg-emerald-500/20 border border-emerald-400/25 backdrop-blur-md">
                {t("label_free")}
              </span>
            </div>
          )}
        </div>

        <p className="mt-1.5 px-0.5 text-[12px] sm:text-[13px] font-medium text-[#EDEBE8] leading-snug line-clamp-2 font-['Inter_Tight'] group-hover:text-violet-100 transition-colors">
          {name}
        </p>
      </Link>
    </motion.article>
  );
}
