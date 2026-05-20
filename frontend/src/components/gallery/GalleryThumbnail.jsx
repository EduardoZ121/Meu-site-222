import { useEffect, useState } from "react";
import { ImageOff, Loader2 } from "lucide-react";
import {
  fetchCreationBlob,
  isVideoCreation,
  thumbnailCandidates,
} from "../../lib/galleryActions";
import { useI18n } from "../../lib/i18n";

/**
 * Thumbnail: direct CDN URL first (fast). API blob only on error (lazy).
 */
export default function GalleryThumbnail({ creation, className = "", onOpen }) {
  const { t } = useI18n();
  const candidates = thumbnailCandidates(creation);
  const [srcIndex, setSrcIndex] = useState(0);
  const [blobSrc, setBlobSrc] = useState(null);
  const [loadingBlob, setLoadingBlob] = useState(false);
  const [broken, setBroken] = useState(!candidates.length && !creation?.id);

  const src = blobSrc || candidates[srcIndex] || "";
  const isVideo = isVideoCreation(creation, candidates[0]);

  const creationId = creation?.id;
  useEffect(() => {
    setSrcIndex(0);
    setBlobSrc(null);
    setBroken(!thumbnailCandidates(creation).length && !creationId);
    setLoadingBlob(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when item id changes
  }, [creationId]);

  useEffect(() => {
    return () => {
      if (blobSrc) URL.revokeObjectURL(blobSrc);
    };
  }, [blobSrc]);

  const tryApiBlob = async () => {
    if (!creation?.id || loadingBlob || blobSrc) return;
    setLoadingBlob(true);
    try {
      const blob = await fetchCreationBlob(creation);
      setBlobSrc(URL.createObjectURL(blob));
      setBroken(false);
    } catch {
      setBroken(true);
    } finally {
      setLoadingBlob(false);
    }
  };

  const onMediaError = () => {
    if (srcIndex < candidates.length - 1) {
      setSrcIndex((i) => i + 1);
      return;
    }
    if (!blobSrc && creation?.id) {
      void tryApiBlob();
      return;
    }
    setBroken(true);
  };

  if (broken && !loadingBlob) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-rp-bg text-rp-mute2 p-2">
        <ImageOff className="w-5 h-5 opacity-40" />
        <span className="text-[9px] text-center leading-tight">{t("gal_unavailable_hint")}</span>
      </div>
    );
  }

  const media = src && !broken ? (
    isVideo ? (
      <video
        src={src}
        muted
        playsInline
        preload="metadata"
        className={className}
        onError={onMediaError}
      />
    ) : (
      <img
        src={src}
        alt=""
        className={className}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={onMediaError}
      />
    )
  ) : null;

  return (
    <button
      type="button"
      onClick={() => onOpen?.(creation)}
      className="relative block w-full h-full p-0 border-0 bg-transparent cursor-pointer overflow-hidden"
      aria-label={t("gal_view")}
      disabled={!creation?.id}
    >
      {(loadingBlob || (!src && !broken)) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-rp-bg/50">
          <Loader2 className="w-5 h-5 text-rp-lavender animate-spin" />
        </div>
      )}
      {media}
    </button>
  );
}
