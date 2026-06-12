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
import GalleryMedia from "../../components/GalleryMedia";
import GalleryExtendModal from "../../components/gallery/GalleryExtendModal";
import StudioHelpTip from "../../components/studio/StudioHelpTip";
import { canAccessVideoFeatures } from "../../lib/isAdmin";
import {
  displayMediaUrl,
  isVideoCreation,
  primaryResultUrl,
  proxiedMediaUrl,
} from "../../lib/creationUrls";

function dedupeCreations(list) {
  const seenIds = new Set();
  const seenUrls = new Set();
  return (list || []).filter((c) => {
    if (!c?.id || seenIds.has(c.id)) return false;
    const url = primaryResultUrl(c);
    if (url && seenUrls.has(url)) return false;
    seenIds.add(c.id);
    if (url) seenUrls.add(url);
    return true;
  });
}

function GalleryLightbox({ item, onClose, t }) {
  const rawUrl = primaryResultUrl(item);
  const isVideo = isVideoCreation(item, rawUrl);
  const [src, setSrc] = useState("");
  const [broken, setBroken] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!item) return;
    setBroken(false);
    setLoaded(false);
    setSrc(displayMediaUrl(rawUrl, false));
  }, [item, rawUrl]);

  const onMediaError = () => {
    const proxy = proxiedMediaUrl(rawUrl);
    if (proxy && src !== proxy) {
      setSrc(proxy);
      return;
    }
    setBroken(true);
    setLoaded(true);
  };

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
        {!loaded && !broken && rawUrl && (
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        )}
        {src && !broken ? (
          isVideo ? (
            <video
              src={src}
              controls
              autoPlay
              className="max-h-[80vh] max-w-full rounded-lg"
              onError={onMediaError}
              onLoadedData={() => setLoaded(true)}
            />
          ) : (
            <img
              src={src}
              alt=""
              className="max-h-[80vh] max-w-full object-contain rounded-lg"
              onError={onMediaError}
              onLoad={() => setLoaded(true)}
            />
          )
        ) : broken || !rawUrl ? (
          <p className="text-white/70 text-sm">{t("gal_file_unavailable")}</p>
        ) : null}
        <p className="mt-4 text-white/80 text-sm text-center max-w-xl line-clamp-4">{item.prompt}</p>
      </div>
    </div>
  );
}

