import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Heart, Trash2, Download, X, Loader2, Eye, RefreshCw, Film,
} from "lucide-react";
import { api, formatApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { toast } from "sonner";
import useTitle from "../../lib/useTitle";
import GalleryMedia, { useGalleryLightboxMedia } from "../../components/GalleryMedia";
import GalleryExtendModal from "../../components/gallery/GalleryExtendModal";
import StudioHelpTip from "../../components/studio/StudioHelpTip";
import PosterMotionFlyerButton from "../../components/poster/PosterMotionFlyerButton";
import { canAccessVideoFeatures } from "../../lib/isAdmin";
import { isVideoCreation, normalizeCreation, primaryResultUrl } from "../../lib/creationUrls";
import { isPosterCreation } from "../../lib/posterMotionFlyerBridge";

function GalleryLightbox({ item, onClose, t, videoExtendAccess }) {
  const { src, broken, loading, isVideo, onDirectError } = useGalleryLightboxMedia(item);
  const posterUrl = item && isPosterCreation(item) ? primaryResultUrl(item) : "";

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
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
        {!loading && src && !broken ? (
          isVideo ? (
            <video src={src} controls autoPlay className="max-h-[80vh] max-w-full rounded-lg" onError={onDirectError} />
          ) : (
            <img src={src} alt="" className="max-h-[80vh] max-w-full object-contain rounded-lg" onError={onDirectError} />
          )
        ) : !loading && (broken || !src) ? (
          <p className="text-white/70 text-sm">{t("gal_file_unavailable")}</p>
        ) : null}
        {videoExtendAccess && posterUrl && !isVideo ? (
          <div className="mt-4 w-full max-w-md">
            <PosterMotionFlyerButton
              imageUrl={posterUrl}
              creationId={item.id}
              aspectRatio={item.aspect_ratio || item.aspectRatio}
              testId={`gallery-lightbox-mfly-${item.id}`}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function GalleryCard({
  item,
  busy,
  videoExtendAccess,
  t,
  onView,
  onDownload,
  onExtend,
  onToggleFav,
  onRemove,
}) {
  const posterUrl = isPosterCreation(item) ? primaryResultUrl(item) : "";

  return (
    <article
      className="flex flex-col border border-rp-border bg-rp-surface overflow-hidden rounded-sm"
      data-testid={`gallery-item-${item.id}`}
    >
      <div className="relative aspect-square overflow-hidden bg-rp-bg">
        <GalleryMedia
          creation={item}
          className="w-full h-full object-cover"
          onClick={() => onView(item)}
        />
      </div>

      <div className="flex items-center gap-1 p-2 border-t border-rp-border">
        <button
          type="button"
          disabled={busy}
          onClick={() => onView(item)}
          className="flex-1 min-h-10 flex items-center justify-center gap-1 rounded border border-rp-border text-rp-text hover:border-rp-lavender hover:text-rp-lavender text-[10px] uppercase tracking-wider disabled:opacity-40"
          title={t("gal_view")}
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t("gal_view")}</span>
        </button>
        {videoExtendAccess && posterUrl && (
          <PosterMotionFlyerButton
            imageUrl={posterUrl}
            creationId={item.id}
            aspectRatio={item.aspect_ratio || item.aspectRatio}
            compact
            testId={`gallery-mfly-${item.id}`}
          />
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => onDownload(item)}
          className="min-h-10 min-w-10 flex items-center justify-center rounded border border-rp-border text-rp-text hover:border-rp-lavender hover:text-rp-lavender disabled:opacity-40"
          title={t("gal_download")}
        >
          <Download className="w-3.5 h-3.5" />
        </button>
        {videoExtendAccess && isVideoCreation(item) && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onExtend(item)}
            className="min-h-10 min-w-10 flex items-center justify-center rounded border border-rp-border text-rp-text hover:border-[#A855F7] hover:text-[#A855F7] disabled:opacity-40"
            title={t("vid_extend_title")}
            data-testid={`gallery-extend-${item.id}`}
          >
            <Film className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => onToggleFav(item.id)}
          className={`min-h-10 min-w-10 flex items-center justify-center rounded border ${
            item.is_favorite
              ? "border-rp-purple text-rp-lavender"
              : "border-rp-border text-rp-text hover:border-rp-lavender"
          } disabled:opacity-40`}
          title={t("gal_favorite")}
        >
          <Heart className="w-3.5 h-3.5" fill={item.is_favorite ? "currentColor" : "none"} />
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onRemove(item.id)}
          className="min-h-10 min-w-10 flex items-center justify-center rounded border border-rp-border text-rp-text hover:border-red-400 hover:text-red-400 disabled:opacity-40"
          title={t("remove")}
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </article>
  );
}

export default function Gallery({ favoritesOnly = false }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const videoExtendAccess = canAccessVideoFeatures(user);
  const [searchParams, setSearchParams] = useSearchParams();
  useTitle(favoritesOnly ? t("sidebar_favorites") : t("sidebar_gallery"));

  const [items, setItems] = useState([]);
  const [pendingItems, setPendingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [extendItem, setExtendItem] = useState(null);
  const loadingRef = useRef(false);
  const tRef = useRef(t);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const load = useCallback((opts = {}) => {
    const isBackground = Boolean(opts.background);
    if (!isBackground && loadingRef.current) return Promise.resolve();
    if (!isBackground) {
      loadingRef.current = true;
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    const historyUrl = `/generations/history?limit=60${favoritesOnly ? "&only_favorites=true" : ""}`;

    return Promise.all([
      api.get(historyUrl),
      favoritesOnly ? Promise.resolve({ data: { pending: [] } }) : api.get("/generations/pending"),
    ])
      .then(([historyRes, pendingRes]) => {
        const list = (historyRes.data?.creations || []).map(normalizeCreation);
        setItems(list);
        setPendingItems((pendingRes.data?.pending || []).filter((p) => p.status !== "completed"));
      })
      .catch((err) => {
        if (!isBackground) {
          toast.error(formatApiError(err, tRef.current("gal_load_fail")));
          setItems([]);
          setPendingItems([]);
        }
      })
      .finally(() => {
        if (!isBackground) loadingRef.current = false;
        if (!isBackground) setLoading(false);
        if (isBackground) setRefreshing(false);
      });
  }, [favoritesOnly]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onRefresh = () => load({ background: true });
    const onVisible = () => {
      if (document.visibilityState === "visible") load({ background: true });
    };
    window.addEventListener("rp:creation-succeeded", onRefresh);
    window.addEventListener("rp:prediction-finished", onRefresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("rp:creation-succeeded", onRefresh);
      window.removeEventListener("rp:prediction-finished", onRefresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  useEffect(() => {
    const focusId = String(searchParams.get("focus") || "").trim();
    if (!focusId || !items.length) return;
    const target = items.find((x) => x.id === focusId);
    if (!target) return;
    setViewItem(target);
    requestAnimationFrame(() => {
      document.querySelector(`[data-testid="gallery-item-${focusId}"]`)?.scrollIntoView?.({
        behavior: "smooth",
        block: "center",
      });
    });
    const next = new URLSearchParams(searchParams);
    next.delete("focus");
    setSearchParams(next, { replace: true });
  }, [items, searchParams, setSearchParams]);

  const toggleFav = async (id) => {
    setBusyId(id);
    try {
      const { data } = await api.post(`/generations/${encodeURIComponent(id)}/favorite`);
      setItems((cur) => cur.map((c) => (c.id === id ? { ...c, is_favorite: data.is_favorite } : c)));
    } catch (err) {
      toast.error(formatApiError(err, t("failed")));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id) => {
    if (!window.confirm(t("gal_confirm_delete"))) return;
    setBusyId(id);
    try {
      await api.delete(`/generations/${encodeURIComponent(id)}`);
      setItems((cur) => cur.filter((c) => c.id !== id));
      if (viewItem?.id === id) setViewItem(null);
      toast.success(t("remove"));
    } catch (err) {
      toast.error(formatApiError(err, t("gal_delete_fail")));
    } finally {
      setBusyId(null);
    }
  };

  const handleDownload = async (item) => {
    if (!item?.id) {
      toast.error(t("gal_file_unavailable"));
      return;
    }
    setBusyId(item.id);
    try {
      const ext = isVideoCreation(item) ? "mp4" : "jpg";
      const { data } = await api.get(`/generations/${encodeURIComponent(item.id)}/media`, {
        responseType: "blob",
        timeout: 120000,
      });
      const objectUrl = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `remake-pixel-${item.id.slice(0, 8)}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
    } catch (err) {
      toast.error(formatApiError(err, t("gal_download_fail")));
    } finally {
      setBusyId(null);
    }
  };

  const recoverMissing = async () => {
    setRefreshing(true);
    try {
      const { data } = await api.post("/generations/repair");
      await load({ background: true });
      if (data?.repaired > 0) {
        toast.success(`${data.repaired} criação(ões) recuperada(s).`);
      } else {
        toast.message("Nada em falta — se a geração ainda corre, aguarda mais um minuto.");
      }
    } catch (err) {
      toast.error(formatApiError(err, "Não foi possível recuperar."));
    } finally {
      setRefreshing(false);
    }
  };

  const empty = !loading && items.length === 0 && pendingItems.length === 0;

  return (
    <div className="max-w-[1200px] mx-auto" data-testid="gallery-page">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div>
            <p className="eyebrow mb-3">{favoritesOnly ? t("fav_eyebrow") : t("gal_eyebrow")}</p>
            <h1 className="heading-xl">{favoritesOnly ? t("fav_title") : t("gal_title")}</h1>
          </div>
          <StudioHelpTip helpKey="help_page_gallery" size="lg" testId="gallery-page-help" className="mt-6 shrink-0" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => load({ background: true })}
            disabled={loading}
            className="btn-secondary !py-2 !px-3 text-xs flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading || refreshing ? "animate-spin" : ""}`} />
            {t("gal_refresh")}
          </button>
          <button
            type="button"
            onClick={recoverMissing}
            disabled={loading || refreshing}
            className="btn-secondary !py-2 !px-3 text-xs"
            data-testid="gallery-recover"
          >
            Recuperar criações
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center gap-2 text-rp-mute text-sm py-12">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t("loading")}
        </div>
      ) : empty ? (
        <div className="border border-rp-border p-16 text-center" data-testid="gallery-empty">
          <p className="text-rp-mute mb-2 text-sm">{t("gal_empty")}</p>
          <a href="/app/generate" className="text-rp-lavender text-sm hover:underline">
            {t("gal_begin")}
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" data-testid="gallery-grid">
          {pendingItems.map((p) => (
            <article
              key={p.prediction_id}
              className="flex flex-col border border-violet-500/30 bg-rp-surface overflow-hidden rounded-sm"
              data-testid={`gallery-pending-${p.prediction_id}`}
            >
              <div className="relative aspect-square overflow-hidden bg-rp-bg flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                <span className="text-[10px] text-violet-300/90 font-mono uppercase tracking-wide">
                  {t("gal_processing")}
                </span>
              </div>
            </article>
          ))}
          {items.map((item) => (
            <GalleryCard
              key={item.id}
              item={item}
              busy={busyId === item.id}
              videoExtendAccess={videoExtendAccess}
              t={t}
              onView={setViewItem}
              onDownload={handleDownload}
              onExtend={setExtendItem}
              onToggleFav={toggleFav}
              onRemove={remove}
            />
          ))}
        </div>
      )}

      <GalleryLightbox item={viewItem} onClose={() => setViewItem(null)} t={t} videoExtendAccess={videoExtendAccess} />
      {extendItem && (
        <GalleryExtendModal
          item={extendItem}
          onClose={() => setExtendItem(null)}
          onStarted={() => load({ background: true })}
        />
      )}
    </div>
  );
}
