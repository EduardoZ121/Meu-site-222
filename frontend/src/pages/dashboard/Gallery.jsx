import { useCallback, useEffect, useRef, useState } from "react";
import {
  Download, Heart, Loader2, RefreshCw, Share2, Trash2, X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api, formatApiError } from "../../lib/api";
import { useI18n } from "../../lib/i18n";
import { toast } from "sonner";
import useTitle from "../../lib/useTitle";
import GalleryThumbnail from "../../components/gallery/GalleryThumbnail";
import {
  downloadCreation,
  fetchCreationBlob,
  isVideoCreation,
  primaryResultUrl,
  shareCreation,
  thumbnailCandidates,
} from "../../lib/galleryActions";

function GalleryLightbox({ item, onClose, t }) {
  const [src, setSrc] = useState("");
  const [loading, setLoading] = useState(true);
  const [broken, setBroken] = useState(false);
  const video = item && isVideoCreation(item);

  useEffect(() => {
    if (!item) return undefined;
    let objectUrl = null;
    let cancelled = false;
    setLoading(true);
    setBroken(false);
    setSrc("");

    const direct = thumbnailCandidates(item)[0];
    if (direct) {
      setSrc(direct);
      setLoading(false);
      return () => {};
    }

    fetchCreationBlob(item)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setBroken(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [item]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      data-testid="gallery-lightbox"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 min-h-11 min-w-11 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
        aria-label={t("gal_close")}
      >
        <X className="w-5 h-5" />
      </button>
      <div
        className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {loading && <Loader2 className="w-8 h-8 text-white animate-spin" />}
        {!loading && src && !broken && (
          video ? (
            <video src={src} controls autoPlay className="max-h-[80vh] max-w-full rounded-lg" />
          ) : (
            <img src={src} alt="" className="max-h-[80vh] max-w-full object-contain rounded-lg" />
          )
        )}
        {!loading && broken && (
          <p className="text-white/70 text-sm">{t("gal_file_unavailable")}</p>
        )}
        {item.prompt ? (
          <p className="mt-4 text-white/80 text-sm text-center max-w-xl line-clamp-4 px-4">
            {item.prompt}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function GalleryCard({
  item,
  busy,
  t,
  onOpen,
  onDownload,
  onShare,
  onToggleFav,
  onDelete,
}) {
  const hasMedia = Boolean(primaryResultUrl(item) || item?.id);

  return (
    <article
      className="flex flex-col border border-rp-border bg-rp-surface overflow-hidden rounded-lg"
      data-testid={`gallery-item-${item.id}`}
    >
      <div className="relative aspect-square overflow-hidden bg-rp-bg">
        <GalleryThumbnail
          creation={item}
          className="w-full h-full object-cover"
          onOpen={onOpen}
        />
      </div>

      {item.prompt ? (
        <p className="px-2.5 pt-2 text-rp-mute text-[11px] line-clamp-2 min-h-[2.25rem] leading-snug">
          {item.prompt}
        </p>
      ) : (
        <div className="min-h-[2.25rem]" />
      )}

      <div className="grid grid-cols-4 gap-1 p-2 border-t border-rp-border">
        <button
          type="button"
          disabled={busy || !hasMedia}
          onClick={() => onDownload(item)}
          className="min-h-10 flex flex-col items-center justify-center gap-0.5 rounded-md border border-rp-border text-rp-mute hover:text-rp-lavender hover:border-rp-lavender disabled:opacity-40 text-[9px] uppercase tracking-wide"
          title={t("gal_download")}
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline truncate max-w-full px-0.5">{t("gal_download")}</span>
        </button>
        <button
          type="button"
          disabled={busy || !hasMedia}
          onClick={() => onShare(item)}
          className="min-h-10 flex flex-col items-center justify-center gap-0.5 rounded-md border border-rp-border text-rp-mute hover:text-rp-lavender hover:border-rp-lavender disabled:opacity-40 text-[9px] uppercase tracking-wide"
          title={t("gal_share")}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline truncate max-w-full px-0.5">{t("gal_share")}</span>
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onToggleFav(item.id)}
          className={`min-h-10 flex flex-col items-center justify-center gap-0.5 rounded-md border disabled:opacity-40 text-[9px] uppercase tracking-wide ${
            item.is_favorite
              ? "border-rp-purple text-rp-lavender"
              : "border-rp-border text-rp-mute hover:text-rp-lavender hover:border-rp-lavender"
          }`}
          title={t("gal_favorite")}
        >
          <Heart className="w-3.5 h-3.5" fill={item.is_favorite ? "currentColor" : "none"} />
          <span className="hidden sm:inline">{t("gal_favorite")}</span>
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onDelete(item.id)}
          className="min-h-10 flex flex-col items-center justify-center gap-0.5 rounded-md border border-rp-border text-rp-mute hover:text-red-400 hover:border-red-400 disabled:opacity-40 text-[9px] uppercase tracking-wide"
          title={t("gal_delete")}
        >
          {busy ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">{t("gal_delete")}</span>
        </button>
      </div>
    </article>
  );
}

export default function Gallery({ favoritesOnly = false }) {
  const { t } = useI18n();
  useTitle(favoritesOnly ? t("sidebar_favorites") : t("sidebar_gallery"));

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [viewItem, setViewItem] = useState(null);

  const historyPath = favoritesOnly
    ? "/generations/history?limit=60&only_favorites=true"
    : "/generations/history?limit=60";

  const loadFailRef = useRef(t("gal_load_fail"));
  loadFailRef.current = t("gal_load_fail");

  const fetchItems = useCallback((isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    return api
      .get(historyPath)
      .then((r) => setItems(r.data.creations || []))
      .catch((err) => {
        toast.error(formatApiError(err, loadFailRef.current));
        setItems([]);
      })
      .finally(() => {
        if (isManualRefresh) setRefreshing(false);
        else setLoading(false);
      });
  }, [historyPath]);

  useEffect(() => {
    fetchItems(false);
  }, [fetchItems]);

  const runBusy = async (id, fn) => {
    setBusyId(id);
    try {
      await fn();
    } finally {
      setBusyId(null);
    }
  };

  const toggleFav = (id) => {
    runBusy(id, async () => {
      const { data } = await api.post(`/generations/${encodeURIComponent(id)}/favorite`);
      setItems((cur) => {
        const next = cur.map((c) => (c.id === id ? { ...c, is_favorite: data.is_favorite } : c));
        return favoritesOnly && !data.is_favorite ? next.filter((c) => c.id !== id) : next;
      });
    }).catch((err) => toast.error(formatApiError(err, t("failed"))));
  };

  const removeOne = (id) => {
    if (!window.confirm(t("gal_confirm_delete"))) return;
    runBusy(id, async () => {
      await api.delete(`/generations/${encodeURIComponent(id)}`);
      setItems((cur) => cur.filter((c) => c.id !== id));
      if (viewItem?.id === id) setViewItem(null);
      toast.success(t("remove"));
    }).catch((err) => toast.error(formatApiError(err, t("gal_delete_fail"))));
  };

  const clearAll = () => {
    if (!items.length) return;
    if (!window.confirm(t("gal_clear_all_confirm"))) return;
    setClearing(true);
    const qs = favoritesOnly ? "?only_favorites=true" : "";
    api
      .delete(`/generations/history${qs}`)
      .then((r) => {
        const n = r.data?.deleted ?? items.length;
        setItems([]);
        setViewItem(null);
        toast.success(t("gal_cleared", { n }));
      })
      .catch((err) => toast.error(formatApiError(err, t("gal_delete_fail"))))
      .finally(() => setClearing(false));
  };

  const handleDownload = (item) => {
    runBusy(item.id, async () => {
      await downloadCreation(item);
      toast.success(t("gal_download_started"));
    }).catch((err) => toast.error(formatApiError(err, t("gal_download_fail"))));
  };

  const handleShare = (item) => {
    runBusy(item.id, async () => {
      const result = await shareCreation(item);
      if (result === "copied") toast.success(t("gal_share_copied"));
      else if (result === "shared") toast.success(t("gal_share"));
    }).catch((err) => toast.error(formatApiError(err, t("gal_share_fail"))));
  };

  return (
    <div className="max-w-[1280px] mx-auto pb-12" data-testid="gallery-page">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">{favoritesOnly ? t("fav_eyebrow") : t("gal_eyebrow")}</p>
          <h1 className="heading-xl">{favoritesOnly ? t("fav_title") : t("gal_title")}</h1>
          {!loading && items.length > 0 && (
            <p className="text-rp-mute text-sm mt-2">{t("gal_item_count", { n: items.length })}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fetchItems(true)}
            disabled={loading || refreshing || clearing}
            className="btn-secondary !py-2 !px-3 text-xs flex items-center gap-2"
            data-testid="gallery-refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {t("gal_refresh")}
          </button>
          {items.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              disabled={loading || clearing}
              className="btn-secondary !py-2 !px-3 text-xs flex items-center gap-2 text-red-300 border-red-400/30 hover:border-red-400/60"
              data-testid="gallery-clear-all"
            >
              {clearing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              {t("gal_clear_all")}
            </button>
          )}
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-rp-mute text-sm py-16">
          <Loader2 className="w-5 h-5 animate-spin text-rp-lavender" />
          {t("loading")}
        </div>
      ) : items.length === 0 ? (
        <div className="border border-rp-border rounded-lg p-16 text-center" data-testid="gallery-empty">
          <p className="text-rp-mute mb-3 text-sm">{t("gal_empty")}</p>
          <Link to="/app/generate" className="text-rp-lavender text-sm hover:underline">
            {t("gal_begin")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" data-testid="gallery-grid">
          {items.map((item) => (
            <GalleryCard
              key={item.id}
              item={item}
              busy={busyId === item.id || clearing}
              t={t}
              onOpen={setViewItem}
              onDownload={handleDownload}
              onShare={handleShare}
              onToggleFav={toggleFav}
              onDelete={removeOne}
            />
          ))}
        </div>
      )}

      <GalleryLightbox item={viewItem} onClose={() => setViewItem(null)} t={t} />
    </div>
  );
}
