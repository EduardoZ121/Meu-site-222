import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Heart,
  Trash2,
  Download,
  X,
  Loader2,
  Eye,
  RefreshCw,
  Film,
  Sparkles,
  Images,
  ArrowUpDown,
  Filter,
  RotateCcw,
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
import {
  getCachedCreation,
  mergeCreationIntoList,
  readGalleryCache,
  writeGalleryCache,
} from "../../lib/galleryCache";

function formatGalleryDate(value, lang) {
  if (!value) return "";
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return "";
  try {
    return d.toLocaleDateString(lang === "pt" ? "pt-PT" : lang || "en", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function creationTitle(item, t) {
  const prompt = String(item?.prompt || "").trim();
  if (prompt) return prompt.length > 48 ? `${prompt.slice(0, 48)}…` : prompt;
  if (isVideoCreation(item)) return t("gal_card_video");
  if (item?.type === "poster") return t("gal_card_poster");
  return t("gal_card_image");
}

function creationModel(item, t) {
  const raw = String(item?.model_used || item?.model || item?.engine || "").trim();
  if (raw) {
    const short = raw.split("·")[0].split("/").pop().trim();
    return short.length > 28 ? `${short.slice(0, 28)}…` : short;
  }
  if (isVideoCreation(item)) return t("gal_model_video");
  if (item?.type === "poster") return t("gal_model_poster");
  return t("gal_model_image");
}

function GalleryLightbox({ item, onClose, t, videoExtendAccess, lang }) {
  const { src, broken, loading, isVideo, onDirectError } = useGalleryLightboxMedia(item);
  const posterUrl = item && isPosterCreation(item) ? primaryResultUrl(item) : "";

  if (!item) return null;

  return (
    <div
      className="rp-gal-lightbox"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      data-testid="gallery-lightbox"
    >
      <button
        type="button"
        onClick={onClose}
        className="rp-gal-lightbox__close"
        aria-label={t("gal_close")}
      >
        <X className="w-5 h-5" />
      </button>
      <div className="rp-gal-lightbox__stage" onClick={(e) => e.stopPropagation()}>
        {loading && <Loader2 className="w-8 h-8 text-violet-300 animate-spin" />}
        {!loading && src && !broken ? (
          isVideo ? (
            <video src={src} controls autoPlay className="rp-gal-lightbox__media" onError={onDirectError} />
          ) : (
            <img src={src} alt="" className="rp-gal-lightbox__media" onError={onDirectError} />
          )
        ) : !loading && (broken || !src) ? (
          <p className="text-white/70 text-sm">{t("gal_file_unavailable")}</p>
        ) : null}
        <div className="rp-gal-lightbox__meta">
          <p className="rp-gal-lightbox__title">{creationTitle(item, t)}</p>
          <p className="rp-gal-lightbox__sub">
            {[formatGalleryDate(item.created_at, lang), creationModel(item, t)].filter(Boolean).join(" · ")}
          </p>
        </div>
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

function GalleryToolbarButton({ icon: Icon, label, onClick, disabled, spinning, testId, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      className={`rp-gal-tool-btn ${active ? "rp-gal-tool-btn--active" : ""}`}
      title={label}
    >
      <Icon className={`w-3.5 h-3.5 shrink-0 ${spinning ? "animate-spin" : ""}`} strokeWidth={1.75} />
      <span>{label}</span>
    </button>
  );
}

function GalleryCard({
  item,
  busy,
  videoExtendAccess,
  t,
  lang,
  onView,
  onDownload,
  onExtend,
  onToggleFav,
  onRemove,
}) {
  const posterUrl = isPosterCreation(item) ? primaryResultUrl(item) : "";
  const title = creationTitle(item, t);
  const date = formatGalleryDate(item.created_at, lang);
  const model = creationModel(item, t);

  return (
    <article className="rp-gal-card" data-testid={`gallery-item-${item.id}`}>
      <div className="rp-gal-card__media">
        <GalleryMedia
          creation={item}
          className="rp-gal-card__img"
          onClick={() => onView(item)}
          fadeIn
        />
        <div className="rp-gal-card__overlay" aria-hidden>
          <p className="rp-gal-card__name">{title}</p>
          <p className="rp-gal-card__meta">
            {[date, model].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      <div className="rp-gal-card__actions">
        <button
          type="button"
          disabled={busy}
          onClick={() => onView(item)}
          className="rp-gal-icon-btn"
          title={t("gal_view")}
          aria-label={t("gal_view")}
        >
          <Eye className="w-4 h-4" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onDownload(item)}
          className="rp-gal-icon-btn"
          title={t("gal_download")}
          aria-label={t("gal_download")}
        >
          <Download className="w-4 h-4" strokeWidth={1.75} />
        </button>
        {videoExtendAccess && isVideoCreation(item) && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onExtend(item)}
            className="rp-gal-icon-btn"
            title={t("vid_extend_title")}
            aria-label={t("vid_extend_title")}
            data-testid={`gallery-extend-${item.id}`}
          >
            <Film className="w-4 h-4" strokeWidth={1.75} />
          </button>
        )}
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
          onClick={() => onToggleFav(item.id)}
          className={`rp-gal-icon-btn ${item.is_favorite ? "rp-gal-icon-btn--fav" : ""}`}
          title={t("gal_favorite")}
          aria-label={t("gal_favorite")}
        >
          <Heart
            className={`w-4 h-4 ${item.is_favorite ? "rp-gal-heart--on" : ""}`}
            strokeWidth={1.75}
            fill={item.is_favorite ? "currentColor" : "none"}
          />
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onRemove(item.id)}
          className="rp-gal-icon-btn rp-gal-icon-btn--danger"
          title={t("remove")}
          aria-label={t("remove")}
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" strokeWidth={1.75} />}
        </button>
      </div>
    </article>
  );
}

function GallerySkeleton() {
  return (
    <div className="rp-gal-grid" data-testid="gallery-skeleton" aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rp-gal-skel" style={{ animationDelay: `${i * 60}ms` }}>
          <div className="rp-gal-skel__media" />
          <div className="rp-gal-skel__bar" />
        </div>
      ))}
    </div>
  );
}

