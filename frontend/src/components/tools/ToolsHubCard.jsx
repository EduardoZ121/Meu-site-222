import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Pin, Sparkles } from "lucide-react";
import {
  getToolCover,
  getToolCoverPosition,
  isVideoToolCover,
} from "../../lib/toolsCoverCatalogue";
import { cn } from "../../lib/utils";

const cardEase = [0.16, 1, 0.3, 1];

function CoverMedia({ id, tier }) {
  const src = getToolCover(id, tier);
  const objectPosition = getToolCoverPosition(id);
  const useVideo = isVideoToolCover(id, tier);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const mediaRef = useRef(null);

  useEffect(() => {
    setLoaded(false);
    setErrored(false);
    const el = mediaRef.current;
    if (!useVideo && el?.complete && el.naturalWidth > 0) setLoaded(true);
  }, [src, useVideo]);

  if (errored) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-violet-900/50 via-[#141418] to-black" />
    );
  }

  const mediaClass = cn(
    "absolute inset-0 h-full w-full object-cover",
    loaded ? "opacity-100" : "opacity-0",
  );

  return (
    <>
      {!loaded && (
        <div className="rp-tool-thumb-shimmer absolute inset-0 z-[1]" aria-hidden />
      )}
      {useVideo ? (
        <video
          ref={mediaRef}
          src={src}
          className={mediaClass}
          style={{ objectPosition }}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onLoadedData={() => setLoaded(true)}
          onCanPlay={() => setLoaded(true)}
          onError={() => {
            setErrored(true);
            setLoaded(true);
          }}
          data-testid={`tool-cover-${id}`}
        />
      ) : (
        <img
          ref={mediaRef}
          src={src}
          alt=""
          className={mediaClass}
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
      )}
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
        className="rp-tools-hub-card group block h-full focus-visible:outline-none rounded-2xl"
        data-testid={testId || `tool-${id}`}
      >
        <div className="rp-tools-hub-card__media relative aspect-square overflow-hidden bg-[#121216]">
          <CoverMedia id={id} tier={tier} />
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
                "absolute top-2 right-2 z-[4] flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all shadow-lg",
                pinned
                  ? "bg-violet-500/40 text-violet-100"
                  : "bg-black/45 text-white/80 hover:bg-black/60 hover:text-white",
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
              <span className="rp-tools-hub-card__badge px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-md">
                {t("label_new")}
              </span>
            )}
            {isBeta && (
              <span className="rp-tools-hub-card__badge px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide text-amber-100 bg-amber-500/30 shadow-md">
                {t("badge_beta")}
              </span>
            )}
          </div>

          {showCost && (
            <div className="absolute bottom-2 right-2 z-[3]">
              <span className="rp-tools-hub-card__cost inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tabular-nums text-[#f4e8d4] bg-black/55 backdrop-blur-md shadow-md">
                <Sparkles className="w-2.5 h-2.5 text-[#c7a77a]" strokeWidth={2} />
                {cost}
              </span>
            </div>
          )}
          {isFree && (
            <div className="absolute bottom-2 right-2 z-[3]">
              <span className="rp-tools-hub-card__badge px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-200 bg-emerald-500/25 backdrop-blur-md shadow-md">
                {t("label_free")}
              </span>
            </div>
          )}
        </div>

        <p className="rp-tools-hub-card__name mt-1.5 px-0.5 text-[12px] sm:text-[13px] leading-snug line-clamp-2 transition-colors">
          {name}
        </p>
      </Link>
    </motion.article>
  );
}
