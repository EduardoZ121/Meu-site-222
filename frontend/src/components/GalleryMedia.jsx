import { useCallback, useEffect, useRef, useState } from "react";
import { ImageOff } from "lucide-react";
import { api } from "../lib/api";
import { useI18n } from "../lib/i18n";
import {
  authMediaPath,
  displayMediaUrl,
  isVideoCreation,
  mediaPreferProxyFirst,
  primaryResultUrl,
  proxiedMediaUrl,
} from "../lib/creationUrls";

const IMAGE_LOAD_TIMEOUT_MS = 16000;
const VIDEO_LOAD_TIMEOUT_MS = 28000;

/** Carrega media autenticada quando URL directa/proxy falham ou não existem. */
function useAuthMediaBlob(creationId, enabled) {
  const [blobSrc, setBlobSrc] = useState("");
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const attemptRef = useRef(0);

  useEffect(() => {
    if (!enabled || !creationId) {
      setBlobSrc("");
      setLoading(false);
      setFailed(false);
      attemptRef.current = 0;
      return undefined;
    }

    let objectUrl;
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    setBlobSrc("");

    const path = authMediaPath(creationId);
    const run = async (attempt) => {
      try {
        const { data } = await api.get(path, {
          responseType: "blob",
          timeout: 45000,
        });
        if (cancelled) return;
        if (!data || data.size < 32) {
          if (attempt < 1) {
            attemptRef.current = attempt + 1;
            await new Promise((r) => setTimeout(r, 400));
            if (!cancelled) await run(attempt + 1);
            return;
          }
          setFailed(true);
          return;
        }
        objectUrl = URL.createObjectURL(data);
        setBlobSrc(objectUrl);
        setFailed(false);
      } catch {
        if (cancelled) return;
        if (attempt < 1) {
          attemptRef.current = attempt + 1;
          await new Promise((r) => setTimeout(r, 500));
          if (!cancelled) await run(attempt + 1);
          return;
        }
        setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run(0);

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [creationId, enabled]);

  return { blobSrc, loading, failed };
}

/**
 * Attach load/error handlers and recover from the classic React race where a
 * cached <img> fires onLoad before the listener is attached.
 * Timeout advances the fallback cascade — it does NOT mean permanent failure.
 */
function useMediaElementReady(src, { onError, enabled = true, isVideo = false } = {}) {
  const [ready, setReady] = useState(false);
  const nodeRef = useRef(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const timeoutMs = isVideo ? VIDEO_LOAD_TIMEOUT_MS : IMAGE_LOAD_TIMEOUT_MS;

  useEffect(() => {
    setReady(false);
    if (!enabled || !src) return undefined;

    let cancelled = false;
    const markReady = () => {
      if (!cancelled) setReady(true);
    };
    const markError = () => {
      if (!cancelled) onErrorRef.current?.();
    };

    const timer = window.setTimeout(() => {
      if (cancelled) return;
      const el = nodeRef.current;
      if (!el) {
        markError();
        return;
      }
      if (el.tagName === "IMG") {
        if (el.complete && el.naturalWidth > 0) {
          markReady();
          return;
        }
        markError();
        return;
      }
      if (el.tagName === "VIDEO") {
        // HAVE_METADATA (1) is enough to show a frame in the grid.
        if (el.readyState >= 1) {
          markReady();
          return;
        }
        markError();
      }
    }, timeoutMs);

    const raf = window.requestAnimationFrame(() => {
      const el = nodeRef.current;
      if (!el || cancelled) return;
      if (el.tagName === "IMG") {
        if (el.complete && el.naturalWidth > 0) {
          markReady();
          return;
        }
        if (el.complete && el.naturalWidth === 0) {
          markError();
        }
      } else if (el.tagName === "VIDEO" && el.readyState >= 1) {
        markReady();
      }
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.cancelAnimationFrame(raf);
    };
  }, [src, enabled, timeoutMs]);

  const bindRef = useCallback((el) => {
    nodeRef.current = el;
    if (!el || !src) return;
    if (el.tagName === "IMG" && el.complete && el.naturalWidth > 0) {
      setReady(true);
    } else if (el.tagName === "VIDEO" && el.readyState >= 1) {
      setReady(true);
    }
  }, [src]);

  const onLoad = useCallback(() => setReady(true), []);
  const onLoadedData = useCallback(() => setReady(true), []);
  const onLoadedMetadata = useCallback(() => setReady(true), []);
  const handleError = useCallback(() => {
    setReady(false);
    onErrorRef.current?.();
  }, []);

  return { ready, bindRef, onLoad, onLoadedData, onLoadedMetadata, handleError };
}

function initialDisplaySrc(rawUrl) {
  if (!rawUrl) return "";
  return displayMediaUrl(rawUrl, mediaPreferProxyFirst(rawUrl));
}

function PublicGalleryMedia({ creation, className, onClick }) {
  const { t } = useI18n();
  const rawUrl = primaryResultUrl(creation);
  const [src, setSrc] = useState(() => initialDisplaySrc(rawUrl));
  const [broken, setBroken] = useState(false);
  const isVideo = isVideoCreation(creation, rawUrl);

  useEffect(() => {
    setBroken(false);
    setSrc(initialDisplaySrc(rawUrl));
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
        {t("gal_unavailable")}
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
    />
  ) : (
    <img src={src} alt="" className={className} onError={onError} loading="lazy" />
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

/**
 * Auth gallery thumb: direct → proxy → authenticated /media blob.
 * Never flash "Indisponível" while a later fallback is still possible.
 */
function AuthGalleryMedia({ creation, className, onClick, fadeIn = false }) {
  const { t } = useI18n();
  const rawUrl = primaryResultUrl(creation);
  const isVideo = isVideoCreation(creation, rawUrl);
  const [phase, setPhase] = useState(() => {
    if (!rawUrl) return "blob";
    if (mediaPreferProxyFirst(rawUrl)) return "proxy";
    return "direct";
  });
  const [displayFailed, setDisplayFailed] = useState(false);

  const wantBlob = phase === "blob" || !rawUrl;
  const { blobSrc, loading: blobLoading, failed: blobFailed } = useAuthMediaBlob(
    creation?.id,
    wantBlob,
  );

  useEffect(() => {
    setDisplayFailed(false);
    if (!rawUrl) setPhase("blob");
    else if (mediaPreferProxyFirst(rawUrl)) setPhase("proxy");
    else setPhase("direct");
  }, [rawUrl, creation?.id]);

  const directSrc = rawUrl
    ? (phase === "proxy" ? proxiedMediaUrl(rawUrl) : displayMediaUrl(rawUrl, false))
    : "";

  const src = phase === "blob" ? blobSrc : directSrc;

  const advanceFallback = useCallback(() => {
    setPhase((cur) => {
      if (cur === "direct") {
        const proxy = proxiedMediaUrl(rawUrl);
        if (proxy && proxy !== rawUrl) return "proxy";
        return "blob";
      }
      if (cur === "proxy") return "blob";
      return cur;
    });
  }, [rawUrl]);

  const onStageError = useCallback(() => {
    if (phase === "blob") {
      setDisplayFailed(true);
      return;
    }
    advanceFallback();
  }, [phase, advanceFallback]);

  const {
    ready: mediaReady,
    bindRef,
    onLoad,
    onLoadedData,
    onLoadedMetadata,
    handleError,
  } = useMediaElementReady(src, {
    onError: onStageError,
    enabled: Boolean(src) && !displayFailed,
    isVideo,
  });

  const loading = Boolean(
    !displayFailed
    && (
      (phase === "blob" && !blobSrc && blobLoading)
      || (src && !mediaReady && !(phase === "blob" && blobFailed))
    ),
  );

  const broken = displayFailed
    || (phase === "blob" && blobFailed && !blobSrc)
    || (!src && !blobLoading && !rawUrl && !creation?.id);

  if (broken) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#121217] text-white/45"
        data-testid="gallery-media-broken"
      >
        <ImageOff className="w-6 h-6 opacity-50" strokeWidth={1.25} />
        <span className="text-[10px] font-mono uppercase tracking-wider text-center px-2">
          {t("gal_unavailable")}
        </span>
      </div>
    );
  }

  const mediaClass = fadeIn
    ? `${className || ""} rp-gal-fade-media ${mediaReady ? "rp-gal-fade-media--ready" : ""}`
    : className;

  const inner = src ? (
    isVideo ? (
      <video
        ref={bindRef}
        src={src}
        muted
        playsInline
        preload="metadata"
        className={mediaClass}
        onLoadedData={onLoadedData}
        onLoadedMetadata={onLoadedMetadata}
        onError={handleError}
      />
    ) : (
      <img
        ref={bindRef}
        src={src}
        alt=""
        className={mediaClass}
        loading="lazy"
        decoding="async"
        onLoad={onLoad}
        onError={handleError}
      />
    )
  ) : null;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!src && !loading}
      className="relative block w-full h-full p-0 border-0 bg-transparent cursor-pointer text-left disabled:cursor-default overflow-hidden"
      aria-label="Ver"
    >
      {loading && (
        <div className="absolute inset-0 z-10 rp-gal-media-shimmer" aria-hidden />
      )}
      {inner}
    </button>
  );
}

export function useGalleryLightboxMedia(creation) {
  const rawUrl = primaryResultUrl(creation);
  const isVideo = isVideoCreation(creation, rawUrl);
  const [phase, setPhase] = useState(() => {
    if (!rawUrl) return "blob";
    if (mediaPreferProxyFirst(rawUrl)) return "proxy";
    return "direct";
  });

  const wantBlob = phase === "blob" || !rawUrl;
  const { blobSrc, loading: blobLoading, failed } = useAuthMediaBlob(creation?.id, wantBlob);

  useEffect(() => {
    if (!rawUrl) setPhase("blob");
    else if (mediaPreferProxyFirst(rawUrl)) setPhase("proxy");
    else setPhase("direct");
  }, [rawUrl, creation?.id]);

  const advanceFallback = useCallback(() => {
    setPhase((cur) => {
      if (cur === "direct") {
        const proxy = proxiedMediaUrl(rawUrl);
        if (proxy && proxy !== rawUrl) return "proxy";
        return "blob";
      }
      if (cur === "proxy") return "blob";
      return cur;
    });
  }, [rawUrl]);

  const onDirectError = useCallback(() => {
    advanceFallback();
  }, [advanceFallback]);

  const directSrc = rawUrl
    ? (phase === "proxy" ? proxiedMediaUrl(rawUrl) : displayMediaUrl(rawUrl, false))
    : "";
  const src = phase === "blob" ? blobSrc : directSrc;
  const loading = !src && (blobLoading || phase !== "blob");
  const broken = !src && !loading && (phase === "blob" && failed);

  useEffect(() => {
    if (!src || phase === "blob") return undefined;
    const ms = isVideo ? VIDEO_LOAD_TIMEOUT_MS : IMAGE_LOAD_TIMEOUT_MS;
    const timer = window.setTimeout(() => {
      advanceFallback();
    }, ms);
    return () => window.clearTimeout(timer);
  }, [src, phase, isVideo, advanceFallback]);

  return { src, broken, loading, isVideo, onDirectError };
}

export default function GalleryMedia({ creation, className, onClick, publicView = false, fadeIn = false }) {
  if (publicView) {
    return <PublicGalleryMedia creation={creation} className={className} onClick={onClick} />;
  }
  return <AuthGalleryMedia creation={creation} className={className} onClick={onClick} fadeIn={fadeIn} />;
}