const GALLERY_FETCH_MS = 20000;
const GALLERY_LOAD_SAFETY_MS = 28000;
const PENDING_MAX_AGE_MS = 12 * 60 * 1000;

function initialFromCache(favoritesOnly) {
  if (favoritesOnly) return { items: [], pending: [], hasCache: false };
  // Stale cache is fine for instant paint — history refreshes in background.
  const cached = readGalleryCache({ allowStale: true });
  const items = cached?.creations || [];
  return {
    items,
    pending: cached?.pending || [],
    hasCache: items.length > 0,
  };
}

export default function Gallery({ favoritesOnly = false }) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const videoExtendAccess = canAccessVideoFeatures(user);
  const [searchParams, setSearchParams] = useSearchParams();
  useTitle(favoritesOnly ? t("sidebar_favorites") : t("sidebar_gallery"));

  const boot = useMemo(() => initialFromCache(favoritesOnly), [favoritesOnly]);
  const [items, setItems] = useState(boot.items);
  const [pendingItems, setPendingItems] = useState(boot.pending);
  // Skip cold skeleton when we already have a warm list (e.g. after generation success).
  const [loading, setLoading] = useState(!boot.hasCache);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [extendItem, setExtendItem] = useState(null);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const refreshTimerRef = useRef(null);
  const pendingPollRef = useRef(null);
  const repairOnceRef = useRef(false);
  const tRef = useRef(t);
  const itemsRef = useRef(boot.items);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const loadGenRef = useRef(0);
  const safetyTimerRef = useRef(null);

  const filterPending = useCallback((rows) => {
    const now = Date.now();
    return (rows || []).filter((p) => {
      if (p.status === "completed") return false;
      const created = new Date(p.created_at).getTime();
      if (Number.isFinite(created) && now - created > PENDING_MAX_AGE_MS) return false;
      return true;
    });
  }, []);

  const load = useCallback((opts = {}) => {
    const isBackground = Boolean(opts.background);
    const loadGen = ++loadGenRef.current;
    const warm = !favoritesOnly ? readGalleryCache({ allowStale: true }) : null;
    const hasWarmList = Boolean(warm?.creations?.length) || itemsRef.current.length > 0;
    // Never blank the grid when we already have photos (cache or on-screen).
    const useSkeleton = !isBackground && !hasWarmList && !opts.keepVisible;

    if (useSkeleton) {
      setLoading(true);
      if (safetyTimerRef.current) window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = window.setTimeout(() => {
        if (loadGenRef.current === loadGen) {
          setLoading(false);
        }
      }, GALLERY_LOAD_SAFETY_MS);
    } else {
      setLoading(false);
      setRefreshing(true);
    }

    const historyUrl = `/generations/history?limit=60${favoritesOnly ? "&only_favorites=true" : ""}`;

    return Promise.allSettled([
      api.get(historyUrl, { timeout: GALLERY_FETCH_MS }),
      favoritesOnly
        ? Promise.resolve({ data: { pending: [] } })
        : api.get("/generations/pending", { timeout: GALLERY_FETCH_MS }),
    ])
      .then(([historyResult, pendingResult]) => {
        if (loadGen !== loadGenRef.current) return;
        if (historyResult.status === "fulfilled") {
          let list = (historyResult.value.data?.creations || []).map(normalizeCreation);
          // Keep a just-ready creation visible even if history lags slightly.
          if (!favoritesOnly) {
            const focusId = String(new URLSearchParams(window.location.search).get("focus") || "").trim();
            const focusCached = focusId ? getCachedCreation(focusId) : null;
            if (focusCached) list = mergeCreationIntoList(list, focusCached);
            writeGalleryCache(
              list,
              pendingResult.status === "fulfilled"
                ? filterPending(pendingResult.value.data?.pending)
                : warm?.pending || [],
            );
          }
          setItems(list);
        } else if (useSkeleton) {
          throw historyResult.reason;
        }
        if (pendingResult.status === "fulfilled") {
          setPendingItems(filterPending(pendingResult.value.data?.pending));
        } else if (useSkeleton) {
          setPendingItems([]);
        }
        if (historyResult.status === "rejected" && useSkeleton) {
          throw historyResult.reason;
        }
      })
      .catch((err) => {
        if (loadGen !== loadGenRef.current) return;
        if (useSkeleton) {
          toast.error(formatApiError(err, tRef.current("gal_load_fail")));
          setItems([]);
          setPendingItems([]);
        }
      })
      .finally(() => {
        if (loadGen !== loadGenRef.current) return;
        if (useSkeleton) {
          if (safetyTimerRef.current) {
            window.clearTimeout(safetyTimerRef.current);
            safetyTimerRef.current = null;
          }
        }
        setLoading(false);
        setRefreshing(false);
      });
  }, [favoritesOnly, filterPending]);

  useEffect(() => {
    // Always keep visible list if cache had anything; refresh quietly.
    load({ keepVisible: boot.hasCache, background: boot.hasCache });
    if (repairOnceRef.current) return undefined;
    repairOnceRef.current = true;
    const repairTimer = window.setTimeout(() => {
      api.post("/generations/repair", {}, { timeout: 60000 })
        .then(() => load({ background: true }))
        .catch(() => {});
    }, 3000);
    return () => {
      window.clearTimeout(repairTimer);
      if (safetyTimerRef.current) window.clearTimeout(safetyTimerRef.current);
      loadGenRef.current += 1;
    };
  }, [load, boot.hasCache]);

  useEffect(() => {
    if (favoritesOnly || pendingItems.length === 0) {
      if (pendingPollRef.current) window.clearInterval(pendingPollRef.current);
      pendingPollRef.current = null;
      return undefined;
    }
    pendingPollRef.current = window.setInterval(() => {
      load({ background: true });
    }, 12000);
    return () => {
      if (pendingPollRef.current) window.clearInterval(pendingPollRef.current);
      pendingPollRef.current = null;
    };
  }, [favoritesOnly, pendingItems.length, load]);

  useEffect(() => {
    const scheduleRefresh = () => {
      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = window.setTimeout(() => {
        load({ background: true });
      }, 2500);
    };
    const onCreationSucceeded = (event) => {
      const creation = normalizeCreation(event?.detail);
      if (creation?.id && !favoritesOnly) {
        setItems((cur) => mergeCreationIntoList(cur, creation));
        setLoading(false);
      }
      scheduleRefresh();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") scheduleRefresh();
    };
    window.addEventListener("rp:creation-succeeded", onCreationSucceeded);
    window.addEventListener("rp:prediction-finished", scheduleRefresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
      window.removeEventListener("rp:creation-succeeded", onCreationSucceeded);
      window.removeEventListener("rp:prediction-finished", scheduleRefresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load, favoritesOnly]);

  useEffect(() => {
    const focusId = String(searchParams.get("focus") || "").trim();
    if (!focusId) return;

    let target = items.find((x) => x.id === focusId);
    if (!target && !favoritesOnly) {
      const cached = getCachedCreation(focusId);
      if (cached) {
        target = cached;
        setItems((cur) => mergeCreationIntoList(cur, cached));
        setLoading(false);
      }
    }
    if (!target) {
      // Still fetching history — wait; don't toast yet unless empty + not loading.
      if (loading) return;
      if (!items.length) return;
      toast.message(t("gal_focus_not_found"));
      const next = new URLSearchParams(searchParams);
      next.delete("focus");
      setSearchParams(next, { replace: true });
      return;
    }

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
  }, [items, searchParams, setSearchParams, t, loading, favoritesOnly]);

  const displayedItems = useMemo(() => {
    let list = [...items];
    if (filter === "image") list = list.filter((i) => !isVideoCreation(i));
    if (filter === "video") list = list.filter((i) => isVideoCreation(i));
    if (filter === "favorites") list = list.filter((i) => i.is_favorite);
    list.sort((a, b) => {
      const ta = new Date(a.created_at || 0).getTime();
      const tb = new Date(b.created_at || 0).getTime();
      return sort === "oldest" ? ta - tb : tb - ta;
    });
    return list;
  }, [items, filter, sort]);

  const toggleFav = async (id) => {
    setBusyId(id);
    try {
      const { data } = await api.post(`/generations/${encodeURIComponent(id)}/favorite`);
      setItems((cur) => {
        const next = cur.map((c) => (c.id === id ? { ...c, is_favorite: data.is_favorite } : c));
        if (!favoritesOnly) writeGalleryCache(next, pendingItems);
        return next;
      });
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
      setItems((cur) => {
        const next = cur.filter((c) => c.id !== id);
        if (!favoritesOnly) writeGalleryCache(next, pendingItems);
        return next;
      });
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
      a.download = `remake-${item.id.slice(0, 8)}.${ext}`;
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
        toast.success(t("gal_recover_ok", { n: data.repaired }));
      } else {
        toast.message(t("gal_recover_none"));
      }
    } catch (err) {
      toast.error(formatApiError(err, t("gal_recover_fail")));
    } finally {
      setRefreshing(false);
    }
  };

  const empty = !loading && displayedItems.length === 0 && pendingItems.length === 0;
  const filterLabel = {
    all: t("gal_filter_all"),
    image: t("gal_filter_image"),
    video: t("gal_filter_video"),
    favorites: t("gal_filter_favorites"),
  }[filter];
  const sortLabel = sort === "oldest" ? t("gal_sort_oldest") : t("gal_sort_newest");

  return (
    <div className="rp-gal" data-testid="gallery-page">
      <header className="rp-gal-header">
        <div className="rp-gal-header__copy">
          <div className="flex items-center gap-2 mb-3">
            <p className="rp-gal-eyebrow">
              {favoritesOnly ? t("fav_eyebrow") : t("gal_eyebrow")}
            </p>
            <StudioHelpTip helpKey="help_page_gallery" size="md" testId="gallery-page-help" />
          </div>
          <h1 className="rp-gal-title">
            {favoritesOnly ? t("fav_title") : t("gal_title")}
          </h1>
          <p className="rp-gal-desc">
            {favoritesOnly ? t("fav_desc") : t("gal_desc")}
          </p>
        </div>

        <div className="rp-gal-toolbar">
          <GalleryToolbarButton
            icon={RefreshCw}
            label={t("gal_refresh")}
            onClick={() => load({ background: true })}
            disabled={loading && !items.length}
            spinning={loading || refreshing}
          />
          {!favoritesOnly && (
            <GalleryToolbarButton
              icon={RotateCcw}
              label={t("gal_recover")}
              onClick={recoverMissing}
              disabled={(loading && !items.length) || refreshing}
              testId="gallery-recover"
            />
          )}
          <div className="rp-gal-menu">
            <GalleryToolbarButton
              icon={Filter}
              label={filterLabel}
              onClick={() => { setFilterOpen((o) => !o); setSortOpen(false); }}
              active={filter !== "all" || filterOpen}
            />
            {filterOpen && (
              <div className="rp-gal-menu__panel" role="menu">
                {["all", "image", "video", "favorites"].map((key) => (
                  <button
                    key={key}
                    type="button"
                    role="menuitem"
                    className={filter === key ? "is-active" : ""}
                    onClick={() => { setFilter(key); setFilterOpen(false); }}
                  >
                    {{
                      all: t("gal_filter_all"),
                      image: t("gal_filter_image"),
                      video: t("gal_filter_video"),
                      favorites: t("gal_filter_favorites"),
                    }[key]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="rp-gal-menu">
            <GalleryToolbarButton
              icon={ArrowUpDown}
              label={sortLabel}
              onClick={() => { setSortOpen((o) => !o); setFilterOpen(false); }}
              active={sortOpen}
            />
            {sortOpen && (
              <div className="rp-gal-menu__panel" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className={sort === "newest" ? "is-active" : ""}
                  onClick={() => { setSort("newest"); setSortOpen(false); }}
                >
                  {t("gal_sort_newest")}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={sort === "oldest" ? "is-active" : ""}
                  onClick={() => { setSort("oldest"); setSortOpen(false); }}
                >
                  {t("gal_sort_oldest")}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {loading && items.length === 0 ? (
        <GallerySkeleton />
      ) : empty ? (
        <div className="rp-gal-empty" data-testid="gallery-empty">
          <div className="rp-gal-empty__icon">
            <Images className="w-10 h-10" strokeWidth={1.25} />
          </div>
          <h2 className="rp-gal-empty__title">{t("gal_empty_title")}</h2>
          <p className="rp-gal-empty__desc">{t("gal_empty")}</p>
          <Link to="/app/generate" className="rp-gal-empty__cta">
            <Sparkles className="w-4 h-4" strokeWidth={1.75} />
            {t("gal_begin")}
          </Link>
        </div>
      ) : (
        <div className="rp-gal-grid" data-testid="gallery-grid">
          {pendingItems.map((p) => (
            <article
              key={p.prediction_id}
              className="rp-gal-card rp-gal-card--pending"
              data-testid={`gallery-pending-${p.prediction_id}`}
            >
              <div className="rp-gal-card__media rp-gal-card__media--pending">
                <Loader2 className="w-7 h-7 text-violet-400 animate-spin" />
                <span className="rp-gal-pending-label">{t("gal_processing")}</span>
              </div>
              <div className="rp-gal-card__actions rp-gal-card__actions--ghost" />
            </article>
          ))}
          {displayedItems.map((item) => (
            <GalleryCard
              key={item.id}
              item={item}
              busy={busyId === item.id}
              videoExtendAccess={videoExtendAccess}
              t={t}
              lang={lang}
              onView={setViewItem}
              onDownload={handleDownload}
              onExtend={setExtendItem}
              onToggleFav={toggleFav}
              onRemove={remove}
            />
          ))}
        </div>
      )}

      <GalleryLightbox
        item={viewItem}
        onClose={() => setViewItem(null)}
        t={t}
        lang={lang}
        videoExtendAccess={videoExtendAccess}
      />
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
