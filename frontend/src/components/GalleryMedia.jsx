import { useEffect, useState } from "react";
import { ImageOff, Loader2 } from "lucide-react";
import {
  displayMediaUrl,
  isVideoCreation,
  primaryResultUrl,
  proxiedMediaUrl,
} from "../lib/creationUrls";

/** Página pública Explore — URLs directas (blob é público). */
function PublicGalleryMedia({ creation, className, onClick }) {
  const rawUrl = primaryResultUrl(creation);
  const [src, setSrc] = useState(() => displayMediaUrl(rawUrl, false));
  const [broken, setBroken] = useState(false);
  const isVideo = isVideoCreation(creation, rawUrl);

  useEffect(() => {
    setBroken(false);
    setSrc(displayMediaUrl(rawUrl, false));
  }, [rawUrl, creation?.id]);

  const onError = () => {
    const proxy = proxiedMediaUrl(rawUrl);
    if (proxy && src !== proxy) {
      setSrc(proxy);
      return;
    }
    setBroken(true);
  };

  if (!rawUrl || broken) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-rp-surface text-rp-mute2 text-[10px]">
        Indisponível
      </div>
    );
  }

  const inner = isVideo ? (
    <video src={src} muted playsInline preload="metadata" className={className} onError={onError} />
  ) : (
    <img src={src} alt="" className={className} onError={onError} loading="lazy" referrerPolicy="no-referrer" />
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="block w-full h-full p-0 border-0 bg-transparent cursor-pointer">
        {inner}
      </button>
    );
  }
  return inner;
}

/** Galeria do utilizador — URL directa (rápido) com fallback proxy. */
function AuthGalleryMedia({ creation, className, onClick }) {
  const rawUrl = primaryResultUrl(creation);
  const isVideo = isVideoCreation(creation, rawUrl);
  const [src, setSrc] = useState(() => displayMediaUrl(rawUrl, false));
  const [broken, setBroken] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setBroken(false);
    setLoaded(false);
    setSrc(displayMediaUrl(rawUrl, false));
  }, [rawUrl, creation?.id]);

  const onError = () => {
    const proxy = proxiedMediaUrl(rawUrl);
    if (proxy && src !== proxy) {
      setSrc(proxy);
      return;
    }
    setBroken(true);
  };

  if (!rawUrl || broken) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center gap-2 bg-rp-surface text-rp-mute2"
        data-testid="gallery-media-broken"
      >
        <ImageOff className="w-6 h-6 opacity-50" strokeWidth={1.25} />
        <span className="text-[10px] font-mono uppercase tracking-wider text-center px-2">
          Indisponível
        </span>
      </div>
    );
  }

  const inner = isVideo ? (
    <video
      src={src}
      muted
      playsInline
      preload="metadata"
      className={className}
      onError={onError}
      onLoadedData={() => setLoaded(true)}
    />
  ) : (
    <img
      src={src}
      alt=""
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={onError}
      onLoad={() => setLoaded(true)}
    />
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative block w-full h-full p-0 border-0 bg-transparent cursor-pointer text-left"
      aria-label="Ver"
    >
      {!loaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-rp-bg/50">
          <Loader2 className="w-5 h-5 text-rp-lavender animate-spin" />
        </div>
      )}
      {inner}
    </button>
  );
}

export default function GalleryMedia({ creation, className, onClick, publicView = false }) {
  if (publicView) {
    return <PublicGalleryMedia creation={creation} className={className} onClick={onClick} />;
  }
  return <AuthGalleryMedia creation={creation} className={className} onClick={onClick} />;
}
