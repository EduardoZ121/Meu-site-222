import { useEffect, useState } from "react";
import { Heart, Trash2, Download } from "lucide-react";
import { api } from "../../lib/api";
import { useI18n } from "../../lib/i18n";
import { toast } from "sonner";
import useTitle from "../../lib/useTitle";

export default function Gallery({ favoritesOnly = false }) {
  const { t } = useI18n();
  useTitle(favoritesOnly ? t("sidebar_favorites") : t("sidebar_gallery"));
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/generations/history?limit=60${favoritesOnly ? "&only_favorites=true" : ""}`)
      .then((r) => setItems(r.data.creations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [favoritesOnly]);

  const toggleFav = async (id) => {
    try {
      const { data } = await api.post(`/generations/${id}/favorite`);
      setItems((cur) => cur.map((c) => c.id === id ? { ...c, is_favorite: data.is_favorite } : c));
    } catch { toast.error(t("failed")); }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/generations/${id}`);
      setItems((cur) => cur.filter((c) => c.id !== id));
      toast.success(t("remove"));
    } catch { toast.error(t("failed")); }
  };

  return (
    <div className="max-w-[1200px] mx-auto" data-testid="gallery-page">
      <div className="mb-10">
        <p className="eyebrow mb-3">{favoritesOnly ? t("fav_eyebrow") : t("gal_eyebrow")}</p>
        <h1 className="heading-xl">{favoritesOnly ? t("fav_title") : t("gal_title")}</h1>
      </div>

      {loading ? (
        <p className="text-rp-mute text-sm">{t("loading")}</p>
      ) : items.length === 0 ? (
        <div className="border border-rp-border p-16 text-center" data-testid="gallery-empty">
          <p className="text-rp-mute mb-2 text-sm">{t("gal_empty")}</p>
          <a href="/app/generate" className="text-rp-lavender text-sm hover:underline">{t("gal_begin")}</a>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1" data-testid="gallery-grid">
          {items.map((c) => (
            <div key={c.id} className="relative group aspect-square overflow-hidden bg-rp-surface" data-testid={`gallery-item-${c.id}`}>
              <img src={c.result_urls[0]} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-rp-bg/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <p className="text-rp-text text-xs line-clamp-3 mb-2">{c.prompt}</p>
                <div className="flex gap-2">
                  <a href={c.result_urls[0]} target="_blank" rel="noreferrer" className="text-rp-text hover:text-rp-lavender"><Download className="w-3.5 h-3.5" /></a>
                  <button onClick={() => toggleFav(c.id)} className={c.is_favorite ? "text-rp-lavender" : "text-rp-text hover:text-rp-lavender"}><Heart className="w-3.5 h-3.5" fill={c.is_favorite ? "currentColor" : "none"} /></button>
                  <button onClick={() => remove(c.id)} className="text-rp-text hover:text-red-400 ml-auto"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
