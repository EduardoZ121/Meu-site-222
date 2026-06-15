import { useCallback, useEffect, useState } from "react";
import { ImageOff, Loader2 } from "lucide-react";
import { api } from "../lib/api";
import {
  displayMediaUrl,
  isVideoCreation,
  primaryResultUrl,
  proxiedMediaUrl,
} from "../lib/creationUrls";

/** Carrega media autenticada quando não há URL directa na criação. */
function useAuthMediaBlob(creationId, enabled) {
  const [blobSrc, setBlobSrc] = useState("");
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!enabled || !creationId) {
      setBlobSrc("");
      setLoading(false);
      setFailed(false);
      return undefined;
    }

    let objectUrl;
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    setBlobSrc("");

    (async () => {
      try {
        const { data } = await api.get(`/generations/${encodeURIComponent(creationId)}/media`, {
          responseType: "blob",
          timeout: 180000,
        });
        if (cancelled) return;
        objectUrl = URL.createObjectURL(data);
        setBlobSrc(objectUrl);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [creationId, enabled]);

  return { blobSrc, loading, failed };
}

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

function AuthGalleryMedia({ creation, className, onClick }) {
  const rawUrl = primaryResultUrl(creation);
  const isVideo = isVideoCreation(creation, rawUrl);
  const [directSrc, setDirectSrc] = useState(() => (rawUrl ? displayMediaUrl(rawUrl, false) : ""));
  const [directBroken, setDirectBroken] = useState(false);
  const { blobSrc, loading: blobLoading, failed: blobFailed } = useAuthMediaBlob(
    creation?.id,
    !rawUrl || directBroken,
  );

  useEffect(() => {
    setDirectBroken(false);
    setDirectSrc(rawUrl ? displayMediaUrl(rawUrl, false) : "");
  }, [rawUrl, creation?.id]);

  const onDirectError = useCallback(() => {
    const proxy = proxiedMediaUrl(rawUrl);
    if (proxy && directSrc !== proxy) {
      setDirectSrc(proxy);
      return;
    }
    setDirectBroken(true);
  }, [rawUrl, directSrc]);

  const src = (!directBroken && directSrc) ? directSrc : blobSrc;
  const loading = !src && (Boolean(rawUrl) ? false : blobLoading);
  const broken = !src && !loading && (directBroken || blobFailed || !creation?.id);

  if (broken) {
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

  const inner = src ? (
    isVideo ? (
      <video
        src={src}
        muted
        playsInline
        preload="metadata"
        className={className}
        onError={onDirectError}
      />
    ) : (
      <img
        src={src}
        alt=""
        className={className}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={onDirectError}
      />
    )
  ) : null;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!src}
      className="relative block w-full h-full p-0 border-0 bg-transparent cursor-pointer text-left disabled:cursor-default"
      aria-label="Ver"
    >
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-rp-bg/50">
          <Loader2 className="w-5 h-5 text-rp-lavender animate-spin" />
        </div>
      )}
      {inner}
    </button>
  );
}

export function useGalleryLightboxMedia(creation) {
  const rawUrl = primaryResultUrl(creation);
  const isVideo = isVideoCreation(creation, rawUrl);
  const [directSrc, setDirectSrc] = useState(() => (rawUrl ? displayMediaUrl(rawUrl, false) : ""));
  const [directBroken, setDirectBroken] = useState(false);
  const { blobSrc, loading, failed } = useAuthMediaBlob(creation?.id, !rawUrl || directBroken);

  useEffect(() => {
    setDirectBroken(false);
    setDirectSrc(rawUrl ? displayMediaUrl(rawUrl, false) : "");
  }, [rawUrl, creation?.id]);

  const onDirectError = useCallback(() => {
    const proxy = proxiedMediaUrl(rawUrl);
    if (proxy && directSrc !== proxy) {
      setDirectSrc(proxy);
      return;
    }
    setDirectBroken(true);
  }, [rawUrl, directSrc]);

  const src = (!directBroken && directSrc) ? directSrc : blobSrc;
  const broken = !src && !loading && (directBroken || failed);

  return { src, broken, loading, isVideo, onDirectError };
}

export default function GalleryMedia({ creation, className, onClick, publicView = false }) {
  if (publicView) {
    return <PublicGalleryMedia creation={creation} className={className} onClick={onClick} />;
  }
  return <AuthGalleryMedia creation={creation} className={className} onClick={onClick} />;
}