export default function Gallery({ favoritesOnly = false }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const videoExtendAccess = canAccessVideoFeatures(user);
  const [searchParams, setSearchParams] = useSearchParams();
  useTitle(favoritesOnly ? t("sidebar_favorites") : t("sidebar_gallery"));
  const [items, setItems] = useState([]);
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
    if (loadingRef.current) return Promise.resolve();
    loadingRef.current = true;
    const isBackground = Boolean(opts.background);
    if (!isBackground) setLoading(true);
    if (isBackground) setRefreshing(true);
    return api
      .get(`/generations/history?limit=60${favoritesOnly ? "&only_favorites=true" : ""}`)
      .then((r) => setItems(dedupeCreations(r.data.creations)))
      .catch((err) => {
        if (!isBackground) toast.error(formatApiError(err, tRef.current("gal_load_fail")));
        setItems([]);
      })
      .finally(() => {
        loadingRef.current = false;
        if (!isBackground) setLoading(false);
        if (isBackground) setRefreshing(false);
      });
  }, [favoritesOnly]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onCreation = () => load({ background: true });
    const onFinished = () => load({ background: true });
    const onVisible = () => {
      if (document.visibilityState === "visible") load({ background: true });
    };
    window.addEventListener("rp:creation-succeeded", onCreation);
    window.addEventListener("rp:prediction-finished", onFinished);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("rp:creation-succeeded", onCreation);
      window.removeEventListener("rp:prediction-finished", onFinished);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  useEffect(() => {
    const focusId = String(searchParams.get("focus") || "").trim();
    if (!focusId || !items.length) return;
    const target = items.find((x) => x.id === focusId);
    if (!target) return;
    setViewItem(target);
    const el = document.querySelector(`[data-testid="gallery-item-${focusId}"]`);
    if (el?.scrollIntoView) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
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
      toast.success("Download iniciado.");
    } catch (err) {
      toast.error(formatApiError(err, t("gal_download_fail")));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto" data-testid="gallery-page">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div>
            <p className="eyebrow mb-3">{favoritesOnly ? t("fav_eyebrow") : t("gal_eyebrow")}</p>
            <h1 className="heading-xl">{favoritesOnly ? t("fav_title") : t("gal_title")}</h1>
          </div>
          <StudioHelpTip helpKey="help_page_gallery" size="lg" testId="gallery-page-help" className="mt-6 shrink-0" />
        </div>
        <button
          type="button"
          onClick={() => load({ background: true })}
          disabled={loading}
          className="btn-secondary !py-2 !px-3 text-xs flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading || refreshing ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-rp-mute text-sm py-12">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t("loading")}
        </div>
      ) : items.length === 0 ? (
        <div className="border border-rp-border p-16 text-center" data-testid="gallery-empty">
          <p className="text-rp-mute mb-2 text-sm">{t("gal_empty")}</p>
          <a href="/app/generate" className="text-rp-lavender text-sm hover:underline">
            {t("gal_begin")}
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" data-testid="gallery-grid">
          {items.map((c) => {
            const busy = busyId === c.id;
            const hasMedia = Boolean(primaryResultUrl(c));
            return (
              <article
                key={c.id}
                className="flex flex-col border border-rp-border bg-rp-surface overflow-hidden rounded-sm"
                data-testid={`gallery-item-${c.id}`}
              >
                <div className="relative aspect-square overflow-hidden bg-rp-bg">
                  <GalleryMedia
                    creation={c}
                    className="w-full h-full object-cover"
                    onClick={() => hasMedia && setViewItem(c)}
                  />
                </div>

                <p className="px-2 pt-2 text-rp-mute text-[11px] line-clamp-2 min-h-[2.5rem]">{c.prompt}</p>

                <div className="flex items-center gap-1 p-2 border-t border-rp-border">
                  <button
                    type="button"
                    disabled={busy || !hasMedia}
                    onClick={() => setViewItem(c)}
                    className="flex-1 min-h-10 flex items-center justify-center gap-1 rounded border border-rp-border text-rp-text hover:border-rp-lavender hover:text-rp-lavender text-[10px] uppercase tracking-wider disabled:opacity-40"
                    title="Ver"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Ver</span>
                  </button>
                  <button
                    type="button"
                    disabled={busy || !hasMedia}
                    onClick={() => handleDownload(c)}
                    className="min-h-10 min-w-10 flex items-center justify-center rounded border border-rp-border text-rp-text hover:border-rp-lavender hover:text-rp-lavender disabled:opacity-40"
                    title="Descarregar"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  {videoExtendAccess && isVideoCreation(c) && hasMedia && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setExtendItem(c)}
                      className="min-h-10 min-w-10 flex items-center justify-center rounded border border-rp-border text-rp-text hover:border-[#A855F7] hover:text-[#A855F7] disabled:opacity-40"
                      title={t("vid_extend_title")}
                      data-testid={`gallery-extend-${c.id}`}
                    >
                      <Film className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => toggleFav(c.id)}
                    className={`min-h-10 min-w-10 flex items-center justify-center rounded border ${
                      c.is_favorite
                        ? "border-rp-purple text-rp-lavender"
                        : "border-rp-border text-rp-text hover:border-rp-lavender"
                    } disabled:opacity-40`}
                    title="Favorito"
                  >
                    <Heart className="w-3.5 h-3.5" fill={c.is_favorite ? "currentColor" : "none"} />
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => remove(c.id)}
                    className="min-h-10 min-w-10 flex items-center justify-center rounded border border-rp-border text-rp-text hover:border-red-400 hover:text-red-400 disabled:opacity-40"
                    title="Apagar"
                  >
                    {busy ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <GalleryLightbox item={viewItem} onClose={() => setViewItem(null)} t={t} />
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
